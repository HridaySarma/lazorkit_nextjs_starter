'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { PublicKey } from '@solana/web3.js';
import { createTransferInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import { validateSolanaAddress, getExplorerUrl, formatBalance } from '@/lib/solana';
import { validateTransfer, mapSDKError } from '@/lib/lazorkit';
import { useToast } from './ToastProvider';

/**
 * Props for the GaslessTransfer component.
 */
interface GaslessTransferProps {
  /** Current USDC balance in smallest units */
  usdcBalance: number;
  /** Callback fired after successful transfer */
  onTransferComplete: () => void;
}

/**
 * Transfer state for tracking the transaction lifecycle.
 */
type TransferState = 'idle' | 'confirming' | 'processing' | 'success' | 'error';

/**
 * GaslessTransfer Component
 * 
 * Provides a form for sending gasless USDC transfers with real-time validation,
 * confirmation modal, and transaction status feedback.
 * Uses toast notifications for success/error feedback.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 7.3, 7.4, 7.6
 */
export function GaslessTransfer({ usdcBalance, onTransferComplete }: GaslessTransferProps) {
  const { showSuccess, showError } = useToast();
  const { smartWalletPubkey, signAndSendTransaction, isSigning } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [transferState, setTransferState] = useState<TransferState>('idle');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  /**
   * Validates the form inputs in real-time.
   */
  const validateForm = useCallback(() => {
    if (!recipient && !amount) {
      setValidationError(null);
      return false;
    }

    const amountNum = parseFloat(amount);
    const error = validateTransfer(recipient, amountNum || 0, usdcBalance);
    setValidationError(error);
    return error === null && recipient && amount && amountNum > 0;
  }, [recipient, amount, usdcBalance]);

  // Run validation when inputs change
  useEffect(() => {
    validateForm();
  }, [validateForm]);

  /**
   * Checks if the form is valid and can be submitted.
   */
  const isFormValid = useCallback(() => {
    const amountNum = parseFloat(amount);
    return (
      recipient.trim() !== '' &&
      validateSolanaAddress(recipient) &&
      amountNum > 0 &&
      amountNum * 1_000_000 <= usdcBalance
    );
  }, [recipient, amount, usdcBalance]);

  /**
   * Opens the confirmation modal.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid()) {
      setTransferState('confirming');
    }
  };

  /**
   * Executes the gasless transfer using SDK transaction signing.
   * Shows toast notifications for success/error feedback.
   */
  const executeTransfer = async () => {
    if (!smartWalletPubkey) {
      setTransactionError('Wallet not connected');
      setTransferState('error');
      return;
    }

    setTransferState('processing');
    setTransactionError(null);

    try {
      // USDC Devnet mint address
      const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
      const recipientPubkey = new PublicKey(recipient);
      
      // Get associated token accounts for sender and recipient
      // allowOwnerOffCurve: true is needed for PDA wallets like Lazorkit smart wallets
      const senderTokenAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        smartWalletPubkey,
        true // allowOwnerOffCurve
      );
      
      const recipientTokenAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        recipientPubkey,
        true // allowOwnerOffCurve - recipient might also be a PDA
      );

      // Build transaction instructions
      const instructions = [];

      // Check token accounts exist
      const { Connection } = await import('@solana/web3.js');
      
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
        'confirmed'
      );
      
      // Verify sender has a token account with balance
      const senderAccountInfo = await connection.getAccountInfo(senderTokenAccount);
      if (!senderAccountInfo) {
        throw new Error('Your wallet does not have a USDC token account. Please receive some USDC first.');
      }
      
      // Check if recipient has a USDC token account
      const recipientAccountInfo = await connection.getAccountInfo(recipientTokenAccount);
      
      if (!recipientAccountInfo) {
        // Recipient doesn't have a USDC token account
        // For gasless transactions, we cannot create ATAs because the smart wallet has no SOL for rent
        // The paymaster only sponsors transaction fees, not account creation rent
        throw new Error('Recipient does not have a USDC token account. They need to receive USDC from a funded wallet first to create their account.');
      }

      // Create SPL token transfer instruction for USDC
      // Amount is in smallest units (6 decimals for USDC)
      instructions.push(
        createTransferInstruction(
          senderTokenAccount,
          recipientTokenAccount,
          smartWalletPubkey,
          Math.floor(parseFloat(amount) * 1_000_000) // Convert to smallest units
        )
      );

      // Use Lazorkit SDK's signAndSendTransaction with gasless options
      // Per SDK docs: pass instructions and transactionOptions for paymaster
      const signature = await signAndSendTransaction({
        instructions,
        transactionOptions: {
          feeToken: 'USDC', // Use USDC for fee payment via paymaster
          computeUnitLimit: 200_000, // Set compute budget
        },
      });

      setTxSignature(signature);
      setTransferState('success');
      
      // Show success toast notification
      showSuccess(`Successfully sent ${parseFloat(amount).toFixed(2)} USDC!`);
      
      // Auto-refresh balances after successful transfer
      onTransferComplete();
    } catch (err) {
      console.error('Transfer error:', err);
      // Map SDK errors to user-friendly messages
      const authError = mapSDKError(err);
      setTransactionError(authError.message);
      setTransferState('error');
      
      // Show error toast with retry option
      showError(authError.message, () => setTransferState('confirming'));
    }
  };

  /**
   * Resets the form to initial state.
   */
  const resetForm = () => {
    setRecipient('');
    setAmount('');
    setTransferState('idle');
    setValidationError(null);
    setTransactionError(null);
    setTxSignature(null);
  };

  /**
   * Renders the confirmation modal.
   */
  const renderConfirmationModal = () => {
    if (transferState !== 'confirming') return null;

    const amountNum = parseFloat(amount);

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-bg-card rounded-card p-6 max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-200">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Confirm Transfer
          </h3>
          
          <div className="space-y-4 mb-6">
            <div className="bg-bg-secondary rounded-lg p-4">
              <p className="text-text-muted text-xs uppercase tracking-wider mb-1">
                Sending
              </p>
              <p className="text-2xl font-bold text-text-primary">
                {amountNum.toFixed(2)} USDC
              </p>
            </div>
            
            <div className="bg-bg-secondary rounded-lg p-4">
              <p className="text-text-muted text-xs uppercase tracking-wider mb-1">
                To
              </p>
              <p className="text-sm font-mono text-text-primary break-all">
                {recipient}
              </p>
            </div>

            <div className="flex items-center gap-2 text-success text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>No gas fees - transaction is sponsored</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setTransferState('idle')}
              className="flex-1 px-4 py-3 bg-bg-secondary text-text-secondary rounded-card hover:bg-bg-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-text-muted/50 focus:ring-offset-2 focus:ring-offset-bg-card active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              onClick={executeTransfer}
              className="flex-1 px-4 py-3 bg-gradient-primary text-white font-medium rounded-card hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-card active:scale-[0.98]"
            >
              Confirm Send
            </button>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renders the processing modal.
   */
  const renderProcessingModal = () => {
    if (transferState !== 'processing') return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-bg-card rounded-card p-6 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Processing Transfer
          </h3>
          <p className="text-text-secondary text-sm">
            Please wait while your transaction is being processed...
          </p>
        </div>
      </div>
    );
  };

  /**
   * Renders the success modal.
   */
  const renderSuccessModal = () => {
    if (transferState !== 'success' || !txSignature) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-bg-card rounded-card p-6 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Transfer Successful!
          </h3>
          <p className="text-text-secondary text-sm mb-4">
            Your USDC has been sent successfully.
          </p>
          
          <a
            href={getExplorerUrl(txSignature)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:text-primary-light text-sm mb-6 transition-colors"
          >
            View on Solana Explorer
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>

          <button
            onClick={resetForm}
            className="w-full px-4 py-3 bg-gradient-primary text-white font-medium rounded-card hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-card active:scale-[0.98]"
          >
            Done
          </button>
        </div>
      </div>
    );
  };

  /**
   * Renders the error modal.
   */
  const renderErrorModal = () => {
    if (transferState !== 'error') return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-bg-card rounded-card p-6 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Transfer Failed
          </h3>
          <p className="text-text-secondary text-sm mb-6">
            {transactionError || 'An error occurred while processing your transfer.'}
          </p>

          <div className="flex gap-3">
            <button
              onClick={resetForm}
              className="flex-1 px-4 py-3 bg-bg-secondary text-text-secondary rounded-card hover:bg-bg-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-text-muted/50 focus:ring-offset-2 focus:ring-offset-bg-card active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              onClick={() => setTransferState('confirming')}
              className="flex-1 px-4 py-3 bg-gradient-primary text-white font-medium rounded-card hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-card active:scale-[0.98]"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  };

  const isDisabled = transferState === 'processing' || isSigning;
  const availableBalance = formatBalance(usdcBalance, 'USDC');

  return (
    <>
      <div className="bg-bg-card rounded-card p-5">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Send USDC
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recipient Address Input */}
          <div>
            <label className="block text-text-muted text-xs uppercase tracking-wider mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={isDisabled}
              placeholder="Enter Solana address"
              className={`
                w-full px-4 py-3 bg-bg-secondary rounded-lg
                text-text-primary placeholder-text-muted
                border transition-all duration-200 ease-out
                focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed
                ${validationError?.includes('address') 
                  ? 'border-error focus:ring-error' 
                  : 'border-text-muted/10 hover:border-text-muted/30'
                }
              `}
            />
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-text-muted text-xs uppercase tracking-wider">
                Amount (USDC)
              </label>
              <span className="text-text-muted text-xs">
                Available: {availableBalance} USDC
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isDisabled}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={`
                  w-full px-4 py-3 bg-bg-secondary rounded-lg
                  text-text-primary placeholder-text-muted
                  border transition-all duration-200 ease-out
                  focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed
                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                  ${validationError?.includes('balance') || validationError?.includes('Amount')
                    ? 'border-error focus:ring-error' 
                    : 'border-text-muted/10 hover:border-text-muted/30'
                  }
                `}
              />
              <button
                type="button"
                onClick={() => setAmount((usdcBalance / 1_000_000).toFixed(2))}
                disabled={isDisabled}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-primary hover:text-primary-light transition-all duration-200 disabled:opacity-50 focus:outline-none focus:underline active:scale-95"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Validation Error */}
          {validationError && (
            <p className="text-error text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {validationError}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid() || isDisabled}
            className={`
              w-full flex items-center justify-center gap-2 px-4 py-3
              bg-gradient-primary text-white font-medium rounded-card
              transition-all duration-200 ease-out-expo
              ${!isFormValid() || isDisabled
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]'
              }
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-card
              focus-visible:ring-2 focus-visible:ring-primary
            `}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send USDC
          </button>

          {/* Gasless Info */}
          <p className="text-center text-text-muted text-xs">
            ✨ No gas fees - transactions are sponsored
          </p>
        </form>
      </div>

      {/* Modals */}
      {renderConfirmationModal()}
      {renderProcessingModal()}
      {renderSuccessModal()}
      {renderErrorModal()}
    </>
  );
}

export default GaslessTransfer;

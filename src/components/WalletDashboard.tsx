'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { getSOLBalance, getUSDCBalance, formatBalance, truncateAddress } from '@/lib/solana';
import { useToast } from './ToastProvider';

/**
 * Props for the WalletDashboard component.
 */
interface WalletDashboardProps {
  /** Callback fired when user logs out */
  onLogout: () => void;
}

/**
 * WalletDashboard Component
 * 
 * Displays wallet address with truncation and copy-to-clipboard,
 * SOL and USDC balances in card layout, and refresh functionality.
 * Uses toast notifications for user feedback.
 * 
 * Now uses the LazorKit SDK's useWallet hook for wallet state management.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 7.5
 */
export function WalletDashboard({ onLogout }: WalletDashboardProps) {
  const { smartWalletPubkey, isConnected, disconnect } = useWallet();
  const { showSuccess, showError } = useToast();
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  /**
   * Fetches both SOL and USDC balances from the blockchain.
   * Shows error toast on failure with retry option.
   */
  const fetchBalances = useCallback(async () => {
    if (!smartWalletPubkey) return;

    setIsLoading(true);
    setError(null);

    try {
      const walletAddress = smartWalletPubkey.toBase58();
      const [sol, usdc] = await Promise.all([
        getSOLBalance(walletAddress),
        getUSDCBalance(walletAddress),
      ]);

      setSolBalance(sol);
      setUsdcBalance(usdc);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch balances';
      setError(message);
      showError(message, fetchBalances);
    } finally {
      setIsLoading(false);
    }
  }, [smartWalletPubkey, showError]);

  // Fetch balances on mount and when wallet changes
  useEffect(() => {
    if (isConnected && smartWalletPubkey) {
      fetchBalances();
    }
  }, [fetchBalances, isConnected, smartWalletPubkey]);

  /**
   * Handles logout by calling SDK disconnect method.
   * SDK automatically clears stored credentials.
   */
  const handleLogout = async () => {
    try {
      await disconnect();
      onLogout();
    } catch (err) {
      console.error('Logout error:', err);
      // Still call onLogout even if disconnect fails
      onLogout();
    }
  };

  /**
   * Copies the wallet address to clipboard.
   * Shows toast notification on success.
   */
  const copyAddress = async () => {
    if (!smartWalletPubkey) return;

    const walletAddress = smartWalletPubkey.toBase58();
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      showSuccess('Address copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = walletAddress;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      showSuccess('Address copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /**
   * Renders a balance card with loading/error states.
   */
  const renderBalanceCard = (
    token: 'SOL' | 'USDC',
    balance: number | null,
    icon: React.ReactNode
  ) => {
    const formattedBalance = balance !== null ? formatBalance(balance, token) : '—';

    return (
      <div className="bg-bg-card rounded-card p-5 flex-1 min-w-[140px]">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <span className="text-text-secondary text-sm font-medium">{token}</span>
        </div>
        <div className="text-2xl font-bold text-text-primary">
          {isLoading ? (
            <div className="h-8 w-24 bg-bg-secondary rounded animate-pulse" />
          ) : (
            formattedBalance
          )}
        </div>
      </div>
    );
  };

  // Show not connected state if wallet is not connected
  if (!isConnected || !smartWalletPubkey) {
    return (
      <div className="w-full bg-bg-card rounded-card p-5">
        <p className="text-text-muted text-center">Wallet not connected</p>
      </div>
    );
  }

  const walletAddress = smartWalletPubkey.toBase58();

  return (
    <div className="w-full space-y-6">
      {/* Wallet Address Section */}
      <div className="bg-bg-card rounded-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">
              Wallet Address
            </p>
            <div className="flex items-center gap-2">
              <span className="text-text-primary font-mono text-lg">
                {truncateAddress(walletAddress)}
              </span>
              <button
                onClick={copyAddress}
                className="p-1.5 rounded-lg bg-bg-secondary hover:bg-primary/20 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-card active:scale-95"
                title="Copy address"
              >
                {copied ? (
                  <svg
                    className="w-4 h-4 text-success"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-text-secondary hover:text-error border border-text-muted/20 hover:border-error/50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-error/50 focus:ring-offset-2 focus:ring-offset-bg-card active:scale-[0.98]"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="flex gap-4 flex-wrap">
        {renderBalanceCard(
          'SOL',
          solBalance,
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">◎</span>
          </div>
        )}
        {renderBalanceCard(
          'USDC',
          usdcBalance,
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
            <span className="text-white text-xs font-bold">$</span>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-error"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm text-error">{error}</span>
            </div>
            <button
              onClick={fetchBalances}
              className="text-sm text-primary hover:text-primary-light transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={fetchBalances}
        disabled={isLoading}
        className={`
          w-full flex items-center justify-center gap-2 px-4 py-3
          bg-bg-card hover:bg-bg-secondary border border-text-muted/10
          rounded-card transition-all duration-200 ease-out-expo
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-primary
          ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:border-primary/30 active:scale-[0.99]'}
        `}
      >
        <svg
          className={`w-4 h-4 text-text-secondary ${isLoading ? 'animate-spin' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span className="text-sm text-text-secondary">
          {isLoading ? 'Refreshing...' : 'Refresh Balances'}
        </span>
      </button>
    </div>
  );
}

export default WalletDashboard;

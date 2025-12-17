import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GaslessTransfer } from '../GaslessTransfer';
import { PublicKey } from '@solana/web3.js';

const mockSignAndSendTransaction = vi.fn();
const mockSmartWalletPubkey = new PublicKey('11111111111111111111111111111111');
const mockUseWallet = {
  smartWalletPubkey: mockSmartWalletPubkey as PublicKey | null,
  signAndSendTransaction: mockSignAndSendTransaction,
  isSigning: false,
};

vi.mock('@lazorkit/wallet', () => ({
  useWallet: () => mockUseWallet,
}));

vi.mock('@/lib/solana', () => ({
  validateSolanaAddress: (address: string) => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  },
  getExplorerUrl: (signature: string) => `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
  formatBalance: (amount: number) => (amount / 1_000_000).toFixed(2),
}));

vi.mock('@/lib/lazorkit', () => ({
  validateTransfer: (recipient: string, amount: number, balance: number) => {
    if (!recipient || recipient.trim() === '') {
      return 'Recipient address is required.';
    }
    if (amount <= 0) {
      return 'Amount must be greater than zero.';
    }
    if (amount * 1_000_000 > balance) {
      return 'Insufficient USDC balance for this transfer.';
    }
    return null;
  },
  mapSDKError: (error: unknown) => {
    const err = error instanceof Error ? error : new Error(String(error));
    return {
      code: 'UNKNOWN',
      message: err.message,
      originalError: err,
    };
  },
}));

vi.mock('../ToastProvider', () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

vi.mock('@solana/spl-token', () => ({
  createTransferInstruction: vi.fn(() => ({
    keys: [],
    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    data: Buffer.from([]),
  })),
  getAssociatedTokenAddress: vi.fn(() => Promise.resolve(new PublicKey('22222222222222222222222222222222'))),
}));

describe('GaslessTransfer Component', () => {
  const mockOnTransferComplete = vi.fn();
  const mockBalance = 100_000_000;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWallet.isSigning = false;
    mockSignAndSendTransaction.mockResolvedValue('test-signature-123');
  });

  it('should render the component', () => {
    render(
      <GaslessTransfer
        usdcBalance={mockBalance}
        onTransferComplete={mockOnTransferComplete}
      />
    );

    expect(screen.getByRole('heading', { name: 'Send USDC' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Solana address')).toBeInTheDocument();
  });

  it('should use SDK wallet state', () => {
    mockUseWallet.isSigning = true;

    render(
      <GaslessTransfer
        usdcBalance={mockBalance}
        onTransferComplete={mockOnTransferComplete}
      />
    );

    const recipientInput = screen.getByPlaceholderText('Enter Solana address');
    expect(recipientInput).toBeDisabled();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletDashboard } from '../WalletDashboard';
import { PublicKey } from '@solana/web3.js';

// Mock the @lazorkit/wallet hook
const mockDisconnect = vi.fn();
const mockSmartWalletPubkey = new PublicKey('11111111111111111111111111111111');
const mockUseWallet = {
  smartWalletPubkey: mockSmartWalletPubkey as PublicKey | null,
  isConnected: true,
  disconnect: mockDisconnect,
};

vi.mock('@lazorkit/wallet', () => ({
  useWallet: () => mockUseWallet,
}));

// Mock the solana utilities
vi.mock('@/lib/solana', () => ({
  getSOLBalance: vi.fn().mockResolvedValue(1_000_000_000), // 1 SOL
  getUSDCBalance: vi.fn().mockResolvedValue(100_000_000), // 100 USDC
  formatBalance: (amount: number, token: string) => {
    if (token === 'SOL') {
      return (amount / 1_000_000_000).toFixed(4);
    }
    return (amount / 1_000_000).toFixed(2);
  },
  truncateAddress: (address: string) => {
    if (address.length <= 8) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  },
}));

// Mock the toast provider
const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();

vi.mock('./ToastProvider', () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

describe('WalletDashboard Component - SDK Integration', () => {
  const mockOnLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWallet.isConnected = true;
    mockUseWallet.smartWalletPubkey = mockSmartWalletPubkey;
    mockDisconnect.mockResolvedValue(undefined);
  });

  describe('SDK State Usage', () => {
    it('should use smartWalletPubkey from SDK state', () => {
      render(<WalletDashboard onLogout={mockOnLogout} />);

      // Should display truncated address from SDK state
      expect(screen.getByText(/1111\.\.\.1111/)).toBeInTheDocument();
    });

    it('should use isConnected from SDK state', () => {
      mockUseWallet.isConnected = false;
      mockUseWallet.smartWalletPubkey = null;

      render(<WalletDashboard onLogout={mockOnLogout} />);

      expect(screen.getByText('Wallet not connected')).toBeInTheDocument();
    });

    it('should display wallet address when connected', () => {
      render(<WalletDashboard onLogout={mockOnLogout} />);

      // Wallet address section should be visible
      expect(screen.getByText('Wallet Address')).toBeInTheDocument();
    });
  });

  describe('SDK Disconnect Method', () => {
    it('should call SDK disconnect() method when logout is clicked', async () => {
      render(<WalletDashboard onLogout={mockOnLogout} />);

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockDisconnect).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onLogout callback after SDK disconnect', async () => {
      render(<WalletDashboard onLogout={mockOnLogout} />);

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockOnLogout).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle disconnect errors gracefully', async () => {
      mockDisconnect.mockRejectedValueOnce(new Error('Disconnect failed'));

      render(<WalletDashboard onLogout={mockOnLogout} />);

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      // Should still call onLogout even if disconnect fails
      await waitFor(() => {
        expect(mockOnLogout).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Balance Display', () => {
    it('should fetch and display balances using SDK wallet address', async () => {
      render(<WalletDashboard onLogout={mockOnLogout} />);

      await waitFor(() => {
        expect(screen.getByText('1.0000')).toBeInTheDocument(); // SOL balance
        expect(screen.getByText('100.00')).toBeInTheDocument(); // USDC balance
      });
    });

    it('should show loading state while fetching balances', () => {
      render(<WalletDashboard onLogout={mockOnLogout} />);

      // Should show loading placeholders initially
      const loadingElements = screen.getAllByRole('generic').filter(
        el => el.className.includes('animate-pulse')
      );
      expect(loadingElements.length).toBeGreaterThan(0);
    });
  });

  describe('Copy Address Functionality', () => {
    it('should copy SDK wallet address to clipboard', async () => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });

      render(<WalletDashboard onLogout={mockOnLogout} />);

      // Find and click copy button (first button after wallet address)
      const buttons = screen.getAllByRole('button');
      const copyButton = buttons.find(btn => btn.getAttribute('title') === 'Copy address');
      
      if (copyButton) {
        fireEvent.click(copyButton);

        await waitFor(() => {
          expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            mockSmartWalletPubkey.toBase58()
          );
        });
      }
    });
  });
});

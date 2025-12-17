import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PasskeyAuth } from '../PasskeyAuth';
import { PublicKey } from '@solana/web3.js';

// Mock the @lazorkit/wallet hook
const mockConnect = vi.fn();
const mockUseWallet = {
  connect: mockConnect,
  isConnecting: false,
  smartWalletPubkey: null as PublicKey | null,
};

vi.mock('@lazorkit/wallet', () => ({
  useWallet: () => mockUseWallet,
}));

// Mock the lazorkit utilities
vi.mock('@/lib/lazorkit', () => ({
  mapSDKError: (error: unknown) => {
    const err = error instanceof Error ? error : new Error(String(error));
    return {
      code: 'UNKNOWN',
      message: err.message,
      originalError: err,
    };
  },
  isWebAuthnSupported: vi.fn(() => true),
}));

describe('PasskeyAuth Component - SDK Integration', () => {
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWallet.isConnecting = false;
    mockUseWallet.smartWalletPubkey = null;
    mockConnect.mockResolvedValue(undefined);
  });

  describe('SDK Hook Integration', () => {
    it('should use useWallet hook from SDK', () => {
      render(
        <PasskeyAuth
          mode="create"
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      // Component should render without errors, indicating hook is working
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should call SDK connect() method when button is clicked', async () => {
      render(
        <PasskeyAuth
          mode="create"
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledTimes(1);
      });
    });

    it('should use isConnecting state from SDK for loading indicator', () => {
      mockUseWallet.isConnecting = true;

      render(
        <PasskeyAuth
          mode="create"
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(screen.getByText(/creating wallet\.\.\./i)).toBeInTheDocument();
    });

    it('should disable button when SDK isConnecting is true', () => {
      mockUseWallet.isConnecting = true;

      render(
        <PasskeyAuth
          mode="create"
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Error Handling with SDK', () => {
    it('should handle SDK errors using mapSDKError', async () => {
      const testError = new Error('SDK connection failed');
      mockConnect.mockRejectedValueOnce(testError);

      render(
        <PasskeyAuth
          mode="create"
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'UNKNOWN',
            message: 'SDK connection failed',
          })
        );
      });
    });

    it('should display mapped error message in UI', async () => {
      mockConnect.mockRejectedValueOnce(new Error('Test error'));

      render(
        <PasskeyAuth
          mode="create"
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });
    });
  });

  describe('Mode-Specific Behavior', () => {
    it('should display "Create Wallet" text in create mode', () => {
      render(
        <PasskeyAuth
          mode="create"
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(screen.getByText('Create Wallet')).toBeInTheDocument();
    });

    it('should display "Sign In" text in signin mode', () => {
      render(
        <PasskeyAuth
          mode="signin"
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('should call connect() for both create and signin modes', async () => {
      const { rerender } = render(
        <PasskeyAuth
          mode="create"
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledTimes(1);
      });

      mockConnect.mockClear();

      rerender(
        <PasskeyAuth
          mode="signin"
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledTimes(1);
      });
    });
  });
});

'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';
import type { WalletSession, AuthError } from '@/types';
import { mapSDKError, isPlatformAuthenticatorAvailable } from '@/lib/lazorkit';

/**
 * Props for the PasskeyAuth component.
 */
interface PasskeyAuthProps {
  /** Authentication mode: 'create' for new wallet, 'signin' for existing */
  mode: 'create' | 'signin';
  /** Callback fired on successful authentication */
  onSuccess: (wallet: WalletSession) => void;
  /** Callback fired on authentication error */
  onError: (error: AuthError) => void;
}

/**
 * PasskeyAuth Component
 * 
 * Handles passkey-based wallet creation and sign-in flows using WebAuthn.
 * Displays appropriate loading states and error messages for each failure type.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 7.2, 7.10
 */
export function PasskeyAuth({ mode, onSuccess, onError }: PasskeyAuthProps) {
  const { connect, isConnecting, smartWalletPubkey } = useWallet();
  const [error, setError] = useState<AuthError | null>(null);

  /**
   * Handles the authentication flow based on mode.
   * Creates a new wallet or signs in with existing passkey.
   * The SDK's connect() method handles both create and sign-in flows.
   */
  const handleAuth = useCallback(async () => {
    // Clear any previous errors
    setError(null);

    try {
      // Check WebAuthn support before proceeding
      const isAvailable = await isPlatformAuthenticatorAvailable();
      if (!isAvailable) {
        const authError: AuthError = {
          code: 'BROWSER_UNSUPPORTED',
          message: "Passkeys are not available. This may be due to using a remote desktop or VM. Please use a local Chrome, Safari, or Edge browser.",
        };
        setError(authError);
        onError(authError);
        return;
      }

      // Single connect() call works for both create and sign-in
      // SDK determines if credential exists and acts accordingly
      await connect();
      
      // On success, SDK updates smartWalletPubkey automatically
      if (smartWalletPubkey) {
        const wallet: WalletSession = {
          publicKey: smartWalletPubkey.toBase58(),
          credentialId: 'managed-by-sdk',
          createdAt: Date.now(),
        };
        
        // Notify parent of success
        // Note: SDK handles persistence automatically, no need to call saveSession()
        onSuccess(wallet);
      }
    } catch (err) {
      // Map SDK errors to AuthError format
      const authError = mapSDKError(err);
      setError(authError);
      onError(authError);
    }
  }, [connect, smartWalletPubkey, onSuccess, onError]);

  /**
   * Gets the appropriate button text based on mode and loading state.
   */
  const getButtonText = () => {
    if (isConnecting) {
      return mode === 'create' ? 'Creating Wallet...' : 'Signing In...';
    }
    return mode === 'create' ? 'Create Wallet' : 'Sign In';
  };

  /**
   * Gets the appropriate icon based on mode.
   */
  const getIcon = () => {
    if (mode === 'create') {
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      );
    }
    return (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
        />
      </svg>
    );
  };

  /**
   * Gets user-friendly error message with recovery guidance.
   */
  const getErrorDisplay = () => {
    if (!error) return null;

    let actionText = 'Try Again';
    let showCreateOption = false;

    switch (error.code) {
      case 'USER_CANCELLED':
        actionText = 'Try Again';
        break;
      case 'BROWSER_UNSUPPORTED':
        actionText = 'Learn More';
        break;
      case 'CREDENTIAL_INVALID':
        showCreateOption = mode === 'signin';
        actionText = 'Try Again';
        break;
      case 'NETWORK_ERROR':
        actionText = 'Retry';
        break;
      default:
        actionText = 'Try Again';
    }

    return (
      <div className="mt-4 p-4 bg-error/10 border border-error/20 rounded-card animate-fade-in">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-error flex-shrink-0 mt-0.5"
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
          <div className="flex-1">
            <p className="text-sm text-error font-medium">{error.message}</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleAuth}
                className="text-xs text-primary hover:text-primary-light transition-colors duration-200 focus:outline-none focus:underline"
              >
                {actionText}
              </button>
              {showCreateOption && (
                <span className="text-xs text-text-muted">
                  or create a new wallet
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <button
        onClick={handleAuth}
        disabled={isConnecting}
        className={`
          w-full flex items-center justify-center gap-2 px-6 py-3
          bg-gradient-primary text-white font-medium rounded-card
          transition-all duration-200 ease-out-expo
          ${isConnecting 
            ? 'opacity-70 cursor-not-allowed' 
            : 'hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]'
          }
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-primary
          focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
        `}
      >
        {isConnecting ? (
          <svg
            className="w-5 h-5 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          getIcon()
        )}
        <span>{getButtonText()}</span>
      </button>

      {getErrorDisplay()}
    </div>
  );
}

export default PasskeyAuth;

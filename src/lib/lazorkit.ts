/**
 * Lazorkit SDK Wrapper
 * 
 * This module provides helper functions for the Lazorkit SDK integration.
 * The actual SDK functionality is provided by @lazorkit/wallet package
 * through the LazorkitProvider and useWallet hook.
 * 
 * This file contains only utility functions for:
 * - WebAuthn support detection
 * - SDK error mapping
 * - Transfer validation
 */

import type { AuthError, AuthErrorCode } from '@/types';
import { PublicKey } from '@solana/web3.js';

/** Default RPC URL for Solana Devnet */
const DEFAULT_RPC_URL = 'https://api.devnet.solana.com';

/** Default Lazorkit portal URL */
const DEFAULT_PORTAL_URL = 'https://portal.lazor';

/** Default Paymaster URL for gasless transactions */
const DEFAULT_PAYMASTER_URL = 'https://kora.devnet.lazorkit.com';

/**
 * Configuration options for Lazorkit SDK initialization.
 */
export interface LazorkitConfig {
  /** Solana RPC endpoint URL */
  rpcUrl?: string;
  /** Lazorkit portal URL for passkey operations */
  portalUrl?: string;
  /** Paymaster URL for gasless transaction sponsorship */
  paymasterUrl?: string;
  /** API key for Lazorkit services */
  apiKey?: string;
}

/**
 * Gets the Lazorkit configuration from environment variables.
 * Falls back to default values if not specified.
 * 
 * @returns Configuration object for Lazorkit SDK
 */
export function getLazorkitConfig(): LazorkitConfig {
  return {
    rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || DEFAULT_RPC_URL,
    portalUrl: process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL || DEFAULT_PORTAL_URL,
    paymasterUrl: process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL || DEFAULT_PAYMASTER_URL,
    apiKey: process.env.NEXT_PUBLIC_LAZORKIT_API_KEY,
  };
}


/**
 * Creates an AuthError object with consistent structure.
 * Used to normalize errors from various sources into a standard format.
 * 
 * @param code - The error code for programmatic handling
 * @param message - Human-readable error message
 * @param originalError - The original error for debugging
 * @returns A structured AuthError object
 */
function createAuthError(
  code: AuthErrorCode,
  message: string,
  originalError?: Error
): AuthError {
  return { code, message, originalError };
}

/**
 * Maps raw errors from WebAuthn/Lazorkit to structured AuthError types.
 * 
 * This function analyzes error messages to determine the appropriate error code
 * and provides user-friendly messages with actionable guidance.
 * 
 * Error mapping strategy:
 * - USER_CANCELLED: User dismissed the WebAuthn prompt (recoverable)
 * - BROWSER_UNSUPPORTED: Browser lacks WebAuthn support (requires browser change)
 * - CREDENTIAL_INVALID: Passkey not found or invalid (may need new wallet)
 * - NETWORK_ERROR: Connection issues (retry may help)
 * - UNKNOWN: Unexpected errors (generic recovery)
 * 
 * @param error - The raw error from the SDK or WebAuthn
 * @returns A structured AuthError with appropriate code and message
 */
function mapError(error: unknown): AuthError {
  const err = error instanceof Error ? error : new Error(String(error));
  const message = err.message.toLowerCase();

  // USER_CANCELLED: User dismissed the WebAuthn prompt
  // This is a recoverable error - user can simply try again
  if (message.includes('cancel') || message.includes('abort') || message.includes('user denied')) {
    return createAuthError(
      'USER_CANCELLED',
      'Authentication cancelled. Click to try again.',
      err
    );
  }

  // CREDENTIAL_INVALID: Invalid or not found credential
  // User may need to create a new wallet if passkey was deleted
  // Check this BEFORE browser unsupported to avoid false positives
  if (message.includes('invalid') || message.includes('not found') || message.includes('no credential')) {
    return createAuthError(
      'CREDENTIAL_INVALID',
      'Passkey not recognized. Would you like to create a new wallet?',
      err
    );
  }

  // BROWSER_UNSUPPORTED: Browser doesn't support WebAuthn/passkeys
  // User needs to switch to a supported browser (Chrome, Safari, Edge)
  if (message.includes('not supported') || message.includes('webauthn')) {
    return createAuthError(
      'BROWSER_UNSUPPORTED',
      "Your browser doesn't support passkeys. Please use Chrome, Safari, or Edge.",
      err
    );
  }

  // NETWORK_ERROR: Network-related errors
  // Retry may help if it's a temporary connection issue
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout') || 
      message.includes('service unavailable') || message.includes('503') || message.includes('failed to get payer')) {
    return createAuthError(
      'NETWORK_ERROR',
      'The Lazorkit paymaster service is currently unavailable. Please try again in a few minutes.',
      err
    );
  }

  // UNKNOWN: Catch-all for unexpected errors
  // Provide generic message with retry option
  return createAuthError(
    'UNKNOWN',
    'An unexpected error occurred. Please try again.',
    err
  );
}

/**
 * Maps SDK errors to application AuthError format.
 * Exported for use in components that interact with the SDK.
 * 
 * @param error - The raw error from the SDK
 * @returns A structured AuthError with appropriate code and message
 */
export function mapSDKError(error: unknown): AuthError {
  return mapError(error);
}

/**
 * Checks if WebAuthn is supported in the current browser.
 * WebAuthn is required for passkey-based authentication.
 * 
 * Note: This is a synchronous check. For remote desktop/VM environments,
 * the actual availability check happens during authentication.
 * 
 * @returns True if WebAuthn API is available
 */
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
  );
}

/**
 * Checks if platform authenticator (passkeys) is actually available.
 * This performs an async check that works better in remote/VM environments.
 * 
 * @returns Promise that resolves to true if platform authenticator is available
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    return false;
  }
  
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}



/**
 * Validates transfer parameters before submission.
 * 
 * @param recipient - The recipient address to validate
 * @param amount - The transfer amount
 * @param balance - The sender's current USDC balance (in smallest units)
 * @returns An error message if validation fails, null if valid
 */
export function validateTransfer(
  recipient: string,
  amount: number,
  balance: number
): string | null {
  // Check recipient address format
  if (!recipient || recipient.trim() === '') {
    return 'Recipient address is required.';
  }

  try {
    new PublicKey(recipient);
  } catch {
    return 'Invalid recipient address format.';
  }

  // Check amount is positive
  if (amount <= 0) {
    return 'Amount must be greater than zero.';
  }

  // Check sufficient balance (convert amount to smallest units for comparison)
  const amountInSmallestUnits = amount * 1_000_000;
  if (amountInSmallestUnits > balance) {
    return 'Insufficient USDC balance for this transfer.';
  }

  return null;
}

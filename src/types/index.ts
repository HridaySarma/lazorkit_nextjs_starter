/**
 * Type Definitions for Lazorkit Passkey Wallet Starter
 * 
 * This module defines all TypeScript interfaces and types used throughout
 * the application for type safety and documentation.
 * 
 * @module types
 */

/**
 * Represents an authenticated wallet session.
 * 
 * This interface is used as a data transfer object for wallet authentication
 * callbacks. Session persistence is handled automatically by the LazorKit SDK.
 * 
 * @example
 * const session: WalletSession = {
 *   publicKey: 'ABC123...XYZ',
 *   credentialId: 'managed-by-sdk',
 *   createdAt: Date.now(),
 *   displayName: 'My Wallet'
 * };
 */
export interface WalletSession {
  /** The Solana public key address of the smart wallet (base58 encoded) */
  publicKey: string;
  /** Credential identifier (managed by SDK) */
  credentialId: string;
  /** Timestamp (Unix milliseconds) when the session was created */
  createdAt: number;
  /** Optional user-defined display name for the wallet */
  displayName?: string;
}

/**
 * Represents the current balance state of a wallet.
 * 
 * Balances are stored in their smallest units to avoid floating point issues.
 * Use formatBalance() from lib/solana.ts to convert for display.
 * 
 * @example
 * const balance: WalletBalance = {
 *   solLamports: 1_000_000_000, // 1 SOL
 *   usdcAmount: 10_000_000,     // 10 USDC
 *   lastUpdated: Date.now()
 * };
 */
export interface WalletBalance {
  /** SOL balance in lamports (1 SOL = 1,000,000,000 lamports) */
  solLamports: number;
  /** USDC balance in smallest units (1 USDC = 1,000,000 units) */
  usdcAmount: number;
  /** Timestamp (Unix milliseconds) of last balance fetch */
  lastUpdated: number;
}

/**
 * Represents a transaction in the wallet's history.
 * 
 * Used to display transaction history with relevant details.
 * Amounts are in the token's smallest unit.
 * 
 * @example
 * const tx: Transaction = {
 *   signature: 'abc123...',
 *   type: 'send',
 *   amount: 5_000_000, // 5 USDC
 *   token: 'USDC',
 *   counterparty: 'recipient_address',
 *   timestamp: Date.now(),
 *   status: 'confirmed'
 * };
 */
export interface Transaction {
  /** Transaction signature - unique identifier on Solana blockchain */
  signature: string;
  /** Type of transaction relative to the wallet owner */
  type: 'send' | 'receive' | 'unknown';
  /** Amount transferred (in token's smallest unit) */
  amount: number;
  /** Token type - determines decimal formatting */
  token: 'SOL' | 'USDC';
  /** Counterparty address (recipient for sends, sender for receives) */
  counterparty: string;
  /** Unix timestamp (milliseconds) of the transaction */
  timestamp: number;
  /** Current status of the transaction on the blockchain */
  status: 'confirmed' | 'pending' | 'failed';
}

/**
 * Parameters for initiating a gasless USDC transfer.
 * 
 * Used by the GaslessTransfer component to collect transfer details.
 * Amount is in human-readable format (e.g., 10.50 for $10.50 USDC).
 * 
 * @example
 * const request: TransferRequest = {
 *   recipient: 'ABC123...XYZ',
 *   amount: 10.50
 * };
 */
export interface TransferRequest {
  /** Recipient's Solana public key address (base58 encoded) */
  recipient: string;
  /** Amount of USDC to transfer (human-readable, e.g., 10.50) */
  amount: number;
}

/**
 * Error codes that can occur during passkey authentication.
 * 
 * These codes enable programmatic error handling and appropriate
 * user feedback based on the type of failure.
 * 
 * - USER_CANCELLED: User dismissed the WebAuthn prompt
 * - BROWSER_UNSUPPORTED: Browser lacks WebAuthn support
 * - CREDENTIAL_INVALID: Passkey not found or invalid
 * - NETWORK_ERROR: Connection issues with Lazorkit services
 * - UNKNOWN: Unexpected error occurred
 */
export type AuthErrorCode =
  | 'USER_CANCELLED'
  | 'BROWSER_UNSUPPORTED'
  | 'CREDENTIAL_INVALID'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

/**
 * Structured error type for passkey authentication failures.
 * 
 * Provides both machine-readable code for programmatic handling
 * and human-readable message for user display.
 * 
 * @example
 * const error: AuthError = {
 *   code: 'USER_CANCELLED',
 *   message: 'Authentication cancelled. Click to try again.',
 *   originalError: new Error('User cancelled')
 * };
 */
export interface AuthError {
  /** Error code for programmatic handling and conditional logic */
  code: AuthErrorCode;
  /** Human-readable error message suitable for display to users */
  message: string;
  /** Original error object for debugging and logging purposes */
  originalError?: Error;
}

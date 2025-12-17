/**
 * Solana Utilities Module
 * 
 * This module provides utility functions for interacting with the Solana
 * blockchain, including balance fetching, address validation, transaction
 * history, and formatting helpers.
 * 
 * All functions are designed to work with Solana Devnet by default.
 * 
 * @module solana
 */

import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  ParsedTransactionWithMeta,
} from '@solana/web3.js';
import type { Transaction } from '@/types';

/** USDC has 6 decimal places (1 USDC = 1,000,000 smallest units) */
const USDC_DECIMALS = 6;

/** SOL display precision - 4 decimal places per design requirements */
const SOL_DISPLAY_DECIMALS = 4;

/** USDC display precision - 2 decimal places per design requirements */
const USDC_DISPLAY_DECIMALS = 2;

/** Default Devnet RPC URL - used when NEXT_PUBLIC_SOLANA_RPC_URL is not set */
const DEFAULT_RPC_URL = 'https://api.devnet.solana.com';

/** Devnet USDC mint address - the SPL token mint for USDC on Devnet */
const DEVNET_USDC_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

/**
 * Creates a connection to the Solana Devnet RPC endpoint.
 * Uses environment variable if available, otherwise falls back to default.
 * 
 * @returns A Solana Connection instance configured for Devnet
 */
export function getConnection(): Connection {
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || DEFAULT_RPC_URL;
  return new Connection(rpcUrl, 'confirmed');
}

/**
 * Gets the USDC mint address for the current network.
 * 
 * @returns The USDC mint PublicKey
 */
export function getUsdcMint(): PublicKey {
  const mintAddress = process.env.NEXT_PUBLIC_USDC_MINT || DEVNET_USDC_MINT;
  return new PublicKey(mintAddress);
}

/**
 * Fetches the SOL balance for a given wallet address.
 * 
 * @param address - The wallet's public key address as a string
 * @returns The balance in lamports
 * @throws Error if the address is invalid or RPC call fails
 */
export async function getSOLBalance(address: string): Promise<number> {
  const connection = getConnection();
  const publicKey = new PublicKey(address);
  return connection.getBalance(publicKey);
}


/**
 * Fetches the USDC balance for a given wallet address.
 * Queries the SPL token account associated with the wallet.
 * 
 * @param address - The wallet's public key address as a string
 * @returns The USDC balance in smallest units (divide by 1e6 for human-readable)
 * @throws Error if the address is invalid or RPC call fails
 */
export async function getUSDCBalance(address: string): Promise<number> {
  const connection = getConnection();
  const publicKey = new PublicKey(address);
  const usdcMint = getUsdcMint();

  try {
    // Get all token accounts for this wallet that hold USDC
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { mint: usdcMint }
    );

    if (tokenAccounts.value.length === 0) {
      return 0;
    }

    // Sum up balances from all USDC token accounts (usually just one)
    let totalBalance = 0;
    for (const account of tokenAccounts.value) {
      const parsedInfo = account.account.data.parsed?.info;
      if (parsedInfo?.tokenAmount?.amount) {
        totalBalance += parseInt(parsedInfo.tokenAmount.amount, 10);
      }
    }

    return totalBalance;
  } catch (error) {
    // If no token account exists, balance is 0
    if (error instanceof Error && error.message.includes('could not find')) {
      return 0;
    }
    throw error;
  }
}

/**
 * Formats a balance value for display.
 * SOL is formatted to 4 decimal places, USDC to 2 decimal places.
 * 
 * @param amount - The raw amount (lamports for SOL, smallest units for USDC)
 * @param token - The token type ('SOL' or 'USDC')
 * @returns A formatted string with the appropriate decimal places
 */
export function formatBalance(amount: number, token: 'SOL' | 'USDC'): string {
  if (token === 'SOL') {
    const solAmount = amount / LAMPORTS_PER_SOL;
    return solAmount.toFixed(SOL_DISPLAY_DECIMALS);
  } else {
    const usdcAmount = amount / Math.pow(10, USDC_DECIMALS);
    return usdcAmount.toFixed(USDC_DISPLAY_DECIMALS);
  }
}

/**
 * Validates whether a string is a valid Solana public key address.
 * Checks for valid base58 encoding and correct byte length (32 bytes).
 * 
 * @param address - The string to validate
 * @returns True if the address is a valid Solana public key
 */
export function validateSolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  try {
    const publicKey = new PublicKey(address);
    // PublicKey constructor validates base58 and creates a 32-byte key
    // We also verify it's on the ed25519 curve by checking it's not all zeros
    return PublicKey.isOnCurve(publicKey.toBytes());
  } catch {
    return false;
  }
}

/**
 * Truncates a Solana address for display.
 * Shows first 4 and last 4 characters with ellipsis in between.
 * 
 * @param address - The full Solana public key address
 * @returns A truncated string in format "XXXX...XXXX"
 */
export function truncateAddress(address: string): string {
  if (!address || address.length < 8) {
    return address;
  }
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/**
 * Fetches the transaction history for a wallet.
 * Returns the 10 most recent transactions.
 * 
 * @param address - The wallet's public key address
 * @returns An array of Transaction objects
 */
export async function getTransactionHistory(address: string): Promise<Transaction[]> {
  const connection = getConnection();
  const publicKey = new PublicKey(address);

  try {
    // Fetch recent transaction signatures
    const signatures = await connection.getSignaturesForAddress(publicKey, {
      limit: 10,
    });

    if (signatures.length === 0) {
      return [];
    }

    // Fetch full transaction details
    const transactions: Transaction[] = [];
    
    for (const sig of signatures) {
      try {
        const tx = await connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (tx) {
          const parsed = parseTransaction(tx, address);
          if (parsed) {
            transactions.push(parsed);
          }
        }
      } catch {
        // Skip transactions that fail to parse
        continue;
      }
    }

    return transactions;
  } catch (error) {
    throw new Error(`Failed to fetch transaction history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parses a raw Solana transaction into our Transaction format.
 * 
 * @param tx - The parsed transaction from Solana
 * @param walletAddress - The wallet address to determine send/receive
 * @returns A Transaction object or null if parsing fails
 */
function parseTransaction(
  tx: ParsedTransactionWithMeta,
  walletAddress: string
): Transaction | null {
  if (!tx.meta || !tx.transaction) {
    return null;
  }

  const signature = tx.transaction.signatures[0];
  const timestamp = tx.blockTime ? tx.blockTime * 1000 : Date.now();
  const status = tx.meta.err ? 'failed' : 'confirmed';

  // Try to parse as SOL transfer first
  const instructions = tx.transaction.message.instructions;
  
  for (const instruction of instructions) {
    if ('parsed' in instruction && instruction.parsed) {
      const parsed = instruction.parsed;
      
      // Handle SOL transfers
      if (parsed.type === 'transfer' && instruction.program === 'system') {
        const info = parsed.info;
        const isSend = info.source === walletAddress;
        
        return {
          signature,
          type: isSend ? 'send' : 'receive',
          amount: info.lamports,
          token: 'SOL',
          counterparty: isSend ? info.destination : info.source,
          timestamp,
          status,
        };
      }
      
      // Handle SPL token transfers (USDC)
      if (parsed.type === 'transfer' && instruction.program === 'spl-token') {
        const info = parsed.info;
        const isSend = info.authority === walletAddress || info.source === walletAddress;
        
        return {
          signature,
          type: isSend ? 'send' : 'receive',
          amount: parseInt(info.amount, 10),
          token: 'USDC',
          counterparty: isSend ? info.destination : (info.authority || info.source),
          timestamp,
          status,
        };
      }
    }
  }

  // Return unknown type for transactions we can't parse
  return {
    signature,
    type: 'unknown',
    amount: 0,
    token: 'SOL',
    counterparty: '',
    timestamp,
    status,
  };
}

/**
 * Gets the Solana Explorer URL for a transaction.
 * 
 * @param signature - The transaction signature
 * @returns The full Explorer URL with devnet cluster parameter
 */
export function getExplorerUrl(signature: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://explorer.solana.com';
  return `${baseUrl}/tx/${signature}?cluster=devnet`;
}

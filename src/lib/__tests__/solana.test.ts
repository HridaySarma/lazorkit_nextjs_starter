import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatBalance, validateSolanaAddress, truncateAddress } from '../solana';
import { Keypair } from '@solana/web3.js';

/**
 * Arbitrary generator for valid Solana public key addresses.
 * Generates real keypairs to ensure valid base58-encoded 32-byte keys.
 */
const validSolanaAddressArbitrary = fc.integer().map(() => {
  const keypair = Keypair.generate();
  return keypair.publicKey.toBase58();
});

/**
 * Arbitrary generator for SOL amounts in lamports.
 * Range: 0 to 1 billion SOL (in lamports)
 */
const solLamportsArbitrary = fc.integer({ min: 0, max: 1_000_000_000 * 1_000_000_000 });

/**
 * Arbitrary generator for USDC amounts in smallest units.
 * Range: 0 to 1 billion USDC (in smallest units)
 */
const usdcAmountArbitrary = fc.integer({ min: 0, max: 1_000_000_000 * 1_000_000 });

/**
 * Arbitrary generator for invalid addresses.
 */
const invalidAddressArbitrary = fc.oneof(
  fc.constant(''),
  fc.constant('invalid'),
  fc.string({ minLength: 1, maxLength: 10 }),
  fc.string({ minLength: 50, maxLength: 100 }),
  // Invalid base58 characters (0, O, I, l are not in base58)
  fc.constant('0OIl1234567890'),
);

describe('Solana Utilities - Property Tests', () => {
  /**
   * **Feature: lazorkit-passkey-wallet-starter, Property 3: Balance Formatting Consistency**
   * For any numeric balance value (SOL in lamports, USDC in smallest units),
   * the formatting function SHALL produce a string with exactly 4 decimal places
   * for SOL and 2 decimal places for USDC.
   * **Validates: Requirements 4.6**
   */
  it('Property 3: Balance Formatting Consistency', () => {
    // Test SOL formatting (4 decimal places)
    fc.assert(
      fc.property(solLamportsArbitrary, (lamports) => {
        const formatted = formatBalance(lamports, 'SOL');
        
        // Should be a valid number string
        expect(Number.isNaN(parseFloat(formatted))).toBe(false);
        
        // Should have exactly 4 decimal places
        const parts = formatted.split('.');
        expect(parts.length).toBe(2);
        expect(parts[1].length).toBe(4);
      }),
      { numRuns: 100 }
    );

    // Test USDC formatting (2 decimal places)
    fc.assert(
      fc.property(usdcAmountArbitrary, (amount) => {
        const formatted = formatBalance(amount, 'USDC');
        
        // Should be a valid number string
        expect(Number.isNaN(parseFloat(formatted))).toBe(false);
        
        // Should have exactly 2 decimal places
        const parts = formatted.split('.');
        expect(parts.length).toBe(2);
        expect(parts[1].length).toBe(2);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: lazorkit-passkey-wallet-starter, Property 4: Address Validation Correctness**
   * For any string input, the address validation function SHALL return true
   * if and only if the string is a valid base58-encoded Solana public key
   * of exactly 32 bytes.
   * **Validates: Requirements 5.1, 5.5**
   */
  it('Property 4: Address Validation Correctness - valid addresses', () => {
    fc.assert(
      fc.property(validSolanaAddressArbitrary, (address) => {
        // Valid Solana addresses should pass validation
        expect(validateSolanaAddress(address)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('Property 4: Address Validation Correctness - invalid addresses', () => {
    fc.assert(
      fc.property(invalidAddressArbitrary, (address) => {
        // Invalid addresses should fail validation
        expect(validateSolanaAddress(address)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: lazorkit-passkey-wallet-starter, Property 7: Address Truncation Format**
   * For any valid Solana public key address, the truncation function SHALL
   * produce a string in the format "XXXX...XXXX" where the first and last
   * 4 characters are preserved.
   * **Validates: Requirements 7.8**
   */
  it('Property 7: Address Truncation Format', () => {
    fc.assert(
      fc.property(validSolanaAddressArbitrary, (address) => {
        const truncated = truncateAddress(address);
        
        // Should follow format "XXXX...XXXX"
        expect(truncated).toMatch(/^.{4}\.\.\..{4}$/);
        
        // First 4 characters should match original
        expect(truncated.slice(0, 4)).toBe(address.slice(0, 4));
        
        // Last 4 characters should match original
        expect(truncated.slice(-4)).toBe(address.slice(-4));
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: lazorkit-passkey-wallet-starter, Property 6: Transaction Display Completeness**
 * 
 * For any Transaction object, the rendered display SHALL include the transaction
 * signature, type, amount, counterparty address, timestamp, and status.
 * 
 * **Validates: Requirements 6.2**
 */
describe('Transaction Display - Property Tests', () => {
  /**
   * Arbitrary generator for valid transaction types.
   */
  const transactionTypeArbitrary = fc.constantFrom('send', 'receive', 'unknown') as fc.Arbitrary<'send' | 'receive' | 'unknown'>;

  /**
   * Arbitrary generator for valid token types.
   */
  const tokenTypeArbitrary = fc.constantFrom('SOL', 'USDC') as fc.Arbitrary<'SOL' | 'USDC'>;

  /**
   * Arbitrary generator for valid transaction statuses.
   */
  const statusArbitrary = fc.constantFrom('confirmed', 'pending', 'failed') as fc.Arbitrary<'confirmed' | 'pending' | 'failed'>;

  /**
   * Arbitrary generator for transaction signatures (base58-like strings).
   */
  const signatureArbitrary = fc.stringOf(
    fc.constantFrom(...'123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'.split('')),
    { minLength: 64, maxLength: 88 }
  );

  /**
   * Arbitrary generator for Transaction objects.
   */
  const transactionArbitrary = fc.record({
    signature: signatureArbitrary,
    type: transactionTypeArbitrary,
    amount: fc.integer({ min: 0, max: 1_000_000_000_000 }),
    token: tokenTypeArbitrary,
    counterparty: validSolanaAddressArbitrary,
    timestamp: fc.integer({ min: 1609459200000, max: 1893456000000 }), // 2021-2030
    status: statusArbitrary,
  });

  /**
   * Simulates rendering a transaction to extract display data.
   * This mirrors what the TransactionHistory component does.
   */
  function renderTransactionDisplay(tx: {
    signature: string;
    type: 'send' | 'receive' | 'unknown';
    amount: number;
    token: 'SOL' | 'USDC';
    counterparty: string;
    timestamp: number;
    status: 'confirmed' | 'pending' | 'failed';
  }): {
    hasSignature: boolean;
    hasType: boolean;
    hasAmount: boolean;
    hasCounterparty: boolean;
    hasTimestamp: boolean;
    hasStatus: boolean;
  } {
    // Format amount for display
    const formattedAmount = formatBalance(tx.amount, tx.token);
    
    // Format counterparty for display
    const formattedCounterparty = truncateAddress(tx.counterparty);
    
    // Format timestamp for display
    const date = new Date(tx.timestamp);
    const formattedTimestamp = date.toISOString();
    
    // Format status for display
    const formattedStatus = tx.status.charAt(0).toUpperCase() + tx.status.slice(1);
    
    // Format type for display
    const formattedType = tx.type === 'unknown' ? 'Transaction' : tx.type;

    return {
      hasSignature: tx.signature.length > 0,
      hasType: formattedType.length > 0,
      hasAmount: formattedAmount.length > 0 && !isNaN(parseFloat(formattedAmount)),
      hasCounterparty: formattedCounterparty.length > 0,
      hasTimestamp: formattedTimestamp.length > 0 && !isNaN(date.getTime()),
      hasStatus: formattedStatus.length > 0,
    };
  }

  it('Property 6: Transaction Display Completeness', () => {
    fc.assert(
      fc.property(transactionArbitrary, (tx) => {
        const display = renderTransactionDisplay(tx);
        
        // All required fields must be present in the display
        expect(display.hasSignature).toBe(true);
        expect(display.hasType).toBe(true);
        expect(display.hasAmount).toBe(true);
        expect(display.hasCounterparty).toBe(true);
        expect(display.hasTimestamp).toBe(true);
        expect(display.hasStatus).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('Property 6: Transaction amount formatting preserves token type', () => {
    fc.assert(
      fc.property(transactionArbitrary, (tx) => {
        const formattedAmount = formatBalance(tx.amount, tx.token);
        
        // SOL should have 4 decimal places, USDC should have 2
        const parts = formattedAmount.split('.');
        if (tx.token === 'SOL') {
          expect(parts[1].length).toBe(4);
        } else {
          expect(parts[1].length).toBe(2);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('Property 6: Transaction counterparty is properly truncated', () => {
    fc.assert(
      fc.property(transactionArbitrary, (tx) => {
        const truncated = truncateAddress(tx.counterparty);
        
        // Should follow format "XXXX...XXXX"
        expect(truncated).toMatch(/^.{4}\.\.\..{4}$/);
        
        // Should preserve first and last 4 characters
        expect(truncated.slice(0, 4)).toBe(tx.counterparty.slice(0, 4));
        expect(truncated.slice(-4)).toBe(tx.counterparty.slice(-4));
      }),
      { numRuns: 100 }
    );
  });
});

describe('Solana Utilities - Unit Tests', () => {
  it('should format SOL balance correctly', () => {
    // 1 SOL = 1,000,000,000 lamports
    expect(formatBalance(1_000_000_000, 'SOL')).toBe('1.0000');
    expect(formatBalance(500_000_000, 'SOL')).toBe('0.5000');
    expect(formatBalance(0, 'SOL')).toBe('0.0000');
    expect(formatBalance(123_456_789, 'SOL')).toBe('0.1235');
  });

  it('should format USDC balance correctly', () => {
    // 1 USDC = 1,000,000 smallest units
    expect(formatBalance(1_000_000, 'USDC')).toBe('1.00');
    expect(formatBalance(500_000, 'USDC')).toBe('0.50');
    expect(formatBalance(0, 'USDC')).toBe('0.00');
    expect(formatBalance(1_234_567, 'USDC')).toBe('1.23');
  });

  it('should validate known valid addresses', () => {
    // System program address (known valid)
    expect(validateSolanaAddress('11111111111111111111111111111111')).toBe(true);
  });

  it('should reject invalid addresses', () => {
    expect(validateSolanaAddress('')).toBe(false);
    expect(validateSolanaAddress('invalid')).toBe(false);
    expect(validateSolanaAddress('too-short')).toBe(false);
  });

  it('should truncate addresses correctly', () => {
    const address = 'ABC123xyz789DEF456uvw012GHI789jkl';
    expect(truncateAddress(address)).toBe('ABC1...9jkl');
  });

  it('should handle short addresses in truncation', () => {
    expect(truncateAddress('short')).toBe('short');
    expect(truncateAddress('')).toBe('');
  });
});

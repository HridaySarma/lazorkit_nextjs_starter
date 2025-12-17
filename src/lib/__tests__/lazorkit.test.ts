import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  isWebAuthnSupported,
  validateTransfer,
  getLazorkitConfig,
  mapSDKError,
} from '../lazorkit';
import { Keypair } from '@solana/web3.js';
import type { AuthError } from '@/types';

describe('Lazorkit Wrapper - Unit Tests', () => {
  describe('isWebAuthnSupported', () => {
    beforeEach(() => {
      // Reset window mock before each test
      vi.stubGlobal('window', undefined);
    });

    it('should return false when window is undefined (SSR)', () => {
      vi.stubGlobal('window', undefined);
      expect(isWebAuthnSupported()).toBe(false);
    });

    it('should return false when PublicKeyCredential is not available', () => {
      vi.stubGlobal('window', {});
      expect(isWebAuthnSupported()).toBe(false);
    });

    it('should return true when WebAuthn is fully supported', () => {
      vi.stubGlobal('window', {
        PublicKeyCredential: {
          isUserVerifyingPlatformAuthenticatorAvailable: () => Promise.resolve(true),
        },
      });
      expect(isWebAuthnSupported()).toBe(true);
    });
  });

  describe('validateTransfer', () => {
    const validRecipient = Keypair.generate().publicKey.toBase58();
    const validBalance = 100_000_000; // 100 USDC in smallest units

    it('should return null for valid transfer parameters', () => {
      const error = validateTransfer(validRecipient, 10, validBalance);
      expect(error).toBeNull();
    });

    it('should return error for empty recipient', () => {
      const error = validateTransfer('', 10, validBalance);
      expect(error).toBe('Recipient address is required.');
    });

    it('should return error for whitespace-only recipient', () => {
      const error = validateTransfer('   ', 10, validBalance);
      expect(error).toBe('Recipient address is required.');
    });

    it('should return error for invalid recipient address format', () => {
      const error = validateTransfer('invalid-address', 10, validBalance);
      expect(error).toBe('Invalid recipient address format.');
    });

    it('should return error for zero amount', () => {
      const error = validateTransfer(validRecipient, 0, validBalance);
      expect(error).toBe('Amount must be greater than zero.');
    });

    it('should return error for negative amount', () => {
      const error = validateTransfer(validRecipient, -5, validBalance);
      expect(error).toBe('Amount must be greater than zero.');
    });

    it('should return error for insufficient balance', () => {
      // Try to send 200 USDC when balance is 100 USDC
      const error = validateTransfer(validRecipient, 200, validBalance);
      expect(error).toBe('Insufficient USDC balance for this transfer.');
    });

    it('should allow transfer of exact balance', () => {
      // Balance is 100 USDC (100_000_000 smallest units)
      const error = validateTransfer(validRecipient, 100, validBalance);
      expect(error).toBeNull();
    });

    it('should handle decimal amounts correctly', () => {
      // 10.50 USDC = 10_500_000 smallest units
      const error = validateTransfer(validRecipient, 10.5, validBalance);
      expect(error).toBeNull();
    });

    it('should reject amount exceeding balance by small margin', () => {
      // Try to send 100.01 USDC when balance is exactly 100 USDC
      const error = validateTransfer(validRecipient, 100.01, validBalance);
      expect(error).toBe('Insufficient USDC balance for this transfer.');
    });
  });

  describe('getLazorkitConfig', () => {
    it('should return default values when env vars are not set', () => {
      const config = getLazorkitConfig();
      
      expect(config.rpcUrl).toBeDefined();
      expect(config.portalUrl).toBeDefined();
      expect(config.paymasterUrl).toBeDefined();
    });

    it('should return config with expected structure', () => {
      const config = getLazorkitConfig();
      
      expect(typeof config.rpcUrl).toBe('string');
      expect(typeof config.portalUrl).toBe('string');
      expect(typeof config.paymasterUrl).toBe('string');
    });
  });
});

describe('Lazorkit Wrapper - Error Handling', () => {
  describe('mapSDKError', () => {
    it('should map user cancellation errors to USER_CANCELLED', () => {
      const cancelErrors = [
        new Error('User cancelled the operation'),
        new Error('Operation aborted by user'),
        new Error('User denied authentication'),
      ];
      
      cancelErrors.forEach(err => {
        const authError = mapSDKError(err);
        expect(authError.code).toBe('USER_CANCELLED');
        expect(authError.message).toBe('Authentication cancelled. Click to try again.');
        expect(authError.originalError).toBe(err);
      });
    });

    it('should map browser unsupported errors to BROWSER_UNSUPPORTED', () => {
      const unsupportedErrors = [
        new Error('WebAuthn not supported'),
        new Error('WebAuthn API not supported in this browser'),
        new Error('Feature not supported'),
      ];
      
      unsupportedErrors.forEach(err => {
        const authError = mapSDKError(err);
        expect(authError.code).toBe('BROWSER_UNSUPPORTED');
        expect(authError.message).toBe("Your browser doesn't support passkeys. Please use Chrome, Safari, or Edge.");
        expect(authError.originalError).toBe(err);
      });
    });

    it('should map invalid credential errors to CREDENTIAL_INVALID', () => {
      const invalidErrors = [
        new Error('Credential invalid'),
        new Error('Credential not found'),
        new Error('No credential available'),
      ];
      
      invalidErrors.forEach(err => {
        const authError = mapSDKError(err);
        expect(authError.code).toBe('CREDENTIAL_INVALID');
        expect(authError.message).toBe('Passkey not recognized. Would you like to create a new wallet?');
        expect(authError.originalError).toBe(err);
      });
    });

    it('should map network errors to NETWORK_ERROR', () => {
      const networkErrors = [
        new Error('Network error occurred'),
        new Error('Fetch failed'),
        new Error('Request timeout'),
      ];
      
      networkErrors.forEach(err => {
        const authError = mapSDKError(err);
        expect(authError.code).toBe('NETWORK_ERROR');
        expect(authError.message).toBe('Network error. Please check your connection and try again.');
        expect(authError.originalError).toBe(err);
      });
    });

    it('should map unknown errors to UNKNOWN', () => {
      const unknownErrors = [
        new Error('Something unexpected happened'),
        new Error('Random error message'),
      ];
      
      unknownErrors.forEach(err => {
        const authError = mapSDKError(err);
        expect(authError.code).toBe('UNKNOWN');
        expect(authError.message).toBe('An unexpected error occurred. Please try again.');
        expect(authError.originalError).toBe(err);
      });
    });

    it('should handle non-Error objects', () => {
      const nonErrorInputs = [
        'string error',
        { message: 'object error' },
        null,
        undefined,
      ];
      
      nonErrorInputs.forEach(input => {
        const authError = mapSDKError(input);
        expect(authError.code).toBe('UNKNOWN');
        expect(authError.message).toBe('An unexpected error occurred. Please try again.');
        expect(authError.originalError).toBeInstanceOf(Error);
      });
    });

    it('should preserve original error for debugging', () => {
      const originalError = new Error('Test error with stack trace');
      const authError = mapSDKError(originalError);
      
      expect(authError.originalError).toBe(originalError);
      expect(authError.originalError?.stack).toBeDefined();
    });

    it('should be case-insensitive when matching error messages', () => {
      const mixedCaseErrors = [
        new Error('USER CANCELLED'),
        new Error('User Cancelled'),
        new Error('user cancelled'),
      ];
      
      mixedCaseErrors.forEach(err => {
        const authError = mapSDKError(err);
        expect(authError.code).toBe('USER_CANCELLED');
      });
    });
  });
});

/**
 * **Feature: lazorkit-passkey-wallet-starter, Property 5: Insufficient Balance Detection**
 * 
 * For any transfer amount and wallet balance, the validation function SHALL return
 * an insufficient funds error if and only if the transfer amount exceeds the available balance.
 * 
 * **Validates: Requirements 5.6**
 */
describe('Lazorkit Wrapper - Property-Based Tests', () => {
  // Generate a valid Solana address for testing
  const validRecipient = Keypair.generate().publicKey.toBase58();

  describe('Property 5: Insufficient Balance Detection', () => {
    it('should return insufficient funds error when amount exceeds balance', () => {
      fc.assert(
        fc.property(
          // Generate balance in smallest units (0 to 1 billion USDC)
          fc.integer({ min: 0, max: 1_000_000_000_000 }),
          // Generate additional amount to exceed balance (in smallest units, then convert)
          fc.integer({ min: 1, max: 1_000_000_000 }),
          (balanceSmallestUnits, additionalSmallestUnits) => {
            // Convert balance to human-readable USDC
            const balanceUsdc = balanceSmallestUnits / 1_000_000;
            
            // Create an amount that exceeds the balance
            const exceedingAmount = balanceUsdc + (additionalSmallestUnits / 1_000_000);
            
            // Validate transfer with exceeding amount
            const error = validateTransfer(validRecipient, exceedingAmount, balanceSmallestUnits);
            
            // Should return insufficient funds error
            return error === 'Insufficient USDC balance for this transfer.';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT return insufficient funds error when amount is within balance', () => {
      fc.assert(
        fc.property(
          // Generate balance in whole USDC units to avoid floating point precision issues
          // Balance range: 1 to 1,000,000 USDC (in smallest units)
          fc.integer({ min: 1, max: 1_000_000 }).map(n => n * 1_000_000),
          // Generate percentage of balance to use (1-99% to ensure we're strictly under)
          fc.integer({ min: 1, max: 99 }),
          (balanceSmallestUnits, percentage) => {
            // Calculate amount as percentage of balance (in whole USDC units)
            const balanceUsdc = balanceSmallestUnits / 1_000_000;
            const amountUsdc = Math.floor(balanceUsdc * percentage / 100);
            
            // Skip if amount is zero
            if (amountUsdc <= 0) return true;
            
            // Validate transfer with amount within balance
            const error = validateTransfer(validRecipient, amountUsdc, balanceSmallestUnits);
            
            // Should NOT return insufficient funds error (error should be null)
            return error === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow transfer of exact balance amount', () => {
      fc.assert(
        fc.property(
          // Generate balance in smallest units (use multiples of 1_000_000 to avoid precision issues)
          fc.integer({ min: 1, max: 1_000_000 }).map(n => n * 1_000_000),
          (balanceSmallestUnits) => {
            // Convert balance to human-readable USDC (exact conversion)
            const exactBalance = balanceSmallestUnits / 1_000_000;
            
            // Exact balance should be valid
            const error = validateTransfer(validRecipient, exactBalance, balanceSmallestUnits);
            
            return error === null;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

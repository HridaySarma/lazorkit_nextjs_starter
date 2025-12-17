import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateSDKConfig, getSDKConfig, isSDKConfigured } from '../config';

describe('SDK Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('validateSDKConfig', () => {
    it('should return default values when environment variables are not set', () => {
      delete process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL;
      delete process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL;
      delete process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL;

      const config = validateSDKConfig();

      expect(config.rpcUrl).toBe('https://api.devnet.solana.com');
      expect(config.portalUrl).toBe('https://portal.lazor.sh');
      expect(config.paymasterUrl).toBe('https://lazorkit-paymaster.onrender.com');
    });

    it('should use environment variables when they are set', () => {
      process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL = 'https://custom-rpc.com';
      process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL = 'https://custom-portal.com';
      process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL = 'https://custom-paymaster.com';

      const config = validateSDKConfig();

      expect(config.rpcUrl).toBe('https://custom-rpc.com');
      expect(config.portalUrl).toBe('https://custom-portal.com');
      expect(config.paymasterUrl).toBe('https://custom-paymaster.com');
    });

    it('should include API key when provided', () => {
      process.env.NEXT_PUBLIC_LAZORKIT_API_KEY = 'test-api-key';

      const config = validateSDKConfig();

      expect(config.apiKey).toBe('test-api-key');
    });

    it('should have undefined API key when not provided', () => {
      delete process.env.NEXT_PUBLIC_LAZORKIT_API_KEY;

      const config = validateSDKConfig();

      expect(config.apiKey).toBeUndefined();
    });
  });

  describe('getSDKConfig', () => {
    it('should return validated configuration', () => {
      process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL = 'https://test-rpc.com';

      const config = getSDKConfig();

      expect(config).toHaveProperty('rpcUrl');
      expect(config).toHaveProperty('portalUrl');
      expect(config).toHaveProperty('paymasterUrl');
    });
  });

  describe('isSDKConfigured', () => {
    it('should return true when all required variables are set', () => {
      process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL = 'https://test-rpc.com';
      process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL = 'https://test-portal.com';
      process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL = 'https://test-paymaster.com';

      expect(isSDKConfigured()).toBe(true);
    });

    it('should return false when any required variable is missing', () => {
      delete process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL;
      process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL = 'https://test-portal.com';
      process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL = 'https://test-paymaster.com';

      expect(isSDKConfigured()).toBe(false);
    });

    it('should return false when all variables are missing', () => {
      delete process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL;
      delete process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL;
      delete process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL;

      expect(isSDKConfigured()).toBe(false);
    });
  });
});

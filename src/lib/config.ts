/**
 * Environment Configuration and Validation
 * 
 * This module validates required environment variables for the LazorKit SDK
 * and provides typed access to configuration values.
 */

export interface SDKConfig {
  rpcUrl: string;
  portalUrl: string;
  paymasterUrl: string;
  apiKey?: string;
}

/**
 * Default configuration values for LazorKit SDK
 */
const DEFAULT_CONFIG: SDKConfig = {
  rpcUrl: 'https://api.devnet.solana.com',
  portalUrl: 'https://portal.lazor.sh',
  paymasterUrl: 'https://kora.devnet.lazorkit.com',
};

/**
 * Validates that required SDK environment variables are present
 * Logs warnings for missing variables and uses defaults
 * 
 * @returns {SDKConfig} Configuration object with validated values
 */
export function validateSDKConfig(): SDKConfig {
  const requiredVars = [
    'NEXT_PUBLIC_LAZORKIT_RPC_URL',
    'NEXT_PUBLIC_LAZORKIT_PORTAL_URL',
    'NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL',
  ];

  const missing: string[] = [];
  
  // Check for missing required variables
  requiredVars.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  // Log warnings for missing variables
  if (missing.length > 0) {
    console.warn(
      '[LazorKit SDK] Missing environment variables:',
      missing.join(', '),
      '\nUsing default values. Please configure these in your .env file.'
    );
  }

  // Return configuration with defaults as fallback
  return {
    rpcUrl: process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL || DEFAULT_CONFIG.rpcUrl,
    portalUrl: process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL || DEFAULT_CONFIG.portalUrl,
    paymasterUrl: process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL || DEFAULT_CONFIG.paymasterUrl,
    apiKey: process.env.NEXT_PUBLIC_LAZORKIT_API_KEY,
  };
}

/**
 * Get the validated SDK configuration
 * Call this once at application startup
 */
export function getSDKConfig(): SDKConfig {
  return validateSDKConfig();
}

/**
 * Check if all required environment variables are properly configured
 * 
 * @returns {boolean} True if all required variables are set
 */
export function isSDKConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL &&
    process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL &&
    process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL
  );
}

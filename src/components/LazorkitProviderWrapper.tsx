'use client';

import { LazorkitProvider } from '@lazorkit/wallet';
import { ReactNode } from 'react';

/**
 * Client-side wrapper for LazorkitProvider
 * 
 * This component wraps the LazorkitProvider from @lazorkit/wallet
 * and marks it as a client component to avoid SSR issues with React hooks.
 * 
 * Configures the SDK with:
 * - RPC endpoint for Solana blockchain communication
 * - Portal URL for passkey credential management
 * - Paymaster configuration for gasless transactions
 * 
 * Note: The @lazorkit/wallet v2.0.0 SDK has built-in credential persistence
 * and automatic reconnection. The following features are handled automatically:
 * - Auto-connect: SDK automatically restores sessions on page load
 * - Persist credentials: SDK stores credentials in browser storage by default
 * - Sync between tabs: Handled by browser storage events
 * - Iframe support: Enabled by default in the SDK
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */
export function LazorkitProviderWrapper({ children }: { children: ReactNode }) {
  const paymasterUrl = process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL || 'https://kora.devnet.lazorkit.com';
  
  // Optional: Skip paymaster config if explicitly disabled for testing
  const paymasterConfig = process.env.NEXT_PUBLIC_DISABLE_PAYMASTER === 'true' 
    ? undefined 
    : {
        paymasterUrl,
        apiKey: process.env.NEXT_PUBLIC_LAZORKIT_API_KEY,
      };

  return (
    <LazorkitProvider
      rpcUrl={process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL || 'https://api.devnet.solana.com'}
      portalUrl={process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL || 'https://portal.lazor.sh'}
      paymasterConfig={paymasterConfig}
    >
      {children}
    </LazorkitProvider>
  );
}

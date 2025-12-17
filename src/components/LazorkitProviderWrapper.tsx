'use client';

import { LazorkitProvider } from '@lazorkit/wallet';
import { ReactNode } from 'react';

/**
 * Client-side wrapper for LazorkitProvider
 * 
 * This component wraps the LazorkitProvider from @lazorkit/wallet
 * and marks it as a client component to avoid SSR issues with React hooks.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
export function LazorkitProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <LazorkitProvider
      rpcUrl={process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL || 'https://api.devnet.solana.com'}
      portalUrl={process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL || 'https://portal.lazor.sh'}
      paymasterConfig={{
        paymasterUrl: process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL || 'https://lazorkit-paymaster.onrender.com',
        apiKey: process.env.NEXT_PUBLIC_LAZORKIT_API_KEY,
      }}
    >
      {children}
    </LazorkitProvider>
  );
}

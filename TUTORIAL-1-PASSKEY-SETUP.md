# Tutorial 1: Passkey Authentication Setup

This tutorial walks you through implementing passkey-based wallet authentication using the Lazorkit SDK. By the end, you'll understand how to create wallets and authenticate users using device biometrics (Face ID, Touch ID) instead of seed phrases.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Understanding WebAuthn](#understanding-webauthn)
4. [Setting Up the Lazorkit Wrapper](#setting-up-the-lazorkit-wrapper)
5. [Creating the Auth Component](#creating-the-auth-component)
6. [Session Persistence](#session-persistence)
7. [Error Handling](#error-handling)
8. [Testing](#testing)
9. [Common Pitfalls](#common-pitfalls)

## Overview

Passkey authentication uses the WebAuthn standard to create cryptographic credentials stored securely on the user's device. When combined with the Lazorkit SDK, this enables:

- **Seedless wallets**: No 12/24 word phrases to manage
- **Real biometric security**: Protected by Face ID, Touch ID, Windows Hello, or fingerprint
- **Smart wallet creation**: Program-derived addresses controlled by passkey credentials
- **SDK-managed state**: Automatic credential persistence and session management
- **Cross-device support**: Works on phones, tablets, and computers
- **Phishing resistance**: Credentials are bound to the origin

**Important**: This tutorial covers the **real Lazorkit SDK integration** using `@lazorkit/wallet` v2.0.0+, which triggers actual biometric prompts on your device.

## Prerequisites

Before starting, ensure you have:

- Node.js 18.17 or later
- A Next.js 14+ project with TypeScript
- A device with biometric authentication (Touch ID, Face ID, Windows Hello, or fingerprint)
- A supported browser (Chrome 67+, Safari 13+, Edge 18+, Firefox 60+)
- The Lazorkit SDK installed:

```bash
npm install @lazorkit/wallet@^2.0.0 @solana/web3.js
```

## Understanding WebAuthn

WebAuthn is the browser API that powers passkeys. Here's how the flow works:

### Wallet Creation (Registration)

```
User clicks "Create Wallet"
        ↓
Browser prompts for biometric
        ↓
Device creates keypair
        ↓
Public key sent to Lazorkit
        ↓
Smart wallet created on Solana
        ↓
Session returned to app
```

### Sign In (Authentication)

```
User clicks "Sign In"
        ↓
Browser prompts for biometric
        ↓
Device signs challenge
        ↓
Signature verified by Lazorkit
        ↓
Existing wallet restored
        ↓
Session returned to app
```

## Setting Up the Lazorkit Provider

The Lazorkit SDK uses React Context to manage wallet state. You need to wrap your application with `LazorKitProvider` before using any wallet functionality.

### Step 1: Configure the Provider

First, wrap your app with the provider in `src/app/layout.tsx`:

```typescript
import { LazorKitProvider } from '@lazorkit/wallet';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LazorKitProvider
          rpcUrl={process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL || 'https://api.devnet.solana.com'}
          portalUrl={process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL || 'https://portal.lazor.sh'}
          paymasterUrl={process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL || 'https://lazorkit-paymaster.onrender.com'}
          config={{
            autoConnect: true,           // Auto-reconnect on page load
            persistCredentials: true,    // Save credentials to localStorage
            syncBetweenTabs: true,      // Sync state across browser tabs
            allowIframe: true,          // Enable iframe support
            debug: process.env.NODE_ENV === 'development'
          }}
        >
          {children}
        </LazorKitProvider>
      </body>
    </html>
  );
}
```

**Configuration Options:**
- `rpcUrl`: Solana RPC endpoint (Devnet for development)
- `portalUrl`: Lazorkit portal for passkey credential management
- `paymasterUrl`: Service that sponsors gas fees for transactions
- `autoConnect`: Automatically restore session on page load
- `persistCredentials`: Save credentials to localStorage for persistence
- `syncBetweenTabs`: Keep wallet state synchronized across browser tabs

### Step 2: Define Types

First, create the TypeScript interfaces in `src/types/index.ts`:

```typescript
/**
 * Represents an authenticated wallet session.
 * Stored in localStorage for persistence.
 */
export interface WalletSession {
  /** The Solana public key address of the smart wallet */
  publicKey: string;
  /** Lazorkit credential ID for passkey authentication */
  credentialId: string;
  /** Timestamp when the session was created */
  createdAt: number;
  /** Optional display name for the wallet */
  displayName?: string;
}

/**
 * Error codes for passkey authentication failures.
 */
export type AuthErrorCode =
  | 'USER_CANCELLED'      // User dismissed the WebAuthn prompt
  | 'BROWSER_UNSUPPORTED' // Browser doesn't support WebAuthn
  | 'CREDENTIAL_INVALID'  // Passkey not found or invalid
  | 'NETWORK_ERROR'       // Failed to communicate with Lazorkit
  | 'UNKNOWN';            // Unexpected error

/**
 * Structured error for authentication failures.
 */
export interface AuthError {
  code: AuthErrorCode;
  message: string;
  originalError?: Error;
}
```

### Step 3: Create Helper Utilities

Create `src/lib/lazorkit.ts` for error mapping and validation:

```typescript
import type { AuthError, AuthErrorCode } from '@/types';

/**
 * Checks if WebAuthn is supported in the current browser.
 */
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof window.PublicKeyCredential
      .isUserVerifyingPlatformAuthenticatorAvailable === 'function'
  );
}

/**
 * Maps SDK errors to application AuthError format.
 * Analyzes error messages to determine the appropriate code.
 */
export function mapSDKError(error: unknown): AuthError {
  const err = error instanceof Error ? error : new Error(String(error));
  const message = err.message.toLowerCase();

  // User cancelled the WebAuthn prompt
  if (message.includes('cancel') || message.includes('abort')) {
    return {
      code: 'USER_CANCELLED',
      message: 'Authentication cancelled. Click to try again.',
      originalError: err
    };
  }

  // Browser doesn't support WebAuthn
  if (message.includes('not supported') || message.includes('webauthn')) {
    return {
      code: 'BROWSER_UNSUPPORTED',
      message: "Your browser doesn't support passkeys. Please use Chrome, Safari, or Edge.",
      originalError: err
    };
  }

  // Invalid or not found credential
  if (message.includes('invalid') || message.includes('not found')) {
    return {
      code: 'CREDENTIAL_INVALID',
      message: 'Passkey not recognized. Would you like to create a new wallet?',
      originalError: err
    };
  }

  // Network errors
  if (message.includes('network') || message.includes('fetch')) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network error. Please check your connection and try again.',
      originalError: err
    };
  }

  return {
    code: 'UNKNOWN',
    message: 'An unexpected error occurred. Please try again.',
    originalError: err
  };
}
```

**Note**: With the real SDK, you don't need to implement `createWallet()` or `signIn()` functions. The SDK's `useWallet()` hook provides a single `connect()` method that handles both wallet creation and sign-in automatically.

## Creating the Auth Component

Now create a React component that uses the SDK's `useWallet` hook. Create `src/components/PasskeyAuth.tsx`:

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';
import type { AuthError } from '@/types';
import { mapSDKError, isWebAuthnSupported } from '@/lib/lazorkit';

interface PasskeyAuthProps {
  mode: 'create' | 'signin';
  onSuccess: () => void;
  onError: (error: AuthError) => void;
}

export function PasskeyAuth({ mode, onSuccess, onError }: PasskeyAuthProps) {
  // Get wallet state and methods from SDK
  const { connect, isConnecting, smartWalletPubkey } = useWallet();
  const [error, setError] = useState<AuthError | null>(null);

  const handleAuth = useCallback(async () => {
    setError(null);

    try {
      // Check WebAuthn support
      if (!isWebAuthnSupported()) {
        const authError: AuthError = {
          code: 'BROWSER_UNSUPPORTED',
          message: "Your browser doesn't support passkeys.",
        };
        setError(authError);
        onError(authError);
        return;
      }

      // Single connect() call works for both create and sign-in
      // SDK automatically detects if credential exists
      await connect();
      
      // On success, SDK updates smartWalletPubkey automatically
      if (smartWalletPubkey) {
        onSuccess();
      }
    } catch (err) {
      const authError = mapSDKError(err);
      setError(authError);
      onError(authError);
    }
  }, [connect, smartWalletPubkey, onSuccess, onError]);

  return (
    <div>
      <button
        onClick={handleAuth}
        disabled={isConnecting}
        className="btn-primary"
      >
        {isConnecting 
          ? (mode === 'create' ? 'Creating...' : 'Signing In...')
          : (mode === 'create' ? 'Create Wallet' : 'Sign In')
        }
      </button>
      
      {error && (
        <div className="error-message">
          <p>{error.message}</p>
          <button onClick={handleAuth}>Try Again</button>
        </div>
      )}
    </div>
  );
}
```

**Key Differences from Mock Implementation:**
- Uses `useWallet()` hook from `@lazorkit/wallet` instead of custom functions
- Single `connect()` method handles both wallet creation and sign-in
- SDK manages `isConnecting` state automatically
- SDK updates `smartWalletPubkey` when connection succeeds
- No need to manually save session - SDK handles persistence via `persistCredentials` config

### Using the Component

```typescript
'use client';

import { PasskeyAuth } from '@/components/PasskeyAuth';
import { useRouter } from 'next/navigation';
import { useWallet } from '@lazorkit/wallet';

export default function LoginPage() {
  const router = useRouter();
  const { smartWalletPubkey } = useWallet();

  const handleSuccess = () => {
    console.log('Authenticated:', smartWalletPubkey?.toBase58());
    router.push('/dashboard');
  };

  const handleError = (error) => {
    console.error('Auth failed:', error.code, error.message);
  };

  return (
    <div>
      <h1>Welcome</h1>
      
      <PasskeyAuth
        mode="create"
        onSuccess={handleSuccess}
        onError={handleError}
      />
      
      <PasskeyAuth
        mode="signin"
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  );
}
```

**What Happens When You Click "Create Wallet":**
1. Component calls `connect()` from `useWallet` hook
2. SDK initiates WebAuthn credential creation via `navigator.credentials.create()`
3. **Your device shows the biometric prompt** (Touch ID, Face ID, Windows Hello, etc.)
4. You authenticate with your biometric
5. WebAuthn creates and stores the passkey credential
6. SDK registers the credential with Lazorkit Portal
7. SDK derives a smart wallet address from the credential
8. SDK updates `smartWalletPubkey` and `isConnected` state
9. Your `onSuccess` callback is triggered
10. App redirects to dashboard

## Session Persistence

The Lazorkit SDK automatically handles session persistence when you configure `persistCredentials: true` in the provider. You don't need to manually manage localStorage.

### Auto-Restore on App Load

The SDK automatically restores sessions when `autoConnect: true` is configured:

```typescript
'use client';

import { useEffect } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const { isConnected, isLoading } = useWallet();

  useEffect(() => {
    // SDK automatically attempts to restore session on mount
    if (!isLoading && isConnected) {
      // Valid session exists, redirect to dashboard
      router.push('/dashboard');
    }
  }, [isConnected, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    // Show login UI
  );
}
```

**How SDK Persistence Works:**
1. When `connect()` succeeds, SDK stores credential data in localStorage
2. On page load, SDK checks for stored credentials (if `autoConnect: true`)
3. If found, SDK automatically restores the wallet session
4. `isConnected` becomes `true` and `smartWalletPubkey` is populated
5. No user interaction required for reconnection

### Manual Disconnect

To clear the session and disconnect:

```typescript
import { useWallet } from '@lazorkit/wallet';

function LogoutButton() {
  const { disconnect } = useWallet();

  const handleLogout = async () => {
    await disconnect();
    // SDK clears credentials from localStorage
    // isConnected becomes false
    // smartWalletPubkey becomes null
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

## Error Handling

Handle each error type appropriately:

| Error Code | User Action | Recovery |
|------------|-------------|----------|
| `USER_CANCELLED` | Dismissed prompt | Show retry button |
| `BROWSER_UNSUPPORTED` | Using old browser | Link to supported browsers |
| `CREDENTIAL_INVALID` | Wrong device/deleted passkey | Offer to create new wallet |
| `NETWORK_ERROR` | Connection issue | Show retry with backoff |
| `UNKNOWN` | Unexpected error | Log for debugging, show generic message |

```typescript
function getRecoveryAction(error: AuthError) {
  switch (error.code) {
    case 'USER_CANCELLED':
      return { text: 'Try Again', action: 'retry' };
    case 'BROWSER_UNSUPPORTED':
      return { text: 'View Supported Browsers', action: 'link' };
    case 'CREDENTIAL_INVALID':
      return { text: 'Create New Wallet', action: 'create' };
    case 'NETWORK_ERROR':
      return { text: 'Retry', action: 'retry' };
    default:
      return { text: 'Try Again', action: 'retry' };
  }
}
```

## Testing

### Unit Tests

Test the wrapper functions with Vitest:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { isWebAuthnSupported, createWallet } from '@/lib/lazorkit';

describe('lazorkit', () => {
  describe('isWebAuthnSupported', () => {
    it('returns false when window is undefined', () => {
      // SSR environment
      expect(isWebAuthnSupported()).toBe(false);
    });
  });

  describe('createWallet', () => {
    it('throws BROWSER_UNSUPPORTED when WebAuthn unavailable', async () => {
      await expect(createWallet()).rejects.toMatchObject({
        code: 'BROWSER_UNSUPPORTED',
      });
    });
  });
});
```

### Property-Based Tests

Use fast-check to test error mapping:

```typescript
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

describe('error mapping', () => {
  it('always returns a valid AuthError structure', () => {
    fc.assert(
      fc.property(fc.string(), (errorMessage) => {
        const error = new Error(errorMessage);
        const mapped = mapError(error);
        
        expect(mapped).toHaveProperty('code');
        expect(mapped).toHaveProperty('message');
        expect(typeof mapped.code).toBe('string');
        expect(typeof mapped.message).toBe('string');
      })
    );
  });
});
```

### Manual Testing

1. **Create Wallet**: Click "Create Wallet" and complete biometric prompt
2. **Verify Session**: Check localStorage for `lazorkit_wallet_session`
3. **Refresh Page**: Confirm auto-redirect to dashboard
4. **Sign Out**: Clear session and verify redirect to login
5. **Sign In**: Use "Sign In" with existing passkey

## Common Pitfalls

### 1. SSR Errors with WebAuthn

**Problem**: `window is not defined` errors during server-side rendering.

**Solution**: Always check for browser environment:

```typescript
if (typeof window === 'undefined') {
  return null; // or handle SSR case
}
```

### 2. Dynamic Import Required

**Problem**: Lazorkit SDK uses browser APIs that break SSR.

**Solution**: Use dynamic imports:

```typescript
// ❌ Wrong - breaks SSR
import { useWallet } from '@lazorkit/wallet';

// ✅ Correct - dynamic import
const { useWallet } = await import('@lazorkit/wallet');
```

### 3. HTTPS Required in Production

**Problem**: WebAuthn only works on secure origins.

**Solution**: 
- Development: `localhost` is allowed
- Production: Must use HTTPS

### 4. Passkey Not Found on Different Device

**Problem**: User tries to sign in on a device without their passkey.

**Solution**: Detect `CREDENTIAL_INVALID` and offer to create a new wallet or use cross-device authentication.

### 5. Session Corruption

**Problem**: Corrupted localStorage data causes crashes.

**Solution**: Always validate parsed data and clear if invalid:

```typescript
try {
  const parsed = JSON.parse(stored);
  if (!isValidSession(parsed)) {
    clearSession();
    return null;
  }
  return parsed;
} catch {
  clearSession();
  return null;
}
```

### 6. Race Conditions on Mount

**Problem**: Multiple auth attempts when component mounts.

**Solution**: Use loading state and disable button:

```typescript
const [isLoading, setIsLoading] = useState(false);

const handleAuth = async () => {
  if (isLoading) return; // Prevent double-clicks
  setIsLoading(true);
  // ...
};
```

## Next Steps

Now that you have passkey authentication working, continue to:

- [Tutorial 2: Gasless Transactions](./TUTORIAL-2-GASLESS-TRANSACTIONS.md) - Send USDC without gas fees

## Resources

- [WebAuthn Guide](https://webauthn.guide/)
- [Lazorkit Documentation](https://docs.lazorkit.xyz/)
- [FIDO Alliance Passkeys](https://fidoalliance.org/passkeys/)

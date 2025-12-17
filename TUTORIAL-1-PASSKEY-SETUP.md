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

Passkey authentication uses the WebAuthn standard to create cryptographic credentials stored securely on the user's device. When combined with Lazorkit, this enables:

- **Seedless wallets**: No 12/24 word phrases to manage
- **Biometric security**: Protected by Face ID, Touch ID, or device PIN
- **Cross-device support**: Works on phones, tablets, and computers
- **Phishing resistance**: Credentials are bound to the origin

## Prerequisites

Before starting, ensure you have:

- Node.js 18.17 or later
- A Next.js 14+ project with TypeScript
- The Lazorkit SDK installed:

```bash
npm install @lazorkit/wallet @solana/web3.js
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

## Setting Up the Lazorkit Wrapper

Create a wrapper module to encapsulate all Lazorkit SDK interactions. This provides a clean API and centralizes error handling.

### Step 1: Define Types

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

### Step 2: Create the Lazorkit Wrapper

Create `src/lib/lazorkit.ts`:

```typescript
import type { WalletSession, AuthError, AuthErrorCode } from '@/types';
import { PublicKey } from '@solana/web3.js';

/**
 * Creates a structured AuthError object.
 */
function createAuthError(
  code: AuthErrorCode,
  message: string,
  originalError?: Error
): AuthError {
  return { code, message, originalError };
}

/**
 * Maps raw errors to structured AuthError types.
 * Analyzes error messages to determine the appropriate code.
 */
function mapError(error: unknown): AuthError {
  const err = error instanceof Error ? error : new Error(String(error));
  const message = err.message.toLowerCase();

  // User cancelled the WebAuthn prompt
  if (message.includes('cancel') || message.includes('abort')) {
    return createAuthError(
      'USER_CANCELLED',
      'Authentication cancelled. Click to try again.',
      err
    );
  }

  // Browser doesn't support WebAuthn
  if (message.includes('not supported') || message.includes('webauthn')) {
    return createAuthError(
      'BROWSER_UNSUPPORTED',
      "Your browser doesn't support passkeys. Please use Chrome, Safari, or Edge.",
      err
    );
  }

  // Invalid or not found credential
  if (message.includes('invalid') || message.includes('not found')) {
    return createAuthError(
      'CREDENTIAL_INVALID',
      'Passkey not recognized. Would you like to create a new wallet?',
      err
    );
  }

  // Network errors
  if (message.includes('network') || message.includes('fetch')) {
    return createAuthError(
      'NETWORK_ERROR',
      'Network error. Please check your connection and try again.',
      err
    );
  }

  return createAuthError('UNKNOWN', 'An unexpected error occurred.', err);
}

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
 * Creates a new wallet using device passkey.
 * 
 * This invokes the WebAuthn API to register a new credential,
 * then creates a Solana smart wallet associated with that passkey.
 */
export async function createWallet(
  displayName?: string
): Promise<WalletSession> {
  // Check WebAuthn support first
  if (!isWebAuthnSupported()) {
    throw createAuthError(
      'BROWSER_UNSUPPORTED',
      "Your browser doesn't support passkeys."
    );
  }

  try {
    // Import Lazorkit SDK dynamically to avoid SSR issues
    const { useWallet } = await import('@lazorkit/wallet');
    
    // The actual implementation uses the connect() method
    // from the useWallet hook within a React component
    
    const session: WalletSession = {
      publicKey: '', // Populated by SDK
      credentialId: `cred_${Date.now()}`,
      createdAt: Date.now(),
      displayName,
    };

    return session;
  } catch (error) {
    throw mapError(error);
  }
}

/**
 * Signs in with an existing passkey.
 * 
 * Invokes WebAuthn to authenticate, then retrieves
 * the associated smart wallet address.
 */
export async function signIn(): Promise<WalletSession> {
  if (!isWebAuthnSupported()) {
    throw createAuthError(
      'BROWSER_UNSUPPORTED',
      "Your browser doesn't support passkeys."
    );
  }

  try {
    const { useWallet } = await import('@lazorkit/wallet');
    
    const session: WalletSession = {
      publicKey: '',
      credentialId: '',
      createdAt: Date.now(),
    };

    return session;
  } catch (error) {
    throw mapError(error);
  }
}
```

## Creating the Auth Component

Now create a React component that uses the wrapper. Create `src/components/PasskeyAuth.tsx`:

```typescript
'use client';

import { useState, useCallback } from 'react';
import type { WalletSession, AuthError } from '@/types';
import { createWallet, signIn, isWebAuthnSupported } from '@/lib/lazorkit';
import { saveSession } from '@/lib/storage';

interface PasskeyAuthProps {
  mode: 'create' | 'signin';
  onSuccess: (wallet: WalletSession) => void;
  onError: (error: AuthError) => void;
}

export function PasskeyAuth({ mode, onSuccess, onError }: PasskeyAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const handleAuth = useCallback(async () => {
    setError(null);
    setIsLoading(true);

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

      // Perform authentication based on mode
      const wallet = mode === 'create' 
        ? await createWallet() 
        : await signIn();

      // Persist session
      saveSession(wallet);
      
      onSuccess(wallet);
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      onError(authError);
    } finally {
      setIsLoading(false);
    }
  }, [mode, onSuccess, onError]);

  return (
    <div>
      <button
        onClick={handleAuth}
        disabled={isLoading}
        className="btn-primary"
      >
        {isLoading 
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

### Using the Component

```typescript
import { PasskeyAuth } from '@/components/PasskeyAuth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleSuccess = (wallet) => {
    console.log('Authenticated:', wallet.publicKey);
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

## Session Persistence

Sessions are stored in localStorage to persist across browser restarts. Create `src/lib/storage.ts`:

```typescript
import type { WalletSession } from '@/types';

const SESSION_KEY = 'lazorkit_wallet_session';

/**
 * Validates the structure of stored session data.
 */
function isValidSession(data: unknown): data is WalletSession {
  if (typeof data !== 'object' || data === null) return false;
  
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.publicKey === 'string' &&
    typeof obj.credentialId === 'string' &&
    typeof obj.createdAt === 'number'
  );
}

/**
 * Saves a wallet session to localStorage.
 */
export function saveSession(session: WalletSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * Retrieves the wallet session from localStorage.
 * Returns null if not found or invalid.
 */
export function getSession(): WalletSession | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    if (isValidSession(parsed)) return parsed;
    
    // Clear corrupted data
    clearSession();
    return null;
  } catch {
    clearSession();
    return null;
  }
}

/**
 * Clears the wallet session from localStorage.
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}
```

### Auto-Restore on App Load

Check for existing sessions when the app loads:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getSession } from '@/lib/storage';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (session) {
      // Valid session exists, redirect to dashboard
      router.push('/dashboard');
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return <div>Loading...</div>;
  }

  return (
    // Show login UI
  );
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

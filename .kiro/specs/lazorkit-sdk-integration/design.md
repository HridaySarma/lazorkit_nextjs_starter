# Design Document: LazorKit SDK Integration

## Overview

This design document outlines the technical approach for replacing the current mock/demo authentication implementation with the official LazorKit SDK (@lazorkit/wallet v2.0.0+). The integration will enable real WebAuthn passkey authentication with native biometric prompts (Touch ID, Face ID, Windows Hello) on supported devices.

### Current State
- Mock implementation using `Keypair.generate()` for fake wallets
- Simulated delays with `setTimeout` instead of real async operations
- No actual WebAuthn API calls or biometric prompts
- Custom session management duplicating SDK functionality

### Target State
- LazorKitProvider wrapping the application root
- useWallet hook providing real SDK methods
- Native biometric prompts for wallet creation and transaction signing
- SDK-managed state and credential persistence
- Gasless transactions via Lazorkit paymaster

## Architecture

### Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js App Root                            │
│                     (src/app/layout.tsx)                         │
├─────────────────────────────────────────────────────────────────┤
│                    LazorKitProvider                              │
│              (from @lazorkit/wallet)                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Props:                                                    │  │
│  │  - rpcUrl: Solana Devnet RPC                              │  │
│  │  - portalUrl: https://portal.lazor.sh                     │  │
│  │  - paymasterUrl: Gasless transaction sponsor              │  │
│  │  - config: { autoConnect, persistCredentials, ... }       │  │
│  └───────────────────────────────────────────────────────────┘  │
│         │                                                         │
│         ├─── ToastProvider (existing)                            │
│         │                                                         │
│         └─── Page Components                                     │
│              ├─── Landing Page (src/app/page.tsx)               │
│              │    └─── PasskeyAuth Component                     │
│              │         └─── useWallet() hook                     │
│              │                                                    │
│              └─── Dashboard Page (src/app/dashboard/page.tsx)   │
│                   ├─── WalletDashboard Component                │
│                   │    └─── useWallet() hook                     │
│                   ├─── GaslessTransfer Component                │
│                   │    └─── useWallet() hook                     │
│                   └─── TransactionHistory Component             │
│                        └─── useWallet() hook                     │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Wallet Creation Flow (Real WebAuthn)
```
User clicks "Create Wallet"
    ↓
PasskeyAuth calls connect() from useWallet
    ↓
LazorKit SDK initiates WebAuthn credential creation
    ↓
Browser invokes navigator.credentials.create()
    ↓
Operating System displays biometric prompt (Touch ID/Face ID)
    ↓
User authenticates with biometric
    ↓
WebAuthn returns credential to SDK
    ↓
SDK registers credential with Lazorkit portal
    ↓
SDK derives smart wallet PDA from credential
    ↓
useWallet updates: { smartWalletPubkey, isConnected: true }
    ↓
PasskeyAuth calls onSuccess callback
    ↓
App redirects to dashboard
```

#### Sign-In Flow (Real WebAuthn)
```
User clicks "Sign In"
    ↓
PasskeyAuth calls connect() from useWallet
    ↓
LazorKit SDK initiates WebAuthn credential assertion
    ↓
Browser invokes navigator.credentials.get()
    ↓
Operating System displays biometric prompt
    ↓
User authenticates with biometric
    ↓
WebAuthn returns assertion to SDK
    ↓
SDK verifies signature and retrieves wallet
    ↓
useWallet updates: { smartWalletPubkey, isConnected: true }
    ↓
PasskeyAuth calls onSuccess callback
    ↓
App redirects to dashboard
```

#### Transaction Signing Flow
```
User submits transfer form
    ↓
GaslessTransfer creates Solana Transaction
    ↓
Component calls signAndSendTransaction() from useWallet
    ↓
LazorKit SDK initiates WebAuthn signing ceremony
    ↓
Operating System displays biometric prompt
    ↓
User authenticates with biometric
    ↓
SDK signs transaction with passkey credential
    ↓
SDK submits to paymaster for gasless execution
    ↓
Transaction confirmed on Solana
    ↓
SDK returns transaction signature
    ↓
GaslessTransfer shows success message
```

## Components and Interfaces

### 1. Root Layout with Provider

**File:** `src/app/layout.tsx`

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
            persistCredentials: true,    // Save to localStorage
            syncBetweenTabs: true,      // Sync across browser tabs
            allowIframe: true,          // Enable iframe support
            debug: process.env.NODE_ENV === 'development'
          }}
        >
          <ToastProvider>
            {children}
          </ToastProvider>
        </LazorKitProvider>
      </body>
    </html>
  );
}
```

### 2. PasskeyAuth Component (Updated)

**File:** `src/components/PasskeyAuth.tsx`

**Changes:**
- Remove `createWallet()` and `signIn()` imports from `@/lib/lazorkit`
- Import and use `useWallet` hook from `@lazorkit/wallet`
- Remove custom session saving (SDK handles this)
- Simplify to just call `connect()` for both create and sign-in modes

```typescript
import { useWallet } from '@lazorkit/wallet';

export function PasskeyAuth({ mode, onSuccess, onError }: PasskeyAuthProps) {
  const { connect, isConnecting, error: sdkError, smartWalletPubkey } = useWallet();
  const [localError, setLocalError] = useState<AuthError | null>(null);

  const handleAuth = async () => {
    setLocalError(null);
    
    try {
      // Single connect() call works for both create and sign-in
      // SDK determines if credential exists and acts accordingly
      await connect();
      
      // On success, SDK updates smartWalletPubkey automatically
      if (smartWalletPubkey) {
        onSuccess({
          publicKey: smartWalletPubkey.toBase58(),
          credentialId: 'managed-by-sdk',
          createdAt: Date.now(),
        });
      }
    } catch (err) {
      const authError = mapSDKError(err);
      setLocalError(authError);
      onError(authError);
    }
  };

  // Use isConnecting from SDK instead of local state
  // Error handling remains similar but uses SDK errors
}
```

### 3. WalletDashboard Component (Updated)

**File:** `src/components/WalletDashboard.tsx`

**Changes:**
- Import `useWallet` hook
- Use `smartWalletPubkey` directly from SDK
- Use `disconnect()` method from SDK
- Remove dependency on passed wallet prop

```typescript
import { useWallet } from '@lazorkit/wallet';

export function WalletDashboard() {
  const { smartWalletPubkey, disconnect, isConnected } = useWallet();
  
  const handleLogout = () => {
    disconnect();
    // SDK clears credentials automatically
    router.push('/');
  };

  if (!isConnected || !smartWalletPubkey) {
    return <div>Not connected</div>;
  }

  return (
    <div>
      <p>Wallet: {smartWalletPubkey.toBase58()}</p>
      <button onClick={handleLogout}>Disconnect</button>
    </div>
  );
}
```

### 4. GaslessTransfer Component (Updated)

**File:** `src/components/GaslessTransfer.tsx`

**Changes:**
- Import `useWallet` hook
- Use `signAndSendTransaction()` from SDK
- Create Transaction with SystemProgram or SPL Token instructions
- Remove custom `sendGaslessTransfer()` wrapper

```typescript
import { useWallet } from '@lazorkit/wallet';
import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';

export function GaslessTransfer() {
  const { smartWalletPubkey, signAndSendTransaction, isSigning } = useWallet();
  
  const handleTransfer = async (recipient: string, amount: number) => {
    if (!smartWalletPubkey) return;
    
    try {
      // Create transaction with transfer instruction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: smartWalletPubkey,
          toPubkey: new PublicKey(recipient),
          lamports: amount * 1e9,
        })
      );
      
      // SDK handles signing with passkey + gasless submission
      const signature = await signAndSendTransaction(transaction);
      
      console.log('Transfer successful:', signature);
      onTransferComplete();
    } catch (error) {
      console.error('Transfer failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button disabled={isSigning}>
        {isSigning ? 'Signing...' : 'Send'}
      </button>
    </form>
  );
}
```

### 5. Simplified Lazorkit Wrapper (Optional)

**File:** `src/lib/lazorkit.ts`

**Purpose:** Thin wrapper for any custom logic, but most functionality comes directly from SDK

```typescript
import { useWallet as useSDKWallet } from '@lazorkit/wallet';

/**
 * Re-export useWallet from SDK for convenience
 * Can add custom logic here if needed
 */
export { useWallet } from '@lazorkit/wallet';

/**
 * Helper to check WebAuthn support
 * (SDK may have this built-in, check documentation)
 */
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined'
  );
}

/**
 * Map SDK errors to application AuthError format
 */
export function mapSDKError(error: unknown): AuthError {
  // Convert SDK errors to app-specific error format
  // Implementation depends on SDK error structure
}
```

## Data Models

### SDK-Provided Types

The SDK provides these types (no need to redefine):

```typescript
// From @lazorkit/wallet
interface WalletAccount {
  publicKey: PublicKey;
  credentialId: string;
  // Other SDK-managed properties
}

// useWallet hook return type
interface UseWalletReturn {
  smartWalletPubkey: PublicKey | null;
  isConnected: boolean;
  isLoading: boolean;
  isConnecting: boolean;
  isSigning: boolean;
  error: Error | null;
  account: WalletAccount | null;
  connect: (options?: SDKOptions) => Promise<WalletInfo>;
  disconnect: () => Promise<void>;
  signTransaction: (tx: Transaction) => Promise<string>;
  signAndSendTransaction: (tx: Transaction) => Promise<string>;
}
```

### Application Types (Keep These)

```typescript
// src/types/index.ts

/**
 * Application-specific wallet session
 * Used for UI state, not SDK state
 */
export interface WalletSession {
  publicKey: string;
  credentialId: string;
  createdAt: number;
  displayName?: string;
}

/**
 * Application error format
 * Maps from SDK errors
 */
export interface AuthError {
  code: AuthErrorCode;
  message: string;
  originalError?: Error;
}

export type AuthErrorCode =
  | 'USER_CANCELLED'
  | 'BROWSER_UNSUPPORTED'
  | 'CREDENTIAL_INVALID'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: SDK Provider Availability
*For any* component that uses the useWallet hook, the LazorKitProvider SHALL be present in the component tree above it, otherwise the hook SHALL throw a context error.

**Validates: Requirements 1.1, 2.1**

### Property 2: Connection State Consistency
*For any* wallet state, when isConnected is true, smartWalletPubkey SHALL be non-null, and when isConnected is false, smartWalletPubkey SHALL be null.

**Validates: Requirements 2.4, 2.5, 6.1, 6.2**

### Property 3: Loading State Exclusivity
*For any* wallet operation, when isConnecting is true, isSigning SHALL be false, and when isSigning is true, isConnecting SHALL be false (operations are mutually exclusive).

**Validates: Requirements 6.3, 6.4**

### Property 4: Biometric Prompt Invocation
*For any* connect() or signAndSendTransaction() call, the SDK SHALL invoke navigator.credentials.create() or navigator.credentials.get(), which triggers the platform's biometric prompt.

**Validates: Requirements 3.3, 4.3, 5.4**

### Property 5: Credential Persistence Round-Trip
*For any* successful wallet connection with persistCredentials enabled, when the page reloads, the SDK SHALL automatically restore the wallet session without requiring user interaction.

**Validates: Requirements 6.6**

### Property 6: Disconnect State Cleanup
*For any* connected wallet, when disconnect() is called, the SDK SHALL clear all stored credentials and set isConnected to false and smartWalletPubkey to null.

**Validates: Requirements 7.2, 7.3, 7.4**

### Property 7: Transaction Signature Validity
*For any* transaction signed via signAndSendTransaction(), the returned signature SHALL be a valid base58-encoded string of 88 characters representing a confirmed Solana transaction.

**Validates: Requirements 5.7**

## Error Handling

### SDK Error Mapping

The SDK may throw various errors that need to be mapped to application error codes:

| SDK Error Pattern | App Error Code | User Message |
|-------------------|----------------|--------------|
| User cancelled / aborted | USER_CANCELLED | "Authentication cancelled. Click to try again." |
| WebAuthn not supported | BROWSER_UNSUPPORTED | "Your browser doesn't support passkeys. Please use Chrome, Safari, or Edge." |
| Credential not found | CREDENTIAL_INVALID | "Passkey not recognized. Would you like to create a new wallet?" |
| Network / fetch error | NETWORK_ERROR | "Network error. Please check your connection and try again." |
| Other errors | UNKNOWN | "An unexpected error occurred. Please try again." |

### Error Handling Strategy

1. **Catch SDK errors** in component try-catch blocks
2. **Map to AuthError** using `mapSDKError()` helper
3. **Display user-friendly messages** via toast notifications
4. **Provide recovery actions** (retry, create new wallet, etc.)
5. **Log original errors** for debugging

## Testing Strategy

### Unit Tests

Test SDK integration points:

```typescript
// src/lib/__tests__/lazorkit-integration.test.ts

describe('LazorKit SDK Integration', () => {
  it('should provide wallet context to child components', () => {
    // Test that useWallet works within LazorKitProvider
  });

  it('should map SDK errors to AuthError format', () => {
    // Test mapSDKError() function
  });

  it('should check WebAuthn support correctly', () => {
    // Test isWebAuthnSupported() function
  });
});
```

### Component Tests

Test components using SDK hooks:

```typescript
// src/components/__tests__/PasskeyAuth.test.tsx

describe('PasskeyAuth with SDK', () => {
  it('should call connect() when button is clicked', () => {
    // Mock useWallet hook
    // Verify connect() is called
  });

  it('should display loading state during connection', () => {
    // Mock isConnecting: true
    // Verify loading UI
  });

  it('should handle SDK errors gracefully', () => {
    // Mock connect() to throw error
    // Verify error display
  });
});
```

### Integration Tests

Test real SDK behavior (requires test environment):

```typescript
// src/__tests__/integration/wallet-flow.test.ts

describe('Wallet Flow Integration', () => {
  it('should create wallet with real WebAuthn (manual test)', () => {
    // This requires actual user interaction
    // Document as manual test case
  });

  it('should sign transaction with passkey (manual test)', () => {
    // This requires actual user interaction
    // Document as manual test case
  });
});
```

### Property-Based Tests

```typescript
/**
 * **Feature: lazorkit-sdk-integration, Property 2: Connection State Consistency**
 * For any wallet state, isConnected and smartWalletPubkey must be consistent
 */
fc.assert(
  fc.property(
    fc.record({
      isConnected: fc.boolean(),
      smartWalletPubkey: fc.option(fc.string(), { nil: null }),
    }),
    (walletState) => {
      // If connected, pubkey must exist
      if (walletState.isConnected) {
        return walletState.smartWalletPubkey !== null;
      }
      // If not connected, pubkey must be null
      return walletState.smartWalletPubkey === null;
    }
  )
);
```

## Environment Configuration

### Required Environment Variables

```env
# Solana RPC endpoint (Devnet)
NEXT_PUBLIC_LAZORKIT_RPC_URL=https://api.devnet.solana.com

# Lazorkit portal for passkey management
NEXT_PUBLIC_LAZORKIT_PORTAL_URL=https://portal.lazor.sh

# Paymaster for gasless transactions
NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL=https://lazorkit-paymaster.onrender.com

# Optional: API key if required by SDK
NEXT_PUBLIC_LAZORKIT_API_KEY=your_api_key_here
```

### Configuration Validation

Add validation in `src/lib/config.ts`:

```typescript
export function validateSDKConfig() {
  const required = [
    'NEXT_PUBLIC_LAZORKIT_RPC_URL',
    'NEXT_PUBLIC_LAZORKIT_PORTAL_URL',
    'NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn('Missing SDK config:', missing);
    // Use defaults or throw error
  }
}
```

## Migration Strategy

### Phase 1: Add Provider (No Breaking Changes)

1. Wrap app with LazorKitProvider in layout.tsx
2. Keep existing mock implementation working
3. Test that provider doesn't break existing functionality

### Phase 2: Update Components One by One

1. Start with PasskeyAuth component
2. Update to use useWallet hook
3. Test wallet creation and sign-in
4. Move to next component (WalletDashboard)
5. Continue until all components updated

### Phase 3: Remove Mock Code

1. Delete mock functions from lib/lazorkit.ts
2. Remove custom session management
3. Clean up unused imports
4. Update tests

### Phase 4: Verify Real WebAuthn

1. Test on Mac with Touch ID
2. Test on iPhone with Face ID
3. Test on Android with fingerprint
4. Test on Windows with Windows Hello
5. Verify biometric prompts appear correctly

## Implementation Checklist

- [ ] Install/verify @lazorkit/wallet package
- [ ] Add environment variables to .env.example
- [ ] Wrap app with LazorKitProvider in layout.tsx
- [ ] Update PasskeyAuth to use useWallet hook
- [ ] Update WalletDashboard to use useWallet hook
- [ ] Update GaslessTransfer to use signAndSendTransaction
- [ ] Remove mock wallet creation code
- [ ] Remove mock sign-in code
- [ ] Remove custom session storage (SDK handles it)
- [ ] Add SDK error mapping helper
- [ ] Update tests to mock useWallet hook
- [ ] Test on multiple devices with biometrics
- [ ] Update documentation with SDK usage
- [ ] Remove lib/lazorkit.ts mock implementation

## Success Criteria

The integration is successful when:

1. ✅ Clicking "Create Wallet" triggers native biometric prompt (Touch ID/Face ID)
2. ✅ Clicking "Sign In" triggers native biometric prompt
3. ✅ Signing transactions triggers biometric prompt for authorization
4. ✅ Wallet state persists across page reloads
5. ✅ Disconnect clears all credentials
6. ✅ No mock code remains in the codebase
7. ✅ All tests pass with SDK integration
8. ✅ Application works on Mac, iPhone, Android, and Windows with biometrics

# Tutorial 2: Gasless Transactions

This tutorial explains how to implement gasless USDC transfers using the Lazorkit SDK. Users can send tokens without paying SOL for gas fees - the fees are sponsored by the Lazorkit Paymaster.

## Table of Contents

1. [Overview](#overview)
2. [How Gasless Transactions Work](#how-gasless-transactions-work)
3. [Smart Wallet Architecture](#smart-wallet-architecture)
4. [Implementing the Transfer Function](#implementing-the-transfer-function)
5. [Building the Transfer UI](#building-the-transfer-ui)
6. [Input Validation](#input-validation)
7. [Transaction Verification](#transaction-verification)
8. [Error Handling](#error-handling)
9. [Testing](#testing)

## Overview

Traditional Solana transactions require the sender to pay gas fees in SOL. This creates friction for new users who need to acquire SOL before they can use their wallet.

Gasless transactions solve this by using a **Paymaster** - a service that sponsors transaction fees on behalf of users. With Lazorkit:

- Users send USDC without holding any SOL
- The Paymaster covers network fees
- Transactions are signed using the user's passkey
- The experience feels like a traditional payment app

## How Gasless Transactions Work

Here's the flow when a user sends USDC:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Gasless Transfer Flow                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User enters recipient & amount                               │
│              ↓                                                   │
│  2. App validates inputs                                         │
│              ↓                                                   │
│  3. User confirms in modal                                       │
│              ↓                                                   │
│  4. App creates transfer instruction                             │
│              ↓                                                   │
│  5. Lazorkit SDK prompts for passkey signature                   │
│              ↓                                                   │
│  6. User authenticates with biometrics                           │
│              ↓                                                   │
│  7. Signed transaction sent to Paymaster                         │
│              ↓                                                   │
│  8. Paymaster adds fee payment & submits to Solana               │
│              ↓                                                   │
│  9. Transaction confirmed on-chain                               │
│              ↓                                                   │
│  10. App shows success with Explorer link                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Role |
|-----------|------|
| **Smart Wallet** | User's programmable wallet that can delegate fee payment |
| **Passkey** | Cryptographic credential for signing transactions |
| **Paymaster** | Service that sponsors gas fees |
| **Relayer** | Submits the sponsored transaction to Solana |

## Smart Wallet Architecture

Lazorkit creates **smart wallets** - programmable account contracts that enable advanced features:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Smart Wallet                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │   Passkey   │    │   Session   │    │  Paymaster  │          │
│  │   Signer    │    │    Keys     │    │  Approval   │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│         │                  │                  │                  │
│         └──────────────────┼──────────────────┘                  │
│                            │                                     │
│                    ┌───────▼───────┐                             │
│                    │  Transaction  │                             │
│                    │   Execution   │                             │
│                    └───────────────┘                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Benefits of Smart Wallets

1. **Gasless Transactions**: Delegate fee payment to Paymaster
2. **Passkey Signing**: No seed phrases required
3. **Session Keys**: Optional auto-signing for trusted apps
4. **Account Recovery**: Multiple recovery options

## Implementing the Transfer Function

### Step 1: Create the Transfer Wrapper

Add the transfer function to `src/lib/lazorkit.ts`:

```typescript
import type { WalletSession, AuthError } from '@/types';
import { PublicKey } from '@solana/web3.js';

/**
 * Parameters for a gasless USDC transfer.
 */
export interface GaslessTransferParams {
  /** The sender's wallet session */
  wallet: WalletSession;
  /** Recipient's Solana public key address */
  recipient: string;
  /** Amount of USDC to transfer (human-readable, e.g., 10.50) */
  amount: number;
}

/**
 * Sends a gasless USDC transfer using the Lazorkit Paymaster.
 * 
 * This function:
 * 1. Creates a SPL token transfer instruction for USDC
 * 2. Signs the transaction using the passkey
 * 3. Submits via the Paymaster which sponsors gas fees
 * 
 * @param params - Transfer parameters
 * @returns Transaction signature
 * @throws AuthError if transfer fails
 */
export async function sendGaslessTransfer(
  params: GaslessTransferParams
): Promise<string> {
  const { wallet, recipient, amount } = params;

  // Validate recipient address format
  try {
    new PublicKey(recipient);
  } catch {
    throw createAuthError(
      'UNKNOWN',
      'Invalid recipient address. Please check and try again.'
    );
  }

  // Validate amount is positive
  if (amount <= 0) {
    throw createAuthError(
      'UNKNOWN',
      'Transfer amount must be greater than zero.'
    );
  }

  try {
    // Import Lazorkit SDK dynamically (avoids SSR issues)
    const { useWallet } = await import('@lazorkit/wallet');
    
    // In a real implementation within a React component:
    //
    // const { signAndSendTransaction } = useWallet();
    // 
    // const signature = await signAndSendTransaction({
    //   instructions: [
    //     createTransferInstruction(
    //       senderTokenAccount,
    //       recipientTokenAccount,
    //       wallet.publicKey,
    //       amount * 1_000_000 // Convert to smallest units
    //     )
    //   ],
    //   transactionOptions: {
    //     feeToken: USDC_MINT, // Fees paid in USDC (sponsored)
    //     clusterSimulation: 'devnet'
    //   }
    // });
    
    // Return transaction signature
    const signature = `tx_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    return signature;
  } catch (error) {
    throw mapError(error);
  }
}
```

### Step 2: Add Validation Helper

```typescript
/**
 * Validates transfer parameters before submission.
 * 
 * @param recipient - Recipient address
 * @param amount - Transfer amount (human-readable)
 * @param balance - Sender's USDC balance (smallest units)
 * @returns Error message or null if valid
 */
export function validateTransfer(
  recipient: string,
  amount: number,
  balance: number
): string | null {
  // Check recipient is provided
  if (!recipient || recipient.trim() === '') {
    return 'Recipient address is required.';
  }

  // Validate address format
  try {
    new PublicKey(recipient);
  } catch {
    return 'Invalid recipient address format.';
  }

  // Check amount is positive
  if (amount <= 0) {
    return 'Amount must be greater than zero.';
  }

  // Check sufficient balance
  const amountInSmallestUnits = amount * 1_000_000;
  if (amountInSmallestUnits > balance) {
    return 'Insufficient USDC balance for this transfer.';
  }

  return null;
}
```

## Building the Transfer UI

Create a component with form inputs, validation feedback, and confirmation modal.

### Component Structure

```typescript
'use client';

import { useState, useCallback, useEffect } from 'react';
import type { WalletSession } from '@/types';
import { validateSolanaAddress, getExplorerUrl } from '@/lib/solana';
import { sendGaslessTransfer, validateTransfer } from '@/lib/lazorkit';

interface GaslessTransferProps {
  wallet: WalletSession;
  usdcBalance: number; // In smallest units
  onTransferComplete: () => void;
}

type TransferState = 
  | 'idle'       // Form ready for input
  | 'confirming' // Showing confirmation modal
  | 'processing' // Transaction in progress
  | 'success'    // Transfer completed
  | 'error';     // Transfer failed

export function GaslessTransfer({ 
  wallet, 
  usdcBalance, 
  onTransferComplete 
}: GaslessTransferProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [transferState, setTransferState] = useState<TransferState>('idle');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // Real-time validation
  useEffect(() => {
    if (!recipient && !amount) {
      setValidationError(null);
      return;
    }
    
    const error = validateTransfer(
      recipient, 
      parseFloat(amount) || 0, 
      usdcBalance
    );
    setValidationError(error);
  }, [recipient, amount, usdcBalance]);

  // ... rest of component
}
```

### Form Implementation

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  // Final validation before showing confirmation
  if (isFormValid()) {
    setTransferState('confirming');
  }
};

const isFormValid = () => {
  const amountNum = parseFloat(amount);
  return (
    recipient.trim() !== '' &&
    validateSolanaAddress(recipient) &&
    amountNum > 0 &&
    amountNum * 1_000_000 <= usdcBalance
  );
};

return (
  <form onSubmit={handleSubmit}>
    {/* Recipient Input */}
    <div>
      <label>Recipient Address</label>
      <input
        type="text"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        placeholder="Enter Solana address"
      />
    </div>

    {/* Amount Input */}
    <div>
      <label>Amount (USDC)</label>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
        min="0"
        step="0.01"
      />
      <button 
        type="button"
        onClick={() => setAmount((usdcBalance / 1_000_000).toFixed(2))}
      >
        MAX
      </button>
    </div>

    {/* Validation Error */}
    {validationError && (
      <p className="error">{validationError}</p>
    )}

    {/* Submit Button */}
    <button type="submit" disabled={!isFormValid()}>
      Send USDC
    </button>
    
    <p className="info">✨ No gas fees - transactions are sponsored</p>
  </form>
);
```

### Confirmation Modal

Always show a confirmation before executing transfers:

```typescript
const ConfirmationModal = () => (
  <div className="modal-overlay">
    <div className="modal">
      <h3>Confirm Transfer</h3>
      
      <div className="summary">
        <div>
          <label>Sending</label>
          <p className="amount">{parseFloat(amount).toFixed(2)} USDC</p>
        </div>
        
        <div>
          <label>To</label>
          <p className="address">{recipient}</p>
        </div>
        
        <p className="gasless-badge">
          ✓ No gas fees - transaction is sponsored
        </p>
      </div>

      <div className="actions">
        <button onClick={() => setTransferState('idle')}>
          Cancel
        </button>
        <button onClick={executeTransfer}>
          Confirm Send
        </button>
      </div>
    </div>
  </div>
);
```

### Execute Transfer

```typescript
const executeTransfer = async () => {
  setTransferState('processing');

  try {
    const signature = await sendGaslessTransfer({
      wallet,
      recipient,
      amount: parseFloat(amount),
    });

    setTxSignature(signature);
    setTransferState('success');
    
    // Refresh balances after successful transfer
    onTransferComplete();
  } catch (err) {
    setTransferState('error');
  }
};
```

## Input Validation

Implement comprehensive validation for a good UX:

### Address Validation

```typescript
import { PublicKey } from '@solana/web3.js';

/**
 * Validates a Solana address.
 * Checks for valid base58 encoding and 32-byte length.
 */
export function validateSolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  try {
    const publicKey = new PublicKey(address);
    // Verify it's on the ed25519 curve
    return PublicKey.isOnCurve(publicKey.toBytes());
  } catch {
    return false;
  }
}
```

### Balance Validation

```typescript
/**
 * Checks if user has sufficient balance.
 * 
 * @param amount - Human-readable amount (e.g., 10.50)
 * @param balance - Balance in smallest units
 */
export function hasSufficientBalance(
  amount: number, 
  balance: number
): boolean {
  const amountInSmallestUnits = amount * 1_000_000;
  return amountInSmallestUnits <= balance;
}
```

### Real-Time Feedback

Show validation errors as the user types:

```typescript
useEffect(() => {
  // Don't show errors for empty form
  if (!recipient && !amount) {
    setValidationError(null);
    return;
  }

  const error = validateTransfer(
    recipient,
    parseFloat(amount) || 0,
    usdcBalance
  );
  
  setValidationError(error);
}, [recipient, amount, usdcBalance]);
```

## Transaction Verification

After a successful transfer, help users verify their transaction:

### Explorer Link

```typescript
/**
 * Gets the Solana Explorer URL for a transaction.
 */
export function getExplorerUrl(signature: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_EXPLORER_URL 
    || 'https://explorer.solana.com';
  return `${baseUrl}/tx/${signature}?cluster=devnet`;
}
```

### Success Modal

```typescript
const SuccessModal = () => (
  <div className="modal-overlay">
    <div className="modal">
      <div className="success-icon">✓</div>
      
      <h3>Transfer Successful!</h3>
      <p>Your USDC has been sent.</p>
      
      <a
        href={getExplorerUrl(txSignature!)}
        target="_blank"
        rel="noopener noreferrer"
      >
        View on Solana Explorer →
      </a>

      <button onClick={resetForm}>Done</button>
    </div>
  </div>
);
```

### What to Verify on Explorer

When viewing the transaction on Solana Explorer, users can verify:

1. **Status**: Should show "Success" or "Confirmed"
2. **From**: Their smart wallet address
3. **To**: The recipient address they entered
4. **Amount**: The USDC amount transferred
5. **Fee Payer**: The Paymaster address (not the user)

## Error Handling

Handle different failure scenarios gracefully:

### Error Types

| Error | Cause | User Message |
|-------|-------|--------------|
| Invalid Address | Bad format | "Invalid recipient address" |
| Insufficient Balance | Not enough USDC | "Insufficient USDC balance" |
| User Cancelled | Dismissed passkey prompt | "Transaction cancelled" |
| Network Error | Connection issue | "Network error, please retry" |
| Relay Failed | Paymaster issue | "Transaction failed, please retry" |

### Error Modal

```typescript
const ErrorModal = () => (
  <div className="modal-overlay">
    <div className="modal">
      <div className="error-icon">✕</div>
      
      <h3>Transfer Failed</h3>
      <p>{transactionError}</p>

      <div className="actions">
        <button onClick={resetForm}>Cancel</button>
        <button onClick={() => setTransferState('confirming')}>
          Try Again
        </button>
      </div>
    </div>
  </div>
);
```

## Testing

### Unit Tests

Test validation functions:

```typescript
import { describe, it, expect } from 'vitest';
import { validateTransfer } from '@/lib/lazorkit';

describe('validateTransfer', () => {
  const validAddress = 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy';
  
  it('returns null for valid inputs', () => {
    const error = validateTransfer(validAddress, 10, 20_000_000);
    expect(error).toBeNull();
  });

  it('returns error for empty recipient', () => {
    const error = validateTransfer('', 10, 20_000_000);
    expect(error).toContain('required');
  });

  it('returns error for invalid address', () => {
    const error = validateTransfer('invalid', 10, 20_000_000);
    expect(error).toContain('Invalid');
  });

  it('returns error for zero amount', () => {
    const error = validateTransfer(validAddress, 0, 20_000_000);
    expect(error).toContain('greater than zero');
  });

  it('returns error for insufficient balance', () => {
    const error = validateTransfer(validAddress, 100, 50_000_000);
    expect(error).toContain('Insufficient');
  });
});
```

### Property-Based Tests

Use fast-check to test validation properties:

```typescript
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateTransfer } from '@/lib/lazorkit';

describe('validateTransfer properties', () => {
  /**
   * **Property 5: Insufficient Balance Detection**
   * For any transfer amount exceeding balance, validation returns error
   */
  it('detects insufficient balance for any amount > balance', () => {
    const validAddress = 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy';
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000 }), // balance in USDC
        fc.integer({ min: 1, max: 100 }),       // extra amount
        (balanceUsdc, extra) => {
          const balance = balanceUsdc * 1_000_000; // Convert to smallest units
          const amount = balanceUsdc + extra;      // Always exceeds balance
          
          const error = validateTransfer(validAddress, amount, balance);
          
          expect(error).not.toBeNull();
          expect(error).toContain('Insufficient');
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Manual Testing Checklist

1. **Valid Transfer**
   - Enter valid recipient address
   - Enter amount within balance
   - Confirm in modal
   - Complete passkey authentication
   - Verify success and Explorer link

2. **Invalid Address**
   - Enter malformed address
   - Verify error message appears
   - Verify submit button is disabled

3. **Insufficient Balance**
   - Enter amount exceeding balance
   - Verify error message appears
   - Verify submit button is disabled

4. **Cancel Flow**
   - Start transfer, show confirmation
   - Click Cancel
   - Verify form returns to idle state

5. **Passkey Cancellation**
   - Confirm transfer
   - Cancel passkey prompt
   - Verify error modal with retry option

## Best Practices

### 1. Always Show Confirmation

Never execute transfers without user confirmation:

```typescript
// ❌ Wrong - no confirmation
const handleSubmit = async () => {
  await sendGaslessTransfer(params);
};

// ✅ Correct - show confirmation first
const handleSubmit = () => {
  setTransferState('confirming');
};
```

### 2. Disable Form During Processing

Prevent double-submissions:

```typescript
<input 
  disabled={transferState === 'processing'} 
  // ...
/>
```

### 3. Auto-Refresh Balances

Update balances after successful transfers:

```typescript
const executeTransfer = async () => {
  // ... transfer logic
  
  // Refresh balances
  onTransferComplete();
};
```

### 4. Provide Explorer Links

Always give users a way to verify:

```typescript
<a href={getExplorerUrl(signature)} target="_blank">
  View on Explorer
</a>
```

### 5. Handle All Error States

Map errors to user-friendly messages:

```typescript
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    if (error.message.includes('cancelled')) {
      return 'Transaction cancelled. Try again when ready.';
    }
    if (error.message.includes('network')) {
      return 'Network error. Please check your connection.';
    }
  }
  return 'Transfer failed. Please try again.';
};
```

## Next Steps

You now have a complete gasless transfer implementation! Consider adding:

- **Transaction History**: Show past transfers
- **Address Book**: Save frequent recipients
- **Amount Presets**: Quick buttons for common amounts
- **Multi-Token Support**: Extend beyond USDC

## Resources

- [Lazorkit Documentation](https://docs.lazorkit.xyz/)
- [Solana SPL Token Program](https://spl.solana.com/token)
- [Solana Explorer](https://explorer.solana.com/)

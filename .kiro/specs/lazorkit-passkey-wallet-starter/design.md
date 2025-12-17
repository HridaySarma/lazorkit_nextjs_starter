# Design Document: Lazorkit Passkey Wallet Starter

## Overview

The Lazorkit Passkey Wallet Starter is a production-ready Next.js 14+ application demonstrating passkey-based authentication and gasless transactions on Solana using the Lazorkit SDK. The application serves as both a functional wallet interface and a reference implementation for developers integrating Lazorkit into their projects.

### Key Features
- **Passkey Authentication**: WebAuthn-based wallet creation and sign-in without seed phrases
- **Gasless Transactions**: USDC transfers where users don't pay network fees
- **Session Persistence**: Wallet sessions persist across browser restarts
- **Modern UI**: Clean, intuitive interface with smooth animations and responsive design

### Technology Stack
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Solana (Devnet)
- **SDK**: Lazorkit SDK for passkey wallets and gasless transactions
- **Web3**: @solana/web3.js for blockchain interactions

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js Application                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Landing   │  │  Dashboard  │  │      Components         │  │
│  │   Page      │  │    Page     │  │  - PasskeyAuth          │  │
│  │  (page.tsx) │  │ (page.tsx)  │  │  - WalletDashboard      │  │
│  │             │  │             │  │  - GaslessTransfer      │  │
│  │             │  │             │  │  - TransactionHistory   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                        Library Layer                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ lazorkit.ts │  │  solana.ts  │  │      storage.ts         │  │
│  │ SDK Wrapper │  │  Web3 Utils │  │  Session Management     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                      External Services                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Lazorkit   │  │   Solana    │  │     Browser Storage     │  │
│  │    SDK      │  │   Devnet    │  │     (localStorage)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Wallet Creation Flow**:
   ```
   User Click → PasskeyAuth → lazorkit.ts → Lazorkit SDK → WebAuthn API
                                                              ↓
   Dashboard ← storage.ts ← Session Created ← Smart Wallet Created
   ```

2. **Gasless Transfer Flow**:
   ```
   User Input → GaslessTransfer → lazorkit.ts → Lazorkit SDK
                                                     ↓
   Balance Update ← solana.ts ← Transaction Confirmed ← Relayer
   ```

## Components and Interfaces

### Page Components

#### Landing Page (`src/app/page.tsx`)
- Hero section with value proposition
- "Create Wallet" and "Sign In" buttons
- Feature highlights section
- Responsive layout for mobile/desktop

#### Dashboard Page (`src/app/dashboard/page.tsx`)
- Protected route (redirects to landing if no session)
- Wallet address display with copy functionality
- Balance cards (SOL and USDC)
- Transfer form
- Transaction history
- Logout button

### UI Components

#### PasskeyAuth (`src/components/PasskeyAuth.tsx`)
```typescript
interface PasskeyAuthProps {
  mode: 'create' | 'signin';
  onSuccess: (wallet: WalletSession) => void;
  onError: (error: AuthError) => void;
}
```
- Handles both wallet creation and sign-in flows
- Displays loading states during WebAuthn operations
- Shows appropriate error messages for different failure scenarios

#### WalletDashboard (`src/components/WalletDashboard.tsx`)
```typescript
interface WalletDashboardProps {
  wallet: WalletSession;
  onLogout: () => void;
}
```
- Displays wallet address (truncated with copy button)
- Shows SOL and USDC balances in card layout
- Refresh button for balance updates
- Logout functionality

#### GaslessTransfer (`src/components/GaslessTransfer.tsx`)
```typescript
interface GaslessTransferProps {
  wallet: WalletSession;
  usdcBalance: number;
  onTransferComplete: () => void;
}
```
- Form with recipient address and amount inputs
- Real-time validation feedback
- Confirmation modal before submission
- Loading state during transaction processing
- Success/error notifications

#### TransactionHistory (`src/components/TransactionHistory.tsx`)
```typescript
interface TransactionHistoryProps {
  walletAddress: string;
}
```
- Fetches and displays recent transactions
- Loading skeleton during fetch
- Empty state for new wallets
- Clickable rows linking to Solana Explorer

## Data Models

### WalletSession
```typescript
/**
 * Represents an authenticated wallet session
 * Stored in localStorage for persistence
 */
interface WalletSession {
  /** The Solana public key address of the smart wallet */
  publicKey: string;
  /** Lazorkit credential ID for passkey authentication */
  credentialId: string;
  /** Timestamp when the session was created */
  createdAt: number;
  /** Optional display name for the wallet */
  displayName?: string;
}
```

### WalletBalance
```typescript
/**
 * Represents the current balance state of a wallet
 */
interface WalletBalance {
  /** SOL balance in lamports (divide by 1e9 for SOL) */
  solLamports: number;
  /** USDC balance in smallest units (divide by 1e6 for USDC) */
  usdcAmount: number;
  /** Timestamp of last balance fetch */
  lastUpdated: number;
}
```

### Transaction
```typescript
/**
 * Represents a transaction in the wallet's history
 */
interface Transaction {
  /** Transaction signature (unique identifier) */
  signature: string;
  /** Type of transaction */
  type: 'send' | 'receive' | 'unknown';
  /** Amount transferred (in token's smallest unit) */
  amount: number;
  /** Token type */
  token: 'SOL' | 'USDC';
  /** Counterparty address (recipient for sends, sender for receives) */
  counterparty: string;
  /** Unix timestamp of the transaction */
  timestamp: number;
  /** Transaction status */
  status: 'confirmed' | 'pending' | 'failed';
}
```

### TransferRequest
```typescript
/**
 * Parameters for initiating a gasless USDC transfer
 */
interface TransferRequest {
  /** Recipient's Solana public key address */
  recipient: string;
  /** Amount of USDC to transfer (in human-readable format, e.g., 10.50) */
  amount: number;
}
```

### AuthError
```typescript
/**
 * Error types that can occur during passkey authentication
 */
interface AuthError {
  /** Error code for programmatic handling */
  code: 'USER_CANCELLED' | 'BROWSER_UNSUPPORTED' | 'CREDENTIAL_INVALID' | 'NETWORK_ERROR' | 'UNKNOWN';
  /** Human-readable error message */
  message: string;
  /** Original error for debugging */
  originalError?: Error;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following correctness properties have been identified:

### Property 1: Session Data Round-Trip Consistency
*For any* valid WalletSession object, serializing it to JSON and then parsing it back SHALL produce an object with identical property values.

**Validates: Requirements 3.5, 3.6**

### Property 2: Invalid Session Data Handling
*For any* malformed or corrupted JSON string stored as session data, the storage module SHALL return null and clear the corrupted data rather than throwing an exception.

**Validates: Requirements 3.4**

### Property 3: Balance Formatting Consistency
*For any* numeric balance value (SOL in lamports, USDC in smallest units), the formatting function SHALL produce a string with exactly 4 decimal places for SOL and 2 decimal places for USDC.

**Validates: Requirements 4.6**

### Property 4: Address Validation Correctness
*For any* string input, the address validation function SHALL return true if and only if the string is a valid base58-encoded Solana public key of exactly 32 bytes.

**Validates: Requirements 5.1, 5.5**

### Property 5: Insufficient Balance Detection
*For any* transfer amount and wallet balance, the validation function SHALL return an insufficient funds error if and only if the transfer amount exceeds the available balance.

**Validates: Requirements 5.6**

### Property 6: Transaction Display Completeness
*For any* Transaction object, the rendered display SHALL include the transaction signature, type, amount, counterparty address, timestamp, and status.

**Validates: Requirements 6.2**

### Property 7: Address Truncation Format
*For any* valid Solana public key address, the truncation function SHALL produce a string in the format "XXXX...XXXX" where the first and last 4 characters are preserved.

**Validates: Requirements 7.8**

## Error Handling

### Authentication Errors

| Error Code | Cause | User Message | Recovery Action |
|------------|-------|--------------|-----------------|
| USER_CANCELLED | User dismissed WebAuthn prompt | "Authentication cancelled. Click to try again." | Show retry button |
| BROWSER_UNSUPPORTED | Browser doesn't support WebAuthn | "Your browser doesn't support passkeys. Please use Chrome, Safari, or Edge." | Link to supported browsers |
| CREDENTIAL_INVALID | Passkey not found or invalid | "Passkey not recognized. Would you like to create a new wallet?" | Offer wallet creation |
| NETWORK_ERROR | Failed to communicate with Lazorkit | "Network error. Please check your connection and try again." | Show retry button |

### Transaction Errors

| Error Code | Cause | User Message | Recovery Action |
|------------|-------|--------------|-----------------|
| INSUFFICIENT_FUNDS | Balance too low | "Insufficient USDC balance for this transfer." | Show current balance |
| INVALID_RECIPIENT | Bad address format | "Invalid recipient address. Please check and try again." | Highlight input field |
| RELAY_FAILED | Gasless relay error | "Transaction failed to process. Please try again." | Show retry button |
| TIMEOUT | Transaction took too long | "Transaction timed out. Please check your history for status." | Link to history |

### RPC Errors

| Error Code | Cause | User Message | Recovery Action |
|------------|-------|--------------|-----------------|
| RPC_UNAVAILABLE | Devnet RPC down | "Unable to connect to Solana network. Please try again later." | Show retry button |
| RATE_LIMITED | Too many requests | "Too many requests. Please wait a moment and try again." | Auto-retry with backoff |

## Testing Strategy

### Dual Testing Approach

This project employs both unit testing and property-based testing to ensure comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, and integration points
- **Property-Based Tests**: Verify universal properties that should hold across all inputs

### Testing Framework

- **Unit Testing**: Vitest (fast, TypeScript-native)
- **Property-Based Testing**: fast-check (JavaScript/TypeScript PBT library)
- **Component Testing**: React Testing Library

### Property-Based Test Configuration

Each property-based test will:
- Run a minimum of 100 iterations
- Use smart generators that constrain to valid input spaces
- Include a comment referencing the correctness property being tested

### Test File Structure

```
src/
├── lib/
│   ├── __tests__/
│   │   ├── storage.test.ts      # Unit + PBT for session management
│   │   ├── solana.test.ts       # Unit + PBT for blockchain utilities
│   │   └── lazorkit.test.ts     # Unit tests for SDK wrapper
│   ├── storage.ts
│   ├── solana.ts
│   └── lazorkit.ts
├── components/
│   ├── __tests__/
│   │   ├── GaslessTransfer.test.tsx
│   │   └── TransactionHistory.test.tsx
│   └── ...
```

### Test Annotations

All property-based tests must include the following annotation format:
```typescript
/**
 * **Feature: lazorkit-passkey-wallet-starter, Property 1: Session Data Round-Trip Consistency**
 * For any valid WalletSession, serialize then parse produces identical values
 */
```

## UI/UX Design

### Color Palette

```css
/* Primary gradient for CTAs and accents */
--gradient-primary: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);

/* Background colors */
--bg-primary: #0f0f23;
--bg-secondary: #1a1a2e;
--bg-card: #16213e;

/* Text colors */
--text-primary: #ffffff;
--text-secondary: #a0aec0;
--text-muted: #718096;

/* Status colors */
--success: #10b981;
--error: #ef4444;
--warning: #f59e0b;
```

### Component Styling

- **Cards**: Rounded corners (12px), subtle shadow, dark background
- **Buttons**: Gradient background, hover scale effect, disabled opacity
- **Inputs**: Dark background, focus ring, validation border colors
- **Modals**: Centered, backdrop blur, slide-in animation

### Responsive Breakpoints

- **Mobile**: < 640px (single column, stacked cards)
- **Tablet**: 640px - 1024px (two column where appropriate)
- **Desktop**: > 1024px (full layout with sidebar potential)

## Environment Configuration

### Required Environment Variables

```env
# Solana RPC endpoint (Devnet by default)
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# Lazorkit API configuration
NEXT_PUBLIC_LAZORKIT_API_KEY=your_api_key_here

# USDC Devnet mint address
NEXT_PUBLIC_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

# Solana Explorer base URL
NEXT_PUBLIC_EXPLORER_URL=https://explorer.solana.com
```

### Deployment Configuration

For Vercel deployment:
1. Connect GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy with default Next.js settings
4. Ensure `?cluster=devnet` is appended to Explorer links

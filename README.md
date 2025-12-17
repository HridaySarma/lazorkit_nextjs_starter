# Lazorkit Passkey Wallet Starter

A production-ready Next.js 14+ starter application demonstrating passkey-based authentication and gasless transactions on Solana using the Lazorkit SDK.

> **📝 Note**: This starter runs in **demo mode** with simulated passkey authentication and gasless transactions. See [IMPLEMENTATION-NOTE.md](./IMPLEMENTATION-NOTE.md) for details on converting to production with real Lazorkit SDK integration.

## ✨ Features

- **Passkey Authentication** - Create and sign into wallets using device biometrics (Face ID, Touch ID) - no seed phrases required
- **Gasless Transactions** - Send USDC without paying SOL for gas fees
- **Session Persistence** - Wallet sessions persist across browser restarts
- **Modern UI** - Clean, responsive interface with smooth animations
- **TypeScript** - Fully typed codebase with comprehensive interfaces
- **Well-Documented** - Extensive code comments and tutorials

## 🏗️ Architecture

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

### Key Components

| Component | Description |
|-----------|-------------|
| `PasskeyAuth` | Handles wallet creation and sign-in via WebAuthn |
| `WalletDashboard` | Displays wallet address and balances |
| `GaslessTransfer` | Form for sending USDC without gas fees |
| `TransactionHistory` | Shows recent transaction activity |

### Library Modules

| Module | Description |
|--------|-------------|
| `lib/lazorkit.ts` | Lazorkit SDK wrapper for passkey operations |
| `lib/solana.ts` | Solana Web3.js utilities for blockchain interactions |
| `lib/storage.ts` | Session persistence using localStorage |

## 📋 Prerequisites

- **Node.js** 18.17 or later
- **npm** or **yarn** package manager
- A modern browser with WebAuthn support (Chrome, Safari, Edge, Firefox)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/lazorkit-passkey-wallet-starter.git
cd lazorkit-passkey-wallet-starter
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and configure your settings:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

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

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**🎯 Quick Test**: See [QUICK-START.md](./QUICK-START.md) for a step-by-step guide to test all features!

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📦 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page
│   ├── dashboard/         # Dashboard page (protected)
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── PasskeyAuth.tsx    # Authentication component
│   ├── WalletDashboard.tsx # Balance display
│   ├── GaslessTransfer.tsx # Transfer form
│   └── TransactionHistory.tsx # Transaction list
├── lib/                   # Utility modules
│   ├── lazorkit.ts        # Lazorkit SDK wrapper
│   ├── solana.ts          # Solana utilities
│   ├── storage.ts         # Session management
│   └── __tests__/         # Unit & property tests
└── types/                 # TypeScript interfaces
    └── index.ts           # Type definitions
```

## 🌐 Deploying to Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/lazorkit-passkey-wallet-starter)

### Option 2: Manual Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Configure Environment Variables**
   
   In the Vercel dashboard, add the following environment variables:
   - `NEXT_PUBLIC_SOLANA_RPC_URL` - Solana Devnet RPC endpoint
   - `NEXT_PUBLIC_LAZORKIT_API_KEY` - Your Lazorkit API key
   - `NEXT_PUBLIC_USDC_MINT` - USDC Devnet mint address
   - `NEXT_PUBLIC_EXPLORER_URL` - Solana Explorer URL

### Devnet Configuration

This application is configured for Solana Devnet by default:

- **RPC Endpoint**: `https://api.devnet.solana.com`
- **USDC Mint**: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
- **Explorer**: Links include `?cluster=devnet` parameter

To get Devnet SOL for testing, use the [Solana Faucet](https://faucet.solana.com/).

## 🔧 Troubleshooting

### Passkey Not Working

**Problem**: WebAuthn prompt doesn't appear or fails immediately.

**Solutions**:
- Ensure you're using a supported browser (Chrome, Safari, Edge)
- Check that your device has biometric authentication enabled
- Try using HTTPS (required for WebAuthn in production)
- Clear browser data and try again

### Balance Not Loading

**Problem**: SOL or USDC balance shows loading indefinitely.

**Solutions**:
- Check your internet connection
- Verify the RPC endpoint is accessible
- The Devnet RPC may be rate-limited; wait and retry
- Check browser console for specific error messages

### Transaction Failed

**Problem**: Gasless transfer fails with an error.

**Solutions**:
- Verify the recipient address is valid
- Ensure you have sufficient USDC balance
- Check that the Lazorkit Paymaster service is operational
- Try again after a few moments

### Session Not Persisting

**Problem**: Wallet session is lost after closing the browser.

**Solutions**:
- Ensure localStorage is enabled in your browser
- Check that you're not in private/incognito mode
- Verify no browser extensions are blocking storage

## 📚 Tutorials

Learn how to implement key features:

- [**Tutorial 1: Passkey Setup**](./TUTORIAL-1-PASSKEY-SETUP.md) - Step-by-step guide to implementing passkey authentication
- [**Tutorial 2: Gasless Transactions**](./TUTORIAL-2-GASLESS-TRANSACTIONS.md) - How to send transactions without gas fees

## 🛠️ Tech Stack

- **Framework**: [Next.js 14+](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Blockchain**: [Solana](https://solana.com/) (Devnet)
- **SDK**: [Lazorkit](https://lazorkit.xyz/) for passkey wallets
- **Web3**: [@solana/web3.js](https://solana-labs.github.io/solana-web3.js/)
- **Testing**: [Vitest](https://vitest.dev/) + [fast-check](https://fast-check.dev/)

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

## 🔗 Resources

- [Lazorkit Documentation](https://docs.lazorkit.xyz/)
- [Solana Developer Docs](https://docs.solana.com/)
- [WebAuthn Guide](https://webauthn.guide/)
- [Next.js Documentation](https://nextjs.org/docs)

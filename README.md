# Lazorkit Passkey Wallet Starter

A production-ready Next.js 14+ starter application demonstrating passkey-based authentication and gasless transactions on Solana using the Lazorkit SDK.

> **✅ Production Ready**: This starter uses the official **@lazorkit/wallet SDK** with real WebAuthn passkey authentication and biometric prompts (Touch ID, Face ID, Windows Hello).

## ✨ Features

- **Real Passkey Authentication** - Create and sign into wallets using actual device biometrics (Face ID, Touch ID, Windows Hello) via WebAuthn
- **Gasless Transactions** - Send USDC without paying SOL for gas fees using Lazorkit Paymaster
- **Smart Wallet Integration** - Program-derived addresses controlled by passkey credentials
- **Session Persistence** - SDK-managed credential persistence across browser restarts
- **Biometric Transaction Signing** - Every transaction requires biometric confirmation for security
- **Modern UI** - Clean, responsive interface with smooth animations
- **TypeScript** - Fully typed codebase with comprehensive interfaces
- **Well-Documented** - Extensive code comments and tutorials

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js App Root                            │
│                     (src/app/layout.tsx)                         │
├─────────────────────────────────────────────────────────────────┤
│                    LazorKitProvider                              │
│              (from @lazorkit/wallet SDK)                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  - Manages wallet state via React Context                 │  │
│  │  - Handles WebAuthn credential lifecycle                  │  │
│  │  - Provides useWallet() hook to all components            │  │
│  │  - Auto-reconnects on page load                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│         │                                                         │
│         ├─── Landing Page (src/app/page.tsx)                     │
│         │    └─── PasskeyAuth Component                          │
│         │         └─── useWallet() → connect()                   │
│         │                                                         │
│         └─── Dashboard Page (src/app/dashboard/page.tsx)        │
│              ├─── WalletDashboard Component                      │
│              │    └─── useWallet() → smartWalletPubkey          │
│              ├─── GaslessTransfer Component                      │
│              │    └─── useWallet() → signAndSendTransaction()   │
│              └─── TransactionHistory Component                   │
│                   └─── useWallet() → smartWalletPubkey          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Lazorkit SDK Services                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Portal    │  │  Paymaster  │  │    Solana Devnet        │  │
│  │  (Passkey   │  │  (Gasless   │  │   (Blockchain RPC)      │  │
│  │   Storage)  │  │   Sponsor)  │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Description |
|-----------|-------------|
| `LazorKitProvider` | SDK provider wrapping the app, manages wallet state via React Context |
| `PasskeyAuth` | Handles wallet creation and sign-in via real WebAuthn using `useWallet().connect()` |
| `WalletDashboard` | Displays wallet address and balances from `useWallet().smartWalletPubkey` |
| `GaslessTransfer` | Form for sending USDC using `useWallet().signAndSendTransaction()` |
| `TransactionHistory` | Shows recent transaction activity |

### Library Modules

| Module | Description |
|--------|-------------|
| `lib/lazorkit.ts` | Helper utilities for SDK error mapping and validation |
| `lib/solana.ts` | Solana Web3.js utilities for blockchain interactions |
| `lib/config.ts` | Environment configuration and validation |

## 📋 Prerequisites

- **Node.js** 18.17 or later
- **npm** or **yarn** package manager
- A modern browser with WebAuthn support (Chrome 67+, Safari 13+, Edge 18+, Firefox 60+)
- A device with biometric authentication (Touch ID, Face ID, Windows Hello, or fingerprint sensor)

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

# Lazorkit SDK Configuration
NEXT_PUBLIC_LAZORKIT_PORTAL_URL=https://portal.lazor.sh
NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL=https://lazorkit-paymaster.onrender.com

# USDC Devnet mint address
NEXT_PUBLIC_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

# Solana Explorer base URL
NEXT_PUBLIC_EXPLORER_URL=https://explorer.solana.com
```

**Note**: The Lazorkit SDK endpoints are pre-configured for Devnet. No API key is required for development.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**🎯 Quick Test**: See [QUICK-START.md](./QUICK-START.md) for a step-by-step guide to test all features!

## 🧪 Running Tests

### Automated Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests
npm test -- src/__tests__/integration/
```

### Device Testing

To verify real WebAuthn functionality across multiple devices:

1. **Quick Reference**: See [QUICK_TEST_REFERENCE.md](./QUICK_TEST_REFERENCE.md) for a fast overview
2. **Detailed Guide**: Follow [DEVICE_TESTING_GUIDE.md](./DEVICE_TESTING_GUIDE.md) for step-by-step instructions
3. **Test Cases**: Review [MANUAL_TESTS.md](./MANUAL_TESTS.md) for comprehensive test procedures
4. **Results Template**: Use [DEVICE_TEST_RESULTS.md](./DEVICE_TEST_RESULTS.md) to document findings

**Devices to Test:**
- Mac with Touch ID
- iPhone with Face ID
- Android with fingerprint
- Windows with Windows Hello

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

For comprehensive troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

### Quick Fixes

**Passkey Not Working**
- Ensure you're using a supported browser (Chrome 67+, Safari 13+, Edge 18+)
- Check that your device has biometric authentication enabled
- Use HTTPS in production (localhost is allowed for development)
- See [WebAuthn Browser Support](#webauthn-browser-support) below

**Balance Not Loading**
- Check your internet connection
- Verify the RPC endpoint is accessible
- The Devnet RPC may be rate-limited; wait and retry

**Transaction Failed**
- Verify the recipient address is valid
- Ensure you have sufficient USDC balance
- Check that the Lazorkit Paymaster service is operational

**Session Not Persisting**
- The SDK automatically manages credential persistence
- Ensure localStorage is enabled in your browser
- Check that you're not in private/incognito mode

## 📚 Tutorials

Learn how to implement key features:

- [**Tutorial 1: Passkey Setup**](./TUTORIAL-1-PASSKEY-SETUP.md) - Step-by-step guide to implementing passkey authentication
- [**Tutorial 2: Gasless Transactions**](./TUTORIAL-2-GASLESS-TRANSACTIONS.md) - How to send transactions without gas fees

## 🌐 WebAuthn Browser Support

This application uses the WebAuthn standard for passkey authentication. Here's the browser and device compatibility:

### Supported Browsers

| Browser | Minimum Version | Platform Authenticator | Notes |
|---------|----------------|------------------------|-------|
| **Chrome** | 67+ | ✅ Touch ID, Windows Hello, Fingerprint | Recommended |
| **Safari** | 13+ | ✅ Touch ID, Face ID | iOS 14+ required for Face ID |
| **Edge** | 18+ | ✅ Windows Hello, Fingerprint | Chromium-based Edge recommended |
| **Firefox** | 60+ | ✅ Windows Hello, Touch ID | macOS 13+ for Touch ID |
| **Brave** | 1.9+ | ✅ Touch ID, Windows Hello, Fingerprint | Chromium-based |

### Supported Devices

| Platform | Biometric Method | Status |
|----------|------------------|--------|
| **Mac** (macOS 10.15+) | Touch ID | ✅ Fully Supported |
| **iPhone/iPad** (iOS 14+) | Face ID / Touch ID | ✅ Fully Supported |
| **Android** (8.0+) | Fingerprint / Face Unlock | ✅ Fully Supported |
| **Windows** (10+) | Windows Hello (Face/Fingerprint/PIN) | ✅ Fully Supported |
| **Linux** | Fingerprint (via libfprint) | ⚠️ Limited Support |

### Testing WebAuthn Support

You can test if your browser supports WebAuthn by opening the browser console and running:

```javascript
if (window.PublicKeyCredential) {
  console.log("✅ WebAuthn is supported!");
  PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    .then(available => {
      console.log(available ? 
        "✅ Platform authenticator (biometrics) available" : 
        "⚠️ No platform authenticator found");
    });
} else {
  console.log("❌ WebAuthn not supported");
}
```

### Important Notes

- **HTTPS Required**: WebAuthn only works on secure origins (HTTPS) in production. `localhost` is allowed for development.
- **Cross-Device Authentication**: Passkeys are device-specific. To use the same wallet on multiple devices, you'll need to create a new passkey on each device or use platform-specific sync (e.g., iCloud Keychain).
- **Incognito Mode**: WebAuthn may not work in private/incognito browsing modes on some browsers.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14+](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Blockchain**: [Solana](https://solana.com/) (Devnet)
- **SDK**: [@lazorkit/wallet](https://lazorkit.xyz/) v2.0.0+ for passkey wallets
- **Authentication**: [WebAuthn](https://webauthn.guide/) for biometric authentication
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

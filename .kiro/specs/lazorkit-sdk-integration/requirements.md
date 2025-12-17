# Requirements Document

## Introduction

This document specifies the requirements for properly integrating the official Lazorkit SDK (@lazorkit/wallet v2.0.0+) into the existing passkey wallet starter application. The current implementation uses mock/demo code that simulates passkey authentication but does not invoke actual WebAuthn biometric prompts. This integration will replace the mock implementation with the real SDK to enable genuine passkey-based authentication with fingerprint/Face ID on Mac, mobile devices, and other WebAuthn-capable platforms.

## Glossary

- **LazorKitProvider**: React context provider component from @lazorkit/wallet that initializes the SDK and manages wallet state
- **useWallet Hook**: React hook from @lazorkit/wallet that provides wallet connection, signing, and transaction methods
- **WebAuthn**: Web Authentication API that enables passwordless authentication using platform authenticators (fingerprint, Face ID)
- **Platform Authenticator**: Hardware-based authenticator built into devices (Touch ID, Face ID, Windows Hello)
- **Biometric Prompt**: Native OS dialog that requests fingerprint or facial recognition for authentication
- **Smart Wallet**: Solana program-derived address (PDA) controlled by passkey credentials
- **Paymaster**: Service that sponsors transaction fees for gasless operations
- **RPC Endpoint**: Remote Procedure Call endpoint for Solana blockchain communication
- **Portal URL**: Lazorkit service endpoint for passkey credential management
- **Transaction Instruction**: Solana blockchain operation to be signed and executed

## Requirements

### Requirement 1: SDK Provider Integration

**User Story:** As a developer, I want to wrap the application with LazorKitProvider, so that all components can access the SDK's wallet functionality through React context.

#### Acceptance Criteria

1. WHEN the application initializes THEN the System SHALL wrap the root component tree with LazorKitProvider from @lazorkit/wallet
2. WHEN LazorKitProvider is configured THEN the System SHALL pass the Solana RPC URL from environment variables
3. WHEN LazorKitProvider is configured THEN the System SHALL pass the Lazorkit portal URL from environment variables
4. WHEN LazorKitProvider is configured THEN the System SHALL pass the paymaster URL from environment variables
5. WHERE the application supports automatic reconnection THEN the System SHALL set autoConnect configuration to true
6. WHERE the application requires credential persistence THEN the System SHALL set persistCredentials configuration to true

### Requirement 2: Wallet Hook Integration

**User Story:** As a developer, I want to replace mock authentication code with the useWallet hook, so that components use real SDK methods for wallet operations.

#### Acceptance Criteria

1. WHEN a component needs wallet functionality THEN the System SHALL invoke the useWallet hook from @lazorkit/wallet
2. WHEN useWallet is invoked THEN the System SHALL destructure smartWalletPubkey, isConnected, isLoading, connect, disconnect, signTransaction, and signAndSendTransaction
3. WHEN the wallet state changes THEN the useWallet hook SHALL automatically update component state through React context
4. WHEN a component accesses smartWalletPubkey THEN the System SHALL receive a PublicKey object or null from the SDK
5. WHEN a component checks connection status THEN the System SHALL use the isConnected boolean from the SDK

### Requirement 3: Passkey Wallet Creation with Real WebAuthn

**User Story:** As a new user, I want to create a wallet that triggers my device's actual biometric prompt (fingerprint/Face ID), so that I can securely register a passkey credential.

#### Acceptance Criteria

1. WHEN a user clicks "Create Wallet" THEN the System SHALL invoke the connect method from useWallet hook
2. WHEN the connect method is invoked THEN the Lazorkit_SDK SHALL trigger the browser's WebAuthn credential creation flow
3. WHEN WebAuthn credential creation starts THEN the Operating_System SHALL display the native biometric prompt (Touch ID, Face ID, or Windows Hello)
4. WHEN the user completes biometric authentication THEN the Lazorkit_SDK SHALL register the passkey credential with the Lazorkit portal
5. WHEN passkey registration succeeds THEN the Lazorkit_SDK SHALL derive and return the smart wallet public key
6. WHEN wallet creation completes THEN the System SHALL update the UI to reflect the connected state with the wallet address

### Requirement 4: Passkey Sign-In with Real WebAuthn

**User Story:** As a returning user, I want to sign in using my existing passkey that triggers my device's biometric prompt, so that I can authenticate without passwords.

#### Acceptance Criteria

1. WHEN a user clicks "Sign In" THEN the System SHALL invoke the connect method from useWallet hook
2. WHEN the connect method is invoked for an existing credential THEN the Lazorkit_SDK SHALL trigger the browser's WebAuthn credential assertion flow
3. WHEN WebAuthn credential assertion starts THEN the Operating_System SHALL display the native biometric prompt for authentication
4. WHEN the user completes biometric authentication THEN the Lazorkit_SDK SHALL verify the credential signature
5. WHEN credential verification succeeds THEN the Lazorkit_SDK SHALL restore the associated smart wallet session
6. WHEN sign-in completes THEN the System SHALL redirect the user to the dashboard with wallet state populated

### Requirement 5: Transaction Signing with Passkey

**User Story:** As a user, I want to sign transactions using my passkey with biometric confirmation, so that I can authorize blockchain operations securely.

#### Acceptance Criteria

1. WHEN a user initiates a USDC transfer THEN the System SHALL create a Solana Transaction with the transfer instruction
2. WHEN the transaction is ready to sign THEN the System SHALL invoke signAndSendTransaction from useWallet hook
3. WHEN signAndSendTransaction is invoked THEN the Lazorkit_SDK SHALL trigger the WebAuthn signing ceremony
4. WHEN the signing ceremony starts THEN the Operating_System SHALL display the biometric prompt for transaction authorization
5. WHEN the user completes biometric authentication THEN the Lazorkit_SDK SHALL sign the transaction with the passkey credential
6. WHEN the transaction is signed THEN the Lazorkit_SDK SHALL submit it to the Solana network via the paymaster for gasless execution
7. WHEN the transaction is confirmed THEN the System SHALL return the transaction signature to the caller

### Requirement 6: Wallet State Management

**User Story:** As a developer, I want the SDK to manage wallet state automatically, so that I don't need to manually track connection status and credentials.

#### Acceptance Criteria

1. WHEN the wallet connects THEN the useWallet hook SHALL update isConnected to true
2. WHEN the wallet disconnects THEN the useWallet hook SHALL update isConnected to false and clear smartWalletPubkey
3. WHILE any wallet operation is in progress THEN the useWallet hook SHALL set isLoading to true
4. WHEN a wallet operation completes or fails THEN the useWallet hook SHALL set isLoading to false
5. WHEN an error occurs during wallet operations THEN the useWallet hook SHALL populate the error property with an Error object
6. WHEN the application reloads and persistCredentials is enabled THEN the SDK SHALL automatically restore the previous wallet session

### Requirement 7: Disconnect Functionality

**User Story:** As a user, I want to disconnect my wallet and clear my session, so that I can log out securely.

#### Acceptance Criteria

1. WHEN a user clicks "Logout" or "Disconnect" THEN the System SHALL invoke the disconnect method from useWallet hook
2. WHEN disconnect is invoked THEN the Lazorkit_SDK SHALL clear the stored credential data from browser storage
3. WHEN disconnect completes THEN the useWallet hook SHALL update isConnected to false
4. WHEN disconnect completes THEN the useWallet hook SHALL set smartWalletPubkey to null
5. WHEN the wallet is disconnected THEN the System SHALL redirect the user to the landing page

### Requirement 8: Error Handling for SDK Operations

**User Story:** As a user, I want clear error messages when passkey operations fail, so that I understand what went wrong and how to recover.

#### Acceptance Criteria

1. WHEN a wallet operation fails THEN the useWallet hook SHALL populate the error property with details
2. WHEN the user cancels the biometric prompt THEN the System SHALL display a message indicating cancellation and offer retry
3. WHEN the browser does not support WebAuthn THEN the System SHALL display a message listing supported browsers
4. WHEN network errors occur during SDK operations THEN the System SHALL display a message with retry option
5. WHEN credential errors occur THEN the System SHALL display a message explaining the issue and suggesting wallet creation

### Requirement 9: Environment Configuration for SDK

**User Story:** As a developer, I want to configure SDK endpoints via environment variables, so that I can switch between development and production environments.

#### Acceptance Criteria

1. THE .env.example file SHALL document NEXT_PUBLIC_LAZORKIT_RPC_URL with default Solana Devnet endpoint
2. THE .env.example file SHALL document NEXT_PUBLIC_LAZORKIT_PORTAL_URL with the Lazorkit portal endpoint
3. THE .env.example file SHALL document NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL with the paymaster service endpoint
4. WHEN environment variables are not set THEN the System SHALL use documented default values for SDK configuration
5. WHEN the application builds THEN the System SHALL validate that required SDK configuration is present

### Requirement 10: Remove Mock Implementation

**User Story:** As a developer, I want to remove all mock/demo authentication code, so that the application only uses real SDK methods.

#### Acceptance Criteria

1. WHEN the SDK integration is complete THEN the System SHALL remove all Keypair.generate() calls used for mock wallets
2. WHEN the SDK integration is complete THEN the System SHALL remove all simulated delay code (setTimeout for fake async)
3. WHEN the SDK integration is complete THEN the System SHALL remove all mock signature generation code
4. WHEN the SDK integration is complete THEN the System SHALL remove custom session storage logic that duplicates SDK functionality
5. WHEN the SDK integration is complete THEN the lib/lazorkit.ts file SHALL only contain thin wrapper functions that call SDK methods

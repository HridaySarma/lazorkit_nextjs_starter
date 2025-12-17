# Implementation Plan: LazorKit SDK Integration

## Overview

This implementation plan converts the mock/demo authentication code into a real LazorKit SDK integration with actual WebAuthn passkey authentication and biometric prompts. Tasks are ordered to enable incremental progress with early validation of core functionality.

---

## Tasks

- [x] 1. Setup and Configuration





  - Verify @lazorkit/wallet package installation and version
  - Create/update .env.example with SDK configuration variables
  - Add environment variable validation helper
  - _Requirements: 9.1, 9.2, 9.4_


- [x] 2. Integrate LazorKitProvider at Application Root





  - Update src/app/layout.tsx to import LazorKitProvider
  - Wrap the application with LazorKitProvider component
  - Configure provider with rpcUrl, portalUrl, and paymasterUrl from environment
  - Set config options: autoConnect, persistCredentials, syncBetweenTabs, allowIframe
  - Verify provider doesn't break existing functionality
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 3. Update PasskeyAuth Component for Real SDK Integration





  - Import useWallet hook from @lazorkit/wallet
  - Replace createWallet() and signIn() calls with connect() from useWallet
  - Use isConnecting state from SDK instead of local state
  - Remove saveSession() call (SDK handles persistence)
  - Update error handling to map SDK errors to AuthError format
  - Keep existing UI and error display logic
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_


- [x] 4. Create SDK Error Mapping Helper




  - Add mapSDKError() function to lib/lazorkit.ts
  - Map SDK error patterns to AuthError codes (USER_CANCELLED, BROWSER_UNSUPPORTED, etc.)
  - Preserve user-friendly error messages
  - Include original error for debugging
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_


- [x] 5. Update Landing Page Session Check




  - Modify src/app/page.tsx to use useWallet hook for session detection
  - Replace getSession() with isConnected from SDK
  - Update redirect logic to use SDK connection state
  - Remove dependency on custom storage module for session checks
  - _Requirements: 6.6_


- [x] 6. Update WalletDashboard Component




  - Import useWallet hook from @lazorkit/wallet
  - Replace wallet prop with smartWalletPubkey from SDK
  - Use isConnected state from SDK
  - Update disconnect handler to call SDK disconnect() method
  - Remove manual session clearing (SDK handles it)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 7. Update GaslessTransfer Component for SDK Transaction Signing





  - Import useWallet hook from @lazorkit/wallet
  - Replace sendGaslessTransfer() with signAndSendTransaction() from SDK
  - Create Transaction object with SystemProgram or SPL Token instructions
  - Use isSigning state from SDK for loading indicators
  - Handle transaction signature response from SDK
  - Update error handling for SDK transaction errors
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_


- [x] 8. Update Dashboard Page to Use SDK State




  - Modify src/app/dashboard/page.tsx to use useWallet hook
  - Replace getSession() checks with isConnected from SDK
  - Use smartWalletPubkey for wallet address display
  - Update balance fetching to use SDK wallet address
  - Remove dependency on custom storage for wallet data
  - _Requirements: 6.1, 6.2, 6.5_


- [x] 9. Remove Mock Implementation Code




  - Delete createWallet() mock function from lib/lazorkit.ts
  - Delete signIn() mock function from lib/lazorkit.ts
  - Delete sendGaslessTransfer() mock function from lib/lazorkit.ts
  - Remove Keypair.generate() calls
  - Remove setTimeout() simulation delays
  - Remove mock signature generation code
  - Keep only helper functions (isWebAuthnSupported, mapSDKError, validateTransfer)
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_


- [x] 10. Remove or Update Custom Session Storage




  - Evaluate if lib/storage.ts is still needed (SDK handles persistence)
  - Remove saveSession() if SDK persistence is sufficient
  - Remove getSession() if SDK provides connection state
  - Keep clearSession() only if needed for additional cleanup
  - Update any remaining components that import from storage.ts
  - _Requirements: 10.5_


- [x] 11. Update Unit Tests for SDK Integration




  - Mock useWallet hook in component tests
  - Update PasskeyAuth tests to verify connect() is called
  - Update WalletDashboard tests to use SDK state
  - Update GaslessTransfer tests to verify signAndSendTransaction() usage
  - Remove tests for deleted mock functions
  - Add tests for mapSDKError() helper


- [x] 12. Add Integration Tests for SDK Behavior




  - Document manual test cases for real WebAuthn flows
  - Create test checklist for biometric prompts on different devices
  - Add property-based tests for SDK state consistency
  - Test credential persistence across page reloads
  - Test disconnect cleanup behavior


- [x] 13. Update Environment Configuration Files



  - Update .env.example with NEXT_PUBLIC_LAZORKIT_RPC_URL
  - Update .env.example with NEXT_PUBLIC_LAZORKIT_PORTAL_URL
  - Update .env.example with NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL
  - Add comments explaining each environment variable
  - Document default values for each variable
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_


- [-] 14. Verify Real WebAuthn on Multiple Devices


  - Test wallet creation on Mac with Touch ID (verify biometric prompt appears)
  - Test wallet creation on iPhone with Face ID (verify biometric prompt appears)
  - Test wallet creation on Android with fingerprint (verify biometric prompt appears)
  - Test wallet creation on Windows with Windows Hello (verify biometric prompt appears)
  - Test sign-in flow on each device (verify biometric prompt appears)
  - Test transaction signing on each device (verify biometric prompt appears)
  - Document any device-specific issues or behaviors
  - _Requirements: 3.3, 4.3, 5.4_

- [ ] 15. Update Documentation

  - Update README.md with SDK integration details
  - Update TUTORIAL-1-PASSKEY-SETUP.md with real SDK usage examples
  - Update TUTORIAL-2-GASLESS-TRANSACTIONS.md with SDK transaction signing
  - Add troubleshooting section for WebAuthn issues
  - Document supported browsers and devices
  - Add screenshots of biometric prompts if possible

- [ ] 16. Final Verification and Cleanup


  - Run all tests and ensure they pass
  - Verify no mock code remains in codebase
  - Check that all components use SDK hooks
  - Verify environment variables are properly configured
  - Test complete user flow: create wallet → sign in → transfer → disconnect
  - Confirm biometric prompts appear at each authentication point
  - Review code for any remaining TODOs or cleanup needed

---

## Notes

- Tasks 1-10 focus on core SDK integration and removing mock code
- Tasks 11-12 cover comprehensive testing (unit and integration tests)
- Tasks 13-16 cover configuration, verification, and documentation
- Each task builds on previous tasks for incremental progress
- Early tasks enable testing of real WebAuthn functionality
- Device testing (Task 14) is critical to verify biometric prompts work correctly
- All tasks are required for a complete, production-ready implementation

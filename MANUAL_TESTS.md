# Manual Test Cases for LazorKit SDK Integration

This document provides comprehensive manual test cases for verifying real WebAuthn flows and biometric prompts across different devices and platforms.

## Overview

These tests verify that the LazorKit SDK properly integrates with platform authenticators (Touch ID, Face ID, Windows Hello, fingerprint sensors) and triggers native biometric prompts at the correct times.

---

## Test Environment Setup

### Prerequisites
- [ ] Application running locally or on test server
- [ ] HTTPS enabled (required for WebAuthn)
- [ ] Test devices available (see device checklist below)
- [ ] Browser developer tools open for debugging

### Environment Variables
Ensure these are configured:
```env
NEXT_PUBLIC_LAZORKIT_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_LAZORKIT_PORTAL_URL=https://portal.lazor.sh
NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL=https://lazorkit-paymaster.onrender.com
```

---

## Device Test Checklist

### macOS with Touch ID

**Device:** MacBook Pro/Air with Touch ID  
**Browser:** Safari, Chrome, Edge  
**Authenticator:** Touch ID

#### Test 1: Wallet Creation
- [ ] Navigate to landing page
- [ ] Click "Create Wallet" button
- [ ] **Expected:** Touch ID prompt appears with message "Create passkey for wallet"
- [ ] Place finger on Touch ID sensor
- [ ] **Expected:** Wallet created successfully, redirected to dashboard
- [ ] **Expected:** Wallet address displayed in dashboard
- [ ] **Result:** ✅ Pass / ❌ Fail
- [ ] **Notes:** _____________________

#### Test 2: Sign In with Existing Wallet
- [ ] Disconnect wallet (logout)
- [ ] Return to landing page
- [ ] Click "Sign In" button
- [ ] **Expected:** Touch ID prompt appears with message "Sign in with passkey"
- [ ] Place finger on Touch ID sensor
- [ ] **Expected:** Signed in successfully, redirected to dashboard
- [ ] **Expected:** Same wallet address as before
- [ ] **Result:** ✅ Pass / ❌ Fail
- [ ] **Notes:** _____________________

#### Test 3: Transaction Signing
- [ ] From dashboard, navigate to transfer section
- [ ] Enter recipient address and amount
- [ ] Click "Send" button
- [ ] **Expected:** Touch ID prompt appears with message "Authorize transaction"
- [ ] Place finger on Touch ID sensor
- [ ] **Expected:** Transaction signed and submitted
- [ ] **Expected:** Success message with transaction signature
- [ ] **Result:** ✅ Pass / ❌ Fail
- [ ] **Notes:** _____________________

#### Test 4: Credential Persistence
- [ ] Ensure wallet is connected
- [ ] Refresh the page (Cmd+R)
- [ ] **Expected:** Wallet automatically reconnects without biometric prompt
- [ ] **Expected:** Dashboard shows same wallet address
- [ ] **Result:** ✅ Pass / ❌ Fail
- [ ] **Notes:** _____________________

#### Test 5: Disconnect Cleanup
- [ ] Click "Disconnect" or "Logout" button
- [ ] **Expected:** Redirected to landing page
- [ ] Refresh the page
- [ ] **Expected:** Wallet remains disconnected (no auto-reconnect)
- [ ] **Result:** ✅ Pass / ❌ Fail
- [ ] **Notes:** _____________________

---

### iPhone with Face ID

**Device:** iPhone X or later  
**Browser:** Safari (iOS)  
**Authenticator:** Face ID

#### Test 1: Wallet Creation
- [ ] Navigate to landing page in Safari
- [ ] Click "Create Wallet" button
- [ ] **Expected:** Face ID prompt appears with message "Create passkey for wallet"
- [ ] Look at iPhone to authenticate
- [ ] **Expected:** Wallet created successfully, redirected to dashboard
- [ ] **Expected:** Wallet address displayed in dashboard
- [ ] **Result:** ✅ Pass / ❌ Fail
- [ ] **Notes:** _____________________

#### Test 2: Sign In with Existing Wallet
- [ ] Disconnect wallet (logout)
- [ ] Return to landing page
- [ ] Click "Sign In" button
- [ ] **Expected:** Face ID prompt appears
- [ ] Look at iPhone to authenticate
- [ ] **Expected:** Signed in successfully, redirected to dashboard
- [ ] **Result:** ✅ Pass / ❌ Fail
- [ ] **Notes:** _____________________

#### Test 3: Transaction Signing
- [ ] From dashboard, navigate to transfer section
- [ ] Enter recipient address and amount
- [ ] Click "Send" button
- [ ] **Expected:** Face ID prompt appears
- [ ] Look at iPhone to authenticate
- [ ] **Expected:** Transaction signed and submitted
- [ ] **Result:** ✅ Pass / ❌ Fail
- [ ] **Notes:** _____________________

#### Test 4: Credential Persistence (Mobile Safari)
- [ ] Ensure wallet is connected
- [ ] Close Safari tab completely
- [ ] Reopen application URL in new tab
- [ ] **Expected:** Wallet automatically reconnects
- [ ] **Result:** ✅ Pass / ❌ Fail
- [ ] **Notes:** _____________________

---

### Android with Fingerprint

**Device:** Android phone with fingerprint sensor  
**Browser:** Chrome (Android)  
**Authenticator:** Fingerprint sensor

#### Test 1: Wallet Creation
- [ ] Navigate to landing page in Chrome
- [ ] Click "Create Wallet" button
- [ ] **Expected:** Fingerprint prompt appears
- [ ] Place finger on sensor
- [ ] **Expected:** Wallet created successfully
- [ ] **Result:** ✅ Pass / ❌ Fail
- [ ] **Notes:** _____________________

#### Test 2: Sign In with Existing Wallet
- [ ] Disconnect wallet
- [ ] Click "Sign In" button
- [ ] **Expected:** Fingerprint prompt appears
- [ ] Place finger on sensor
- [ ] **Expected:** Signed in successfully
- [ ] **Result:** ✅ Pass / ❌ Fail
- [ ] **Notes:** _____________________

#### Test 3: Transaction Signing
- [ ] Initiate a transfer
- [ ] Click "Send" button
- [ ] **Expected:** Fingerprint prompt appears
- [ ] Place finger on sensor
- [ ] **Expected:** Transaction signed and submitted
- [ ] **Result:** ✅ Pass / ❌ Fail
- [ ] **Notes:** _____________________

---

### Windows with Windows Hello

**Device:** Windows PC with Windows Hello (fingerprint, face, or PIN)  
**Browser:** Edge, Chrome  
**Authenticator:** Windows Hello

#### Test 1: Wallet Creation
- [ ] Navigate to landing page
- [ ] Click "Create Wallet" button
- [ ] **Expected:** Windows Hello prompt appears
- [ ] Authenticate with fingerprint/face/PIN
- [ ] **Expected:** Wallet created successfully
- [ ] **Result:** ✅ Pass / ❌ Fail
- [ ] **Notes:** _____________________

#### Test 2: Sign In with Existing Wallet
- [ ] Disconnect wallet
- [ ] Click "Sign In" button
- [ ] **Expected:** Windows Hello prompt appears
- [ ] Authenticate with Windows Hello
- [ ] **Expected:** Signed in successfully
- [ ] **Result:** ✅ Pass / ❌ Fail
- [ ] **Notes:** _____________________

#### Test 3: Transaction Signing
- [ ] Initiate a transfer
- [ ] Click "Send" button
- [ ] **Expected:** Windows Hello prompt appears
- [ ] Authenticate with Windows Hello
- [ ] **Expected:** Transaction signed and submitted
- [ ] **Result:** ✅ Pass / ❌ Fail
- [ ] **Notes:** _____________________

---

## Error Handling Test Cases

### Test: User Cancels Biometric Prompt

**Platform:** Any  
**Steps:**
- [ ] Click "Create Wallet" or "Sign In"
- [ ] When biometric prompt appears, click "Cancel" or press Escape
- [ ] **Expected:** Error message displayed: "Authentication cancelled. Click to try again."
- [ ] **Expected:** Retry button available
- [ ] Click retry button
- [ ] **Expected:** Biometric prompt appears again
- [ ] **Result:** ✅ Pass / ❌ Fail
- [ ] **Notes:** _____________________

### Test: Unsupported Browser

**Platform:** Any  
**Browser:** Internet Explorer, old browser versions  
**Steps:**
- [ ] Open application in unsupported browser
- [ ] Click "Create Wallet"
- [ ] **Expected:** Error message: "Your browser doesn't support passkeys. Please use Chrome, Safari, or Edge."
- [ ] **Expected:** No biometric prompt appears
- [ ] **Result:** ✅ Pass / ❌ Fail
- [ ] **Notes:** _____________________

### Test: Network Error During Connection

**Platform:** Any  
**Steps:**
- [ ] Disconnect from internet
- [ ] Click "Create Wallet"
- [ ] Complete biometric authentication
- [ ] **Expected:** Error message: "Network error. Please check your connection and try again."
- [ ] Reconnect to internet
- [ ] Click retry
- [ ] **Expected:** Wallet creation succeeds
- [ ] **Result:** ✅ Pass / ❌ Fail
- [ ] **Notes:** _____________________

### Test: Invalid Credential

**Platform:** Any  
**Steps:**
- [ ] Clear browser data (cookies, localStorage)
- [ ] Click "Sign In" (without creating wallet first)
- [ ] **Expected:** Error message: "Passkey not recognized. Would you like to create a new wallet?"
- [ ] **Expected:** Option to create new wallet
- [ ] **Result:** ✅ Pass / ❌ Fail
- [ ] **Notes:** _____________________

---

## Cross-Browser Testing

### Desktop Browsers

| Browser | Version | Wallet Creation | Sign In | Transaction | Persistence | Notes |
|---------|---------|----------------|---------|-------------|-------------|-------|
| Chrome  | Latest  | ⬜ Pass/Fail   | ⬜ Pass/Fail | ⬜ Pass/Fail | ⬜ Pass/Fail | |
| Safari  | Latest  | ⬜ Pass/Fail   | ⬜ Pass/Fail | ⬜ Pass/Fail | ⬜ Pass/Fail | |
| Edge    | Latest  | ⬜ Pass/Fail   | ⬜ Pass/Fail | ⬜ Pass/Fail | ⬜ Pass/Fail | |
| Firefox | Latest  | ⬜ Pass/Fail   | ⬜ Pass/Fail | ⬜ Pass/Fail | ⬜ Pass/Fail | |

### Mobile Browsers

| Browser | Platform | Wallet Creation | Sign In | Transaction | Persistence | Notes |
|---------|----------|----------------|---------|-------------|-------------|-------|
| Safari  | iOS      | ⬜ Pass/Fail   | ⬜ Pass/Fail | ⬜ Pass/Fail | ⬜ Pass/Fail | |
| Chrome  | Android  | ⬜ Pass/Fail   | ⬜ Pass/Fail | ⬜ Pass/Fail | ⬜ Pass/Fail | |
| Chrome  | iOS      | ⬜ Pass/Fail   | ⬜ Pass/Fail | ⬜ Pass/Fail | ⬜ Pass/Fail | |

---

## Performance Testing

### Test: Biometric Prompt Response Time

**Objective:** Verify biometric prompts appear quickly without delay

**Steps:**
- [ ] Click "Create Wallet"
- [ ] Measure time from button click to biometric prompt appearance
- [ ] **Expected:** < 500ms
- [ ] **Actual:** _____ ms
- [ ] **Result:** ✅ Pass / ❌ Fail

### Test: Transaction Signing Speed

**Objective:** Verify transaction signing completes quickly

**Steps:**
- [ ] Initiate transfer
- [ ] Complete biometric authentication
- [ ] Measure time from authentication to transaction confirmation
- [ ] **Expected:** < 3 seconds
- [ ] **Actual:** _____ seconds
- [ ] **Result:** ✅ Pass / ❌ Fail

---

## Security Testing

### Test: Credential Isolation Between Users

**Steps:**
- [ ] Create wallet with User A credentials
- [ ] Note wallet address
- [ ] Disconnect wallet
- [ ] Clear browser data
- [ ] Create wallet with User B credentials (different biometric)
- [ ] Note wallet address
- [ ] **Expected:** Different wallet addresses
- [ ] **Expected:** User B cannot access User A's wallet
- [ ] **Result:** ✅ Pass / ❌ Fail

### Test: Credential Not Shared Across Origins

**Steps:**
- [ ] Create wallet on domain A (e.g., localhost:3000)
- [ ] Note wallet address
- [ ] Open application on domain B (e.g., 127.0.0.1:3000)
- [ ] Try to sign in
- [ ] **Expected:** Credential not found (different origin)
- [ ] **Expected:** Must create new wallet
- [ ] **Result:** ✅ Pass / ❌ Fail

---

## Accessibility Testing

### Test: Keyboard Navigation

**Steps:**
- [ ] Navigate to landing page
- [ ] Use Tab key to focus "Create Wallet" button
- [ ] Press Enter to activate
- [ ] **Expected:** Biometric prompt appears
- [ ] **Result:** ✅ Pass / ❌ Fail

### Test: Screen Reader Compatibility

**Steps:**
- [ ] Enable screen reader (VoiceOver, NVDA, etc.)
- [ ] Navigate to landing page
- [ ] **Expected:** Buttons and status messages are announced
- [ ] **Expected:** Error messages are announced
- [ ] **Result:** ✅ Pass / ❌ Fail

---

## Test Summary

**Date:** _______________  
**Tester:** _______________  
**Environment:** _______________

### Overall Results

- Total Tests: _____
- Passed: _____
- Failed: _____
- Blocked: _____

### Critical Issues Found

1. _____________________
2. _____________________
3. _____________________

### Recommendations

_____________________
_____________________
_____________________

### Sign-off

**Tester Signature:** _______________  
**Date:** _______________

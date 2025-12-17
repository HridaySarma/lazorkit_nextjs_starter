# Device Test Checklist for Biometric Prompts

This checklist provides a quick reference for testing biometric prompts across different devices and platforms.

## Quick Test Matrix

Use this matrix to track which devices have been tested and their results.

| Device Type | OS | Browser | Authenticator | Tested | Result | Notes |
|-------------|----|---------|--------------:|--------|--------|-------|
| MacBook Pro | macOS 14+ | Safari | Touch ID | ⬜ | ⬜ Pass / ⬜ Fail | |
| MacBook Pro | macOS 14+ | Chrome | Touch ID | ⬜ | ⬜ Pass / ⬜ Fail | |
| MacBook Pro | macOS 14+ | Edge | Touch ID | ⬜ | ⬜ Pass / ⬜ Fail | |
| MacBook Air | macOS 14+ | Safari | Touch ID | ⬜ | ⬜ Pass / ⬜ Fail | |
| iPhone 14 Pro | iOS 17+ | Safari | Face ID | ⬜ | ⬜ Pass / ⬜ Fail | |
| iPhone 13 | iOS 16+ | Safari | Face ID | ⬜ | ⬜ Pass / ⬜ Fail | |
| iPhone SE | iOS 16+ | Safari | Touch ID | ⬜ | ⬜ Pass / ⬜ Fail | |
| iPad Pro | iPadOS 17+ | Safari | Face ID | ⬜ | ⬜ Pass / ⬜ Fail | |
| Samsung Galaxy | Android 13+ | Chrome | Fingerprint | ⬜ | ⬜ Pass / ⬜ Fail | |
| Google Pixel | Android 14+ | Chrome | Fingerprint | ⬜ | ⬜ Pass / ⬜ Fail | |
| OnePlus | Android 13+ | Chrome | Fingerprint | ⬜ | ⬜ Pass / ⬜ Fail | |
| Windows PC | Windows 11 | Edge | Windows Hello | ⬜ | ⬜ Pass / ⬜ Fail | |
| Windows PC | Windows 11 | Chrome | Windows Hello | ⬜ | ⬜ Pass / ⬜ Fail | |
| Windows Laptop | Windows 11 | Edge | Fingerprint | ⬜ | ⬜ Pass / ⬜ Fail | |

---

## Per-Device Test Checklist

For each device, verify all three critical flows:

### Device: _____________________

**Date:** _______________  
**Tester:** _______________

#### 1. Wallet Creation Flow
- [ ] Navigate to landing page
- [ ] Click "Create Wallet"
- [ ] Biometric prompt appears
- [ ] Complete biometric authentication
- [ ] Wallet created successfully
- [ ] Redirected to dashboard
- [ ] Wallet address displayed

**Result:** ⬜ Pass / ⬜ Fail  
**Time to prompt:** _____ ms  
**Total time:** _____ seconds  
**Notes:** _____________________

#### 2. Sign-In Flow
- [ ] Disconnect wallet
- [ ] Return to landing page
- [ ] Click "Sign In"
- [ ] Biometric prompt appears
- [ ] Complete biometric authentication
- [ ] Signed in successfully
- [ ] Same wallet address restored

**Result:** ⬜ Pass / ⬜ Fail  
**Time to prompt:** _____ ms  
**Total time:** _____ seconds  
**Notes:** _____________________

#### 3. Transaction Signing Flow
- [ ] Navigate to transfer section
- [ ] Enter recipient and amount
- [ ] Click "Send"
- [ ] Biometric prompt appears
- [ ] Complete biometric authentication
- [ ] Transaction signed
- [ ] Transaction submitted
- [ ] Success message with signature

**Result:** ⬜ Pass / ⬜ Fail  
**Time to prompt:** _____ ms  
**Total time:** _____ seconds  
**Notes:** _____________________

#### 4. Credential Persistence
- [ ] Wallet connected
- [ ] Refresh page
- [ ] Wallet auto-reconnects
- [ ] No biometric prompt needed
- [ ] Same wallet address

**Result:** ⬜ Pass / ⬜ Fail  
**Notes:** _____________________

#### 5. Disconnect Cleanup
- [ ] Click disconnect
- [ ] Redirected to landing
- [ ] Refresh page
- [ ] Wallet stays disconnected
- [ ] No auto-reconnect

**Result:** ⬜ Pass / ⬜ Fail  
**Notes:** _____________________

---

## Platform-Specific Verification Points

### macOS with Touch ID

**Biometric Prompt Appearance:**
- [ ] System Touch ID dialog appears (not browser dialog)
- [ ] Dialog shows app name/domain
- [ ] Dialog shows appropriate message ("Create passkey", "Sign in", "Authorize transaction")
- [ ] Touch ID sensor icon visible
- [ ] Cancel button available

**Biometric Prompt Behavior:**
- [ ] Prompt appears within 500ms of button click
- [ ] Prompt stays on screen until user action
- [ ] Successful authentication closes prompt immediately
- [ ] Failed authentication shows error and allows retry
- [ ] Cancel button returns to app without error

**Notes:** _____________________

---

### iOS with Face ID

**Biometric Prompt Appearance:**
- [ ] System Face ID prompt appears
- [ ] Prompt shows app name/domain
- [ ] Prompt shows appropriate message
- [ ] Face ID icon visible
- [ ] Cancel button available

**Biometric Prompt Behavior:**
- [ ] Prompt appears within 500ms
- [ ] Face ID animation plays
- [ ] Successful authentication closes prompt
- [ ] Failed authentication allows retry
- [ ] Works in both portrait and landscape

**Notes:** _____________________

---

### Android with Fingerprint

**Biometric Prompt Appearance:**
- [ ] System biometric prompt appears
- [ ] Prompt shows app name/domain
- [ ] Prompt shows appropriate message
- [ ] Fingerprint icon visible
- [ ] Cancel button available

**Biometric Prompt Behavior:**
- [ ] Prompt appears within 500ms
- [ ] Fingerprint sensor activates
- [ ] Successful authentication closes prompt
- [ ] Failed authentication allows retry
- [ ] Fallback to PIN/pattern available

**Notes:** _____________________

---

### Windows with Windows Hello

**Biometric Prompt Appearance:**
- [ ] Windows Hello prompt appears
- [ ] Prompt shows app name/domain
- [ ] Prompt shows appropriate message
- [ ] Authenticator icon visible (face/fingerprint/PIN)
- [ ] Cancel button available

**Biometric Prompt Behavior:**
- [ ] Prompt appears within 500ms
- [ ] Authenticator activates
- [ ] Successful authentication closes prompt
- [ ] Failed authentication allows retry
- [ ] Fallback to PIN available

**Notes:** _____________________

---

## Common Issues to Watch For

### Issue Checklist

- [ ] **No biometric prompt appears** - Check WebAuthn support, HTTPS requirement
- [ ] **Prompt appears but doesn't recognize biometric** - Check device settings, enrolled biometrics
- [ ] **Prompt appears multiple times** - Check for duplicate SDK calls
- [ ] **Prompt appears with wrong message** - Check SDK configuration
- [ ] **Slow prompt appearance** - Check network latency, SDK initialization
- [ ] **Prompt doesn't close after success** - Check SDK state management
- [ ] **Error after successful biometric** - Check network, portal connectivity
- [ ] **Credentials not persisting** - Check localStorage, SDK config
- [ ] **Auto-reconnect not working** - Check persistCredentials setting
- [ ] **Different wallet on reconnect** - Check credential storage, origin

---

## Browser Compatibility Notes

### Safari (macOS/iOS)
- [ ] WebAuthn fully supported
- [ ] Touch ID/Face ID integration native
- [ ] Requires HTTPS (or localhost)
- [ ] Credentials stored in iCloud Keychain
- [ ] Cross-device sync available

**Notes:** _____________________

### Chrome (All Platforms)
- [ ] WebAuthn fully supported
- [ ] Platform authenticator support varies by OS
- [ ] Requires HTTPS (or localhost)
- [ ] Credentials stored in browser profile
- [ ] Sync available with Google account

**Notes:** _____________________

### Edge (Windows)
- [ ] WebAuthn fully supported
- [ ] Windows Hello integration native
- [ ] Requires HTTPS (or localhost)
- [ ] Credentials stored in Windows Credential Manager
- [ ] Sync available with Microsoft account

**Notes:** _____________________

### Firefox
- [ ] WebAuthn supported (check version)
- [ ] Platform authenticator support varies
- [ ] May require about:config changes
- [ ] Credentials stored in browser profile

**Notes:** _____________________

---

## Test Environment Requirements

### Required for All Tests
- [ ] HTTPS enabled (or localhost for development)
- [ ] Valid SSL certificate (for non-localhost)
- [ ] Environment variables configured
- [ ] SDK endpoints accessible
- [ ] Solana Devnet accessible

### Device Requirements
- [ ] Biometric authenticator enrolled
- [ ] Device unlocked
- [ ] Browser up to date
- [ ] JavaScript enabled
- [ ] Cookies/localStorage enabled

---

## Reporting Template

### Test Session Summary

**Date:** _______________  
**Duration:** _______________  
**Tester:** _______________

**Devices Tested:** _____  
**Tests Passed:** _____  
**Tests Failed:** _____  
**Tests Blocked:** _____

### Issues Found

#### Issue 1
- **Device:** _____________________
- **Browser:** _____________________
- **Severity:** ⬜ Critical / ⬜ High / ⬜ Medium / ⬜ Low
- **Description:** _____________________
- **Steps to Reproduce:** _____________________
- **Expected:** _____________________
- **Actual:** _____________________
- **Screenshot/Video:** _____________________

#### Issue 2
- **Device:** _____________________
- **Browser:** _____________________
- **Severity:** ⬜ Critical / ⬜ High / ⬜ Medium / ⬜ Low
- **Description:** _____________________
- **Steps to Reproduce:** _____________________
- **Expected:** _____________________
- **Actual:** _____________________
- **Screenshot/Video:** _____________________

### Recommendations

1. _____________________
2. _____________________
3. _____________________

### Next Steps

- [ ] _____________________
- [ ] _____________________
- [ ] _____________________

---

## Sign-off

**Tester:** _______________  
**Date:** _______________  
**Signature:** _______________

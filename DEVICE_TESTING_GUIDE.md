# Device Testing Execution Guide

## Overview

This guide provides step-by-step instructions for verifying real WebAuthn functionality and biometric prompts across multiple devices. This is **Task 14** of the LazorKit SDK Integration implementation plan.

**Requirements Validated:** 3.3, 4.3, 5.4

---

## Quick Start

### What You Need

1. **Devices to Test:**
   - Mac with Touch ID (MacBook Pro/Air)
   - iPhone with Face ID (iPhone X or later)
   - Android phone with fingerprint sensor
   - Windows PC with Windows Hello

2. **Prerequisites:**
   - Application running on HTTPS (required for WebAuthn)
   - Test environment configured with proper environment variables
   - Biometric authenticators enrolled on each device
   - Supported browsers installed

3. **Documentation Files:**
   - `MANUAL_TESTS.md` - Detailed test procedures
   - `DEVICE_TEST_CHECKLIST.md` - Quick reference checklist
   - This file - Execution guide

---

## Testing Workflow

### Step 1: Prepare Test Environment

#### 1.1 Verify Application is Running

```bash
# Start the development server
npm run dev
```

Ensure the application is accessible via HTTPS. For local testing:
- Use `https://localhost:3000` (requires SSL certificate)
- Or deploy to a test server with valid SSL

#### 1.2 Verify Environment Configuration

Check that these environment variables are set:

```env
NEXT_PUBLIC_LAZORKIT_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_LAZORKIT_PORTAL_URL=https://portal.lazor.sh
NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL=https://lazorkit-paymaster.onrender.com
```

#### 1.3 Verify SDK Integration

Open browser console and check for:
- No errors on page load
- LazorKitProvider initialized
- SDK version logged (if debug mode enabled)

---

### Step 2: Test on Mac with Touch ID

**Device:** MacBook Pro or MacBook Air with Touch ID  
**Browser:** Safari (primary), Chrome, Edge (secondary)  
**Estimated Time:** 15-20 minutes

#### 2.1 Wallet Creation Test

1. Open Safari and navigate to the application
2. Click **"Create Wallet"** button
3. **✓ VERIFY:** Touch ID prompt appears within 500ms
4. **✓ VERIFY:** Prompt shows "Create passkey" or similar message
5. **✓ VERIFY:** Prompt displays the application domain
6. Place finger on Touch ID sensor
7. **✓ VERIFY:** Prompt closes immediately after successful authentication
8. **✓ VERIFY:** Redirected to dashboard
9. **✓ VERIFY:** Wallet address displayed
10. **✓ VERIFY:** No errors in console

**Record Results:**
- [ ] Test passed
- [ ] Test failed (describe issue): _______________
- Time to prompt: _____ ms
- Total time: _____ seconds

#### 2.2 Sign-In Test

1. Click **"Disconnect"** or **"Logout"**
2. Return to landing page
3. Click **"Sign In"** button
4. **✓ VERIFY:** Touch ID prompt appears
5. Place finger on Touch ID sensor
6. **✓ VERIFY:** Signed in successfully
7. **✓ VERIFY:** Same wallet address as before

**Record Results:**
- [ ] Test passed
- [ ] Test failed (describe issue): _______________

#### 2.3 Transaction Signing Test

1. Navigate to transfer section
2. Enter recipient address: `11111111111111111111111111111111` (burn address for testing)
3. Enter amount: `0.001` SOL
4. Click **"Send"** button
5. **✓ VERIFY:** Touch ID prompt appears
6. **✓ VERIFY:** Prompt shows "Authorize transaction" or similar
7. Place finger on Touch ID sensor
8. **✓ VERIFY:** Transaction signed and submitted
9. **✓ VERIFY:** Success message with transaction signature

**Record Results:**
- [ ] Test passed
- [ ] Test failed (describe issue): _______________
- Transaction signature: _______________

#### 2.4 Credential Persistence Test

1. Ensure wallet is connected
2. Press **Cmd+R** to refresh page
3. **✓ VERIFY:** Wallet automatically reconnects (no biometric prompt)
4. **✓ VERIFY:** Same wallet address displayed

**Record Results:**
- [ ] Test passed
- [ ] Test failed (describe issue): _______________

#### 2.5 Disconnect Cleanup Test

1. Click **"Disconnect"**
2. Refresh page
3. **✓ VERIFY:** Wallet stays disconnected
4. **✓ VERIFY:** No auto-reconnect occurs

**Record Results:**
- [ ] Test passed
- [ ] Test failed (describe issue): _______________

---

### Step 3: Test on iPhone with Face ID

**Device:** iPhone X or later  
**Browser:** Safari (iOS)  
**Estimated Time:** 15-20 minutes

#### 3.1 Wallet Creation Test

1. Open Safari on iPhone
2. Navigate to the application URL
3. Click **"Create Wallet"** button
4. **✓ VERIFY:** Face ID prompt appears
5. **✓ VERIFY:** Face ID animation plays
6. Look at iPhone to authenticate
7. **✓ VERIFY:** Wallet created successfully
8. **✓ VERIFY:** Redirected to dashboard
9. **✓ VERIFY:** Wallet address displayed

**Record Results:**
- [ ] Test passed
- [ ] Test failed (describe issue): _______________

#### 3.2 Sign-In Test

1. Disconnect wallet
2. Click **"Sign In"** button
3. **✓ VERIFY:** Face ID prompt appears
4. Look at iPhone to authenticate
5. **✓ VERIFY:** Signed in successfully
6. **✓ VERIFY:** Same wallet address restored

**Record Results:**
- [ ] Test passed
- [ ] Test failed (describe issue): _______________

#### 3.3 Transaction Signing Test

1. Navigate to transfer section
2. Enter recipient and amount
3. Click **"Send"** button
4. **✓ VERIFY:** Face ID prompt appears
5. Look at iPhone to authenticate
6. **✓ VERIFY:** Transaction signed and submitted

**Record Results:**
- [ ] Test passed
- [ ] Test failed (describe issue): _______________

#### 3.4 Mobile Safari Persistence Test

1. Ensure wallet is connected
2. Close Safari tab completely
3. Reopen application URL in new tab
4. **✓ VERIFY:** Wallet automatically reconnects

**Record Results:**
- [ ] Test passed
- [ ] Test failed (describe issue): _______________

---

### Step 4: Test on Android with Fingerprint

**Device:** Android phone with fingerprint sensor  
**Browser:** Chrome (Android)  
**Estimated Time:** 15-20 minutes

#### 4.1 Wallet Creation Test

1. Open Chrome on Android
2. Navigate to the application URL
3. Click **"Create Wallet"** button
4. **✓ VERIFY:** Fingerprint prompt appears
5. **✓ VERIFY:** Fingerprint sensor activates
6. Place finger on sensor
7. **✓ VERIFY:** Wallet created successfully

**Record Results:**
- [ ] Test passed
- [ ] Test failed (describe issue): _______________

#### 4.2 Sign-In Test

1. Disconnect wallet
2. Click **"Sign In"** button
3. **✓ VERIFY:** Fingerprint prompt appears
4. Place finger on sensor
5. **✓ VERIFY:** Signed in successfully

**Record Results:**
- [ ] Test passed
- [ ] Test failed (describe issue): _______________

#### 4.3 Transaction Signing Test

1. Navigate to transfer section
2. Enter recipient and amount
3. Click **"Send"** button
4. **✓ VERIFY:** Fingerprint prompt appears
5. Place finger on sensor
6. **✓ VERIFY:** Transaction signed and submitted

**Record Results:**
- [ ] Test passed
- [ ] Test failed (describe issue): _______________

---

### Step 5: Test on Windows with Windows Hello

**Device:** Windows PC with Windows Hello  
**Browser:** Edge (primary), Chrome (secondary)  
**Estimated Time:** 15-20 minutes

#### 5.1 Wallet Creation Test

1. Open Edge on Windows
2. Navigate to the application URL
3. Click **"Create Wallet"** button
4. **✓ VERIFY:** Windows Hello prompt appears
5. **✓ VERIFY:** Authenticator activates (face/fingerprint/PIN)
6. Authenticate with Windows Hello
7. **✓ VERIFY:** Wallet created successfully

**Record Results:**
- [ ] Test passed
- [ ] Test failed (describe issue): _______________

#### 5.2 Sign-In Test

1. Disconnect wallet
2. Click **"Sign In"** button
3. **✓ VERIFY:** Windows Hello prompt appears
4. Authenticate with Windows Hello
5. **✓ VERIFY:** Signed in successfully

**Record Results:**
- [ ] Test passed
- [ ] Test failed (describe issue): _______________

#### 5.3 Transaction Signing Test

1. Navigate to transfer section
2. Enter recipient and amount
3. Click **"Send"** button
4. **✓ VERIFY:** Windows Hello prompt appears
5. Authenticate with Windows Hello
6. **✓ VERIFY:** Transaction signed and submitted

**Record Results:**
- [ ] Test passed
- [ ] Test failed (describe issue): _______________

---

### Step 6: Error Handling Tests

Perform these tests on at least one device from each platform.

#### 6.1 User Cancellation Test

1. Click **"Create Wallet"**
2. When biometric prompt appears, click **"Cancel"**
3. **✓ VERIFY:** Error message: "Authentication cancelled"
4. **✓ VERIFY:** Retry option available
5. Click retry
6. **✓ VERIFY:** Biometric prompt appears again

**Record Results:**
- [ ] Test passed
- [ ] Test failed (describe issue): _______________

#### 6.2 Network Error Test

1. Disconnect from internet
2. Click **"Create Wallet"**
3. Complete biometric authentication
4. **✓ VERIFY:** Error message about network issue
5. Reconnect to internet
6. Click retry
7. **✓ VERIFY:** Wallet creation succeeds

**Record Results:**
- [ ] Test passed
- [ ] Test failed (describe issue): _______________

---

## Step 7: Document Results

### 7.1 Fill Out Test Checklists

Open `DEVICE_TEST_CHECKLIST.md` and:
- Mark tested devices in the Quick Test Matrix
- Fill out per-device test results
- Document any issues found

### 7.2 Create Test Summary

Create a summary document with:

```markdown
# Device Testing Results

**Date:** [Date]
**Tester:** [Your Name]
**Duration:** [Total Time]

## Devices Tested

- [x] Mac with Touch ID - ✅ All tests passed
- [x] iPhone with Face ID - ✅ All tests passed
- [x] Android with Fingerprint - ⚠️ Issue with persistence
- [x] Windows with Windows Hello - ✅ All tests passed

## Issues Found

### Issue 1: Android Credential Persistence
- **Severity:** Medium
- **Description:** Credentials not persisting after browser restart
- **Steps to Reproduce:** ...
- **Expected:** ...
- **Actual:** ...

## Overall Assessment

[Summary of testing results]

## Recommendations

1. [Recommendation 1]
2. [Recommendation 2]
```

### 7.3 Update Task Status

Once all testing is complete and documented, update the task status in `tasks.md`.

---

## Common Issues and Solutions

### Issue: Biometric Prompt Doesn't Appear

**Possible Causes:**
- Not using HTTPS
- WebAuthn not supported in browser
- Biometric authenticator not enrolled
- Browser permissions denied

**Solutions:**
- Verify HTTPS is enabled
- Check browser compatibility
- Enroll biometric in device settings
- Check browser permissions for the site

### Issue: "Unsupported Browser" Error

**Possible Causes:**
- Old browser version
- WebAuthn not enabled
- Browser doesn't support platform authenticators

**Solutions:**
- Update browser to latest version
- Try a different browser (Chrome, Safari, Edge)
- Check browser flags/settings

### Issue: Credentials Not Persisting

**Possible Causes:**
- `persistCredentials` not enabled in SDK config
- Browser blocking localStorage
- Private/incognito mode
- Browser data cleared

**Solutions:**
- Verify SDK configuration
- Check browser storage settings
- Test in normal (non-private) mode
- Don't clear browser data between tests

### Issue: Different Wallet Address After Reconnect

**Possible Causes:**
- Multiple credentials created
- Testing on different origin/domain
- Credential storage issue

**Solutions:**
- Clear all credentials and start fresh
- Ensure testing on same origin
- Check browser console for errors

---

## Success Criteria

The device testing is complete when:

- ✅ Wallet creation tested on all 4 device types
- ✅ Sign-in tested on all 4 device types
- ✅ Transaction signing tested on all 4 device types
- ✅ Biometric prompts verified on all devices
- ✅ Credential persistence verified
- ✅ Disconnect cleanup verified
- ✅ Error handling tested
- ✅ All results documented
- ✅ Issues reported (if any)

---

## Next Steps After Testing

1. **If All Tests Pass:**
   - Mark task as complete
   - Proceed to Task 15 (Update Documentation)
   - Consider the SDK integration successful

2. **If Issues Found:**
   - Document all issues in detail
   - Prioritize issues by severity
   - Create bug reports or GitHub issues
   - Fix critical issues before proceeding
   - Re-test after fixes

3. **Update Documentation:**
   - Add device-specific notes to README
   - Update troubleshooting guide
   - Document any workarounds needed

---

## Resources

- **Manual Test Cases:** `MANUAL_TESTS.md`
- **Device Checklist:** `DEVICE_TEST_CHECKLIST.md`
- **Integration Test Summary:** `INTEGRATION_TEST_SUMMARY.md`
- **LazorKit SDK Docs:** [SDK Documentation URL]
- **WebAuthn Spec:** https://www.w3.org/TR/webauthn/

---

## Contact

If you encounter issues during testing:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Check SDK documentation
4. Consult with the development team

---

**Happy Testing! 🧪**

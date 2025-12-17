# Quick Test Reference Card

## 🎯 Task 14: Verify Real WebAuthn on Multiple Devices

**Goal:** Verify biometric prompts appear correctly on all device types  
**Requirements:** 3.3, 4.3, 5.4  
**Estimated Time:** 60-90 minutes total

---

## ✅ Pre-Test Checklist

- [ ] Application running on HTTPS
- [ ] Environment variables configured
- [ ] All test devices available
- [ ] Biometrics enrolled on each device
- [ ] Supported browsers installed
- [ ] Test documentation ready

---

## 🔄 Three Core Tests (Per Device)

### 1️⃣ Wallet Creation
```
Click "Create Wallet" → Biometric Prompt → Authenticate → Success
```
**Verify:** Prompt appears, authentication works, wallet created

### 2️⃣ Sign-In
```
Disconnect → Click "Sign In" → Biometric Prompt → Authenticate → Success
```
**Verify:** Prompt appears, same wallet restored

### 3️⃣ Transaction Signing
```
Enter Transfer → Click "Send" → Biometric Prompt → Authenticate → Success
```
**Verify:** Prompt appears, transaction signed

---

## 📱 Device Quick Reference

| Device | Browser | Authenticator | Key Points |
|--------|---------|--------------|------------|
| **Mac** | Safari | Touch ID | System prompt, <500ms |
| **iPhone** | Safari | Face ID | Animation plays, portrait/landscape |
| **Android** | Chrome | Fingerprint | Sensor activates, fallback to PIN |
| **Windows** | Edge | Windows Hello | Face/fingerprint/PIN options |

---

## ⚡ Quick Test Flow

### For Each Device:

1. **Create Wallet**
   - Click button
   - ✓ Prompt appears
   - Authenticate
   - ✓ Wallet created

2. **Sign In**
   - Disconnect first
   - Click button
   - ✓ Prompt appears
   - Authenticate
   - ✓ Same wallet

3. **Sign Transaction**
   - Enter transfer details
   - Click send
   - ✓ Prompt appears
   - Authenticate
   - ✓ Transaction sent

4. **Test Persistence**
   - Refresh page
   - ✓ Auto-reconnects

5. **Test Disconnect**
   - Click disconnect
   - Refresh page
   - ✓ Stays disconnected

**Time per device:** ~15 minutes

---

## 🚨 What to Watch For

### ✅ Success Indicators
- Biometric prompt appears within 500ms
- Prompt shows application domain
- Prompt shows appropriate message
- Authentication completes successfully
- No console errors

### ❌ Failure Indicators
- No prompt appears
- Prompt appears but doesn't work
- Wrong prompt message
- Errors in console
- Credentials don't persist

---

## 📝 Quick Documentation

### For Each Device Test:

```markdown
Device: [Mac/iPhone/Android/Windows]
Browser: [Browser name and version]

✅ Wallet Creation: Pass/Fail
✅ Sign-In: Pass/Fail
✅ Transaction: Pass/Fail
✅ Persistence: Pass/Fail
✅ Disconnect: Pass/Fail

Issues: [None or describe]
```

---

## 🐛 Common Issues & Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| No prompt | Check HTTPS, WebAuthn support |
| Prompt doesn't work | Check biometric enrolled |
| Credentials don't persist | Check localStorage enabled |
| Wrong wallet after reload | Clear browser data, start fresh |

---

## 📊 Success Criteria

- ✅ All 4 device types tested
- ✅ All 3 core tests pass on each device
- ✅ Biometric prompts verified
- ✅ Results documented
- ✅ Issues reported (if any)

---

## 📄 Documentation Files

- **This file** - Quick reference
- **DEVICE_TESTING_GUIDE.md** - Detailed instructions
- **DEVICE_TEST_RESULTS.md** - Results template
- **MANUAL_TESTS.md** - Comprehensive test cases
- **DEVICE_TEST_CHECKLIST.md** - Detailed checklist

---

## 🎬 Test Order Recommendation

1. **Mac** (15 min) - Easiest to start with
2. **iPhone** (15 min) - Similar to Mac
3. **Android** (20 min) - May need more setup
4. **Windows** (20 min) - Different authenticator
5. **Error Tests** (10 min) - On any device
6. **Documentation** (10 min) - Fill out results

**Total:** ~90 minutes

---

## 💡 Pro Tips

1. **Test in order** - Start with Mac, it's usually most reliable
2. **Keep console open** - Catch errors immediately
3. **Take screenshots** - Especially of biometric prompts
4. **Note timing** - Record how fast prompts appear
5. **Test errors** - Don't forget cancellation and network tests
6. **Document everything** - Even small observations matter

---

## 🚀 After Testing

1. Fill out `DEVICE_TEST_RESULTS.md`
2. Update `DEVICE_TEST_CHECKLIST.md`
3. Report any issues found
4. Mark task as complete
5. Proceed to Task 15 (Documentation)

---

## 📞 Need Help?

- Check `DEVICE_TESTING_GUIDE.md` for detailed instructions
- Review `MANUAL_TESTS.md` for specific test procedures
- Check browser console for errors
- Verify environment configuration

---

**Good luck with testing! 🧪✨**

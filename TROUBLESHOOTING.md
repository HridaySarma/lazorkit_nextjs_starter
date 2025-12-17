# Troubleshooting Guide

## Common Issues and Solutions

### 500 Internal Server Errors on First Load

**Symptoms**: When you first open the app, you see multiple 500 errors in the browser console for files like `main.js`, `_app.js`, etc.

**Cause**: This is normal Next.js behavior during initial compilation. When you first access a page, Next.js compiles it on-demand, which can cause temporary 500 errors.

**Solution**: 
1. **Wait 5-10 seconds** and refresh the page
2. The errors should disappear once compilation completes
3. Subsequent page loads will be instant

**Prevention**: Run `npm run build` before starting the dev server to pre-compile everything.

---

### Port Already in Use

**Symptoms**: Dev server says "Port 3000 is in use, trying 3001..."

**Solution**: 
- The app will automatically find an available port
- Check the terminal output for the actual port (e.g., `http://localhost:3002`)
- Use that URL in your browser

**Alternative**: Kill the process using port 3000:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

---

### Module Not Found Errors

**Symptoms**: Errors like "Cannot find module '@/components/...'"

**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json .next
npm install
npm run dev
```

---

### Session Not Persisting

**Symptoms**: After closing browser, you're logged out

**Causes**:
- Browser is in incognito/private mode
- localStorage is disabled
- Browser extensions blocking storage
- SDK credential persistence not enabled

**Solution**:
1. Use a regular browser window (not incognito)
2. Check browser settings to ensure localStorage is enabled
3. Disable browser extensions that might block storage
4. Verify `persistCredentials: true` in LazorKitProvider config
5. Try a different browser

**Check SDK Configuration**:
The app should have this in `src/app/layout.tsx`:
```typescript
<LazorKitProvider
  config={{
    persistCredentials: true,  // ← Should be true
    autoConnect: true,
  }}
>
```

---

### Lazorkit SDK Connection Issues

#### "Failed to Connect to Portal" Error

**Symptoms**: Error about portal connection failure

**Causes**:
- Network connectivity issues
- Lazorkit Portal service is down
- Incorrect portal URL in environment variables

**Solutions**:
1. Check your internet connection
2. Verify portal URL in `.env.local`:
   ```env
   NEXT_PUBLIC_LAZORKIT_PORTAL_URL=https://portal.lazor.sh
   ```
3. Check Lazorkit service status
4. Try again after a few moments

#### Paymaster Service Unavailable (503 Error)

**Symptoms**: 
- Error: "Failed to get payer: Service Unavailable"
- HTTP 503 errors in console
- Cannot create wallets or send transactions

**Causes**:
- Paymaster service at `https://lazorkit-paymaster.onrender.com` is down
- Free tier hosting may have downtime or rate limits
- Service maintenance or outage

**Solutions**:
1. **Wait and retry** - Service may recover in 5-30 minutes
2. **Check service status** - Contact Lazorkit support for updates
3. **Use alternative endpoint** - If Lazorkit provides a backup URL:
   ```env
   NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL=https://paymaster-backup.lazorkit.xyz
   ```
4. **See PAYMASTER-SERVICE-DOWN.md** for detailed workarounds

**Note**: The Lazorkit SDK requires a working paymaster for wallet creation and transactions. Without it, you can only test UI components and run unit tests.

#### Paymaster Transaction Failures (Other Errors)

**Symptoms**: Gasless transactions fail with paymaster errors (not 503)

**Causes**:
- Paymaster rate-limited your requests
- Invalid paymaster URL configuration
- Transaction too large or complex

**Solutions**:
1. Verify paymaster URL in `.env.local`:
   ```env
   NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL=https://lazorkit-paymaster.onrender.com
   ```
2. Wait a few moments and retry (service may be rate-limited)
3. Check transaction size and complexity
4. Verify you have sufficient USDC balance

#### SDK Hook Errors ("useWallet must be used within LazorKitProvider")

**Symptoms**: Error about missing provider context

**Cause**: Component using `useWallet()` is not wrapped by `LazorKitProvider`

**Solution**: Ensure `LazorKitProvider` wraps your app in `src/app/layout.tsx`:
```typescript
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <LazorKitProvider {...config}>
          {children}
        </LazorKitProvider>
      </body>
    </html>
  );
}
```

---

### Balances Not Loading

**Symptoms**: SOL/USDC balances show loading spinner indefinitely

**Causes**:
- Solana Devnet RPC is down or rate-limited
- Network connectivity issues
- Invalid wallet address

**Solution**:
1. Check your internet connection
2. Wait a few minutes (Devnet can be slow)
3. Try refreshing the page
4. Check Solana status: https://status.solana.com/

**Alternative RPC**: Update `.env.local`:
```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
# Or try another RPC provider
```

---

### TypeScript Errors

**Symptoms**: Red squiggly lines in VS Code or build errors

**Solution**:
```bash
# Restart TypeScript server in VS Code
# Press: Ctrl+Shift+P (Windows) or Cmd+Shift+P (Mac)
# Type: "TypeScript: Restart TS Server"

# Or rebuild
npm run build
```

---

### Styling Issues / CSS Not Loading

**Symptoms**: Page looks unstyled or broken

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

---

### WebAuthn / Passkey Issues

#### Biometric Prompt Not Appearing

**Symptoms**: Clicking "Create Wallet" or "Sign In" doesn't show Touch ID/Face ID prompt

**Causes**:
- Browser doesn't support WebAuthn
- Device doesn't have biometric authentication enabled
- Using HTTP instead of HTTPS (in production)
- Browser permissions denied

**Solutions**:
1. **Check Browser Support**: Use Chrome 67+, Safari 13+, Edge 18+, or Firefox 60+
2. **Enable Biometrics**: 
   - Mac: System Preferences → Touch ID
   - iPhone: Settings → Face ID & Passcode
   - Android: Settings → Security → Fingerprint
   - Windows: Settings → Accounts → Sign-in options → Windows Hello
3. **Use HTTPS**: In production, WebAuthn requires HTTPS (localhost is allowed for development)
4. **Check Permissions**: Ensure browser has permission to access biometric hardware
5. **Try Different Browser**: Some browsers have better WebAuthn support than others

**Test WebAuthn Support**:
Open browser console (F12) and run:
```javascript
if (window.PublicKeyCredential) {
  PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    .then(available => console.log("Biometrics available:", available));
} else {
  console.log("WebAuthn not supported");
}
```

#### "User Cancelled" Error

**Symptoms**: Error message saying authentication was cancelled

**Cause**: User dismissed the biometric prompt or authentication timed out

**Solution**: 
- Click "Try Again" to retry
- Ensure you complete the biometric authentication within the timeout period (usually 60 seconds)
- If using Touch ID, make sure your finger is clean and dry

#### "Credential Not Found" Error

**Symptoms**: Sign-in fails with credential not found

**Causes**:
- Trying to sign in on a different device than where wallet was created
- Passkey was deleted from device
- Browser data was cleared

**Solutions**:
1. **Create New Wallet**: Passkeys are device-specific. Create a new wallet on this device.
2. **Use Same Device**: Return to the device where you originally created the wallet
3. **Check Keychain** (Mac/iOS): Open Keychain Access and search for "lazor" to verify credential exists

#### Passkey Works on One Browser But Not Another

**Symptoms**: Wallet works in Chrome but not Safari (or vice versa)

**Cause**: Passkeys are stored per-browser on most platforms (except iOS/Mac with iCloud Keychain sync)

**Solution**: 
- Create a separate wallet in each browser, or
- Use iCloud Keychain on Apple devices to sync passkeys across Safari/Chrome

#### "Browser Not Supported" Error

**Symptoms**: Error message about unsupported browser

**Supported Browsers**:
- ✅ Chrome 67+ (Windows, Mac, Android, Linux)
- ✅ Safari 13+ (Mac, iOS)
- ✅ Edge 18+ (Windows, Mac)
- ✅ Firefox 60+ (Windows, Mac, Linux)
- ✅ Brave 1.9+ (Windows, Mac, Android)

**Solution**: Update your browser or switch to a supported browser

---

### Build Warnings About Deprecated Packages

**Symptoms**: Warnings about `eslint@8`, `next@14.2.18`, etc.

**Cause**: Some dependencies have newer versions available

**Solution**: These are warnings, not errors. The app works fine. To update:
```bash
# Update Next.js
npm install next@latest

# Update ESLint
npm install eslint@latest eslint-config-next@latest
```

---

### Windows-Specific: Cannot Remove node_modules

**Symptoms**: "Access denied" when trying to delete node_modules

**Cause**: Windows file locks on native modules

**Solution**:
1. Close all terminals and VS Code
2. Wait 10 seconds
3. Try again
4. If still locked, restart your computer

**Alternative**:
```bash
# Use rimraf (install globally)
npm install -g rimraf
rimraf node_modules
```

---

## Still Having Issues?

### Check These First:

1. **Node.js Version**: Ensure you have Node.js 18.17 or later
   ```bash
   node --version
   ```

2. **Clean Install**:
   ```bash
   rm -rf node_modules package-lock.json .next
   npm install
   npm run build
   npm run dev
   ```

3. **Check Console**: Open browser DevTools (F12) and check:
   - Console tab for JavaScript errors
   - Network tab for failed requests
   - Application tab to verify localStorage

4. **Verify Files**: Ensure all files are present:
   ```bash
   # Should show no errors
   npm run build
   ```

### Debug Mode

Run with verbose logging:
```bash
# Windows
set DEBUG=* && npm run dev

# Mac/Linux
DEBUG=* npm run dev
```

### Get Help

If you're still stuck:
1. Check the [README.md](./README.md) for setup instructions
2. Review [IMPLEMENTATION-NOTE.md](./IMPLEMENTATION-NOTE.md) for architecture details
3. Look at [QUICK-START.md](./QUICK-START.md) for testing guide

### Report an Issue

When reporting issues, include:
- Node.js version (`node --version`)
- npm version (`npm --version`)
- Operating system
- Full error message from console
- Steps to reproduce

---

## Performance Tips

### Faster Development

1. **Use Turbopack** (experimental):
   ```bash
   npm run dev -- --turbo
   ```

2. **Disable source maps** in `next.config.js`:
   ```js
   module.exports = {
     productionBrowserSourceMaps: false,
   }
   ```

3. **Pre-compile pages**:
   ```bash
   npm run build
   npm run start
   ```

### Faster Builds

1. **Clear cache regularly**:
   ```bash
   rm -rf .next
   ```

2. **Update dependencies**:
   ```bash
   npm update
   ```

---

**Last Updated**: December 2024

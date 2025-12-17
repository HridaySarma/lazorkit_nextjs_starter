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

**Solution**:
1. Use a regular browser window (not incognito)
2. Check browser settings to ensure localStorage is enabled
3. Disable browser extensions that might block storage
4. Try a different browser

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

### "Cannot read property 'toBase58' of undefined"

**Symptoms**: Error when trying to use wallet functions

**Cause**: This is expected in demo mode - the wallet functions are simulated

**Solution**: This is normal! The demo uses mock implementations. See [IMPLEMENTATION-NOTE.md](./IMPLEMENTATION-NOTE.md) for details on integrating the real Lazorkit SDK.

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

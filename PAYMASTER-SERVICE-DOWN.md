# Paymaster Service Unavailable - Workaround Guide

## Current Issue

The Lazorkit paymaster service at `https://lazorkit-paymaster.onrender.com` is currently returning **503 Service Unavailable** errors. This prevents wallet creation and gasless transactions from working.

## Error Messages You'll See

```
POST http://localhost:3001/api/paymaster 503 (Service Unavailable)
[Paymaster] Failed to get payer
Failed to connect wallet: Error: Failed to get payer: Service Unavailable
```

## Why This Happens

The paymaster is a third-party service that:
- Sponsors gas fees for wallet creation
- Enables gasless USDC transfers
- Is hosted on Render.com (free tier may have downtime)

When it's down, the Lazorkit SDK cannot create wallets or send transactions.

## Solutions

### Option 1: Wait for Service Recovery (Recommended)

The service is likely experiencing temporary downtime. Try again in:
- 5-10 minutes for brief outages
- 1-2 hours for longer maintenance

Check service status:
- Monitor the console for different error messages
- If you get CORS errors instead of 503, the service is back up

### Option 2: Contact Lazorkit Support

If the service is down for extended periods:

1. **Check Lazorkit Documentation**: Visit https://docs.lazorkit.xyz for service status
2. **Contact Support**: Reach out to Lazorkit team for:
   - Alternative paymaster URLs
   - Service status updates
   - Production-grade paymaster endpoints

### Option 3: Use Alternative Paymaster (If Available)

If Lazorkit provides an alternative endpoint, update your `.env.local`:

```env
# Try alternative paymaster if provided by Lazorkit
NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL=https://paymaster-backup.lazorkit.xyz
```

### Option 4: Test on Physical Device (Not VM)

The current setup has two issues:
1. **Paymaster is down** (503 error)
2. **You're in a remote VM** (passkeys don't work well in VMs)

For full testing, you need:
- A **local physical device** (not remote desktop/VM)
- A **working paymaster service**

## What Works vs What Doesn't

### ✅ Currently Working
- Next.js app runs
- UI components render
- Form validation
- Error handling
- Unit tests

### ❌ Currently Blocked
- Creating new wallets (requires paymaster)
- Signing in with passkeys (requires paymaster + physical device)
- Sending transactions (requires paymaster)
- End-to-end testing (requires paymaster)

## Development Without Paymaster

Unfortunately, the Lazorkit SDK **requires** a paymaster for core functionality. You cannot:
- Create wallets without it
- Sign transactions without it
- Test the full flow without it

However, you can still:
- Review and modify UI components
- Update styling and layouts
- Write unit tests for components
- Prepare documentation

## Next Steps

1. **Wait for service recovery** - Check back in 30 minutes
2. **Test on local device** - Move from VM to physical machine
3. **Contact Lazorkit** - Get production paymaster endpoint
4. **Review code** - Use this time to review implementation

## Monitoring Service Status

Watch the browser console. When the service recovers, you'll see:
- Different error messages (not 503)
- Or successful wallet creation

## Alternative: Mock Mode for UI Testing

If you only need to test UI/UX without real blockchain interaction, you could:
1. Mock the SDK responses in tests
2. Use the existing unit tests
3. Review component behavior in isolation

But for real passkey + blockchain testing, you need:
- Working paymaster service
- Physical device (not VM)
- Supported browser (Chrome/Safari/Edge)

## Questions?

If you need help:
1. Check if paymaster is back up (try creating wallet again)
2. Verify you're on a physical device (not remote desktop)
3. Contact Lazorkit support for service status
4. Review TROUBLESHOOTING.md for other common issues

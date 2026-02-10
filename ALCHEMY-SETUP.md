# Alchemy RPC Setup

The public Base RPC (`mainnet.base.org`) is rate-limited and returning 403 errors.

## Fix: Use Alchemy (Free Tier)

1. **Get Alchemy API Key**
   - Go to https://www.alchemy.com/
   - Sign up / Log in
   - Create new app: Base Mainnet
   - Copy the HTTPS URL (looks like `https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY`)

2. **Set in Vercel**
   ```bash
   vercel env add NEXT_PUBLIC_BASE_RPC_URL production
   # Paste your Alchemy URL when prompted
   ```

3. **Redeploy**
   ```bash
   git commit --allow-empty -m "Trigger rebuild with Alchemy RPC"
   git push
   ```

## Current Issue

Without Alchemy:
- ❌ Browser gets 403 from public RPC
- ❌ `useSeed` hook fails
- ❌ Falls back to wrong background color (`#d5d7e1` instead of `#d5e1e1`)
- ❌ Stats tiles show 0

With Alchemy:
- ✅ Reliable RPC access
- ✅ Seed loads correctly
- ✅ Background color matches Anon
- ✅ All client hooks work

## Temporary Workaround

The SSR seed should work even without Alchemy, but the client-side hooks will fail. Current code prioritizes SSR data when client fetch fails.

---

**Created:** 2026-02-09

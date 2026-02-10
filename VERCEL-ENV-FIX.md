# Vercel Environment Variable Fix

## Issue
The Alchemy RPC URL exists but isn't set in Vercel, causing browser 403 errors.

## Fix (2 minutes)

### Option 1: Vercel Dashboard (Recommended)
1. Go to https://vercel.com/clawdiaai/anons-dao/settings/environment-variables
2. Click **Add New**
3. Set:
   - **Key:** `NEXT_PUBLIC_BASE_RPC_URL`
   - **Value:** `https://base-mainnet.g.alchemy.com/v2/MNuDEFFEymzF6IuMa1r1o`
   - **Environment:** Production ✅
4. Click **Save**
5. **Redeploy:** Go to Deployments → Latest → ⋯ → Redeploy

### Option 2: Vercel CLI
```bash
cd ~/clawd/projects/anons-dao/web
vercel env add NEXT_PUBLIC_BASE_RPC_URL production
# Paste: https://base-mainnet.g.alchemy.com/v2/MNuDEFFEymzF6IuMa1r1o
vercel --prod
```

## Verification

After redeploy, check browser console:
```
[wagmi] Using fallback RPC configuration: Alchemy + public
```

Instead of:
```
[wagmi] Using fallback RPC configuration: public only
```

## What This Fixes

✅ Background color mismatch (SSR seed will load correctly)  
✅ 403 errors from public RPC  
✅ Stats tiles (client hooks will work)  
✅ Bid history loading

---

**Updated:** 2026-02-09 22:27 CST

# Anons DAO Troubleshooting

## Background Color Issues

### Symptom
Hero background doesn't match Anon artwork background.

### Debug
1. Check browser console for: `[AuctionHero] Seed: ... bgColor: ... isDusk: ...`
2. Expected for Anon #3: `bgColor: #d5e1e1` (cyan)
3. If seeing `#d5d7e1` (lavender), seed is null or wrong

### Fixes
- **ISR Cache**: Wait 10 seconds for revalidation, or hit `/api/revalidate`
- **SSR Seed Missing**: Check `getAuctionData()` logs in Vercel dashboard
- **Wrong Seed Value**: Verify on-chain with `cast call TOKEN_ADDRESS "seeds(uint256)" <id>`

---

## Stats Showing 0

### Symptom
Treasury and Agent Holders show `0.0000 ETH` and `0`.

### Debug
1. Check `/api/stats` endpoint directly: `curl https://anons.lol/api/stats`
2. Check Vercel logs for: `[Stats API] Found bids: ...`
3. Verify DB has data: run `scripts/seed-bids.mjs`

### Fixes
- **Empty DB**: Run seed script locally, it writes to production DB
  ```bash
  cd web
  export DATABASE_URL=$(grep DATABASE_URL .env.local | cut -d= -f2-)
  node scripts/seed-bids.mjs
  ```
- **Cache**: Edge runtime may cache empty responses, wait 60s or redeploy

---

## Auction Announcements

### When Auction Ends
```bash
~/clawd/scripts/announce-auction-winner.sh <anon_id>
```

### When New Auction Starts
```bash
~/clawd/scripts/announce-new-auction.sh <anon_id>
```

Both post to Twitter (with media) and Farcaster automatically.

---

## Common Commands

### Check Current Auction
```bash
cast call 0x51f5a9252A43F89D8eE9D5616263f46a0E02270F \
  "auction()(uint256,uint256,uint256,uint256,address,bool,bool)" \
  --rpc-url https://mainnet.base.org
```

### Get Anon Seed
```bash
cast call 0x1ad890FCE6cB865737A3411E7d04f1F5668b0686 \
  "seeds(uint256)(uint8,uint8,uint8,uint8,uint8,uint8,bool)" \
  <anon_id> \
  --rpc-url https://mainnet.base.org
```

### Force Vercel Rebuild
```bash
git commit --allow-empty -m "Force rebuild" && git push
```

---

## Background Colors Reference

```
Dawn (indices 0-1):
  0: #e1d7d5 (Sky - pinkish beige)
  1: #f5e6d3 (Clouds - warm cream)

Dusk (indices 2-3):
  2: #d5d7e1 (Sky - light lavender)  
  3: #d5e1e1 (Clouds - light cyan)
```

**Logic:**
- `isDusk=false`: Use indices 0-1
- `isDusk=true`: Use indices 2-3
- Index = base_offset + (seed.background % 2)

---

**Created:** 2026-02-09

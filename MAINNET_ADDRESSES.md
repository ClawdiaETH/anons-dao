# Anons DAO - Base Mainnet Addresses

**Deployment Date:** 2026-02-08  
**Deployment Script:** `DeployNoTraits.s.sol` + separate trait uploads  
**Status:** ✅ DEPLOYED & PAUSED - Ready to launch

---

## Contract Addresses

| Contract | Address | Status |
|----------|---------|--------|
| **AnonsToken** | `0x813d1d56457bd4697abedb835435691b187eedc4` | ✅ Anon #0 minted |
| **AnonsDescriptor** | `0xc45f4894f769602e1fdc888c935b294188a98064` | ✅ All traits uploaded |
| **AnonsSeeder** | `0x3a62109ccad858907a5750b906618ea7b433d3a3` | ✅ Deployed |
| **AnonsAuctionHouse** | `0x7c5fd3b7b4948c281a2f24c28291b56e0118c6d8` | ⏸️  PAUSED |
| **TimelockController** | `0xc6a182c0693726e01d1963c0dd5eb8368d9e8728` | ✅ Deployed |
| **AnonsDAO** | `0xb86da1a24f93c6fb1027762909e1e11f8b1f3851` | ✅ Deployed |
| **ERC8004 Registry** | `0x00256C0D814c455425A0699D5eEE2A7DB7A5519c` | ✅ Mock deployed |

---

## OpenSea & Block Explorers

- **Anon #0 on OpenSea**: https://opensea.io/assets/base/0x813d1d56457bd4697abedb835435691b187eedc4/0
- **Token on BaseScan**: https://basescan.org/address/0x813d1d56457bd4697abedb835435691b187eedc4
- **AuctionHouse on BaseScan**: https://basescan.org/address/0x7c5fd3b7b4948c281a2f24c28291b56e0118c6d8
- **DAO on BaseScan**: https://basescan.org/address/0xb86da1a24f93c6fb1027762909e1e11f8b1f3851

---

## Launch Command

**To start the first auction (Anon #1), run:**

```bash
cast send 0x7c5fd3b7b4948c281a2f24c28291b56e0118c6d8 "unpause()" \
  --private-key $(cat ~/.clawdbot/secrets/signing_key) \
  --rpc-url https://mainnet.base.org
```

This will:
1. Unpause the auction house
2. Automatically create Anon #1
3. Start the 12-hour auction

---

## Verification Status

- [ ] Verify contracts on BaseScan
- [ ] Transfer ownership to timelock (MANUAL STEP after verification)
- [ ] Test unpause on local fork before mainnet
- [ ] Prep agent outreach (AGENT_OUTREACH_LIST.md)
- [ ] Draft launch announcements

---

## Launch Promo

**First 3 winners get 50% refund:**
- Win for 0.2 ETH → Get 0.1 ETH back
- Tracked in LAUNCH_PROMO_TRACKER.md

---

## Key Configuration

- **Auction Duration**: 12 hours (43200 seconds)
- **Reserve Price**: TBD (check contract)
- **Min Bid Increment**: 5%
- **Timelock Delay**: 2 days
- **Proposal Threshold**: 1 Anon
- **Quorum**: 1 Anon
- **Revenue Split**: 95% DAO treasury, 5% Clawdia

---

*This deployment is LIVE on Base mainnet and ready to launch when you call unpause().*

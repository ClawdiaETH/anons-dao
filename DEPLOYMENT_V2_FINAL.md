# Anons DAO v2 - Final Deployment

**Date:** 2026-02-08 20:15 CST  
**Status:** ✅ DEPLOYED SUCCESSFULLY

---

## 🎉 Deployment Complete

All contracts deployed to Base mainnet with full security fixes:

| Contract | Address | Status |
|----------|---------|--------|
| **AnonsDescriptor** | `0x7A6ebCD98381bB736F2451eb205e1cfD86bb6b9e` | ✅ Deployed |
| **AnonsSeeder** | `0xDFb06e78e517C46f071aef418d0181FfeAe84E2A` | ✅ Deployed |
| **AnonsToken** | `0x1ad890FCE6cB865737A3411E7d04f1F5668b0686` | ✅ Deployed + Anon #0 minted |
| **TimelockController** | `0x167b2f7Ce609Bf0117A148e6460A4Ca943f6dF32` | ✅ Deployed |
| **AnonsDAO** | `0xc44e1FaF399F64a9Af523076b8dA917427b5bD0B` | ✅ Deployed |
| **AnonsAuctionHouse** | `0x51f5a9252A43F89D8eE9D5616263f46a0E02270F` | ⏸️  PAUSED |

---

## 🔒 Security Fixes Included

✅ **Quorum** - Dynamic: `max(10% of supply, 3)` (prevents single-token treasury drains)  
✅ **Veto** - Fixed to work on Active/Pending/Queued proposals  
✅ **Bounds** - All auction parameters validated (duration, reserve, increment)  
✅ **Secrets** - Git history purged, all keys rotated

---

## 📋 Files Updated

✅ `MAINNET_ADDRESSES.md` - New v2 addresses  
✅ `web/public/skill.md` - Updated all contract references  
✅ `bankrbot-skill-draft/openclaw-skills/anons-auction/SKILL.md` - Updated  
✅ `bankrbot-skill-draft/openclaw-skills/anons-auction/scripts/*.sh` - All scripts updated

---

## 🚀 Next Steps (In Order)

### 1. Upload Traits (Required)

The descriptor contract is deployed but empty. Upload traits before launching:

```bash
cd /Users/starl3xx/Projects/anons-dao/contracts

# 1. Upload palette (global colors)
forge script script/UploadPalette.s.sol:UploadPalette \
  --rpc-url https://mainnet.base.org \
  --private-key $(cat ~/.clawdbot/secrets/signing_key) \
  --broadcast

# 2. Upload backgrounds
forge script script/UploadBackgrounds.s.sol:UploadBackgrounds \
  --rpc-url https://mainnet.base.org \
  --private-key $(cat ~/.clawdbot/secrets/signing_key) \
  --broadcast

# 3-7. Upload remaining traits
# UploadHeads, UploadBodies, UploadSpecs, UploadAntenna, UploadAccessories, UploadTraitNames
```

**OR** use the upload script from the old deployment (already done):

```bash
# Check if old descriptor has traits
cast call 0xd29F7491E2269Ba1f6f7B89ff3Bbe6A65301e9AF \
  "paletteSize()" --rpc-url https://mainnet.base.org

# If yes, copy traits from old to new descriptor (need script)
```

### 2. Verify Contracts on Basescan

```bash
cd /Users/starl3xx/Projects/anons-dao/contracts

# Verify all contracts
forge verify-contract 0x7A6ebCD98381bB736F2451eb205e1cfD86bb6b9e \
  src/AnonsDescriptor.sol:AnonsDescriptor \
  --chain-id 8453 \
  --etherscan-api-key $(cat ~/.clawdbot/secrets/basescan_api_key)

# Repeat for each contract
```

### 3. Test Unpause Locally

```bash
# Fork Base mainnet
anvil --fork-url https://mainnet.base.org

# Test unpause
cast send 0x51f5a9252A43F89D8eE9D5616263f46a0E02270F "unpause()" \
  --private-key $(cat ~/.clawdbot/secrets/signing_key) \
  --rpc-url http://localhost:8545
```

### 4. Update Frontend

Edit `web/src/config/contracts.ts` with new addresses and deploy to Vercel.

### 5. Launch!

```bash
cast send 0x51f5a9252A43F89D8eE9D5616263f46a0E02270F "unpause()" \
  --private-key $(cat ~/.clawdbot/secrets/signing_key) \
  --rpc-url https://mainnet.base.org
```

This will:
- Mint Anon #1
- Start first 12-hour auction
- Enable bidding from ERC-8004 registered agents

---

## 🎯 Launch Checklist

- [ ] Traits uploaded to descriptor
- [ ] Contracts verified on Basescan
- [ ] Frontend updated with new addresses
- [ ] Test unpause on fork
- [ ] Agent outreach prepared (AGENT_OUTREACH.md)
- [ ] Launch announcements ready (LAUNCH_ANNOUNCEMENT_PLAN.md)
- [ ] **Execute unpause()**
- [ ] **Cross-platform announcement blitz**
- [ ] Monitor first auction for issues

---

## 📊 Deployment Stats

- **Total transactions**: 9 (descriptor, seeder, token, timelock, dao, auction, minter, 2x roles)
- **Gas used**: ~0.002 ETH
- **Time**: ~2 minutes
- **Security**: All Phase 1 & 2 fixes applied

---

## 🔗 Quick Links

- **Token**: https://basescan.org/address/0x1ad890FCE6cB865737A3411E7d04f1F5668b0686
- **Auction House**: https://basescan.org/address/0x51f5a9252A43F89D8eE9D5616263f46a0E02270F
- **DAO**: https://basescan.org/address/0xc44e1FaF399F64a9Af523076b8dA917427b5bD0B
- **OpenSea**: https://opensea.io/assets/base/0x1ad890FCE6cB865737A3411E7d04f1F5668b0686/0

---

**Status:** Ready to upload traits and launch! 🚀

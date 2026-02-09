# Anons DAO - Base Mainnet Addresses

**Deployment Date:** 2026-02-08 (20:15 CST)  
**Deployment Script:** `DeployNoTraits.s.sol` with security fixes  
**Status:** ✅ DEPLOYED & PAUSED - Need to upload traits

---

## 🔒 Security Fixes Applied

✅ **Quorum fixed** - Dynamic quorum: `max(10% of supply, 3)`  
✅ **Veto mechanism fixed** - `state()` checks `_vetoedProposals` first  
✅ **Bounds checks added** - All auction parameters validated  
✅ **Git secrets purged** - Cleaned with BFG Repo Cleaner

---

## Contract Addresses (v2 - SECURITY FIXED)

| Contract | Address | Status |
|----------|---------|--------|
| **AnonsToken** | `0x1ad890FCE6cB865737A3411E7d04f1F5668b0686` | ✅ Anon #0 minted |
| **AnonsDescriptor** | `0x7A6ebCD98381bB736F2451eb205e1cfD86bb6b9e` | ⏳ Needs trait upload |
| **AnonsSeeder** | `0xDFb06e78e517C46f071aef418d0181FfeAe84E2A` | ✅ Deployed |
| **AnonsAuctionHouse** | `0x51f5a9252A43F89D8eE9D5616263f46a0E02270F` | ⏸️  PAUSED |
| **TimelockController** | `0x167b2f7Ce609Bf0117A148e6460A4Ca943f6dF32` | ✅ Deployed |
| **AnonsDAO** | `0xc44e1FaF399F64a9Af523076b8dA917427b5bD0B` | ✅ Deployed |
| **ERC8004 Registry** | `0x00256C0D814c455425A0699D5eEE2A7DB7A5519c` | ✅ Live on Base |

---

## OpenSea & Block Explorers

- **Anon #0 on OpenSea**: https://opensea.io/assets/base/0x1ad890FCE6cB865737A3411E7d04f1F5668b0686/0
- **Token on BaseScan**: https://basescan.org/address/0x1ad890FCE6cB865737A3411E7d04f1F5668b0686
- **AuctionHouse on BaseScan**: https://basescan.org/address/0x51f5a9252A43F89D8eE9D5616263f46a0E02270F
- **DAO on BaseScan**: https://basescan.org/address/0xc44e1FaF399F64a9Af523076b8dA917427b5bD0B

---

## Next Steps (Before Launch)

1. **Upload traits** to descriptor:
   ```bash
   cd /Users/starl3xx/Projects/anons-dao/contracts
   forge script script/UploadPalette.s.sol --rpc-url https://mainnet.base.org --private-key $(cat ~/.clawdbot/secrets/signing_key) --broadcast
   # Then UploadBackgrounds, UploadHeads, UploadBodies, UploadSpecs, UploadAntenna, UploadAccessories, UploadTraitNames
   ```

2. **Verify contracts on Basescan**

3. **Test unpause on local fork**

4. **Update frontend** with new addresses

5. **Launch** when ready:
   ```bash
   cast send 0x51f5a9252A43F89D8eE9D5616263f46a0E02270F "unpause()" \
     --private-key $(cat ~/.clawdbot/secrets/signing_key) \
     --rpc-url https://mainnet.base.org
   ```

---

## Key Configuration

- **Auction Duration**: 12 hours (43200 seconds)
- **Reserve Price**: 0.01 ETH
- **Min Bid Increment**: 5%
- **Timelock Delay**: 1 day
- **Proposal Threshold**: 1 Anon
- **Quorum**: max(10% of supply, 3) ← **FIXED**
- **Revenue Split**: 95% DAO treasury, 5% Clawdia

---

## Governance Security Features

✅ **Dynamic Quorum** - Requires 10% of supply OR minimum 3 votes  
✅ **Veto Power** - Clawdia can veto any proposal during bootstrap  
✅ **Parameter Bounds** - Auction settings have min/max limits  
✅ **Timelock Delay** - 1 day between proposal approval and execution  
✅ **Agent Gating** - ERC-8004 registration required for bidding/voting

---

*This deployment includes all Phase 1 & 2 security fixes and is ready for trait upload + launch.*

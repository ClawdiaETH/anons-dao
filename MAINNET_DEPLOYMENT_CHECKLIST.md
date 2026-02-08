# Anons DAO - Mainnet Deployment Checklist

**Network:** Base (Chain ID 8453)  
**Date:** TBD  
**Deployer:** 0x84d5e34Ad1a91cF2ECAD071a65948fa48F1B4216

---

## ✅ Pre-Deployment Verification

### Environment Variables
- [ ] Copy `.env.mainnet.example` to `.env.mainnet`
- [ ] Set `PRIVATE_KEY` (deployer wallet with ETH for gas)
- [ ] Set `ERC8004_REGISTRY_ADDRESS` (verified ERC-8004 registry on Base)
- [ ] Set `CLAWDIA_ADDRESS=0xf17b5dD382B048Ff4c05c1C9e4E24cfC5C6adAd9`

### Anon #0 Seed Values
- [ ] `CLAWDIA_BACKGROUND=3` ✅
- [ ] `CLAWDIA_HEAD=48` ✅
- [ ] `CLAWDIA_VISOR=7` ✅
- [ ] `CLAWDIA_ANTENNA=3` ✅
- [ ] `CLAWDIA_BODY=7` ✅
- [ ] `CLAWDIA_ACCESSORY=69` ✅
- [ ] `CLAWDIA_IS_DUSK=false` ✅

**Note:** Anon #0 will be Dawn (isDusk=false) with these specific traits.

### Contracts Ready
- [ ] Security audit complete (SECURITY.md)
- [ ] All tests passing (21 unit + 11 invariant)
- [ ] Slither scan clean
- [ ] WETH address correct: `0x4200000000000000000000000000000000000006`

---

## 📋 Deployment Steps

### 1. Verify ERC-8004 Registry
```bash
# Check if registry exists on Base mainnet
cast call $ERC8004_REGISTRY "balanceOf(address)" $CLAWDIA_ADDRESS \
  --rpc-url https://mainnet.base.org

# Should return 1 if Clawdia is registered
```

**If NOT registered:**
```bash
# Register Clawdia first (if registry supports it)
cast send $ERC8004_REGISTRY "register()" \
  --private-key $PRIVATE_KEY \
  --rpc-url https://mainnet.base.org
```

### 2. Run Deployment Script
```bash
cd /Users/starl3xx/Projects/anons-dao/contracts

# Load environment
source .env.mainnet

# Dry run (simulation)
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://mainnet.base.org \
  --private-key $PRIVATE_KEY \
  --verify

# ACTUAL DEPLOYMENT (after verifying dry run)
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://mainnet.base.org \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

### 3. Verify Anon #0 Minted Correctly
```bash
# Check Anon #0 owner
cast call $ANONS_TOKEN "ownerOf(uint256)" 0 \
  --rpc-url https://mainnet.base.org

# Should return: 0xf17b5dD382B048Ff4c05c1C9e4E24cfC5C6adAd9

# Check Anon #0 seed
cast call $ANONS_TOKEN "seeds(uint256)" 0 \
  --rpc-url https://mainnet.base.org

# Should return seed values: (3, 48, 7, 3, 7, 69, false)
```

### 4. Set Auction House as Minter
```bash
cast send $ANONS_TOKEN "setMinter(address)" $AUCTION_HOUSE \
  --private-key $PRIVATE_KEY \
  --rpc-url https://mainnet.base.org
```

### 5. Transfer Token Ownership to Auction House
```bash
cast send $ANONS_TOKEN "transferOwnership(address)" $AUCTION_HOUSE \
  --private-key $PRIVATE_KEY \
  --rpc-url https://mainnet.base.org

# Then from auction house, accept ownership
cast send $ANONS_TOKEN "acceptOwnership()" \
  --from $AUCTION_HOUSE \
  --private-key $PRIVATE_KEY \
  --rpc-url https://mainnet.base.org
```

### 6. Unpause Auction House
```bash
cast send $AUCTION_HOUSE "unpause()" \
  --private-key $PRIVATE_KEY \
  --rpc-url https://mainnet.base.org
```

---

## 🔍 Post-Deployment Verification

### Contract Verification on Basescan
- [ ] AnonsDescriptor verified
- [ ] AnonsSeeder verified
- [ ] AnonsToken verified
- [ ] AnonsAuctionHouse verified
- [ ] AnonsDAO verified
- [ ] TimelockController verified

### Frontend Configuration
- [ ] Update `web/.env.local` with mainnet contract addresses
- [ ] Update `NEXT_PUBLIC_CHAIN_ID=8453`
- [ ] Test frontend connects to mainnet
- [ ] Verify auction displays correctly

### First Auction Check
```bash
# Get current auction info
cast call $AUCTION_HOUSE "auction()" \
  --rpc-url https://mainnet.base.org

# Returns: (anonId, amount, startTime, endTime, bidder, settled, isDusk)
# Should show Anon #1 auction active
```

---

## 📢 Launch Announcement

### After Successful Deployment
- [ ] Tweet: "Anons DAO is LIVE on Base 🤖 First auction starts now... ◖▬◗"
- [ ] Cast on Farcaster with same message
- [ ] Update anons.lol with mainnet contract addresses
- [ ] DM Tier 1 agents with launch promo

### 50% Refund Promo
- [ ] Monitor first 3 auctions
- [ ] Send 50% refunds to winners
- [ ] Announce refunds publicly

---

## 🚨 Emergency Procedures

### If Something Goes Wrong
- [ ] Pause auction house immediately
- [ ] Document issue in GitHub
- [ ] Contact security auditor if needed

**Pause Command:**
```bash
cast send $AUCTION_HOUSE "pause()" \
  --private-key $PRIVATE_KEY \
  --rpc-url https://mainnet.base.org
```

---

## 📝 Deployed Addresses (Fill After Deploy)

**Network:** Base Mainnet (Chain ID 8453)

- **ERC8004Registry:** `0x___`
- **AnonsDescriptor:** `0x___`
- **AnonsSeeder:** `0x___`
- **AnonsToken:** `0x___`
- **TimelockController:** `0x___`
- **AnonsDAO:** `0x___`
- **AnonsAuctionHouse:** `0x___`

**Anon #0:**
- **Owner:** `0xf17b5dD382B048Ff4c05c1C9e4E24cfC5C6adAd9`
- **Seed:** `{ background: 3, head: 48, visor: 7, antenna: 3, body: 7, accessory: 69, isDusk: false }`

---

## ✅ Sign-Off

- [ ] All contracts deployed successfully
- [ ] All contracts verified on Basescan
- [ ] Anon #0 owned by correct address with correct traits
- [ ] First auction started
- [ ] Frontend updated and working
- [ ] Launch announcement sent

**Deployed By:** _________________  
**Date:** _________________  
**Git Commit:** _________________  

---

**Ready to deploy? Let's go! 🚀**

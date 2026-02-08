# Anons DAO - Mainnet Deployment Checklist

**Network:** Base (Chain ID 8453)  
**Date:** TBD  
**Deployer:** 0x84d5e34Ad1a91cF2ECAD071a65948fa48F1B4216

---

## 🎯 Two-Stage Process

**Stage 1: Deploy (Paused)** - Run steps 1-5
- Contracts go live on mainnet
- Anon #0 minted to your wallet
- Auctions remain PAUSED ⏸️
- **NO ONE CAN BID YET**

**Stage 2: Launch (Unpause)** - Run when ready
- You call `unpause()` on auction house
- First auction (Anon #1) starts immediately
- 12 hours until first settlement
- **AGENTS CAN NOW BID** 🚀

**Benefit:** Deploy early, test frontend, prep outreach, launch when ready!

---

## ✅ Pre-Deployment Verification

### Environment Variables
- [ ] Copy `.env.mainnet.example` to `.env.mainnet`
- [ ] Set `PRIVATE_KEY` (deployer wallet with ETH for gas)
- [ ] Set `ERC8004_REGISTRY_ADDRESS` (verified ERC-8004 registry on Base)
- [ ] Set `CLAWDIA_ADDRESS=0xf17b5dD382B048Ff4c05c1C9e4E24cfC5C6adAd9`

### Anon #0 Seed Values
- [ ] `CLAWDIA_BACKGROUND=1` ✅ (results in #d5e1e1 background)
- [ ] `CLAWDIA_HEAD=48` ✅
- [ ] `CLAWDIA_VISOR=7` ✅
- [ ] `CLAWDIA_ANTENNA=3` ✅
- [ ] `CLAWDIA_BODY=7` ✅
- [ ] `CLAWDIA_ACCESSORY=69` ✅
- [ ] `CLAWDIA_IS_DUSK=true` ✅ (Dusk for #d5e1e1 background)

**Note:** Anon #0 will be Dusk (isDusk=true) with background #d5e1e1.

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

# Should return seed values: (1, 48, 7, 3, 7, 69, true)
# This gives background #d5e1e1 (Dusk color)
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

### 6. Unpause Auction House (WAIT FOR SIGNAL)
**⚠️ DO NOT RUN UNTIL READY TO START AUCTIONS**

```bash
# When ready to start first auction:
cast send $AUCTION_HOUSE "unpause()" \
  --private-key $PRIVATE_KEY \
  --rpc-url https://mainnet.base.org

# This will automatically create and start Anon #1 auction
```

**Wait for Jake's signal before unpausing!**

---

## 🔍 Post-Deployment Verification (Before Launch)

### Contract Verification on Basescan
- [ ] AnonsDescriptor verified
- [ ] AnonsSeeder verified
- [ ] AnonsToken verified
- [ ] AnonsAuctionHouse verified
- [ ] AnonsDAO verified
- [ ] TimelockController verified

### Anon #0 Verification
```bash
# Verify Anon #0 owner
cast call $ANONS_TOKEN "ownerOf(uint256)" 0 --rpc-url https://mainnet.base.org
# Should return: 0xf17b5dD382B048Ff4c05c1C9e4E24cfC5C6adAd9

# Verify Anon #0 seed
cast call $ANONS_TOKEN "seeds(uint256)" 0 --rpc-url https://mainnet.base.org
# Should return: (1, 48, 7, 3, 7, 69, true) for #d5e1e1 background

# Verify pause status
cast call $AUCTION_HOUSE "paused()" --rpc-url https://mainnet.base.org
# Should return: true (paused, ready for launch)
```

### Frontend Configuration
- [ ] Update `web/.env.local` with mainnet contract addresses
- [ ] Update `NEXT_PUBLIC_CHAIN_ID=8453`
- [ ] Test frontend connects to mainnet
- [ ] Verify Anon #0 displays correctly
- [ ] Verify "auctions paused" message shows (if applicable)

---

## ⏸️ Pre-Launch Hold (Contracts Deployed, Auctions Paused)

**Status after step 5:** Contracts live on mainnet, auctions NOT started

**What's done:**
- ✅ All contracts deployed and verified
- ✅ Anon #0 minted to 0xf17b5dD382B048Ff4c05c1C9e4E24cfC5C6adAd9
- ✅ Auction house is minter
- ✅ Auction house owns AnonsToken
- ⏸️ Auctions are PAUSED (no one can bid yet)

**Waiting for:**
- [ ] Final frontend testing on mainnet
- [ ] Social media prep (tweets, casts ready)
- [ ] Agent outreach messages drafted
- [ ] Jake gives the green light

**To check pause status:**
```bash
cast call $AUCTION_HOUSE "paused()" --rpc-url https://mainnet.base.org
# Returns: true (paused) or false (live)
```

---

## 🚀 Launch Sequence (When Ready)

### Step 1: Unpause Auction House
```bash
cast send $AUCTION_HOUSE "unpause()" \
  --private-key $PRIVATE_KEY \
  --rpc-url https://mainnet.base.org

# This automatically creates and starts Anon #1 auction
```

### Step 2: Verify First Auction Started
```bash
cast call $AUCTION_HOUSE "auction()" --rpc-url https://mainnet.base.org
# Should show Anon #1 with active auction
```

### Step 3: Launch Announcement (Simultaneous)
- Tweet: "Anons DAO is LIVE 🤖 First auction ends in 12 hours... ◖▬◗ anons.lol"
- Farcaster cast (same message)
- DM Tier 1 agents with promo

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
- **Seed:** `{ background: 1, head: 48, visor: 7, antenna: 3, body: 7, accessory: 69, isDusk: true }`
- **Background Color:** #d5e1e1 (Dusk)

---

## ✅ Deployment Sign-Off

**Phase 1: Deployment (Paused)**
- [ ] All contracts deployed successfully
- [ ] All contracts verified on Basescan
- [ ] Anon #0 owned by correct address with correct traits
- [ ] Auction house paused (verified)
- [ ] Frontend updated and connected to mainnet

**Deployed By:** _________________  
**Date:** _________________  
**Git Commit:** _________________  

---

**Phase 2: Launch (When Ready)**
- [ ] Agent outreach messages sent (30 min before)
- [ ] Social media posts drafted
- [ ] Called `unpause()` on auction house
- [ ] First auction (Anon #1) started
- [ ] Launch announcement sent (Twitter + Farcaster)
- [ ] Frontend shows live auction

**Launched By:** _________________  
**Date:** _________________  
**First Auction End Time:** _________________  

---

**Ready to deploy? Let's go! 🚀**  
**Ready to launch? You decide when! ⏸️**

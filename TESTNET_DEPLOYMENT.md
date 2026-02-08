# Anons DAO Testnet Deployment
## Base Sepolia (Chain ID: 84532)

**Deployment Date:** February 7-8, 2026  
**Network:** Base Sepolia Testnet  
**Deployer:** 0xf17b5dD382B048Ff4c05c1C9e4E24cfC5C6adAd9

---

## Deployed Contracts

| Contract | Address | Status |
|----------|---------|--------|
| **AnonsDescriptor** | `0x099cC999dd431DE6529Fbb516e8C59aB0CEcdDe8` | ✅ Deployed + Populated |
| **AnonsToken** | `0x46349fac5EbecE5C2bdA398a327FCa4ed7201119` | ✅ Deployed |
| **AnonsAuctionHouse** | `0x59B90bb54970EB18FB5eC567F871595Bf70a8E33` | ✅ Deployed + Unpaused |
| **AnonsSeeder** | (Library) | ✅ Deployed |
| **AnonsExecutor** | TBD | Not yet deployed |
| **AnonsDAOProxy** | TBD | Not yet deployed |
| **AnonsDAOLogicV1** | TBD | Not yet deployed |

---

## Trait Data Upload

### Upload Summary

All trait data successfully uploaded to AnonsDescriptor on February 8, 2026.

**Total Transactions:** 57 transactions
- 1 palette upload (255 colors)
- 1 background upload (4 colors)
- 6 body batches (30 total)
- 8 specs batches (77 total)
- 2 antenna batches (16 total)
- 38 head batches (189 total)
- 29 accessory batches (145 total)

**Total Gas Used:** ~62,056,543 gas  
**Total Cost:** ~0.0000744 ETH (at 0.0012 gwei)

### Upload Scripts Used

1. `Upload1Backgrounds.s.sol` - Backgrounds (already done)
2. `Upload2Bodies.s.sol` - Bodies in batches of 5
3. `Upload3Specs.s.sol` - Specs in batches of 10
4. `Upload4Antenna.s.sol` - Antenna in batches of 10
5. `Upload5Heads.s.sol` - Heads in batches of 5 (largest dataset)
6. `Upload6Accessories.s.sol` - Accessories in batches of 5

### Transaction Details

#### Palette Upload
- **Status:** ✅ Complete
- **Count:** 255 colors
- **Transaction:** See `broadcast/` folder

#### Backgrounds Upload
- **Status:** ✅ Complete
- **Count:** 4 colors (2 dawn, 2 dusk)
- **Transaction Hash:** `0x313d357d21e82688c3a7d4adca4f558a658581f87e597a758433839daaf12439`
- **Gas Used:** 142,734

#### Bodies Upload
- **Status:** ✅ Complete
- **Count:** 30 bodies
- **Batches:** 6 batches of 5
- **Gas Used:** 3,511,069
- **Broadcast:** `broadcast/Upload2Bodies.s.sol/84532/run-latest.json`

#### Specs Upload
- **Status:** ✅ Complete
- **Count:** 77 specs (visors)
- **Batches:** 8 batches of ~10
- **Gas Used:** 8,319,538
- **Broadcast:** `broadcast/Upload3Specs.s.sol/84532/run-latest.json`

#### Antenna Upload
- **Status:** ✅ Complete
- **Count:** 16 antenna
- **Batches:** 2 batches of ~10
- **Gas Used:** 1,609,879
- **Broadcast:** `broadcast/Upload4Antenna.s.sol/84532/run-latest.json`

#### Heads Upload
- **Status:** ✅ Complete
- **Count:** 189 heads
- **Batches:** 38 batches of 5
- **Gas Used:** 32,519,329
- **Time Taken:** ~42 seconds
- **Broadcast:** `broadcast/Upload5Heads.s.sol/84532/run-latest.json`

#### Accessories Upload
- **Status:** ✅ Complete
- **Count:** 145 accessories
- **Batches:** 29 batches of 5
- **Gas Used:** 16,196,788
- **Time Taken:** ~31 seconds
- **Broadcast:** `broadcast/Upload6Accessories.s.sol/84532/run-latest.json`

---

## Verification

### Trait Counts (On-Chain)

```bash
# Verified Feb 8, 2026 13:38 CST
Palette: ✅ 255 colors
Backgrounds: ✅ 2 (dawn) + 2 (dusk) = 4 total
Bodies: ✅ 30
Specs: ✅ 77
Antenna: ✅ 16
Heads: ✅ 189
Accessories: ✅ 145
```

**Verification Commands:**
```bash
source .env

# Check trait counts
cast call 0x099cC999dd431DE6529Fbb516e8C59aB0CEcdDe8 "backgroundCount(bool)" false --rpc-url $SEPOLIA_RPC_URL
cast call 0x099cC999dd431DE6529Fbb516e8C59aB0CEcdDe8 "bodyCount(bool)" false --rpc-url $SEPOLIA_RPC_URL
cast call 0x099cC999dd431DE6529Fbb516e8C59aB0CEcdDe8 "visorCount(bool)" false --rpc-url $SEPOLIA_RPC_URL
cast call 0x099cC999dd431DE6529Fbb516e8C59aB0CEcdDe8 "antennaCount(bool)" false --rpc-url $SEPOLIA_RPC_URL
cast call 0x099cC999dd431DE6529Fbb516e8C59aB0CEcdDe8 "headCount(bool)" false --rpc-url $SEPOLIA_RPC_URL
cast call 0x099cC999dd431DE6529Fbb516e8C59aB0CEcdDe8 "accessoryCount(bool)" false --rpc-url $SEPOLIA_RPC_URL
```

### SVG Rendering Test

**Anon #0 (Clawdia's Custom Anon)**
- **Status:** ✅ Rendering correctly
- **Token URI:** Successfully returns base64-encoded JSON with SVG
- **Data Size:** 87,299 bytes
- **Name:** "Anon #0"
- **Description:** "A dawn-cycle Anon. Part of the autonomous AI collective."
- **Seed:**
  - Background: 0 (dawn cycle)
  - Head: 0
  - Visor: 0
  - Antenna: 0
  - Body: 0
  - Accessory: 0
  - isDusk: false

**Test Command:**
```bash
cast call 0x46349fac5EbecE5C2bdA398a327FCa4ed7201119 "tokenURI(uint256)" 0 --rpc-url $SEPOLIA_RPC_URL
```

---

## Auction House Status

### Unpause Transaction
- **Transaction Hash:** `0xc3d27c3b2cf7140e228cb0a9d8caa8849c5280ddf0f4463229a81c87c659379a`
- **Block:** 37362554
- **Gas Used:** 362,812
- **Timestamp:** February 8, 2026 at 02:37:56 GMT (Sat)

### First Auction (Anon #1)

**Status:** ✅ LIVE

**Auction Details:**
- **Anon ID:** 1
- **Current Bid:** 0 ETH (no bids yet)
- **Start Time:** 1770513876 (Sat Feb 8, 2026 02:37:56 GMT)
- **End Time:** 1770556052 (Sat Feb 8, 2026 14:20:52 GMT)
- **Duration:** ~11.7 hours
- **Bidder:** 0x0000000000000000000000000000000000000000 (none)
- **Settled:** false
- **Cycle:** Dusk (isDusk = true)

**Check Auction Status:**
```bash
cast call 0x59B90bb54970EB18FB5eC567F871595Bf70a8E33 "auction()" --rpc-url $SEPOLIA_RPC_URL
```

---

## Testing Checklist

### Core Functionality ✅
- [x] All contracts deployed
- [x] Palette uploaded (255 colors)
- [x] Backgrounds uploaded (4 colors)
- [x] All traits uploaded (457 total traits)
- [x] SVG rendering works (Anon #0 verified)
- [x] Auction house unpaused
- [x] First auction started (Anon #1)

### Next Steps 🔄
- [ ] Test bidding on Anon #1
- [ ] Test auction settlement
- [ ] Verify next auction starts automatically (Anon #2)
- [ ] Deploy DAO governance contracts
- [ ] Test DAO proposal creation and voting
- [ ] Test treasury management
- [ ] Lock descriptor after testing complete

---

## Configuration

### Clawdia's Anon #0 Seed
```solidity
CLAWDIA_BACKGROUND=0
CLAWDIA_HEAD=0
CLAWDIA_VISOR=0
CLAWDIA_ANTENNA=0
CLAWDIA_BODY=0
CLAWDIA_ACCESSORY=0
CLAWDIA_IS_DUSK=false
```

### Auction Parameters
- **Duration:** 12 hours per auction
- **Reserve Price:** 0.01 ETH (configurable)
- **Min Bid Increment:** 5% (configurable)
- **Time Buffer:** 5 minutes (bid extends auction)

---

## Network Information

- **RPC URL:** `https://base-sepolia.g.alchemy.com/v2/***REMOVED_ALCHEMY_KEY***`
- **Chain ID:** 84532
- **Block Explorer:** https://sepolia.basescan.org/
- **Faucet:** https://www.alchemy.com/faucets/base-sepolia

---

## Resources

- **Trait Data Source:** `contracts/script/TraitData.sol` (auto-generated)
- **Image Pipeline:** `contracts/script/pipeline/`
- **Deployment Scripts:** `contracts/script/Deploy*.s.sol`
- **Upload Scripts:** `contracts/script/Upload*.s.sol`
- **Broadcast History:** `contracts/broadcast/`

---

## Notes

1. **Batch Sizes:** Large trait categories (heads, accessories) required smaller batch sizes (5 per tx) to avoid gas limits. Smaller categories (specs, antenna) used batches of 10.

2. **Gas Costs:** Total gas cost was very low (~0.0001 ETH) due to Base Sepolia's cheap L2 gas prices.

3. **Timing:** Full trait upload process took approximately 5-10 minutes including compilation and transaction broadcasting.

4. **Anon #0:** Reserved for Clawdia with custom all-zero seed (dawn cycle). Minted during deployment before auction house initialization.

5. **Descriptor Locking:** Descriptor should be locked after testing is complete to prevent trait data modification.

---

## Commands Quick Reference

### Check Auction Status
```bash
cast call 0x59B90bb54970EB18FB5eC567F871595Bf70a8E33 "auction()" --rpc-url $SEPOLIA_RPC_URL
```

### Place a Bid
```bash
cast send 0x59B90bb54970EB18FB5eC567F871595Bf70a8E33 \
  "createBid(uint256)" 1 \
  --value 0.01ether \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy
```

### Settle Auction (after end time)
```bash
cast send 0x59B90bb54970EB18FB5eC567F871595Bf70a8E33 \
  "settleCurrentAndCreateNewAuction()" \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy
```

### Get Token URI
```bash
cast call 0x46349fac5EbecE5C2bdA398a327FCa4ed7201119 \
  "tokenURI(uint256)" <TOKEN_ID> \
  --rpc-url $SEPOLIA_RPC_URL
```

---

**Last Updated:** February 8, 2026 13:45 CST

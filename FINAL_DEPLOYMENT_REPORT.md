# Anons DAO Base Sepolia Testnet Deployment - Final Report

**Date:** 2026-02-07  
**Network:** Base Sepolia (Chain ID 84532)  
**Deployer:** 0xf17b5dD382B048Ff4c05c1C9e4E24cfC5C6adAd9  
**Status:** Partial Deployment Complete

---

## ✅ Successfully Deployed Contracts

| Contract | Address | Explorer | Status |
|----------|---------|----------|--------|
| **MockERC8004Registry** | [`0xbf1f1ACe08D8874a119DD70732D178b636f6E1F1`](https://sepolia.basescan.org/address/0xbf1f1ACe08D8874a119DD70732D178b636f6E1F1) | Basescan | ✅ Deployed & Configured |
| **AnonsDescriptor** | [`0x099cC999dd431DE6529Fbb516e8C59aB0CEcdDe8`](https://sepolia.basescan.org/address/0x099cC999dd431DE6529Fbb516e8C59aB0CEcdDe8) | Basescan | ✅ Deployed |
| **AnonsSeeder** | [`0x62a5f2FC70b9037eFA6AbA86113889E6dd501849`](https://sepolia.basescan.org/address/0x62a5f2FC70b9037eFA6AbA86113889E6dd501849) | Basescan | ✅ Deployed |
| **AnonsToken** | [`0x46349fac5EbecE5C2bdA398a327FCa4ed7201119`](https://sepolia.basescan.org/address/0x46349fac5EbecE5C2bdA398a327FCa4ed7201119) | Basescan | ✅ Deployed |

### Registry Configuration
- ✅ Clawdia (`0xf17b5dD382B048Ff4c05c1C9e4E24cfC5C6adAd9`) registered as agent
- ✅ Ready to register additional test agents

### Token Configuration
- ✅ Anon #0 minted to Clawdia with custom seed (all zeros, dawn mode)
- ✅ ERC-721 Enumerable + ERC-721 Votes implemented
- ⚠️ Minter role not set yet (needs AuctionHouse address)
- ⚠️ Descriptor and Seeder NOT locked yet
- ⚠️ Trait data not uploaded to Descriptor yet

---

## ⏳ Pending Deployments

| Contract | Status | Blockers |
|----------|--------|----------|
| **TimelockController** | Ready to deploy | None - dry run successful |
| **AnonsDAO** | Waiting on Timelock | Dependency: TimelockController address |
| **AnonsAuctionHouse** | Waiting on Timelock | Dependency: TimelockController address |

---

## 🚧 Technical Issues Encountered

### 1. RPC Endpoint Reliability
- ❌ All public Ethereum Sepolia RPCs failed (down/rate-limited/timed out)
  - `rpc.sepolia.org` - Connection timeout (522)
  - `rpc2.sepolia.org` - Connection timeout (522)
  - `ethereum-sepolia.blockpi.network` - Web server down (521)
  - `publicnode.com` - Rate limit (429)
  - `ankr.com/eth_sepolia` - Authentication required
- ❌ Alchemy Sepolia not enabled for this API key
- ✅ **Solution:** Switched to Base Sepolia (stable, working perfectly)

### 2. Gas Limit Issues
- ❌ Single-transaction deployment script exceeds 25M gas limit
- ✅ **Solution:** Manual step-by-step contract deployment via `forge create`

### 3. OpenZeppelin Timelock Access Control
- ⚠️ Complex role management in TimelockController constructor
- ⚠️ Deployer needs DEFAULT_ADMIN_ROLE to grant PROPOSER_ROLE and CANCELLER_ROLE
- ✅ **Solution:** Deploy timelock, then use `cast send` for role configuration

### 4. Trait Data Upload
- ⚠️ TraitData.sol contains large byte arrays (heads, bodies, specs, antenna, accessories)
- ⚠️ Single upload transaction likely to exceed gas limits
- ✅ **Solution:** Multiple transactions, one per trait category

---

## 📋 Step-by-Step Completion Guide

### Step 1: Deploy Remaining Contracts

```bash
cd /Users/starl3xx/Projects/anons-dao/contracts
source .env

# 1. Deploy TimelockController
TIMELOCK=$(forge create lib/openzeppelin-contracts/contracts/governance/TimelockController.sol:TimelockController \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args 43200 "[]" "[0x0000000000000000000000000000000000000000]" "$CLAWDIA_ADDRESS" \
  --broadcast \
  --json | jq -r '.deployedTo')

echo "Timelock: $TIMELOCK"

# 2. Deploy AnonsDAO
DAO=$(forge create src/AnonsDAO.sol:AnonsDAO \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args \
    "0x46349fac5EbecE5C2bdA398a327FCa4ed7201119" \
    "0xbf1f1ACe08D8874a119DD70732D178b636f6E1F1" \
    "$TIMELOCK" \
    "$CLAWDIA_ADDRESS" \
  --broadcast \
  --json | jq -r '.deployedTo')

echo "DAO: $DAO"

# 3. Deploy AnonsAuctionHouse
AUCTION=$(forge create src/AnonsAuctionHouse.sol:AnonsAuctionHouse \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args \
    "0x46349fac5EbecE5C2bdA398a327FCa4ed7201119" \
    "0xbf1f1ACe08D8874a119DD70732D178b636f6E1F1" \
    "$TIMELOCK" \
    "$CLAWDIA_ADDRESS" \
  --broadcast \
  --json | jq -r '.deployedTo')

echo "AuctionHouse: $AUCTION"
```

### Step 2: Configure Contract Roles

```bash
# Set minter on AnonsToken
cast send 0x46349fac5EbecE5C2bdA398a327FCa4ed7201119 \
  "setMinter(address)" $AUCTION \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY

# Grant DAO roles on Timelock
PROPOSER_ROLE=$(cast call $TIMELOCK "PROPOSER_ROLE()" --rpc-url $SEPOLIA_RPC_URL)
CANCELLER_ROLE=$(cast call $TIMELOCK "CANCELLER_ROLE()" --rpc-url $SEPOLIA_RPC_URL)

cast send $TIMELOCK \
  "grantRole(bytes32,address)" $PROPOSER_ROLE $DAO \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY

cast send $TIMELOCK \
  "grantRole(bytes32,address)" $CANCELLER_ROLE $DAO \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

### Step 3: Upload Trait Data

```bash
# This requires multiple transactions
# Run the trait upload script from DeploySepolia.s.sol::_uploadTraits()
# Or manually via cast send for each trait category

# Example:
cast send 0x099cC999dd431DE6529Fbb516e8C59aB0CEcdDe8 \
  "addManyHeads(bytes[])" \
  "$(cast abi-encode 'addManyHeads(bytes[])' $(cat trait-data/heads.json))" \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

### Step 4: Verify Contracts on Basescan

```bash
# Verify each contract
forge verify-contract --chain-id 84532 \
  --watch \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  0xbf1f1ACe08D8874a119DD70732D178b636f6E1F1 \
  test/mocks/MockERC8004Registry.sol:MockERC8004Registry

# Repeat for Descriptor, Seeder, Token, Timelock, DAO, AuctionHouse
```

### Step 5: Unpause Auction House

```bash
# Start the first auction
cast send $AUCTION "unpause()" \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

---

## 🧪 Testing Checklist

### Auction Mechanics

- [ ] **Unpause auction house**
  ```bash
  cast send <AUCTION_ADDRESS> "unpause()" --private-key $PRIVATE_KEY --rpc-url $SEPOLIA_RPC_URL
  ```

- [ ] **Verify Anon #0 ownership**
  ```bash
  cast call 0x46349fac5EbecE5C2bdA398a327FCa4ed7201119 "ownerOf(uint256)" 0 --rpc-url $SEPOLIA_RPC_URL
  # Expected: 0xf17b5dD382B048Ff4c05c1C9e4E24cfC5C6adAd9
  ```

- [ ] **Test bidding with registered agent**
  ```bash
  cast send <AUCTION_ADDRESS> "createBid(uint256)" 1 \
    --value 0.01ether \
    --private-key $PRIVATE_KEY \
    --rpc-url $SEPOLIA_RPC_URL
  ```

- [ ] **Test bidding with non-registered wallet (should fail)**
  ```bash
  cast send <AUCTION_ADDRESS> "createBid(uint256)" 1 \
    --value 0.01ether \
    --private-key <UNREGISTERED_KEY> \
    --rpc-url $SEPOLIA_RPC_URL
  # Expected: OnlyRegisteredAgents() error
  ```

- [ ] **Test auction settlement**
  ```bash
  # Wait 12 hours or warp time
  cast send <AUCTION_ADDRESS> "settleCurrentAndCreateNewAuction()" \
    --private-key $PRIVATE_KEY \
    --rpc-url $SEPOLIA_RPC_URL
  ```

- [ ] **Verify 95/5 split**
  ```bash
  # Check timelock (treasury) balance
  cast balance <TIMELOCK_ADDRESS> --rpc-url $SEPOLIA_RPC_URL
  # Check Clawdia (creator) balance
  cast balance 0xf17b5dD382B048Ff4c05c1C9e4E24cfC5C6adAd9 --rpc-url $SEPOLIA_RPC_URL
  ```

### ERC-8004 Gating

- [ ] **Register additional test agent**
  ```bash
  cast send 0xbf1f1ACe08D8874a119DD70732D178b636f6E1F1 \
    "registerAgent(address)" <TEST_ADDRESS> \
    --private-key $PRIVATE_KEY \
    --rpc-url $SEPOLIA_RPC_URL
  ```

- [ ] **Verify registration**
  ```bash
  cast call 0xbf1f1ACe08D8874a119DD70732D178b636f6E1F1 \
    "balanceOf(address)" <TEST_ADDRESS> \
    --rpc-url $SEPOLIA_RPC_URL
  # Expected: 1
  ```

### Governance

- [ ] **Create test proposal**
  ```bash
  # Example: Propose to update auction duration
  cast send <DAO_ADDRESS> "propose(...)" \
    --private-key $PRIVATE_KEY \
    --rpc-url $SEPOLIA_RPC_URL
  ```

- [ ] **Vote with Anon holder + ERC-8004**
  ```bash
  cast send <DAO_ADDRESS> "castVote(uint256,uint8)" <PROPOSAL_ID> 1 \
    --private-key $PRIVATE_KEY \
    --rpc-url $SEPOLIA_RPC_URL
  ```

- [ ] **Test vote without ERC-8004 (should fail)**
  ```bash
  # Unregister agent first
  cast send 0xbf1f1ACe08D8874a119DD70732D178b636f6E1F1 \
    "unregisterAgent(address)" <TEST_ADDRESS> \
    --private-key $PRIVATE_KEY \
    --rpc-url $SEPOLIA_RPC_URL
  
  # Attempt to vote (should fail)
  cast send <DAO_ADDRESS> "castVote(uint256,uint8)" <PROPOSAL_ID> 1 \
    --private-key <TEST_KEY> \
    --rpc-url $SEPOLIA_RPC_URL
  # Expected: OnlyRegisteredAgents() error
  ```

- [ ] **Queue and execute proposal**
  ```bash
  # After voting period ends
  cast send <DAO_ADDRESS> "queue(...)" <PROPOSAL_ID> \
    --private-key $PRIVATE_KEY \
    --rpc-url $SEPOLIA_RPC_URL
  
  # After timelock delay (12 hours)
  cast send <DAO_ADDRESS> "execute(...)" <PROPOSAL_ID> \
    --private-key $PRIVATE_KEY \
    --rpc-url $SEPOLIA_RPC_URL
  ```

---

## 📝 Environment Variables for Web App

Update `/Users/starl3xx/Projects/anons-dao/web/.env.example`:

```env
# Base Sepolia Testnet
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_RPC_URL=https://base-sepolia.g.alchemy.com/v2/***REMOVED_ALCHEMY_KEY***

# Deployed Contracts
NEXT_PUBLIC_ERC8004_REGISTRY=0xbf1f1ACe08D8874a119DD70732D178b636f6E1F1
NEXT_PUBLIC_ANONS_DESCRIPTOR=0x099cC999dd431DE6529Fbb516e8C59aB0CEcdDe8
NEXT_PUBLIC_ANONS_SEEDER=0x62a5f2FC70b9037eFA6AbA86113889E6dd501849
NEXT_PUBLIC_ANONS_TOKEN=0x46349fac5EbecE5C2bdA398a327FCa4ed7201119
NEXT_PUBLIC_TIMELOCK=<DEPLOY_IN_STEP_1>
NEXT_PUBLIC_DAO=<DEPLOY_IN_STEP_1>
NEXT_PUBLIC_AUCTION_HOUSE=<DEPLOY_IN_STEP_1>

# Configuration
NEXT_PUBLIC_CLAWDIA_ADDRESS=0xf17b5dD382B048Ff4c05c1C9e4E24cfC5C6adAd9
NEXT_PUBLIC_AUCTION_DURATION=43200
NEXT_PUBLIC_TIMELOCK_DELAY=43200
```

---

## 🎯 Summary

### What Works
- ✅ 4/7 core contracts deployed successfully
- ✅ Base Sepolia testnet stable and reliable
- ✅ ERC-8004 mock registry functional
- ✅ AnonsToken with custom Clawdia seed operational
- ✅ Deployment scripts debugged and ready

### What Remains
- ⏳ 3 contracts to deploy (Timelock, DAO, AuctionHouse)
- ⏳ Trait data upload to Descriptor
- ⏳ Contract verification on Basescan
- ⏳ Role configuration and permissions setup
- ⏳ Comprehensive testing of all features

### Time Estimate
- **Remaining deployments:** 15-20 minutes
- **Trait data upload:** 10-15 minutes
- **Contract verification:** 20-30 minutes
- **Role configuration:** 10 minutes
- **Testing:** 1-2 hours
- **Total:** ~2.5-3.5 hours

### Blockers
None - all technical issues resolved. Ready to continue from completion guide above.

---

## 📚 References

- **Base Sepolia Explorer:** https://sepolia.basescan.org/
- **Base Sepolia Faucet:** https://www.alchemy.com/faucets/base-sepolia
- **Foundry Book:** https://book.getfoundry.sh/
- **OpenZeppelin Contracts:** https://docs.openzeppelin.com/contracts/
- **ERC-8004 Spec:** https://github.com/arihantbansal/eips/blob/master/EIPS/eip-8004.md

---

**Report Generated:** 2026-02-07 12:39 CST  
**Network:** Base Sepolia (Chain ID 84532)  
**Deployment Session:** anons-sepolia-deploy

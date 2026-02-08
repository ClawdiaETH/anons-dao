# Anons DAO - Testnet Deployment Guide

## Quick Start

This project has been partially deployed to **Base Sepolia** testnet. Follow this guide to complete and test the deployment.

## Current Status

✅ **4/7 contracts deployed** to Base Sepolia  
⏳ **3 contracts pending**: Timelock, DAO, AuctionHouse  
📍 **Network**: Base Sepolia (Chain ID: 84532)

## Deployed Contracts

| Contract | Address | Status |
|----------|---------|--------|
| MockERC8004Registry | `0xbf1f1ACe08D8874a119DD70732D178b636f6E1F1` | ✅ Live |
| AnonsDescriptor | `0x099cC999dd431DE6529Fbb516e8C59aB0CEcdDe8` | ✅ Live |
| AnonsSeeder | `0x62a5f2FC70b9037eFA6AbA86113889E6dd501849` | ✅ Live |
| AnonsToken | `0x46349fac5EbecE5C2bdA398a327FCa4ed7201119` | ✅ Live |
| TimelockController | TBD | ⏳ Pending |
| AnonsDAO | TBD | ⏳ Pending |
| AnonsAuctionHouse | TBD | ⏳ Pending |

## Complete the Deployment

### Prerequisites

```bash
cd /Users/starl3xx/Projects/anons-dao/contracts
source .env  # Loads signing key and RPC URL
```

### Deploy Remaining Contracts

Run the completion script:

```bash
chmod +x ../complete-deployment.sh
../complete-deployment.sh
```

Or deploy manually:

```bash
# 1. Deploy Timelock (12-hour delay)
forge create lib/openzeppelin-contracts/contracts/governance/TimelockController.sol:TimelockController \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args 43200 "[]" "[0x0000000000000000000000000000000000000000]" "$CLAWDIA_ADDRESS" \
  --broadcast

# 2. Deploy DAO (requires Timelock address from step 1)
forge create src/AnonsDAO.sol:AnonsDAO \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args \
    "0x46349fac5EbecE5C2bdA398a327FCa4ed7201119" \
    "0xbf1f1ACe08D8874a119DD70732D178b636f6E1F1" \
    "<TIMELOCK_ADDRESS>" \
    "$CLAWDIA_ADDRESS" \
  --broadcast

# 3. Deploy AuctionHouse
forge create src/AnonsAuctionHouse.sol:AnonsAuctionHouse \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args \
    "0x46349fac5EbecE5C2bdA398a327FCa4ed7201119" \
    "0xbf1f1ACe08D8874a119DD70732D178b636f6E1F1" \
    "<TIMELOCK_ADDRESS>" \
    "$CLAWDIA_ADDRESS" \
  --broadcast
```

### Configure Contracts

```bash
# Set minter role
cast send 0x46349fac5EbecE5C2bdA398a327FCa4ed7201119 \
  "setMinter(address)" <AUCTION_HOUSE_ADDRESS> \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY

# Grant DAO roles on Timelock
PROPOSER_ROLE=$(cast call <TIMELOCK_ADDRESS> "PROPOSER_ROLE()" --rpc-url $SEPOLIA_RPC_URL)
CANCELLER_ROLE=$(cast call <TIMELOCK_ADDRESS> "CANCELLER_ROLE()" --rpc-url $SEPOLIA_RPC_URL)

cast send <TIMELOCK_ADDRESS> "grantRole(bytes32,address)" $PROPOSER_ROLE <DAO_ADDRESS> \
  --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY

cast send <TIMELOCK_ADDRESS> "grantRole(bytes32,address)" $CANCELLER_ROLE <DAO_ADDRESS> \
  --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY
```

## Test the System

### 1. Start First Auction

```bash
cast send <AUCTION_HOUSE_ADDRESS> "unpause()" \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

### 2. Verify Anon #0

```bash
# Check owner
cast call 0x46349fac5EbecE5C2bdA398a327FCa4ed7201119 \
  "ownerOf(uint256)" 0 \
  --rpc-url $SEPOLIA_RPC_URL
# Expected: 0xf17b5dD382B048Ff4c05c1C9e4E24cfC5C6adAd9

# Check seed
cast call 0x46349fac5EbecE5C2bdA398a327FCa4ed7201119 \
  "seeds(uint256)" 0 \
  --rpc-url $SEPOLIA_RPC_URL
```

### 3. Test Bidding (Registered Agent)

```bash
# Place bid
cast send <AUCTION_HOUSE_ADDRESS> \
  "createBid(uint256)" 1 \
  --value 0.01ether \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY

# Check auction state
cast call <AUCTION_HOUSE_ADDRESS> "auction()" --rpc-url $SEPOLIA_RPC_URL
```

### 4. Test ERC-8004 Gating

```bash
# Register another agent
cast send 0xbf1f1ACe08D8874a119DD70732D178b636f6E1F1 \
  "registerAgent(address)" <TEST_ADDRESS> \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY

# Verify registration
cast call 0xbf1f1ACe08D8874a119DD70732D178b636f6E1F1 \
  "balanceOf(address)" <TEST_ADDRESS> \
  --rpc-url $SEPOLIA_RPC_URL
# Should return: 1
```

### 5. Test Governance

```bash
# Create proposal (requires Anon NFT + ERC-8004)
# Vote on proposal
# Queue and execute after delay
```

## Verify Contracts

```bash
forge verify-contract --chain-id 84532 \
  --watch \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  <CONTRACT_ADDRESS> \
  <CONTRACT_PATH>:<CONTRACT_NAME>
```

## Useful Commands

```bash
# Check balances
cast balance <ADDRESS> --rpc-url $SEPOLIA_RPC_URL

# Call view functions
cast call <CONTRACT> "<FUNCTION>" <ARGS> --rpc-url $SEPOLIA_RPC_URL

# Send transactions
cast send <CONTRACT> "<FUNCTION>" <ARGS> \
  --value <ETH> \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY

# Get Base Sepolia testnet ETH
# Visit: https://www.alchemy.com/faucets/base-sepolia
```

## Documentation

- **Full Deployment Report**: `FINAL_DEPLOYMENT_REPORT.md`
- **Deployment Status**: `DEPLOYMENT_STATUS.md`
- **Completion Script**: `complete-deployment.sh`

## Support

- **Base Sepolia Explorer**: https://sepolia.basescan.org/
- **Foundry Docs**: https://book.getfoundry.sh/
- **OpenZeppelin**: https://docs.openzeppelin.com/

---

**Last Updated**: 2026-02-07  
**Network**: Base Sepolia (84532)  
**Status**: Partial deployment complete

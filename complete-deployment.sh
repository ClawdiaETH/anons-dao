#!/bin/bash
set -e

# Anons DAO - Complete Base Sepolia Deployment
# Continues from partially deployed state

cd /Users/starl3xx/Projects/anons-dao/contracts
source .env

echo "=========================================="
echo "  Completing Anons DAO Deployment"
echo "  Network: Base Sepolia"
echo "=========================================="
echo ""

# Already deployed
REGISTRY="0xbf1f1ACe08D8874a119DD70732D178b636f6E1F1"
DESCRIPTOR="0x099cC999dd431DE6529Fbb516e8C59aB0CEcdDe8"
SEEDER="0x62a5f2FC70b9037eFA6AbA86113889E6dd501849"
CLAWDIA="0xf17b5dD382B048Ff4c05c1C9e4E24cfC5C6adAd9"

echo "✓ Registry:    $REGISTRY"
echo "✓ Descriptor:  $DESCRIPTOR"
echo "✓ Seeder:      $SEEDER"
echo "✓ Clawdia:     $CLAWDIA"
echo ""

# Step 1: Deploy AnonsToken with Solidity script helper
echo "Step 1: Deploying AnonsToken..."
TOKEN_DEPLOY=$(forge script script/DeployTokenOnly.s.sol:DeployTokenOnly \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --json \
  | jq -r '.returns.token.value')

if [ -z "$TOKEN_DEPLOY" ]; then
  echo "❌ Token deployment failed"
  exit 1
fi

echo "✓ Token deployed: $TOKEN_DEPLOY"
echo ""

# Step 2: Deploy TimelockController
echo "Step 2: Deploying TimelockController..."
TIMELOCK=$(forge create lib/openzeppelin-contracts/contracts/governance/TimelockController.sol:TimelockController \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args 43200 "[]" "[0x0000000000000000000000000000000000000000]" "$CLAWDIA" \
  --json \
  | jq -r '.deployedTo')

echo "✓ Timelock deployed: $TIMELOCK"
echo ""

# Step 3: Deploy AnonsDAO
echo "Step 3: Deploying AnonsDAO..."
DAO=$(forge create src/AnonsDAO.sol:AnonsDAO \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args "$TOKEN_DEPLOY" "$REGISTRY" "$TIMELOCK" "$CLAWDIA" \
  --json \
  | jq -r '.deployedTo')

echo "✓ DAO deployed: $DAO"
echo ""

# Step 4: Deploy AnonsAuctionHouse
echo "Step 4: Deploying AnonsAuctionHouse..."
AUCTION=$(forge create src/AnonsAuctionHouse.sol:AnonsAuctionHouse \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args "$TOKEN_DEPLOY" "$REGISTRY" "$TIMELOCK" "$CLAWDIA" \
  --json \
  | jq -r '.deployedTo')

echo "✓ AuctionHouse deployed: $AUCTION"
echo ""

# Step 5: Set minter
echo "Step 5: Setting minter to AuctionHouse..."
cast send $TOKEN_DEPLOY "setMinter(address)" $AUCTION \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY

echo "✓ Minter set"
echo ""

# Step 6: Grant timelock roles
echo "Step 6: Configuring Timelock roles..."
PROPOSER_ROLE=$(cast call $TIMELOCK "PROPOSER_ROLE()" --rpc-url $SEPOLIA_RPC_URL)
CANCELLER_ROLE=$(cast call $TIMELOCK "CANCELLER_ROLE()" --rpc-url $SEPOLIA_RPC_URL)

cast send $TIMELOCK "grantRole(bytes32,address)" $PROPOSER_ROLE $DAO \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY

cast send $TIMELOCK "grantRole(bytes32,address)" $CANCELLER_ROLE $DAO \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY

echo "✓ Roles granted"
echo ""

echo "=========================================="
echo "           DEPLOYMENT COMPLETE           "
echo "=========================================="
echo ""
echo "Contract Addresses:"
echo "-------------------"
echo "Registry:      $REGISTRY"
echo "Descriptor:    $DESCRIPTOR"
echo "Seeder:        $SEEDER"
echo "Token:         $TOKEN_DEPLOY"
echo "Timelock:      $TIMELOCK"
echo "DAO:           $DAO"
echo "AuctionHouse:  $AUCTION"
echo ""
echo "Next Steps:"
echo "-----------"
echo "1. Verify contracts on Basescan"
echo "2. Upload trait data to Descriptor"
echo "3. Call auctionHouse.unpause() to start auctions"
echo "4. Update web/.env.example with addresses"
echo ""
echo "=========================================="

# Save addresses
cat > deployed-addresses.json <<EOF
{
  "network": "base-sepolia",
  "chainId": 84532,
  "deployer": "$CLAWDIA",
  "contracts": {
    "MockERC8004Registry": "$REGISTRY",
    "AnonsDescriptor": "$DESCRIPTOR",
    "AnonsSeeder": "$SEEDER",
    "AnonsToken": "$TOKEN_DEPLOY",
    "TimelockController": "$TIMELOCK",
    "AnonsDAO": "$DAO",
    "AnonsAuctionHouse": "$AUCTION"
  },
  "config": {
    "clawdia": "$CLAWDIA",
    "timelockDelay": 43200,
    "auctionDuration": 43200
  }
}
EOF

echo "Addresses saved to deployed-addresses.json"

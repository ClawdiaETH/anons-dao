#!/bin/bash
set -e

# ANONS DAO - Descriptor Upgrade Script
# Deploys new descriptor with fixed specs rendering and uploads all data

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         ANONS DAO - Descriptor Upgrade (Specs Fix)           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
export TOKEN_ADDRESS=0x813d1d56457bd4697abedb835435691b187eedc4
export PRIVATE_KEY=$(cat ~/.clawdbot/secrets/signing_key)
RPC_URL="https://mainnet.base.org"

echo "Token Address: $TOKEN_ADDRESS"
echo "RPC URL: $RPC_URL"
echo ""

read -p "This will deploy a new descriptor and re-upload all traits. Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

cd contracts

# Step 1: Deploy new descriptor
echo ""
echo "═══ Step 1/10: Deploying New Descriptor ═══"
forge script script/UpgradeDescriptor.s.sol:UpgradeDescriptor \
    --rpc-url $RPC_URL \
    --broadcast \
    --verify

# Extract new descriptor address from broadcast
NEW_DESCRIPTOR=$(jq -r '.transactions[0].contractAddress' script/broadcast/UpgradeDescriptor.s.sol/8453/run-latest.json)
export NEW_DESCRIPTOR_ADDRESS=$NEW_DESCRIPTOR

echo ""
echo "New Descriptor: $NEW_DESCRIPTOR_ADDRESS"
echo ""
read -p "Proceed with uploads? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted. Descriptor deployed at: $NEW_DESCRIPTOR_ADDRESS"
    exit 1
fi

# Step 2: Upload palette
echo ""
echo "═══ Step 2/10: Uploading Palette ═══"
export DESCRIPTOR_ADDRESS=$NEW_DESCRIPTOR_ADDRESS
forge script script/UploadPalette.s.sol:UploadPalette \
    --rpc-url $RPC_URL \
    --broadcast

# Step 3: Upload backgrounds
echo ""
echo "═══ Step 3/10: Uploading Backgrounds ═══"
forge script script/Upload1Backgrounds.s.sol:Upload1Backgrounds \
    --rpc-url $RPC_URL \
    --broadcast

# Step 4: Upload bodies
echo ""
echo "═══ Step 4/10: Uploading Bodies ═══"
forge script script/Upload2Bodies.s.sol:Upload2Bodies \
    --rpc-url $RPC_URL \
    --broadcast

# Step 5: Upload specs
echo ""
echo "═══ Step 5/10: Uploading Specs ═══"
forge script script/Upload3Specs.s.sol:Upload3Specs \
    --rpc-url $RPC_URL \
    --broadcast

# Step 6: Upload antenna
echo ""
echo "═══ Step 6/10: Uploading Antenna ═══"
forge script script/Upload4Antenna.s.sol:Upload4Antenna \
    --rpc-url $RPC_URL \
    --broadcast

# Step 7: Upload heads
echo ""
echo "═══ Step 7/10: Uploading Heads ═══"
forge script script/Upload5Heads.s.sol:Upload5Heads \
    --rpc-url $RPC_URL \
    --broadcast

# Step 8: Upload accessories
echo ""
echo "═══ Step 8/10: Uploading Accessories ═══"
forge script script/Upload6Accessories.s.sol:Upload6Accessories \
    --rpc-url $RPC_URL \
    --broadcast

# Step 9: Upload trait names
echo ""
echo "═══ Step 9/10: Uploading Trait Names ═══"
forge script script/UploadTraitNames.s.sol:UploadTraitNames \
    --rpc-url $RPC_URL \
    --broadcast

# Step 10: Update token contract
echo ""
echo "═══ Step 10/10: Updating Token Contract ═══"
forge script script/SetNewDescriptor.s.sol:SetNewDescriptor \
    --rpc-url $RPC_URL \
    --broadcast

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    UPGRADE COMPLETE! ✓                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "New Descriptor: $NEW_DESCRIPTOR_ADDRESS"
echo "Token Contract: $TOKEN_ADDRESS"
echo ""
echo "All Anons now render with:"
echo "  ✓ Fixed specs colors/gradients"
echo "  ✓ Human-readable trait names"
echo ""
echo "Test on OpenSea:"
echo "  https://opensea.io/assets/base/$TOKEN_ADDRESS/0"

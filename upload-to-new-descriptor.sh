#!/bin/bash
set -e

# Upload all traits to the new descriptor using existing scripts
# New descriptor: 0xd29F7491E2269Ba1f6f7B89ff3Bbe6A65301e9AF

export DESCRIPTOR_ADDRESS=0xd29F7491E2269Ba1f6f7B89ff3Bbe6A65301e9AF
export PRIVATE_KEY=$(cat ~/.clawdbot/secrets/signing_key)
RPC_URL="https://mainnet.base.org"

cd ~/Projects/anons-dao/contracts

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          Uploading Traits to New Descriptor                   ║"
echo "║          0xd29F7491E2269Ba1f6f7B89ff3Bbe6A65301e9AF          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Update all upload scripts to use new descriptor
echo "Updating upload scripts..."
sed -i '' 's/0xc45F4894F769602E1FDc888c935B294188a98064/0xd29F7491E2269Ba1f6f7B89ff3Bbe6A65301e9AF/g' script/Upload*.sol
echo "✓ Scripts updated"
echo ""

read -p "This will upload ~461 traits (expensive gas). Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Step 1: Upload palette (255 colors)
echo "═══ Step 1/8: Uploading Palette (255 colors) ═══"
forge script script/UploadPalette.s.sol:UploadPalette \
    --rpc-url $RPC_URL \
    --broadcast \
    --slow || { echo "Failed at palette"; exit 1; }
echo ""

# Step 2: Upload backgrounds
echo "═══ Step 2/8: Uploading Backgrounds ═══"
forge script script/Upload1Backgrounds.s.sol:Upload1Backgrounds \
    --rpc-url $RPC_URL \
    --broadcast \
    --slow || { echo "Failed at backgrounds"; exit 1; }
echo ""

# Step 3: Upload bodies
echo "═══ Step 3/8: Uploading Bodies ═══"
forge script script/Upload2Bodies.s.sol:Upload2Bodies \
    --rpc-url $RPC_URL \
    --broadcast \
    --slow || { echo "Failed at bodies"; exit 1; }
echo ""

# Step 4: Upload specs
echo "═══ Step 4/8: Uploading Specs ═══"
forge script script/Upload3Specs.s.sol:Upload3Specs \
    --rpc-url $RPC_URL \
    --broadcast \
    --slow || { echo "Failed at specs"; exit 1; }
echo ""

# Step 5: Upload antenna
echo "═══ Step 5/8: Uploading Antenna ═══"
forge script script/Upload4Antenna.s.sol:Upload4Antenna \
    --rpc-url $RPC_URL \
    --broadcast \
    --slow || { echo "Failed at antenna"; exit 1; }
echo ""

# Step 6: Upload heads
echo "═══ Step 6/8: Uploading Heads ═══"
forge script script/Upload5Heads.s.sol:Upload5Heads \
    --rpc-url $RPC_URL \
    --broadcast \
    --slow || { echo "Failed at heads"; exit 1; }
echo ""

# Step 7: Upload accessories
echo "═══ Step 7/8: Uploading Accessories ═══"
forge script script/Upload6Accessories.s.sol:Upload6Accessories \
    --rpc-url $RPC_URL \
    --broadcast \
    --slow || { echo "Failed at accessories"; exit 1; }
echo ""

# Step 8: Upload trait names
echo "═══ Step 8/8: Uploading Trait Names ═══"
forge script script/UploadTraitNames.s.sol:UploadTraitNames \
    --rpc-url $RPC_URL \
    --broadcast \
    --slow || { echo "Failed at trait names"; exit 1; }
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                ALL UPLOADS COMPLETE! ✓                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "New Descriptor: $DESCRIPTOR_ADDRESS"
echo ""
echo "NEXT STEP:"
echo "Run: ~/Projects/anons-dao/switch-descriptor.sh"
echo ""
echo "This will update the token contract to use the new descriptor."

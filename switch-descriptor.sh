#!/bin/bash
set -e

# Switch the token contract to use the new descriptor
TOKEN_ADDRESS=0x813d1d56457bd4697abedb835435691b187eedc4
OLD_DESCRIPTOR=0xc45F4894F769602E1FDc888c935B294188a98064
NEW_DESCRIPTOR=0xd29F7491E2269Ba1f6f7B89ff3Bbe6A65301e9AF
PRIVATE_KEY=$(cat ~/.clawdbot/secrets/signing_key)
RPC_URL="https://mainnet.base.org"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          Switch Token to New Descriptor                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Token:          $TOKEN_ADDRESS"
echo "Old Descriptor: $OLD_DESCRIPTOR"
echo "New Descriptor: $NEW_DESCRIPTOR"
echo ""

# Verify new descriptor is configured
echo "Verifying new descriptor configuration..."
HEAD_COUNT=$(cast call $NEW_DESCRIPTOR "headCount(bool)(uint256)" false --rpc-url $RPC_URL)
BODY_COUNT=$(cast call $NEW_DESCRIPTOR "bodyCount(bool)(uint256)" false --rpc-url $RPC_URL)
SPECS_COUNT=$(cast call $NEW_DESCRIPTOR "visorCount(bool)(uint256)" false --rpc-url $RPC_URL)

echo "  Heads:  $HEAD_COUNT"
echo "  Bodies: $BODY_COUNT"
echo "  Specs:  $SPECS_COUNT"
echo ""

if [ "$HEAD_COUNT" = "0" ] || [ "$BODY_COUNT" = "0" ] || [ "$SPECS_COUNT" = "0" ]; then
    echo "ERROR: New descriptor is not fully configured!"
    echo "Run upload-to-new-descriptor.sh first."
    exit 1
fi

read -p "Switch the token contract to the new descriptor? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Switching descriptor..."
cast send $TOKEN_ADDRESS \
    "setDescriptor(address)" $NEW_DESCRIPTOR \
    --private-key $PRIVATE_KEY \
    --rpc-url $RPC_URL

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    DESCRIPTOR SWITCHED! ✓                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "All Anons now render with:"
echo "  ✓ Fixed specs colors/gradients (not black anymore)"
echo "  ✓ Human-readable trait names (Cherry instead of 7)"
echo ""
echo "Verify on OpenSea:"
echo "  https://opensea.io/assets/base/$TOKEN_ADDRESS/0"
echo ""
echo "Note: OpenSea may take a few minutes to refresh metadata."
echo "You can force refresh by clicking the refresh button on the NFT page."

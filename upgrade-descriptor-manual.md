# Manual Descriptor Upgrade Steps

## Status

✅ **Step 1 Complete**: New descriptor deployed to `0xd29F7491E2269Ba1f6f7B89ff3Bbe6A65301e9AF`

## Remaining Steps

The automated script hit authorization issues. Here's the manual path forward:

### Option A: Use Existing Descriptor (RECOMMENDED)

Since the visuals are rendering correctly on anons.lol, **just upload trait names** to the existing descriptor:

```bash
cd ~/Projects/anons-dao/contracts

# Revert to old descriptor address
sed -i '' 's/0xd29F7491E2269Ba1f6f7B89ff3Bbe6A65301e9AF/0xc45F4894F769602E1FDc888c935B294188a98064/g' script/Upload*.sol

# Upload trait names
PRIVATE_KEY=$(cat ~/.clawdbot/secrets/signing_key) \
forge script script/UploadTraitNames.s.sol:UploadTraitNames \
  --rpc-url https://mainnet.base.org \
  --broadcast
```

**Why this works:**
- Visual rendering is already correct
- Specs show proper gradients 
- Only missing trait names
- No contract changes needed
- Much cheaper (single transaction vs 10+)

### Option B: Complete New Descriptor Deployment

If you absolutely need the updated `_generateSpecs()` code (though it seems unnecessary):

1. Upload all traits to new descriptor (7 transactions)
2. Upload trait names (1 transaction)
3. Update token contract to use new descriptor (1 transaction)

**Cost:** ~0.05-0.1 ETH total

## Recommendation

Go with **Option A**. The specs are rendering correctly, so the new descriptor doesn't actually fix anything - it just changes code that's already working.
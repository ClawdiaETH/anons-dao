# Trait Names Feature

## Overview

This feature adds human-readable trait names to the Anons NFT metadata instead of just showing numbers.

**Before:** `"trait_type": "Head", "value": "0"`
**After:** `"trait_type": "Head", "value": "Abstract"`

## Changes Made

### 1. Contract Updates

#### `AnonsDescriptor.sol`
- Added trait name storage arrays for each trait type
- Added `setBackgroundNames()`, `setHeadNames()`, `setSpecsNames()`, `setAntennaNames()`, `setBodyNames()`, and `setAccessoryNames()` functions
- Updated `tokenURI()` to use trait names when available, falling back to numbers if not set
- Added `_getTraitName()` helper function

#### `IAnonsDescriptor.sol`
- Added interfaces for the new trait name setter functions

### 2. Deployment Script

**`UploadTraitNames.s.sol`** - Complete script to upload all trait names:
- **189 head names** (Abstract, Air Conditioner, Alarm Clock, etc.)
- **30 body names** (Bege BSOD, Blue Sky, Gold, etc.)
- **77 specs names** (Amber, Aurora, Binary Amber, etc.)
- **16 antenna names** (Arrow, Crown, Flag, etc.)
- **145 accessory names** (Aardvark, Axe, Bird Flying, etc.)
- **4 background names** (Dawn Sky, Dawn Clouds, Dusk Sky, Dusk Clouds)

### 3. Helper Script

**`generate-trait-names.js`** - Node.js script that:
- Reads `pipeline/output/image-data.json`
- Converts filenames (e.g., "head-abstract") to display names (e.g., "Abstract")
- Generates Solidity code for trait name arrays
- Useful for regenerating if trait data changes

## Usage

### Deploy Trait Names (Mainnet/Testnet)

```bash
# Set environment variables
export PRIVATE_KEY=<your_private_key>
export DESCRIPTOR_ADDRESS=<deployed_descriptor_address>

# Run the upload script
forge script script/UploadTraitNames.s.sol:UploadTraitNames --rpc-url <rpc_url> --broadcast --verify
```

### Regenerate Trait Names (if needed)

If the pipeline output changes and you need to regenerate the trait names:

```bash
cd script
node generate-trait-names.js
```

This will:
1. Read the latest trait data from `pipeline/output/image-data.json`
2. Generate Solidity code with all trait names
3. Save it to `trait-names-generated.sol` (for reference)
4. Update the arrays in `UploadTraitNames.s.sol` manually

## Example Output

After uploading trait names, tokenURI will return:

```json
{
  "name": "Anon #1",
  "description": "A dawn-cycle Anon. Part of the autonomous AI collective.",
  "image": "data:image/svg+xml;base64,...",
  "attributes": [
    {"trait_type": "Cycle", "value": "Dawn"},
    {"trait_type": "Background", "value": "Dawn Sky"},
    {"trait_type": "Head", "value": "Laptop"},
    {"trait_type": "Specs", "value": "Cyan"},
    {"trait_type": "Antenna", "value": "Crown"},
    {"trait_type": "Body", "value": "Computerblue"},
    {"trait_type": "Accessory", "value": "Gnars"}
  ]
}
```

## Trait Name Conventions

- **Heads**: Object names (Abstract, Laptop, Robot, etc.)
- **Bodies**: Color schemes (Blue Sky, Gold, Computerblue, etc.)
- **Specs**: Color/effect names (Cyan, Fire, Binary Amber, etc.)
- **Antenna**: Shape names (Crown, Flag, Propeller, etc.)
- **Accessories**: Varied (Animals, Text, Patterns, Bling, etc.)

## Notes

- Trait names are **optional** - if not set, the contract falls back to showing the numeric trait ID
- Names can be updated by the owner before the descriptor is locked
- Once locked, trait names cannot be changed
- Empty string names fall back to numbers (allows selectively naming traits)
- The script uses the original trait filenames from the pipeline as a base, formatted for display

## Total Trait Names

- **Backgrounds**: 4
- **Heads**: 189
- **Bodies**: 30
- **Specs**: 77
- **Antenna**: 16
- **Accessories**: 145
- **Total**: 461 trait names

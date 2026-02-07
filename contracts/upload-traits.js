#!/usr/bin/env node
const fs = require('fs');
const { execSync } = require('child_process');

const DESCRIPTOR_ADDRESS = '0x099cC999dd431DE6529Fbb516e8C59aB0CEcdDe8';
const RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://base-sepolia.g.alchemy.com/v2/***REMOVED_ALCHEMY_KEY***';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Load trait data
const imageData = JSON.parse(fs.readFileSync('script/pipeline/output/image-data.json', 'utf8'));

console.log('📦 Uploading trait data to AnonsDescriptor...\n');

// 1. Upload palette
console.log('1️⃣ Uploading palette...');
const paletteJson = JSON.stringify(imageData.palette);
try {
  const result = execSync(
    `cast send ${DESCRIPTOR_ADDRESS} "setPalette(string[])" '${paletteJson}' --private-key ${PRIVATE_KEY} --rpc-url ${RPC_URL} --legacy`,
    { encoding: 'utf8' }
  );
  console.log('✅ Palette uploaded');
} catch (error) {
  console.error('❌ Failed to upload palette:', error.message);
  process.exit(1);
}

// 2. Upload backgrounds
console.log('\n2️⃣ Uploading backgrounds...');
const backgroundsJson = JSON.stringify(imageData.backgrounds);
try {
  const result = execSync(
    `cast send ${DESCRIPTOR_ADDRESS} "setBackgrounds(string[])" '${backgroundsJson}' --private-key ${PRIVATE_KEY} --rpc-url ${RPC_URL} --legacy`,
    { encoding: 'utf8' }
  );
  console.log('✅ Backgrounds uploaded');
} catch (error) {
  console.error('❌ Failed to upload backgrounds:', error.message);
  process.exit(1);
}

// Helper function to upload traits in batches
function uploadTraits(traitType, traits, batchSize = 5) {
  console.log(`\n📤 Uploading ${traits.length} ${traitType} in batches of ${batchSize}...`);
  
  const functionName = traitType === 'antenna' 
    ? 'addManyAntenna' 
    : `addMany${traitType.charAt(0).toUpperCase() + traitType.slice(1)}`;
  
  // Convert RLE data to bytes format for Solidity
  const traitBytes = traits.map(trait => {
    // Remove '0x' prefix if present
    const hexData = trait.data.startsWith('0x') ? trait.data.slice(2) : trait.data;
    return `0x${hexData}`;
  });
  
  // Upload in batches
  for (let i = 0; i < traitBytes.length; i += batchSize) {
    const batch = traitBytes.slice(i, Math.min(i + batchSize, traitBytes.length));
    const batchJson = JSON.stringify(batch);
    
    console.log(`  Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(traitBytes.length / batchSize)}: uploading ${batch.length} ${traitType}...`);
    
    try {
      execSync(
        `cast send ${DESCRIPTOR_ADDRESS} "${functionName}(bytes[])" '${batchJson}' --private-key ${PRIVATE_KEY} --rpc-url ${RPC_URL} --legacy --gas-limit 10000000`,
        { encoding: 'utf8', stdio: 'inherit' }
      );
      console.log(`  ✅ Batch uploaded`);
    } catch (error) {
      console.error(`  ❌ Failed to upload batch:`, error.message);
      process.exit(1);
    }
  }
  
  console.log(`✅ All ${traitType} uploaded`);
}

// 3. Upload heads
uploadTraits('heads', imageData.heads, 3);

// 4. Upload specs
uploadTraits('specs', imageData.specs, 5);

// 5. Upload antenna
uploadTraits('antenna', imageData.antenna, 5);

// 6. Upload bodies
uploadTraits('bodies', imageData.bodies, 5);

// 7. Upload accessories
uploadTraits('accessories', imageData.accessories, 5);

console.log('\n✨ All trait data uploaded successfully!\n');

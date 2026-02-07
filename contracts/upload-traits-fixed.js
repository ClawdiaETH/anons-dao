#!/usr/bin/env node
const fs = require('fs');
const { execSync } = require('child_process');

const DESCRIPTOR_ADDRESS = '0x099cC999dd431DE6529Fbb516e8C59aB0CEcdDe8';
const RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://base-sepolia.g.alchemy.com/v2/***REMOVED_ALCHEMY_KEY***';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('❌ PRIVATE_KEY not set');
  process.exit(1);
}

// Load trait data
const imageData = JSON.parse(fs.readFileSync('script/pipeline/output/image-data.json', 'utf8'));

console.log('📦 Uploading trait data to AnonsDescriptor...\n');

// 1. Upload palette (already done, but check)
console.log('1️⃣ Checking palette...');
try {
  const count = execSync(
    `cast call ${DESCRIPTOR_ADDRESS} "palette(uint256)" 0 --rpc-url ${RPC_URL}`,
    { encoding: 'utf8' }
  );
  if (count.includes('execution reverted')) {
    console.log('   Palette needs to be uploaded. Uploading...');
    const paletteJson = JSON.stringify(imageData.palette);
    execSync(
      `cast send ${DESCRIPTOR_ADDRESS} "setPalette(string[])" '${paletteJson}' --private-key ${PRIVATE_KEY} --rpc-url ${RPC_URL} --legacy`,
      { encoding: 'utf8' }
    );
    console.log('✅ Palette uploaded');
  } else {
    console.log('✅ Palette already uploaded');
  }
} catch (error) {
  console.log('   Uploading palette...');
  const paletteJson = JSON.stringify(imageData.palette);
  execSync(
    `cast send ${DESCRIPTOR_ADDRESS} "setPalette(string[])" '${paletteJson}' --private-key ${PRIVATE_KEY} --rpc-url ${RPC_URL} --legacy`,
    { encoding: 'utf8', stdio: 'inherit' }
  );
  console.log('✅ Palette uploaded');
}

// 2. Upload backgrounds
console.log('\n2️⃣ Uploading backgrounds...');
const backgroundsJson = JSON.stringify(imageData.bgcolors);
try {
  execSync(
    `cast send ${DESCRIPTOR_ADDRESS} "setBackgrounds(string[])" '${backgroundsJson}' --private-key ${PRIVATE_KEY} --rpc-url ${RPC_URL} --legacy`,
    { encoding: 'utf8', stdio: 'inherit' }
  );
  console.log('✅ Backgrounds uploaded');
} catch (error) {
  console.error('❌ Failed to upload backgrounds:', error.message);
  process.exit(1);
}

// Helper function to convert base64 to hex
function base64ToHex(base64) {
  const buffer = Buffer.from(base64, 'base64');
  return '0x' + buffer.toString('hex');
}

// Helper function to upload traits in batches
function uploadTraits(traitType, traits, functionName, batchSize = 5) {
  console.log(`\n📤 Uploading ${traits.length} ${traitType} in batches of ${batchSize}...`);
  
  // Convert base64 data to hex format for Solidity
  const traitBytes = traits.map(trait => base64ToHex(trait.data));
  
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

// 3. Upload bodies (smaller, start here)
uploadTraits('bodies', imageData.images.bodies, 'addManyBodies', 5);

// 4. Upload specs
uploadTraits('specs', imageData.images.specs, 'addManySpecs', 5);

// 5. Upload antennas
uploadTraits('antennas', imageData.images.antennas, 'addManyAntenna', 5);

// 6. Upload heads (large - smaller batches)
uploadTraits('heads', imageData.images.heads, 'addManyHeads', 3);

// 7. Upload accessories (large - smaller batches)
uploadTraits('accessories', imageData.images.accessories, 'addManyAccessories', 3);

console.log('\n✨ All trait data uploaded successfully!\n');
console.log('📊 Verifying counts...\n');

// Verify counts
const traits = [
  ['backgroundCount', 4],
  ['headCount', imageData.images.heads.length],
  ['bodyCount', imageData.images.bodies.length],
  ['visorCount', imageData.images.specs.length],
  ['antennaCount', imageData.images.antennas.length],
  ['accessoryCount', imageData.images.accessories.length]
];

for (const [fn, expected] of traits) {
  try {
    const result = execSync(
      `cast call ${DESCRIPTOR_ADDRESS} "${fn}(bool)" false --rpc-url ${RPC_URL}`,
      { encoding: 'utf8' }
    );
    const count = parseInt(result.trim(), 16);
    const status = count === expected ? '✅' : '❌';
    console.log(`${status} ${fn}: ${count} (expected: ${expected})`);
  } catch (error) {
    console.log(`❌ ${fn}: Error checking count`);
  }
}

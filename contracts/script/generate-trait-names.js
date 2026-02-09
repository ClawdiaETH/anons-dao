/**
 * Generate trait name arrays from image-data.json
 * 
 * This script reads the pipeline output and generates Solidity code
 * for the trait name setter functions in UploadTraitNames.s.sol
 */

const fs = require('fs');
const path = require('path');

const IMAGE_DATA_PATH = path.join(__dirname, 'pipeline/output/image-data.json');

/**
 * Convert filename to display name
 * Examples:
 *   "head-abstract" -> "Abstract"
 *   "body-bege-bsod" -> "Beige BSOD"
 *   "head-air-conditioner" -> "Air Conditioner"
 */
function filenameToDisplayName(filename) {
  // Remove prefix (head-, body-, etc.)
  const withoutPrefix = filename.replace(/^(head|body|specs|antenna|accessory)-/, '');
  
  // Split by hyphens and capitalize each word
  const words = withoutPrefix.split('-').map(word => {
    // Handle acronyms
    if (word.toUpperCase() === word) return word;
    if (word === 'bsod') return 'BSOD';
    if (word === 'crt') return 'CRT';
    if (word === 'atm') return 'ATM';
    if (word === 'lcd') return 'LCD';
    
    // Capitalize first letter
    return word.charAt(0).toUpperCase() + word.slice(1);
  });
  
  return words.join(' ');
}

/**
 * Generate Solidity array initialization code
 */
function generateSolidityArray(names, functionName) {
  const lines = [];
  lines.push(`    function ${functionName}() internal pure returns (string[] memory) {`);
  lines.push(`        string[] memory names = new string[](${names.length});`);
  
  names.forEach((name, i) => {
    lines.push(`        names[${i}] = "${name}";`);
  });
  
  lines.push('        return names;');
  lines.push('    }');
  
  return lines.join('\n');
}

async function main() {
  console.log('=== Generate Trait Names ===\n');
  
  const rawData = fs.readFileSync(IMAGE_DATA_PATH, 'utf8');
  const data = JSON.parse(rawData);
  
  console.log('Processing trait names...\n');
  
  // Extract and convert names for each trait type
  const traitTypes = ['heads', 'bodies', 'specs', 'antennas', 'accessories'];
  const functionMap = {
    'heads': 'getHeadNames',
    'bodies': 'getBodyNames',
    'specs': 'getSpecsNames',
    'antennas': 'getAntennaNames',
    'accessories': 'getAccessoryNames'
  };
  
  const solidityCode = [];
  
  for (const traitType of traitTypes) {
    const items = data.images[traitType];
    const displayNames = items.map(item => filenameToDisplayName(item.filename));
    
    console.log(`${traitType}: ${displayNames.length} traits`);
    console.log(`  First 5: ${displayNames.slice(0, 5).join(', ')}\n`);
    
    const code = generateSolidityArray(displayNames, functionMap[traitType]);
    solidityCode.push(code);
  }
  
  console.log('\n=== Generated Solidity Code ===\n');
  console.log(solidityCode.join('\n\n'));
  
  // Optionally write to a file
  const outputPath = path.join(__dirname, 'trait-names-generated.sol');
  fs.writeFileSync(outputPath, solidityCode.join('\n\n'));
  console.log(`\n✓ Saved to ${outputPath}`);
}

main().catch(console.error);

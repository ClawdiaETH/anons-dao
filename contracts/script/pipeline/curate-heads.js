/**
 * Curate Heads
 *
 * Filters Nouns head traits to keep only mechanical/geometric/object heads
 * that fit the Anons robot aesthetic. Copies included heads from
 * decoded-traits/heads/ to curated-traits/heads/.
 */

import fs from 'fs/promises';
import path from 'path';

const INCLUDED_PATH = './curation/included-heads.json';
const SOURCE_DIR = './decoded-traits/heads';
const OUTPUT_DIR = './curated-traits/heads';

async function main() {
  console.log('=== Curate Heads ===\n');

  // Read inclusion list
  const data = JSON.parse(await fs.readFile(INCLUDED_PATH, 'utf-8'));
  const included = data.heads;
  console.log(`Included heads: ${included.length}`);

  // Clean and recreate output dir
  await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  let copied = 0;
  const missing = [];

  for (const name of included) {
    const src = path.join(SOURCE_DIR, `${name}.png`);
    const dst = path.join(OUTPUT_DIR, `${name}.png`);

    try {
      await fs.access(src);
      await fs.copyFile(src, dst);
      copied++;
    } catch {
      missing.push(name);
    }
  }

  console.log(`Copied: ${copied}/${included.length}`);

  if (missing.length > 0) {
    console.warn(`\n⚠ Missing files (${missing.length}):`);
    for (const name of missing) {
      console.warn(`  - ${name}.png`);
    }
  }

  console.log('\n✓ Head curation complete');
}

main().catch(console.error);

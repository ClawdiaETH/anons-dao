/**
 * Add Mouths Pipeline Step
 *
 * Reads mouth-assignments.json and applies mouth styles to roboticized
 * Nouns head PNGs. Also processes generated heads that need mouths.
 *
 * Runs AFTER roboticize, BEFORE generate-specs.
 *
 * For each assigned head:
 * 1. Load the roboticized PNG
 * 2. Auto-detect position (scan opaque area in rows 16-20)
 * 3. Auto-detect color (sample luminance, pick contrasting)
 * 4. Draw the assigned mouth style
 * 5. Overwrite the roboticized PNG
 */

import { PNG } from 'pngjs';
import fs from 'fs/promises';
import path from 'path';
import {
  drawMouth,
  selectMouthColor,
  autoPosition,
  hasMouthFeature,
  MOUTH_STYLES,
} from './mouth-lib.js';

const HEADS_DIR = './roboticized-traits/heads';
const ASSIGNMENTS_PATH = './curation/mouth-assignments.json';

// Heads with organic eyes that survived roboticization.
// These get patched before mouth drawing: replace eye pixels with
// the surrounding head color to remove the "face" read, then draw
// a proper mouth feature instead.
// Format: { headName: { eyePixels: [[x,y],...], fill: 'sample' | '#hex' } }
const EYE_FIXES = {
  'head-treasurechest': {
    // White-black-white eye at row 17, cols 16-18 inside metallic band
    // Replace with keyhole: neutralize white sclera, darken center to keyhole
    eyePixels: [[16, 17], [18, 17]],  // white sclera pixels
    fill: 'sample',                     // sample neighboring color (7f9aa8 band)
    // After clearing eyes, draw keyhole in dark metal
    keyhole: { cx: 17, topY: 16, slotY: 18, color: [0x32, 0x35, 0x3a] },
  },
};

function getPixelRgb(png, x, y) {
  const idx = (y * 32 + x) * 4;
  return [png.data[idx], png.data[idx + 1], png.data[idx + 2]];
}

function setPixelRgb(png, x, y, r, g, b) {
  if (x < 0 || x >= 32 || y < 0 || y >= 32) return;
  const idx = (y * 32 + x) * 4;
  png.data[idx] = r;
  png.data[idx + 1] = g;
  png.data[idx + 2] = b;
  png.data[idx + 3] = 255;
}

function applyEyeFix(png, headName) {
  const fix = EYE_FIXES[headName];
  if (!fix) return false;

  // Replace eye pixels
  for (const [x, y] of fix.eyePixels) {
    if (fix.fill === 'sample') {
      // Sample from neighboring pixel (prefer left neighbor)
      const [r, g, b] = getPixelRgb(png, x - 1, y);
      setPixelRgb(png, x, y, r, g, b);
    } else {
      const c = fix.fill.replace('#', '');
      setPixelRgb(png, x, y,
        parseInt(c.substring(0, 2), 16),
        parseInt(c.substring(2, 4), 16),
        parseInt(c.substring(4, 6), 16));
    }
  }

  // Draw keyhole if specified
  if (fix.keyhole) {
    const { cx, topY, slotY, color } = fix.keyhole;
    // Circular top of keyhole
    setPixelRgb(png, cx - 1, topY, ...color);
    setPixelRgb(png, cx, topY, ...color);
    // Pupil was already dark, keep it as keyhole center
    // Vertical slot below
    setPixelRgb(png, cx, slotY, ...color);
  }

  return true;
}

async function loadPNG(filePath) {
  const buffer = await fs.readFile(filePath);
  return PNG.sync.read(buffer);
}

async function savePNG(png, filePath) {
  const buffer = PNG.sync.write(png);
  await fs.writeFile(filePath, buffer);
}

async function main() {
  console.log('=== Add Mouths to Roboticized Heads ===\n');

  // Load assignments
  const raw = await fs.readFile(ASSIGNMENTS_PATH, 'utf-8');
  const assignments = JSON.parse(raw);

  // Remove comment key
  delete assignments._comment;

  const headNames = Object.keys(assignments);
  console.log(`Assignments: ${headNames.length} heads`);

  let applied = 0;
  let skippedMissing = 0;
  let skippedFeature = 0;

  for (const headName of headNames) {
    const { style, color } = assignments[headName];
    const pngPath = path.join(HEADS_DIR, `${headName}.png`);

    // Check if PNG exists
    try {
      await fs.access(pngPath);
    } catch {
      console.log(`  ⊘ ${headName} — PNG not found, skipping`);
      skippedMissing++;
      continue;
    }

    // Validate style
    if (!MOUTH_STYLES[style]) {
      console.error(`  ✗ ${headName} — unknown style "${style}"`);
      continue;
    }

    // Load the PNG
    const png = await loadPNG(pngPath);

    // Apply eye fixes (remove organic eyes that survived roboticization)
    if (applyEyeFix(png, headName)) {
      console.log(`  🔧 ${headName} — eye fix applied`);
      // Save immediately so the fix persists even if mouth is skipped
      await savePNG(png, pngPath);
    }

    // Check if head already has mouth-zone features
    if (hasMouthFeature(png)) {
      console.log(`  ⊘ ${headName} — existing feature detected, skipping`);
      skippedFeature++;
      continue;
    }

    // Auto-detect position
    const pos = autoPosition(png);

    // Determine color
    let mouthColor;
    if (color === 'auto') {
      mouthColor = selectMouthColor(png, pos.y);
    } else {
      mouthColor = color;
    }

    // Draw the mouth
    drawMouth(png, style, pos.centerX, pos.y, pos.width, mouthColor);

    // Save back
    await savePNG(png, pngPath);
    applied++;
    console.log(`  ✓ ${headName} — ${style} at (${pos.centerX}, ${pos.y}) w=${pos.width}`);
  }

  console.log(`\n✓ Applied mouths to ${applied} heads`);
  if (skippedMissing > 0) console.log(`  Skipped ${skippedMissing} (PNG not found)`);
  if (skippedFeature > 0) console.log(`  Skipped ${skippedFeature} (existing features)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

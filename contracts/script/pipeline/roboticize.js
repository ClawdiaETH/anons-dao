/**
 * Roboticize Nouns Traits
 *
 * Transform organic Nouns into mechanical Anons:
 * 1. Replace flesh tones with metal colors
 * 2. Add panel lines / mechanical details
 * 3. Shift color palette to industrial tones
 * 4. Preserve silhouettes but change materials
 */

import sharp from 'sharp';
import { PNG } from 'pngjs';
import fs from 'fs/promises';
import path from 'path';

const INPUT_DIR = './decoded-traits';
const OUTPUT_DIR = './roboticized-traits';

// Curated heads come from a separate directory (filtered by curate-heads.js)
const INPUT_OVERRIDES = {
  heads: './curated-traits/heads',
};

// Flesh tone ranges to replace (RGB)
const FLESH_TONES = [
  { r: [180, 255], g: [120, 200], b: [80, 160] },   // Light skin
  { r: [140, 200], g: [80, 140], b: [60, 120] },    // Medium skin
  { r: [80, 150], g: [40, 100], b: [30, 80] },      // Dark skin
  { r: [255, 255], g: [200, 230], b: [180, 220] },  // Very pale
];

// Metal color palettes for replacement
const METAL_PALETTES = {
  steel: [
    { r: 180, g: 180, b: 190 }, // Light steel
    { r: 140, g: 145, b: 155 }, // Medium steel
    { r: 100, g: 105, b: 115 }, // Dark steel
    { r: 70, g: 75, b: 85 },    // Shadow steel
  ],
  chrome: [
    { r: 220, g: 225, b: 230 }, // Highlight
    { r: 170, g: 175, b: 185 }, // Light
    { r: 120, g: 125, b: 135 }, // Medium
    { r: 80, g: 85, b: 95 },    // Dark
  ],
  rust: [
    { r: 180, g: 100, b: 60 },  // Light rust
    { r: 140, g: 70, b: 40 },   // Medium rust
    { r: 100, g: 50, b: 30 },   // Dark rust
    { r: 70, g: 35, b: 20 },    // Deep rust
  ],
  copper: [
    { r: 200, g: 140, b: 100 }, // Light copper
    { r: 160, g: 100, b: 70 },  // Medium copper
    { r: 120, g: 70, b: 50 },   // Dark copper
    { r: 80, g: 50, b: 35 },    // Shadow copper
  ],
  matte_black: [
    { r: 60, g: 60, b: 65 },    // Light
    { r: 45, g: 45, b: 50 },    // Medium
    { r: 30, g: 30, b: 35 },    // Dark
    { r: 20, g: 20, b: 25 },    // Shadow
  ],
  military: [
    { r: 100, g: 110, b: 80 },  // Light olive
    { r: 70, g: 80, b: 55 },    // Medium olive
    { r: 50, g: 60, b: 40 },    // Dark olive
    { r: 35, g: 45, b: 30 },    // Shadow
  ]
};

// Check if a color is a flesh tone
function isFleshTone(r, g, b) {
  return FLESH_TONES.some(range =>
    r >= range.r[0] && r <= range.r[1] &&
    g >= range.g[0] && g <= range.g[1] &&
    b >= range.b[0] && b <= range.b[1]
  );
}

// Get luminance of a color (0-1)
function getLuminance(r, g, b) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// Map a color to the nearest in a metal palette based on luminance
function mapToMetal(r, g, b, palette) {
  const lum = getLuminance(r, g, b);
  const index = Math.min(Math.floor(lum * palette.length), palette.length - 1);
  return palette[palette.length - 1 - index]; // Darker = lower luminance
}

// Apply metallic sheen by adjusting saturation
function metallicShift(r, g, b, aggressive = false) {
  const avg = (r + g + b) / 3;
  const desatFactor = aggressive ? 0.7 : 0.3;
  const blueTint = aggressive ? 10 : 5;

  return {
    r: Math.round(r + (avg - r) * desatFactor),
    g: Math.round(g + (avg - g) * desatFactor),
    b: Math.round(Math.min(255, b + (avg - b) * desatFactor + blueTint))
  };
}

// Process a single PNG file
// fullMetal=true maps ALL colors to metal palette (for bodies)
async function roboticizeImage(inputPath, outputPath, metalPalette = 'steel', fullMetal = false) {
  const palette = METAL_PALETTES[metalPalette];

  const inputBuffer = await fs.readFile(inputPath);
  const png = PNG.sync.read(inputBuffer);

  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (y * png.width + x) * 4;

      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const a = png.data[idx + 3];

      // Skip transparent pixels
      if (a === 0) continue;

      if (fullMetal) {
        // Map ALL colors to metal palette (for bodies)
        const metal = mapToMetal(r, g, b, palette);
        png.data[idx] = metal.r;
        png.data[idx + 1] = metal.g;
        png.data[idx + 2] = metal.b;
      } else if (isFleshTone(r, g, b)) {
        // Replace flesh tones with metal
        const metal = mapToMetal(r, g, b, palette);
        png.data[idx] = metal.r;
        png.data[idx + 1] = metal.g;
        png.data[idx + 2] = metal.b;
      } else {
        // Apply metallic shift to non-flesh colors
        const shifted = metallicShift(r, g, b);
        png.data[idx] = shifted.r;
        png.data[idx + 1] = shifted.g;
        png.data[idx + 2] = shifted.b;
      }
    }
  }

  const outputBuffer = PNG.sync.write(png);
  await fs.writeFile(outputPath, outputBuffer);
}

// Add panel lines / mechanical details
async function addPanelLines(inputPath, outputPath) {
  const inputBuffer = await fs.readFile(inputPath);
  const png = PNG.sync.read(inputBuffer);

  // Find edges (where alpha changes from 0 to 255 or color changes significantly)
  // Add darker pixels along internal edges to suggest panel lines

  const edgePixels = [];

  for (let y = 1; y < png.height - 1; y++) {
    for (let x = 1; x < png.width - 1; x++) {
      const idx = (y * png.width + x) * 4;
      const a = png.data[idx + 3];

      if (a === 0) continue;

      // Check if this is an internal edge
      const neighbors = [
        png.data[((y - 1) * png.width + x) * 4 + 3],
        png.data[((y + 1) * png.width + x) * 4 + 3],
        png.data[(y * png.width + (x - 1)) * 4 + 3],
        png.data[(y * png.width + (x + 1)) * 4 + 3],
      ];

      const hasTransparentNeighbor = neighbors.some(n => n === 0);

      // If this pixel is on an edge, darken it for panel line effect
      if (hasTransparentNeighbor) {
        const darkenFactor = 0.5;
        png.data[idx] = Math.round(png.data[idx] * darkenFactor);
        png.data[idx + 1] = Math.round(png.data[idx + 1] * darkenFactor);
        png.data[idx + 2] = Math.round(png.data[idx + 2] * darkenFactor);
      }
    }
  }

  const outputBuffer = PNG.sync.write(png);
  await fs.writeFile(outputPath, outputBuffer);
}

// Create multiple metal variants of a trait
async function createMetalVariants(inputPath, outputDir, baseName) {
  const variants = ['steel', 'chrome', 'rust', 'copper', 'matte_black', 'military'];

  for (const variant of variants) {
    const outputPath = path.join(outputDir, `${baseName}-${variant}.png`);
    await roboticizeImage(inputPath, outputPath, variant);
  }
}

// Process all traits in a category
async function processCategory(category) {
  const inputDir = INPUT_OVERRIDES[category] || path.join(INPUT_DIR, category);
  const outputDir = path.join(OUTPUT_DIR, category);

  // Clean output dir to prevent stale files from prior runs
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });

  const files = await fs.readdir(inputDir);
  const pngFiles = files.filter(f => f.endsWith('.png'));

  console.log(`Processing ${pngFiles.length} ${category}...`);

  for (let i = 0; i < pngFiles.length; i++) {
    const file = pngFiles[i];
    const inputPath = path.join(inputDir, file);
    const baseName = file.replace('.png', '');

    // Bodies get full metal treatment, heads/accessories keep detail
    const fullMetal = (category === 'bodies');
    const outputPath = path.join(outputDir, file);
    await roboticizeImage(inputPath, outputPath, 'steel', fullMetal);

    // Optionally add panel lines
    await addPanelLines(outputPath, outputPath);

    if (i % 50 === 0) {
      console.log(`  ${i}/${pngFiles.length}`);
    }
  }

  console.log(`  ✓ ${pngFiles.length} ${category} roboticized`);
}

// Spread body brightness across a wide range so each is a distinct gray shade.
// Target range: 220 (near-white) down to 70 (dark gray), evenly spaced.
async function normalizeBodyTones() {
  const bodiesDir = path.join(OUTPUT_DIR, 'bodies');
  const files = (await fs.readdir(bodiesDir)).filter(f => f.endsWith('.png')).sort();

  const LIGHTEST = 220;  // near-white
  const DARKEST = 70;    // dark gray

  console.log(`Normalizing ${files.length} body tones (${LIGHTEST}→${DARKEST})...`);

  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(bodiesDir, files[i]);
    const buffer = await fs.readFile(filePath);
    const png = PNG.sync.read(buffer);

    // Calculate current average brightness of opaque pixels
    let totalGray = 0;
    let opaqueCount = 0;
    for (let p = 0; p < png.data.length; p += 4) {
      if (png.data[p + 3] > 0) {
        totalGray += 0.299 * png.data[p] + 0.587 * png.data[p + 1] + 0.114 * png.data[p + 2];
        opaqueCount++;
      }
    }
    if (opaqueCount === 0) continue;

    const currentAvg = totalGray / opaqueCount;
    const targetAvg = LIGHTEST - (i / (files.length - 1)) * (LIGHTEST - DARKEST);
    const shift = targetAvg - currentAvg;

    // Remap each pixel: convert to grayscale, shift to target, preserve internal contrast
    for (let p = 0; p < png.data.length; p += 4) {
      if (png.data[p + 3] === 0) continue;
      const gray = 0.299 * png.data[p] + 0.587 * png.data[p + 1] + 0.114 * png.data[p + 2];
      const newGray = Math.max(0, Math.min(255, Math.round(gray + shift)));
      png.data[p] = newGray;
      png.data[p + 1] = newGray;
      png.data[p + 2] = newGray;
    }

    await fs.writeFile(filePath, PNG.sync.write(png));
  }

  console.log(`  ✓ ${files.length} bodies normalized to distinct gray tones`);
}

async function main() {
  console.log('=== Roboticize Nouns Traits ===\n');

  // Check input exists
  try {
    await fs.access(INPUT_DIR);
  } catch {
    console.error(`✗ Input directory not found: ${INPUT_DIR}`);
    console.error('  Run decode-rle.js first');
    process.exit(1);
  }

  // Process each category
  const categories = ['bodies', 'heads', 'accessories'];
  // Note: We don't process 'glasses' - we replace them entirely with 'specs'

  for (const category of categories) {
    await processCategory(category);
  }

  // Normalize body tones: redistribute 30 bodies from near-white to dark gray
  // After roboticization, all bodies land in a narrow steel-gray band.
  // This step spreads them across a full brightness range so each is distinct.
  await normalizeBodyTones();

  // Copy custom accessories (these are pre-styled and don't need roboticization)
  const customAccDir = './custom-traits/accessories';
  try {
    const customFiles = await fs.readdir(customAccDir);
    const customPngs = customFiles.filter(f => f.endsWith('.png'));
    for (const file of customPngs) {
      await fs.copyFile(
        path.join(customAccDir, file),
        path.join(OUTPUT_DIR, 'accessories', file)
      );
    }
    if (customPngs.length > 0) {
      console.log(`  + ${customPngs.length} custom accessories copied`);
    }
  } catch {
    // No custom accessories dir — that's fine
  }

  console.log('\n✓ All traits roboticized');
  console.log('  Glasses skipped (replaced by specs)');
}

main().catch(console.error);

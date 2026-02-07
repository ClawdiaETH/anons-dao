/**
 * Encode Anons Traits to RLE
 *
 * Takes the roboticized bodies/heads/accessories,
 * generated specs, and generated antennas,
 * and encodes them all to RLE format (image-data.json)
 * for deployment to the Anons contracts.
 */

import { PNG } from 'pngjs';
import fs from 'fs/promises';
import path from 'path';

const INPUT_DIRS = {
  bodies: './roboticized-traits/bodies',
  heads: './roboticized-traits/heads',
  accessories: './roboticized-traits/accessories',
  specs: './generated-traits/specs',
  antennas: './generated-traits/antennas'
};

const OUTPUT_FILE = './output/image-data.json';

// Max colors that fit in a single-byte colorIndex (0 = transparent, 1-255 = palette)
const MAX_PALETTE_SIZE = 255;

// Collect all unique colors across all images, quantize if > 255
function buildPalette(allImages) {
  // Count frequency of each color
  const colorFreq = new Map();

  for (const img of allImages) {
    for (let i = 0; i < img.data.length; i += 4) {
      const a = img.data[i + 3];
      if (a > 0) {
        const r = img.data[i];
        const g = img.data[i + 1];
        const b = img.data[i + 2];
        const hex = rgbToHex(r, g, b);
        colorFreq.set(hex, (colorFreq.get(hex) || 0) + 1);
      }
    }
  }

  const allColors = Array.from(colorFreq.entries());

  if (allColors.length <= MAX_PALETTE_SIZE) {
    console.log(`  ${allColors.length} colors (within ${MAX_PALETTE_SIZE} limit)`);
    return { palette: allColors.map(([hex]) => hex), colorMap: null };
  }

  console.log(`  ${allColors.length} unique colors exceeds ${MAX_PALETTE_SIZE} limit, quantizing...`);

  // Critical colors that must be preserved exactly
  const critical = ['000000', 'ffffff'];

  // Sort by frequency (most used first)
  allColors.sort((a, b) => b[1] - a[1]);

  // Build palette: critical colors first, then by frequency
  const palette = [];
  const paletteSet = new Set();

  for (const hex of critical) {
    if (colorFreq.has(hex) && !paletteSet.has(hex)) {
      palette.push(hex);
      paletteSet.add(hex);
    }
  }

  for (const [hex] of allColors) {
    if (palette.length >= MAX_PALETTE_SIZE) break;
    if (!paletteSet.has(hex)) {
      palette.push(hex);
      paletteSet.add(hex);
    }
  }

  // Build color mapping: every original color → palette index
  const colorMap = new Map();
  let remapped = 0;

  for (const [hex] of allColors) {
    if (paletteSet.has(hex)) {
      colorMap.set(hex, palette.indexOf(hex));
    } else {
      // Find nearest color in palette by Euclidean RGB distance
      const rgb = hexToRgb(hex);
      let nearest = 0;
      let minDist = Infinity;
      for (let i = 0; i < palette.length; i++) {
        const pRgb = hexToRgb(palette[i]);
        const dist = (rgb.r - pRgb.r) ** 2 + (rgb.g - pRgb.g) ** 2 + (rgb.b - pRgb.b) ** 2;
        if (dist < minDist) {
          minDist = dist;
          nearest = i;
        }
      }
      colorMap.set(hex, nearest);
      remapped++;
    }
  }

  console.log(`  Quantized to ${palette.length} colors (${remapped} rare colors remapped to nearest)`);
  return { palette, colorMap };
}

function rgbToHex(r, g, b) {
  return [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16)
  };
}

// Encode a single image to RLE
function encodeImageToRLE(png, palette, colorMap) {
  const width = png.width;
  const height = png.height;

  // Find bounds (non-transparent area)
  let top = height, bottom = 0, left = width, right = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (png.data[idx + 3] > 0) {
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
    }
  }

  // No visible pixels
  if (top > bottom) {
    return { data: '', bounds: { top: 0, right: 0, bottom: 0, left: 0 } };
  }

  // Build RLE data
  const rleBytes = [];

  // Bounds: 4 separate bytes (full byte each, matching Nouns on-chain format)
  rleBytes.push(top);
  rleBytes.push(right + 1);   // exclusive right boundary
  rleBytes.push(bottom + 1);  // exclusive bottom boundary
  rleBytes.push(left);

  // Scan row by row within bounds
  for (let y = top; y <= bottom; y++) {
    let runLength = 0;
    let runColorIndex = 0; // 0 = transparent

    for (let x = left; x <= right; x++) {
      const idx = (y * width + x) * 4;
      const a = png.data[idx + 3];

      let colorIndex = 0;
      if (a > 0) {
        const r = png.data[idx];
        const g = png.data[idx + 1];
        const b = png.data[idx + 2];
        const hex = rgbToHex(r, g, b);
        // +1 because colorIndex 0 = transparent
        if (colorMap) {
          colorIndex = colorMap.get(hex) + 1;
        } else {
          colorIndex = palette.indexOf(hex) + 1;
        }
      }

      if (colorIndex === runColorIndex && runLength < 255) {
        runLength++;
      } else {
        if (runLength > 0) {
          rleBytes.push(runLength);
          rleBytes.push(runColorIndex);
        }
        runLength = 1;
        runColorIndex = colorIndex;
      }
    }

    // Flush last run in row
    if (runLength > 0) {
      rleBytes.push(runLength);
      rleBytes.push(runColorIndex);
    }
  }

  // Convert to base64
  const buffer = Buffer.from(rleBytes);
  const data = buffer.toString('base64');

  return {
    data,
    bounds: { top, right: right + 1, bottom: bottom + 1, left }
  };
}

// Load all PNGs from a directory
async function loadPNGsFromDir(dir) {
  try {
    const files = await fs.readdir(dir);
    const pngFiles = files.filter(f => f.endsWith('.png')).sort();

    const images = [];
    for (const file of pngFiles) {
      const buffer = await fs.readFile(path.join(dir, file));
      const png = PNG.sync.read(buffer);
      images.push({
        filename: file.replace('.png', ''),
        png
      });
    }

    return images;
  } catch (e) {
    console.warn(`  Warning: Could not load ${dir}`);
    return [];
  }
}

async function main() {
  console.log('=== Encode Anons Traits to RLE ===\n');

  // Load all images
  console.log('Loading images...');

  const allImages = {
    bodies: await loadPNGsFromDir(INPUT_DIRS.bodies),
    heads: await loadPNGsFromDir(INPUT_DIRS.heads),
    specs: await loadPNGsFromDir(INPUT_DIRS.specs),
    antennas: await loadPNGsFromDir(INPUT_DIRS.antennas),
    accessories: await loadPNGsFromDir(INPUT_DIRS.accessories),
  };

  console.log('  Bodies:', allImages.bodies.length);
  console.log('  Heads:', allImages.heads.length);
  console.log('  Specs:', allImages.specs.length);
  console.log('  Antennas:', allImages.antennas.length);
  console.log('  Accessories:', allImages.accessories.length);

  // Build unified palette
  console.log('\nBuilding color palette...');
  const allPngs = [
    ...allImages.bodies,
    ...allImages.heads,
    ...allImages.specs,
    ...allImages.antennas,
    ...allImages.accessories
  ].map(i => i.png);

  const { palette, colorMap } = buildPalette(allPngs);
  console.log(`  Palette size: ${palette.length} colors`);

  // Encode all images
  console.log('\nEncoding traits...');

  const encodedImages = {};

  for (const [category, images] of Object.entries(allImages)) {
    console.log(`  Encoding ${category}...`);
    encodedImages[category] = [];

    for (const { filename, png } of images) {
      const { data } = encodeImageToRLE(png, palette, colorMap);
      encodedImages[category].push({
        filename,
        data
      });
    }
  }

  // Build output structure
  const imageData = {
    palette,
    bgcolors: [
      // Dawn backgrounds (warm)
      'e1d7d5', // 0 — Warm gray (Nouns original)
      'f5e6d3', // 1 — Soft cream/sand
      // Dusk backgrounds (cool)
      'd5d7e1', // 2 — Cool gray (Nouns original)
      'd5e1e1', // 3 — Soft blue-gray
    ],
    images: {
      bodies: encodedImages.bodies,
      heads: encodedImages.heads,
      specs: encodedImages.specs,
      antennas: encodedImages.antennas,
      accessories: encodedImages.accessories
    }
  };

  // Write output
  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(imageData, null, 2));

  console.log(`\n✓ Encoded image-data.json`);
  console.log(`  Output: ${OUTPUT_FILE}`);
  console.log(`  Total traits: ${
    encodedImages.bodies.length +
    encodedImages.heads.length +
    encodedImages.specs.length +
    encodedImages.antennas.length +
    encodedImages.accessories.length
  }`);

  // Summary
  console.log('\n=== Anons Trait Summary ===');
  console.log(`Bodies: ${encodedImages.bodies.length}`);
  console.log(`Heads: ${encodedImages.heads.length}`);
  console.log(`Specs: ${encodedImages.specs.length}`);
  console.log(`Antennas: ${encodedImages.antennas.length}`);
  console.log(`Accessories: ${encodedImages.accessories.length}`);
  console.log(`Backgrounds: ${imageData.bgcolors.length}`);
  console.log(`Palette: ${palette.length} colors`);

  const combinations =
    encodedImages.bodies.length *
    encodedImages.heads.length *
    encodedImages.specs.length *
    encodedImages.antennas.length *
    encodedImages.accessories.length *
    imageData.bgcolors.length;

  console.log(`\nPossible combinations: ${combinations.toLocaleString()}`);
}

main().catch(console.error);

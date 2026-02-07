/**
 * Decode Nouns RLE data to PNG files
 *
 * The @nouns/assets package contains RLE-encoded trait data.
 * This script decodes it back to 32x32 PNGs for modification.
 */

import nounsAssets from '@nouns/assets';
const { ImageData } = nounsAssets;
import { buildSVG } from '@nouns/sdk';
import { PNG } from 'pngjs';
import fs from 'fs/promises';
import path from 'path';

const OUTPUT_DIR = './decoded-traits';

// Nouns RLE format (hex-encoded):
// Byte 0: paletteIndex
// Bytes 1-4: bounds [top, right, bottom, left] (absolute coordinates)
// Bytes 5+: [runLength, colorIndex] pairs
// colorIndex 0 = transparent, 1+ maps to palette[colorIndex - 1]
// Row wraps when x reaches bounds.right (exclusive)

function decodeRLE(data, palette) {
  // Create 32x32 transparent image
  const pixels = new Array(32 * 32).fill(null);

  if (!data || data.length < 5) return pixels;

  // Byte 0 is palette index (unused here — single palette)
  // Bytes 1-4: top, right (exclusive), bottom (unused), left
  const bounds = {
    top: data[1],
    right: data[2],
    left: data[4]
  };

  let x = bounds.left;
  let y = bounds.top;
  let i = 5; // RLE data starts at byte 5

  while (i + 1 < data.length) {
    const runLength = data[i];
    const colorIndex = data[i + 1];

    let remaining = runLength;
    while (remaining > 0 && y < 32) {
      // How many pixels fit in this row before wrapping
      const pixelsInRow = Math.min(remaining, bounds.right - x);

      for (let j = 0; j < pixelsInRow; j++) {
        if (x < 32 && y < 32) {
          const pixelIndex = y * 32 + x;
          if (colorIndex > 0) { // 0 = transparent
            pixels[pixelIndex] = palette[colorIndex];
          }
        }
        x++;
      }

      remaining -= pixelsInRow;

      if (x >= bounds.right) {
        x = bounds.left;
        y++;
      }
    }
    i += 2;
  }

  return pixels;
}

function pixelsToPNG(pixels, palette) {
  const png = new PNG({ width: 32, height: 32 });

  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const idx = (y * 32 + x) * 4;
      const pixel = pixels[y * 32 + x];

      if (pixel) {
        // Parse hex color
        const r = parseInt(pixel.slice(0, 2), 16);
        const g = parseInt(pixel.slice(2, 4), 16);
        const b = parseInt(pixel.slice(4, 6), 16);

        png.data[idx] = r;
        png.data[idx + 1] = g;
        png.data[idx + 2] = b;
        png.data[idx + 3] = 255; // opaque
      } else {
        // Transparent
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
      }
    }
  }

  return png;
}

async function decodeAllTraits() {
  const { palette, images } = ImageData;
  const { bodies, accessories, heads, glasses } = images;

  console.log('Nouns trait counts:');
  console.log(`  Bodies: ${bodies.length}`);
  console.log(`  Accessories: ${accessories.length}`);
  console.log(`  Heads: ${heads.length}`);
  console.log(`  Glasses: ${glasses.length}`);
  console.log(`  Palette colors: ${palette.length}`);

  // Create output directories
  const dirs = ['bodies', 'accessories', 'heads', 'glasses'];
  for (const dir of dirs) {
    await fs.mkdir(path.join(OUTPUT_DIR, dir), { recursive: true });
  }

  // Decode each trait category
  const categories = { bodies, accessories, heads, glasses };

  for (const [category, traits] of Object.entries(categories)) {
    console.log(`\nDecoding ${category}...`);

    for (let i = 0; i < traits.length; i++) {
      const trait = traits[i];
      const filename = trait.filename || `${category}-${i}`;

      // The trait data is hex-encoded RLE (0x prefixed)
      const rleData = Buffer.from(trait.data.slice(2), 'hex');
      const pixels = decodeRLE(Array.from(rleData), palette);
      const png = pixelsToPNG(pixels, palette);

      const outputPath = path.join(OUTPUT_DIR, category, `${filename}.png`);

      const buffer = PNG.sync.write(png);
      await fs.writeFile(outputPath, buffer);

      if (i % 50 === 0) {
        console.log(`  ${i}/${traits.length}`);
      }
    }

    console.log(`  ✓ ${traits.length} ${category} decoded`);
  }

  console.log('\n✓ All traits decoded to', OUTPUT_DIR);
}

// Alternative: Use buildSVG to render and then rasterize
async function renderTraitToSVG(traitData, palette, background = 'transparent') {
  const svg = buildSVG([{ data: traitData }], palette, background);
  return svg;
}

async function main() {
  console.log('=== Nouns Trait Decoder ===\n');

  // Check if @nouns/assets is available
  try {
    const nounsAssetsDynamic = await import('@nouns/assets');
    const { ImageData } = nounsAssetsDynamic.default || nounsAssetsDynamic;
    console.log('✓ @nouns/assets loaded');
    console.log(`  Palette: ${ImageData.palette.length} colors`);
    console.log(`  Backgrounds: ${ImageData.bgcolors.length}`);
  } catch (e) {
    console.error('✗ Failed to load @nouns/assets');
    console.error('  Run: npm install @nouns/assets');
    process.exit(1);
  }

  await decodeAllTraits();
}

main().catch(console.error);

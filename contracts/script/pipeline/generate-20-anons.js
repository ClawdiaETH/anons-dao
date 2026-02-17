/**
 * Generate 20 Random Anons for Marketing
 */

import { PNG } from 'pngjs';
import fs from 'fs/promises';
import path from 'path';

const IMAGE_DATA_FILE = './output/image-data.json';
const OUTPUT_DIR = '../../../anon-exports';

// Decode RLE data back to pixels
function decodeRLE(base64Data, palette) {
  if (!base64Data || base64Data.length === 0) {
    return new Array(32 * 32).fill(null);
  }

  const buffer = Buffer.from(base64Data, 'base64');
  const data = Array.from(buffer);

  const pixels = new Array(32 * 32).fill(null);

  const top = data[0];
  const right = data[1];
  const bottom = data[2];
  const left = data[3];

  let x = left;
  let y = top;
  let i = 4;

  while (i + 1 < data.length && y < bottom) {
    const runLength = data[i];
    const colorIndex = data[i + 1];

    let remaining = runLength;
    while (remaining > 0 && y < bottom) {
      const pixelsInRow = Math.min(remaining, right - x);

      for (let j = 0; j < pixelsInRow; j++) {
        if (x < 32 && y < 32) {
          const pixelIndex = y * 32 + x;
          if (colorIndex > 0 && colorIndex <= palette.length) {
            pixels[pixelIndex] = palette[colorIndex - 1];
          }
        }
        x++;
      }

      remaining -= pixelsInRow;

      if (x >= right) {
        x = left;
        y++;
      }
    }
    i += 2;
  }

  return pixels;
}

// Composite multiple layers into one image
function compositeLayers(layers, background, palette) {
  const png = new PNG({ width: 32, height: 32 });

  const bg = hexToRgb(background);
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = bg.r;
    png.data[i + 1] = bg.g;
    png.data[i + 2] = bg.b;
    png.data[i + 3] = 255;
  }

  for (const layer of layers) {
    const pixels = decodeRLE(layer.data, palette);

    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const pixel = pixels[y * 32 + x];
        if (pixel) {
          const idx = (y * 32 + x) * 4;
          const color = hexToRgb(pixel);
          png.data[idx] = color.r;
          png.data[idx + 1] = color.g;
          png.data[idx + 2] = color.b;
          png.data[idx + 3] = 255;
        }
      }
    }
  }

  return png;
}

function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16)
  };
}

// Scale up 10x (320x320)
function scaleUp(png, scale = 10) {
  const scaled = new PNG({
    width: png.width * scale,
    height: png.height * scale
  });

  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const srcIdx = (y * png.width + x) * 4;

      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const destIdx = ((y * scale + sy) * scaled.width + (x * scale + sx)) * 4;
          scaled.data[destIdx] = png.data[srcIdx];
          scaled.data[destIdx + 1] = png.data[srcIdx + 1];
          scaled.data[destIdx + 2] = png.data[srcIdx + 2];
          scaled.data[destIdx + 3] = png.data[srcIdx + 3];
        }
      }
    }
  }

  return scaled;
}

// Generate a random seed
function randomSeed(imageData) {
  return {
    background: Math.floor(Math.random() * imageData.bgcolors.length),
    body: Math.floor(Math.random() * imageData.images.bodies.length),
    head: Math.floor(Math.random() * imageData.images.heads.length),
    specs: Math.floor(Math.random() * imageData.images.specs.length),
    antenna: Math.floor(Math.random() * imageData.images.antennas.length),
    accessory: Math.floor(Math.random() * imageData.images.accessories.length)
  };
}

// Render an Anon from a seed
function renderAnon(seed, imageData) {
  const { palette, bgcolors, images } = imageData;

  const layers = [
    images.bodies[seed.body],
    images.heads[seed.head],
    images.specs[seed.specs],
    images.antennas[seed.antenna],
    images.accessories[seed.accessory]
  ].filter(l => l && l.data);

  const background = bgcolors[seed.background];

  return compositeLayers(layers, background, palette);
}

async function main() {
  console.log('=== Generating 20 Random Anons ===\n');

  // Load image data
  let imageData;
  try {
    const data = await fs.readFile(IMAGE_DATA_FILE, 'utf-8');
    imageData = JSON.parse(data);
    console.log('✓ Loaded image-data.json');
  } catch (e) {
    console.error('✗ Could not load image-data.json');
    process.exit(1);
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  console.log(`\nGenerating 20 random Anons to ${OUTPUT_DIR}...\n`);

  for (let i = 1; i <= 20; i++) {
    const seed = randomSeed(imageData);

    const png = renderAnon(seed, imageData);
    const scaled = scaleUp(png, 10); // 320x320 final size

    const outputPath = path.join(OUTPUT_DIR, `anon-${i}.png`);
    const buffer = PNG.sync.write(scaled);
    await fs.writeFile(outputPath, buffer);

    console.log(`✓ Generated anon-${i}.png`);
  }

  console.log(`\n✓ All 20 Anons exported to ${path.resolve(OUTPUT_DIR)}`);
}

main().catch(console.error);

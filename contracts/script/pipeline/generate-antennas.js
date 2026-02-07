/**
 * Generate Anons Antennas
 *
 * Antennas are the NEW 6th trait unique to Anons (not in Nouns).
 * They extend above the head and add personality.
 *
 * Index 0 = "none" (transparent - no antenna)
 */

import { PNG } from 'pngjs';
import fs from 'fs/promises';
import path from 'path';

const OUTPUT_DIR = './generated-traits/antennas';

// Create empty 32x32 PNG
function createEmptyPNG() {
  const png = new PNG({ width: 32, height: 32 });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 0;
    png.data[i + 1] = 0;
    png.data[i + 2] = 0;
    png.data[i + 3] = 0;
  }
  return png;
}

// Set pixel
function setPixel(png, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= 32 || y < 0 || y >= 32) return;
  const idx = (y * 32 + x) * 4;
  png.data[idx] = r;
  png.data[idx + 1] = g;
  png.data[idx + 2] = b;
  png.data[idx + 3] = a;
}

// Draw a line
function drawLine(png, x1, y1, x2, y2, r, g, b) {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    setPixel(png, x1, y1, r, g, b);
    if (x1 === x2 && y1 === y2) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x1 += sx; }
    if (e2 < dx) { err += dx; y1 += sy; }
  }
}

// Draw filled rectangle
function drawRect(png, x, y, w, h, r, g, b) {
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      setPixel(png, px, py, r, g, b);
    }
  }
}

// Draw filled circle
function drawCircle(png, cx, cy, radius, r, g, b) {
  for (let py = cy - radius; py <= cy + radius; py++) {
    for (let px = cx - radius; px <= cx + radius; px++) {
      const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
      if (dist <= radius) {
        setPixel(png, px, py, r, g, b);
      }
    }
  }
}

// Colors
const METAL_GRAY = { r: 140, g: 145, b: 155 };
const DARK_GRAY = { r: 80, g: 85, b: 95 };
const BLACK = { r: 20, g: 20, b: 25 };
const RED = { r: 255, g: 50, b: 50 };
const GREEN = { r: 50, g: 255, b: 100 };
const BLUE = { r: 50, g: 150, b: 255 };
const GOLD = { r: 255, g: 200, b: 50 };
const WHITE = { r: 240, g: 240, b: 245 };

async function savePNG(png, name) {
  const outputPath = path.join(OUTPUT_DIR, `antenna-${name}.png`);
  const buffer = PNG.sync.write(png);
  await fs.writeFile(outputPath, buffer);
  return outputPath;
}

// === ANTENNA GENERATORS ===

// None (transparent)
async function generateNone() {
  const png = createEmptyPNG();
  return savePNG(png, 'none');
}

// Single rod
async function generateSingleRod() {
  const png = createEmptyPNG();
  // Vertical rod from y=0 to y=6, centered at x=15-16
  drawRect(png, 15, 0, 2, 7, METAL_GRAY.r, METAL_GRAY.g, METAL_GRAY.b);
  // Tip ball
  drawCircle(png, 15, 0, 1, RED.r, RED.g, RED.b);
  return savePNG(png, 'single-rod');
}

// Dual rabbit ears
async function generateRabbitEars() {
  const png = createEmptyPNG();
  // Left ear
  drawLine(png, 12, 6, 10, 0, METAL_GRAY.r, METAL_GRAY.g, METAL_GRAY.b);
  drawLine(png, 13, 6, 11, 0, METAL_GRAY.r, METAL_GRAY.g, METAL_GRAY.b);
  // Right ear
  drawLine(png, 19, 6, 21, 0, METAL_GRAY.r, METAL_GRAY.g, METAL_GRAY.b);
  drawLine(png, 20, 6, 22, 0, METAL_GRAY.r, METAL_GRAY.g, METAL_GRAY.b);
  // Tips
  setPixel(png, 10, 0, RED.r, RED.g, RED.b);
  setPixel(png, 22, 0, RED.r, RED.g, RED.b);
  return savePNG(png, 'rabbit-ears');
}

// Satellite dish
async function generateSatelliteDish() {
  const png = createEmptyPNG();
  // Dish (curved arc)
  for (let x = 12; x <= 20; x++) {
    const y = Math.round(2 + Math.pow((x - 16), 2) * 0.2);
    setPixel(png, x, y, METAL_GRAY.r, METAL_GRAY.g, METAL_GRAY.b);
    setPixel(png, x, y + 1, DARK_GRAY.r, DARK_GRAY.g, DARK_GRAY.b);
  }
  // Stem
  drawRect(png, 15, 4, 2, 4, DARK_GRAY.r, DARK_GRAY.g, DARK_GRAY.b);
  // Receiver
  setPixel(png, 16, 1, RED.r, RED.g, RED.b);
  return savePNG(png, 'satellite-dish');
}

// Tesla coil
async function generateTeslaCoil() {
  const png = createEmptyPNG();
  // Coil rings
  for (let y = 2; y <= 6; y++) {
    drawRect(png, 14, y, 4, 1, METAL_GRAY.r, METAL_GRAY.g, METAL_GRAY.b);
  }
  // Top sphere
  drawCircle(png, 16, 1, 2, WHITE.r, WHITE.g, WHITE.b);
  // Electric spark (blue pixels)
  setPixel(png, 12, 0, BLUE.r, BLUE.g, BLUE.b);
  setPixel(png, 20, 1, BLUE.r, BLUE.g, BLUE.b);
  setPixel(png, 11, 2, BLUE.r, BLUE.g, BLUE.b);
  return savePNG(png, 'tesla-coil');
}

// WiFi symbol
async function generateWiFi() {
  const png = createEmptyPNG();
  // Center dot
  setPixel(png, 16, 5, BLUE.r, BLUE.g, BLUE.b);
  // Inner arc
  setPixel(png, 14, 4, BLUE.r, BLUE.g, BLUE.b);
  setPixel(png, 15, 3, BLUE.r, BLUE.g, BLUE.b);
  setPixel(png, 17, 3, BLUE.r, BLUE.g, BLUE.b);
  setPixel(png, 18, 4, BLUE.r, BLUE.g, BLUE.b);
  // Outer arc
  setPixel(png, 12, 3, BLUE.r, BLUE.g, BLUE.b);
  setPixel(png, 13, 2, BLUE.r, BLUE.g, BLUE.b);
  setPixel(png, 14, 1, BLUE.r, BLUE.g, BLUE.b);
  setPixel(png, 15, 0, BLUE.r, BLUE.g, BLUE.b);
  setPixel(png, 17, 0, BLUE.r, BLUE.g, BLUE.b);
  setPixel(png, 18, 1, BLUE.r, BLUE.g, BLUE.b);
  setPixel(png, 19, 2, BLUE.r, BLUE.g, BLUE.b);
  setPixel(png, 20, 3, BLUE.r, BLUE.g, BLUE.b);
  return savePNG(png, 'wifi');
}

// Propeller
async function generatePropeller() {
  const png = createEmptyPNG();
  // Center hub
  drawRect(png, 15, 3, 2, 2, DARK_GRAY.r, DARK_GRAY.g, DARK_GRAY.b);
  // Blades (4 directions)
  drawRect(png, 15, 0, 2, 3, METAL_GRAY.r, METAL_GRAY.g, METAL_GRAY.b);
  drawRect(png, 12, 3, 3, 2, METAL_GRAY.r, METAL_GRAY.g, METAL_GRAY.b);
  drawRect(png, 17, 3, 3, 2, METAL_GRAY.r, METAL_GRAY.g, METAL_GRAY.b);
  drawRect(png, 15, 5, 2, 2, METAL_GRAY.r, METAL_GRAY.g, METAL_GRAY.b);
  return savePNG(png, 'propeller');
}

// Unicorn horn
async function generateUnicornHorn() {
  const png = createEmptyPNG();
  // Spiral horn
  for (let y = 0; y <= 6; y++) {
    const x = 16 - Math.floor(y / 3);
    const width = Math.max(1, 3 - Math.floor(y / 2));
    // Alternate gold and white for spiral effect
    const color = y % 2 === 0 ? GOLD : WHITE;
    drawRect(png, x, y, width, 1, color.r, color.g, color.b);
  }
  return savePNG(png, 'unicorn-horn');
}

// Crown
async function generateCrown() {
  const png = createEmptyPNG();
  // Base band
  drawRect(png, 12, 5, 8, 2, GOLD.r, GOLD.g, GOLD.b);
  // Spikes
  setPixel(png, 12, 4, GOLD.r, GOLD.g, GOLD.b);
  setPixel(png, 13, 3, GOLD.r, GOLD.g, GOLD.b);
  setPixel(png, 14, 4, GOLD.r, GOLD.g, GOLD.b);

  setPixel(png, 15, 2, GOLD.r, GOLD.g, GOLD.b);
  setPixel(png, 16, 1, GOLD.r, GOLD.g, GOLD.b);
  setPixel(png, 17, 2, GOLD.r, GOLD.g, GOLD.b);

  setPixel(png, 18, 4, GOLD.r, GOLD.g, GOLD.b);
  setPixel(png, 19, 3, GOLD.r, GOLD.g, GOLD.b);
  setPixel(png, 20, 4, GOLD.r, GOLD.g, GOLD.b);

  // Gems
  setPixel(png, 16, 0, RED.r, RED.g, RED.b);
  return savePNG(png, 'crown');
}

// Lightning rod
async function generateLightningRod() {
  const png = createEmptyPNG();
  // Rod
  drawRect(png, 15, 1, 2, 6, METAL_GRAY.r, METAL_GRAY.g, METAL_GRAY.b);
  // Pointed tip
  setPixel(png, 15, 0, WHITE.r, WHITE.g, WHITE.b);
  setPixel(png, 16, 0, WHITE.r, WHITE.g, WHITE.b);
  // Lightning bolt
  setPixel(png, 18, 0, GOLD.r, GOLD.g, GOLD.b);
  setPixel(png, 17, 1, GOLD.r, GOLD.g, GOLD.b);
  setPixel(png, 18, 2, GOLD.r, GOLD.g, GOLD.b);
  setPixel(png, 19, 3, GOLD.r, GOLD.g, GOLD.b);
  return savePNG(png, 'lightning-rod');
}

// Periscope
async function generatePeriscope() {
  const png = createEmptyPNG();
  // Vertical tube
  drawRect(png, 15, 2, 3, 5, METAL_GRAY.r, METAL_GRAY.g, METAL_GRAY.b);
  // Top bend
  drawRect(png, 15, 0, 5, 3, METAL_GRAY.r, METAL_GRAY.g, METAL_GRAY.b);
  // Lens
  setPixel(png, 19, 1, BLUE.r, BLUE.g, BLUE.b);
  return savePNG(png, 'periscope');
}

// Flag
async function generateFlag() {
  const png = createEmptyPNG();
  // Pole
  drawRect(png, 15, 0, 1, 7, METAL_GRAY.r, METAL_GRAY.g, METAL_GRAY.b);
  // Flag
  drawRect(png, 16, 0, 5, 3, RED.r, RED.g, RED.b);
  // Add white stripe
  drawRect(png, 16, 1, 5, 1, WHITE.r, WHITE.g, WHITE.b);
  return savePNG(png, 'flag');
}

// Sprout (plant growing from head)
async function generateSprout() {
  const png = createEmptyPNG();
  // Stem
  drawRect(png, 15, 3, 2, 4, GREEN.r, GREEN.g - 100, GREEN.b - 50);
  // Leaves
  setPixel(png, 13, 2, GREEN.r, GREEN.g, GREEN.b);
  setPixel(png, 14, 1, GREEN.r, GREEN.g, GREEN.b);
  setPixel(png, 18, 2, GREEN.r, GREEN.g, GREEN.b);
  setPixel(png, 19, 1, GREEN.r, GREEN.g, GREEN.b);
  setPixel(png, 15, 0, GREEN.r, GREEN.g, GREEN.b);
  setPixel(png, 16, 0, GREEN.r, GREEN.g, GREEN.b);
  return savePNG(png, 'sprout');
}

// Arrow through head
async function generateArrow() {
  const png = createEmptyPNG();
  // Shaft
  drawRect(png, 8, 3, 16, 1, METAL_GRAY.r, METAL_GRAY.g, METAL_GRAY.b);
  // Arrow head (right side)
  setPixel(png, 24, 2, METAL_GRAY.r, METAL_GRAY.g, METAL_GRAY.b);
  setPixel(png, 25, 3, METAL_GRAY.r, METAL_GRAY.g, METAL_GRAY.b);
  setPixel(png, 24, 4, METAL_GRAY.r, METAL_GRAY.g, METAL_GRAY.b);
  // Fletching (left side)
  setPixel(png, 8, 2, RED.r, RED.g, RED.b);
  setPixel(png, 8, 4, RED.r, RED.g, RED.b);
  setPixel(png, 7, 1, RED.r, RED.g, RED.b);
  setPixel(png, 7, 5, RED.r, RED.g, RED.b);
  return savePNG(png, 'arrow');
}

// Halo
async function generateHalo() {
  const png = createEmptyPNG();
  // Oval halo
  for (let x = 12; x <= 20; x++) {
    setPixel(png, x, 0, GOLD.r, GOLD.g, GOLD.b);
    setPixel(png, x, 2, GOLD.r, GOLD.g, GOLD.b);
  }
  setPixel(png, 11, 1, GOLD.r, GOLD.g, GOLD.b);
  setPixel(png, 21, 1, GOLD.r, GOLD.g, GOLD.b);
  return savePNG(png, 'halo');
}

// Radar spinner
async function generateRadar() {
  const png = createEmptyPNG();
  // Base
  drawRect(png, 14, 5, 4, 2, DARK_GRAY.r, DARK_GRAY.g, DARK_GRAY.b);
  // Spinning dish
  drawLine(png, 16, 4, 12, 0, METAL_GRAY.r, METAL_GRAY.g, METAL_GRAY.b);
  drawLine(png, 16, 4, 20, 0, METAL_GRAY.r, METAL_GRAY.g, METAL_GRAY.b);
  // Sweep indicator
  setPixel(png, 13, 1, GREEN.r, GREEN.g, GREEN.b);
  return savePNG(png, 'radar');
}

async function main() {
  console.log('=== Generate Anons Antennas ===\n');

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const generated = [];

  console.log('Generating antennas...');

  // Index 0 must be "none"
  generated.push(await generateNone());

  // Classic
  generated.push(await generateSingleRod());
  generated.push(await generateRabbitEars());
  generated.push(await generateSatelliteDish());
  generated.push(await generateLightningRod());

  // Tech
  generated.push(await generateWiFi());
  generated.push(await generateRadar());
  generated.push(await generateTeslaCoil());
  generated.push(await generatePeriscope());

  // Weird
  generated.push(await generatePropeller());
  generated.push(await generateUnicornHorn());
  generated.push(await generateCrown());
  generated.push(await generateFlag());
  generated.push(await generateSprout());
  generated.push(await generateArrow());
  generated.push(await generateHalo());

  console.log(`\n✓ Generated ${generated.length} antenna variants`);
  console.log(`  Output: ${OUTPUT_DIR}`);
  console.log(`  Index 0 = "none" (transparent)`);
}

main().catch(console.error);

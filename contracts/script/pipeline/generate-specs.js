/**
 * Generate Anons Specs
 *
 * The specs are the signature Anons trait - horizontal LED visor bars.
 * Unlike Nouns glasses which vary in shape, Anons specs:
 * - Always same position: rows 10-13, cols 6-25 (20px wide, 4px tall)
 * - Always same shape: ◖▬◗ rounded ends
 * - Only color/pattern varies
 *
 * This script generates all specs variants programmatically.
 */

import { PNG } from 'pngjs';
import fs from 'fs/promises';
import path from 'path';

const OUTPUT_DIR = './generated-traits/specs';

// Specs position (constant)
const SPECS = {
  startX: 6,
  endX: 25,
  startY: 10,
  endY: 13,
  width: 20,
  height: 4
};

// Color definitions
const COLORS = {
  // Dawn solids (warm)
  amber: '#FFB000',
  gold: '#FFD700',
  warmWhite: '#FFF5E6',
  coral: '#FF6B6B',
  peach: '#FFAA80',
  copper: '#B87333',
  bronze: '#CD7F32',
  flameOrange: '#FF4500',
  sunrisePink: '#FFB6C1',
  honey: '#EB9605',

  // Dusk solids (cool) — all colors must read as emissive LED glow
  indigo: '#7755EE',      // was #4B0082 — brightened for visibility on dark heads
  cyan: '#00FFFF',
  iceBlue: '#99FFFF',
  violet: '#9933FF',      // was #8B00FF — slightly brightened
  lavender: '#B57EDC',
  steelBlue: '#4682B4',
  midnight: '#5577DD',    // was #191970 — LED midnight blue, not paint midnight
  deepPurple: '#9944CC',  // was #301934 — neon purple, visible on any head
  teal: '#00AAAA',        // was #008080 — boosted for dark-head readability
  silver: '#C0C0C0',

  // Special
  white: '#FFFFFF',
  black: '#000000',
  red: '#FF0000',
  green: '#00FF00',
  blue: '#0000FF',
};

// Parse hex color to RGB
function hexToRGB(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}

// Create empty 32x32 PNG
function createEmptyPNG() {
  const png = new PNG({ width: 32, height: 32 });
  // Fill with transparent
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 0;
    png.data[i + 1] = 0;
    png.data[i + 2] = 0;
    png.data[i + 3] = 0;
  }
  return png;
}

// Set pixel in PNG
function setPixel(png, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= 32 || y < 0 || y >= 32) return;
  const idx = (y * 32 + x) * 4;
  png.data[idx] = r;
  png.data[idx + 1] = g;
  png.data[idx + 2] = b;
  png.data[idx + 3] = a;
}

// Enforce minimum perceived brightness for LED visor effect.
// Specs must be visible on ANY head, including near-black ones.
const MIN_SPECS_LUMINANCE = 55;

function enforceMinBrightness(r, g, b) {
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  if (lum >= MIN_SPECS_LUMINANCE) return { r, g, b };
  // Boost all channels proportionally, preserving hue
  const scale = MIN_SPECS_LUMINANCE / Math.max(lum, 1);
  return {
    r: Math.min(255, Math.round(r * scale)),
    g: Math.min(255, Math.round(g * scale)),
    b: Math.min(255, Math.round(b * scale)),
  };
}

// Draw the specs bar shape with black endcaps and outline: ◖▬▬◗
function drawSpecsBar(png, colorFn) {
  const CAP_WIDTH = 2; // Black endcap columns on each side

  // Main bar: rows 10-13, cols 6-25
  for (let y = SPECS.startY; y <= SPECS.endY; y++) {
    for (let x = SPECS.startX; x <= SPECS.endX; x++) {
      const isLeftCap = x < SPECS.startX + CAP_WIDTH;
      const isRightCap = x > SPECS.endX - CAP_WIDTH;

      if (isLeftCap || isRightCap) {
        setPixel(png, x, y, 0, 0, 0); // Black cap
      } else {
        const raw = colorFn(x, y);
        const { r, g, b } = enforceMinBrightness(raw.r, raw.g, raw.b);
        setPixel(png, x, y, r, g, b);
      }
    }
  }

  // Rounded ends (make corners transparent for ◖ and ◗ shape)
  setPixel(png, SPECS.startX, SPECS.startY, 0, 0, 0, 0);
  setPixel(png, SPECS.startX, SPECS.endY, 0, 0, 0, 0);
  setPixel(png, SPECS.endX, SPECS.startY, 0, 0, 0, 0);
  setPixel(png, SPECS.endX, SPECS.endY, 0, 0, 0, 0);

  // Black outline: scan all pixels and outline non-transparent areas
  const outlinePixels = [];
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const idx = (y * 32 + x) * 4;
      if (png.data[idx + 3] === 0) {
        // Transparent pixel — check if any neighbor is opaque
        const neighbors = [
          [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]
        ];
        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < 32 && ny >= 0 && ny < 32) {
            const nIdx = (ny * 32 + nx) * 4;
            if (png.data[nIdx + 3] > 0) {
              outlinePixels.push([x, y]);
              break;
            }
          }
        }
      }
    }
  }

  // Draw outline pixels
  for (const [x, y] of outlinePixels) {
    setPixel(png, x, y, 0, 0, 0, 255);
  }
}

// Generate solid color specs with visible row-based shading (convex visor look)
async function generateSolid(name, hex) {
  const png = createEmptyPNG();
  const { r, g, b } = hexToRGB(hex);

  // Row shading: top highlight → base → base → bottom shadow
  // Creates a cylindrical/convex 3D appearance
  // Bottom kept at 0.8 (not 0.65) — LEDs glow, they don't shadow aggressively
  const rowMultiplier = [1.2, 1.05, 0.9, 0.8];
  const centerX = SPECS.startX + SPECS.width / 2;
  const maxDistX = SPECS.width / 2;

  drawSpecsBar(png, (x, y) => {
    const row = y - SPECS.startY;
    const rowMul = rowMultiplier[row] || 1.0;
    // Subtle horizontal falloff: edges ~10% darker
    const dx = Math.abs(x - centerX) / maxDistX;
    const edgeMul = 1.0 - dx * 0.1;
    const mul = rowMul * edgeMul;
    return {
      r: Math.round(Math.min(255, r * mul)),
      g: Math.round(Math.min(255, g * mul)),
      b: Math.round(Math.min(255, b * mul))
    };
  });

  const outputPath = path.join(OUTPUT_DIR, `specs-${name}.png`);
  const buffer = PNG.sync.write(png);
  await fs.writeFile(outputPath, buffer);

  return outputPath;
}

// Generate gradient specs (left to right)
async function generateGradient(name, startHex, endHex) {
  const png = createEmptyPNG();
  const start = hexToRGB(startHex);
  const end = hexToRGB(endHex);

  drawSpecsBar(png, (x) => {
    const t = (x - SPECS.startX) / SPECS.width;
    return {
      r: Math.round(start.r + (end.r - start.r) * t),
      g: Math.round(start.g + (end.g - start.g) * t),
      b: Math.round(start.b + (end.b - start.b) * t)
    };
  });

  const outputPath = path.join(OUTPUT_DIR, `specs-${name}.png`);
  const buffer = PNG.sync.write(png);
  await fs.writeFile(outputPath, buffer);

  return outputPath;
}

// Generate split specs (two colors meeting in middle)
async function generateSplit(name, leftHex, rightHex) {
  const png = createEmptyPNG();
  const left = hexToRGB(leftHex);
  const right = hexToRGB(rightHex);
  const mid = SPECS.startX + Math.floor(SPECS.width / 2);

  drawSpecsBar(png, (x) => {
    return x < mid ? left : right;
  });

  const outputPath = path.join(OUTPUT_DIR, `specs-${name}.png`);
  const buffer = PNG.sync.write(png);
  await fs.writeFile(outputPath, buffer);

  return outputPath;
}

// Generate scan pulse pattern (bright center fading out)
async function generateScanPulse(name, hex) {
  const png = createEmptyPNG();
  const base = hexToRGB(hex);
  const center = SPECS.startX + Math.floor(SPECS.width / 2);

  drawSpecsBar(png, (x) => {
    const dist = Math.abs(x - center);
    const maxDist = SPECS.width / 2;
    const intensity = 1 - (dist / maxDist) * 0.7; // Keep minimum 30% brightness

    return {
      r: Math.round(base.r * intensity),
      g: Math.round(base.g * intensity),
      b: Math.round(base.b * intensity)
    };
  });

  const outputPath = path.join(OUTPUT_DIR, `specs-${name}.png`);
  const buffer = PNG.sync.write(png);
  await fs.writeFile(outputPath, buffer);

  return outputPath;
}

// Generate equalizer pattern (vertical bars)
async function generateEqualizer(name, hex, bars = 5) {
  const png = createEmptyPNG();
  const base = hexToRGB(hex);
  const barWidth = Math.floor(SPECS.width / bars);

  // Random-ish heights for each bar
  const heights = [0.8, 1.0, 0.6, 0.9, 0.7];

  drawSpecsBar(png, (x, y) => {
    const barIndex = Math.floor((x - SPECS.startX) / barWidth) % bars;
    const intensity = heights[barIndex];

    return {
      r: Math.round(base.r * intensity),
      g: Math.round(base.g * intensity),
      b: Math.round(base.b * intensity)
    };
  });

  const outputPath = path.join(OUTPUT_DIR, `specs-${name}.png`);
  const buffer = PNG.sync.write(png);
  await fs.writeFile(outputPath, buffer);

  return outputPath;
}

// Generate binary ticker pattern (01010...)
async function generateBinary(name, onHex, offHex) {
  const png = createEmptyPNG();
  const on = hexToRGB(onHex);
  const off = hexToRGB(offHex);

  // Binary pattern: 0101 0011 1001 0110 1010 (20 bits)
  const pattern = [0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0];

  drawSpecsBar(png, (x) => {
    const bit = pattern[x - SPECS.startX] || 0;
    return bit ? on : off;
  });

  const outputPath = path.join(OUTPUT_DIR, `specs-${name}.png`);
  const buffer = PNG.sync.write(png);
  await fs.writeFile(outputPath, buffer);

  return outputPath;
}

// Generate loading bar pattern
async function generateLoadingBar(name, hex, progress = 0.7) {
  const png = createEmptyPNG();
  const base = hexToRGB(hex);
  const fillEnd = SPECS.startX + Math.floor(SPECS.width * progress);

  drawSpecsBar(png, (x) => {
    if (x <= fillEnd) {
      return base;
    } else {
      // Dim unfilled portion
      return {
        r: Math.round(base.r * 0.2),
        g: Math.round(base.g * 0.2),
        b: Math.round(base.b * 0.2)
      };
    }
  });

  const outputPath = path.join(OUTPUT_DIR, `specs-${name}.png`);
  const buffer = PNG.sync.write(png);
  await fs.writeFile(outputPath, buffer);

  return outputPath;
}

// Generate rainbow/chromatic specs
async function generateChromatic(name) {
  const png = createEmptyPNG();

  drawSpecsBar(png, (x) => {
    const hue = ((x - SPECS.startX) / SPECS.width) * 360;
    // HSL to RGB conversion for full saturation/lightness
    const c = 1;
    const xVal = c * (1 - Math.abs((hue / 60) % 2 - 1));
    const m = 0;

    let r, g, b;
    if (hue < 60) { r = c; g = xVal; b = 0; }
    else if (hue < 120) { r = xVal; g = c; b = 0; }
    else if (hue < 180) { r = 0; g = c; b = xVal; }
    else if (hue < 240) { r = 0; g = xVal; b = c; }
    else if (hue < 300) { r = xVal; g = 0; b = c; }
    else { r = c; g = 0; b = xVal; }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  });

  const outputPath = path.join(OUTPUT_DIR, `specs-${name}.png`);
  const buffer = PNG.sync.write(png);
  await fs.writeFile(outputPath, buffer);

  return outputPath;
}

// Generate strobe pattern (alternating bright/dim columns)
async function generateStrobe(name, hex, colWidth = 2) {
  const png = createEmptyPNG();
  const base = hexToRGB(hex);

  drawSpecsBar(png, (x) => {
    const col = Math.floor((x - SPECS.startX) / colWidth);
    const bright = col % 2 === 0;
    const mul = bright ? 1.0 : 0.3;
    return {
      r: Math.round(base.r * mul),
      g: Math.round(base.g * mul),
      b: Math.round(base.b * mul)
    };
  });

  const outputPath = path.join(OUTPUT_DIR, `specs-${name}.png`);
  await fs.writeFile(outputPath, PNG.sync.write(png));
  return outputPath;
}

// Generate noise/static pattern (random-looking brightness per column)
async function generateNoise(name, hex, seed = 42) {
  const png = createEmptyPNG();
  const base = hexToRGB(hex);

  // Deterministic pseudo-random per column
  const noise = [];
  let s = seed;
  for (let i = 0; i < 20; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    noise.push(0.3 + (s % 100) / 100 * 0.7);
  }

  drawSpecsBar(png, (x) => {
    const col = x - SPECS.startX;
    const mul = noise[col] || 0.5;
    return {
      r: Math.round(base.r * mul),
      g: Math.round(base.g * mul),
      b: Math.round(base.b * mul)
    };
  });

  const outputPath = path.join(OUTPUT_DIR, `specs-${name}.png`);
  await fs.writeFile(outputPath, PNG.sync.write(png));
  return outputPath;
}

// Generate wave pattern (sine-wave brightness)
async function generateWave(name, hex, freq = 2) {
  const png = createEmptyPNG();
  const base = hexToRGB(hex);

  drawSpecsBar(png, (x) => {
    const t = (x - SPECS.startX) / SPECS.width;
    const wave = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * freq);
    const mul = 0.3 + wave * 0.7;
    return {
      r: Math.round(base.r * mul),
      g: Math.round(base.g * mul),
      b: Math.round(base.b * mul)
    };
  });

  const outputPath = path.join(OUTPUT_DIR, `specs-${name}.png`);
  await fs.writeFile(outputPath, PNG.sync.write(png));
  return outputPath;
}

// Generate center-dot pattern (single bright pixel in center, dim elsewhere)
async function generateCenterDot(name, hex) {
  const png = createEmptyPNG();
  const base = hexToRGB(hex);
  const center = SPECS.startX + Math.floor(SPECS.width / 2);

  drawSpecsBar(png, (x, y) => {
    const dx = Math.abs(x - center);
    const dy = Math.abs(y - (SPECS.startY + 1.5));
    const dist = Math.sqrt(dx * dx + dy * dy);
    const mul = dist <= 1.5 ? 1.0 : 0.15;
    return {
      r: Math.round(base.r * mul),
      g: Math.round(base.g * mul),
      b: Math.round(base.b * mul)
    };
  });

  const outputPath = path.join(OUTPUT_DIR, `specs-${name}.png`);
  await fs.writeFile(outputPath, PNG.sync.write(png));
  return outputPath;
}

// Generate dual-dot pattern (two bright spots)
async function generateDualDot(name, hex) {
  const png = createEmptyPNG();
  const base = hexToRGB(hex);
  const left = SPECS.startX + 4;
  const right = SPECS.endX - 4;
  const midY = SPECS.startY + 1.5;

  drawSpecsBar(png, (x, y) => {
    const dl = Math.sqrt((x - left) ** 2 + (y - midY) ** 2);
    const dr = Math.sqrt((x - right) ** 2 + (y - midY) ** 2);
    const mul = (dl <= 1.5 || dr <= 1.5) ? 1.0 : 0.15;
    return {
      r: Math.round(base.r * mul),
      g: Math.round(base.g * mul),
      b: Math.round(base.b * mul)
    };
  });

  const outputPath = path.join(OUTPUT_DIR, `specs-${name}.png`);
  await fs.writeFile(outputPath, PNG.sync.write(png));
  return outputPath;
}

// Generate half pattern (left half one color, right half dimmed)
async function generateHalf(name, hex, leftBright = true) {
  const png = createEmptyPNG();
  const base = hexToRGB(hex);
  const mid = SPECS.startX + Math.floor(SPECS.width / 2);

  drawSpecsBar(png, (x) => {
    const isLeft = x < mid;
    const bright = leftBright ? isLeft : !isLeft;
    const mul = bright ? 1.0 : 0.2;
    return {
      r: Math.round(base.r * mul),
      g: Math.round(base.g * mul),
      b: Math.round(base.b * mul)
    };
  });

  const outputPath = path.join(OUTPUT_DIR, `specs-${name}.png`);
  await fs.writeFile(outputPath, PNG.sync.write(png));
  return outputPath;
}

async function main() {
  console.log('=== Generate Anons Specs ===\n');

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const generated = [];

  // Dawn solids
  console.log('Generating dawn solids...');
  generated.push(await generateSolid('amber', COLORS.amber));
  generated.push(await generateSolid('gold', COLORS.gold));
  generated.push(await generateSolid('warm-white', COLORS.warmWhite));
  generated.push(await generateSolid('coral', COLORS.coral));
  generated.push(await generateSolid('peach', COLORS.peach));
  generated.push(await generateSolid('copper', COLORS.copper));
  generated.push(await generateSolid('bronze', COLORS.bronze));
  generated.push(await generateSolid('flame-orange', COLORS.flameOrange));
  generated.push(await generateSolid('sunrise-pink', COLORS.sunrisePink));
  generated.push(await generateSolid('honey', COLORS.honey));

  // Dusk solids
  console.log('Generating dusk solids...');
  generated.push(await generateSolid('indigo', COLORS.indigo));
  generated.push(await generateSolid('cyan', COLORS.cyan));
  generated.push(await generateSolid('ice-blue', COLORS.iceBlue));
  generated.push(await generateSolid('violet', COLORS.violet));
  generated.push(await generateSolid('lavender', COLORS.lavender));
  generated.push(await generateSolid('steel-blue', COLORS.steelBlue));
  generated.push(await generateSolid('midnight', COLORS.midnight));
  generated.push(await generateSolid('deep-purple', COLORS.deepPurple));
  generated.push(await generateSolid('teal', COLORS.teal));
  generated.push(await generateSolid('silver', COLORS.silver));

  // Patterns
  console.log('Generating patterns...');
  generated.push(await generateScanPulse('scan-pulse-amber', COLORS.amber));
  generated.push(await generateScanPulse('scan-pulse-cyan', COLORS.cyan));
  generated.push(await generateEqualizer('equalizer-green', COLORS.green));
  generated.push(await generateEqualizer('equalizer-cyan', COLORS.cyan));
  generated.push(await generateBinary('binary-green', COLORS.green, '#003300'));
  generated.push(await generateBinary('binary-amber', COLORS.amber, '#332200'));
  generated.push(await generateLoadingBar('loading-70', COLORS.cyan, 0.7));
  generated.push(await generateLoadingBar('loading-50', COLORS.amber, 0.5));

  // Gradients
  console.log('Generating gradients...');
  generated.push(await generateGradient('sunset', COLORS.flameOrange, COLORS.deepPurple));
  generated.push(await generateGradient('ocean', COLORS.teal, COLORS.cyan));
  generated.push(await generateGradient('fire', COLORS.red, COLORS.gold));

  // Splits
  console.log('Generating splits...');
  generated.push(await generateSplit('split-cyan-amber', COLORS.cyan, COLORS.amber));
  generated.push(await generateSplit('split-red-blue', COLORS.red, COLORS.blue));

  // More solids
  console.log('Generating extra solids...');
  generated.push(await generateSolid('lime', '#88FF00'));
  generated.push(await generateSolid('hot-pink', '#FF1493'));
  generated.push(await generateSolid('electric-blue', '#0066FF'));
  generated.push(await generateSolid('neon-green', '#39FF14'));
  generated.push(await generateSolid('rose', '#FF6699'));
  generated.push(await generateSolid('sky', '#87CEEB'));
  generated.push(await generateSolid('mint', '#66FFB2'));
  generated.push(await generateSolid('tangerine', '#FF9966'));

  // More gradients
  console.log('Generating extra gradients...');
  generated.push(await generateGradient('ice', '#FFFFFF', COLORS.cyan));
  generated.push(await generateGradient('ember', COLORS.red, COLORS.amber));
  generated.push(await generateGradient('toxic', '#39FF14', COLORS.gold));
  generated.push(await generateGradient('twilight', '#9933FF', '#5577DD'));
  generated.push(await generateGradient('cherry', COLORS.red, '#FF6699'));
  generated.push(await generateGradient('aurora', '#39FF14', '#7755EE'));

  // More splits
  console.log('Generating extra splits...');
  generated.push(await generateSplit('split-green-red', COLORS.green, COLORS.red));
  generated.push(await generateSplit('split-amber-violet', COLORS.amber, '#9933FF'));
  generated.push(await generateSplit('split-white-teal', '#FFFFFF', COLORS.teal));
  generated.push(await generateSplit('split-pink-cyan', '#FF6699', COLORS.cyan));

  // Strobe patterns
  console.log('Generating strobes...');
  generated.push(await generateStrobe('strobe-cyan', COLORS.cyan, 2));
  generated.push(await generateStrobe('strobe-amber', COLORS.amber, 2));
  generated.push(await generateStrobe('strobe-green', COLORS.green, 1));
  generated.push(await generateStrobe('strobe-red', COLORS.red, 3));

  // Noise/static patterns
  console.log('Generating noise...');
  generated.push(await generateNoise('noise-green', COLORS.green, 42));
  generated.push(await generateNoise('noise-cyan', COLORS.cyan, 77));
  generated.push(await generateNoise('noise-amber', COLORS.amber, 13));

  // Wave patterns
  console.log('Generating waves...');
  generated.push(await generateWave('wave-cyan', COLORS.cyan, 2));
  generated.push(await generateWave('wave-amber', COLORS.amber, 3));
  generated.push(await generateWave('wave-green', COLORS.green, 1.5));

  // Center dot / dual dot (eye-like)
  console.log('Generating dots...');
  generated.push(await generateCenterDot('dot-red', COLORS.red));
  generated.push(await generateCenterDot('dot-cyan', COLORS.cyan));
  generated.push(await generateDualDot('eyes-amber', COLORS.amber));
  generated.push(await generateDualDot('eyes-cyan', COLORS.cyan));
  generated.push(await generateDualDot('eyes-red', COLORS.red));

  // Half patterns
  console.log('Generating halves...');
  generated.push(await generateHalf('half-left-amber', COLORS.amber, true));
  generated.push(await generateHalf('half-right-cyan', COLORS.cyan, false));

  // Extra patterns with existing generators
  generated.push(await generateScanPulse('scan-pulse-red', COLORS.red));
  generated.push(await generateScanPulse('scan-pulse-green', COLORS.green));
  generated.push(await generateEqualizer('equalizer-amber', COLORS.amber));
  generated.push(await generateBinary('binary-cyan', COLORS.cyan, '#003333'));
  generated.push(await generateLoadingBar('loading-90', COLORS.green, 0.9));
  generated.push(await generateLoadingBar('loading-30', COLORS.red, 0.3));

  // Specials
  console.log('Generating specials...');
  generated.push(await generateChromatic('chromatic'));
  generated.push(await generateSolid('whiteout', COLORS.white));
  generated.push(await generateSolid('blackout', '#556677'));

  console.log(`\n✓ Generated ${generated.length} specs variants`);
  console.log(`  Output: ${OUTPUT_DIR}`);
}

main().catch(console.error);

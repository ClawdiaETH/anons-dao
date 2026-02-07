/**
 * Generate 61 New Robot-Themed Head PNGs (with robot mouths)
 *
 * Reads curation/new-heads-spec.json for the list of head names,
 * draws each head using pixel art primitives on a 32x32 canvas,
 * and writes PNGs to curated-traits/heads/.
 *
 * All patterns are deterministic (no Math.random) for reproducible builds.
 */

import { PNG } from 'pngjs';
import fs from 'fs/promises';
import path from 'path';
import {
  grillHorizontal, grillVertical, slotSingle, slotDouble,
  speakerDots, ledSegments, ledBar, pixelNeutral, pixelSmile,
  pixelFrown, ventAngled, buttonsRow, screenMini, zipper,
  teethSquare, selectMouthColor,
} from './mouth-lib.js';

const OUTPUT_DIR = './curated-traits/heads';
const SPEC_PATH = './curation/new-heads-spec.json';

// ─────────────────────────────────────
// Drawing Primitives
// ─────────────────────────────────────

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

function setPixel(png, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= 32 || y < 0 || y >= 32) return;
  const idx = (y * 32 + x) * 4;
  png.data[idx] = r;
  png.data[idx + 1] = g;
  png.data[idx + 2] = b;
  png.data[idx + 3] = a;
}

function getPixelAlpha(png, x, y) {
  if (x < 0 || x >= 32 || y < 0 || y >= 32) return 0;
  return png.data[(y * 32 + x) * 4 + 3];
}

function rect(png, x, y, w, h, color) {
  const [r, g, b] = parseColor(color);
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      setPixel(png, px, py, r, g, b);
    }
  }
}

function border(png, x, y, w, h, color) {
  const [r, g, b] = parseColor(color);
  for (let px = x; px < x + w; px++) {
    setPixel(png, px, y, r, g, b);
    setPixel(png, px, y + h - 1, r, g, b);
  }
  for (let py = y; py < y + h; py++) {
    setPixel(png, x, py, r, g, b);
    setPixel(png, x + w - 1, py, r, g, b);
  }
}

function hline(png, x1, x2, y, color) {
  const [r, g, b] = parseColor(color);
  const start = Math.min(x1, x2);
  const end = Math.max(x1, x2);
  for (let px = start; px <= end; px++) {
    setPixel(png, px, y, r, g, b);
  }
}

function vline(png, x, y1, y2, color) {
  const [r, g, b] = parseColor(color);
  const start = Math.min(y1, y2);
  const end = Math.max(y1, y2);
  for (let py = start; py <= end; py++) {
    setPixel(png, x, py, r, g, b);
  }
}

function circle(png, cx, cy, radius, color) {
  const [r, g, b] = parseColor(color);
  for (let py = cy - radius; py <= cy + radius; py++) {
    for (let px = cx - radius; px <= cx + radius; px++) {
      if (Math.sqrt((px - cx) ** 2 + (py - cy) ** 2) <= radius + 0.3) {
        setPixel(png, px, py, r, g, b);
      }
    }
  }
}

function circleOutline(png, cx, cy, radius, color) {
  const [r, g, b] = parseColor(color);
  for (let py = cy - radius - 1; py <= cy + radius + 1; py++) {
    for (let px = cx - radius - 1; px <= cx + radius + 1; px++) {
      const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
      if (dist >= radius - 0.5 && dist <= radius + 0.5) {
        setPixel(png, px, py, r, g, b);
      }
    }
  }
}

function pixel(png, x, y, color) {
  const [r, g, b] = parseColor(color);
  setPixel(png, x, y, r, g, b);
}

function line(png, x1, y1, x2, y2, color) {
  const [r, g, b] = parseColor(color);
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;
  let cx = x1, cy = y1;
  while (true) {
    setPixel(png, cx, cy, r, g, b);
    if (cx === x2 && cy === y2) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; cx += sx; }
    if (e2 < dx) { err += dx; cy += sy; }
  }
}

/** Add 1px black outline around all opaque pixels */
function autoOutline(png, color = '#000000') {
  const [r, g, b] = parseColor(color);
  const toSet = [];
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      if (getPixelAlpha(png, x, y) > 0) continue;
      // Check 4-connected neighbors
      if (
        getPixelAlpha(png, x - 1, y) > 0 ||
        getPixelAlpha(png, x + 1, y) > 0 ||
        getPixelAlpha(png, x, y - 1) > 0 ||
        getPixelAlpha(png, x, y + 1) > 0
      ) {
        toSet.push([x, y]);
      }
    }
  }
  for (const [x, y] of toSet) {
    setPixel(png, x, y, r, g, b);
  }
}

function parseColor(hex) {
  if (typeof hex !== 'string') return hex;
  hex = hex.replace('#', '');
  return [
    parseInt(hex.substring(0, 2), 16),
    parseInt(hex.substring(2, 4), 16),
    parseInt(hex.substring(4, 6), 16),
  ];
}

async function savePNG(png, name) {
  const outputPath = path.join(OUTPUT_DIR, `${name}.png`);
  const buffer = PNG.sync.write(png);
  await fs.writeFile(outputPath, buffer);
  return outputPath;
}

// ─────────────────────────────────────
// HEAD DEFINITIONS
// ─────────────────────────────────────

// === SCREENS & MONITORS (8) ===

function drawCrtStatic() {
  const png = createEmptyPNG();
  // Gray bezel
  rect(png, 7, 7, 18, 18, '#808080');
  // Dark screen
  rect(png, 9, 9, 14, 14, '#1a1a1a');
  // Fixed checkerboard static pattern
  for (let y = 9; y < 23; y++) {
    for (let x = 9; x < 23; x++) {
      if ((x + y * 3) % 5 === 0) pixel(png, x, y, '#ffffff');
      else if ((x * 2 + y) % 7 === 0) pixel(png, x, y, '#c0c0c0');
      else if ((x + y * 2) % 9 === 0) pixel(png, x, y, '#666666');
    }
  }
  // Bezel highlight top
  hline(png, 7, 24, 7, '#a0a0a0');
  // Mouth: speaker grille below screen
  grillHorizontal(png, 16, 18, 14, '#555555');
  autoOutline(png);
  return png;
}

function drawOscilloscope() {
  const png = createEmptyPNG();
  // Dark body
  rect(png, 7, 8, 18, 17, '#2a2a2a');
  // Screen area
  rect(png, 9, 9, 14, 12, '#001a00');
  // Green sine wave across screen
  const wave = [14, 13, 11, 10, 10, 11, 13, 14, 16, 18, 19, 19, 18, 16];
  for (let i = 0; i < wave.length; i++) {
    pixel(png, 9 + i, wave[i], '#00ff41');
    // Glow pixels above and below
    setPixel(png, 9 + i, wave[i] - 1, 0, 80, 20, 128);
    setPixel(png, 9 + i, wave[i] + 1, 0, 80, 20, 128);
  }
  // Knobs at bottom
  pixel(png, 10, 22, '#c0c0c0');
  pixel(png, 13, 22, '#c0c0c0');
  pixel(png, 16, 22, '#c0c0c0');
  pixel(png, 19, 22, '#c0c0c0');
  // Mouth: LED segments on the body below screen
  ledSegments(png, 16, 18, 14, '#00ff41');
  autoOutline(png);
  return png;
}

function drawTerminal() {
  const png = createEmptyPNG();
  // Dark body
  rect(png, 7, 7, 18, 18, '#333333');
  // Black screen
  rect(png, 9, 9, 14, 14, '#0d0d0d');
  // Green text rows (short dashes at fixed positions)
  const rows = [
    [9, 10, 11, 12, 13, 15, 16, 17],
    [9, 10, 12, 13, 14, 15],
    [9, 10, 11, 13, 14, 15, 16, 17, 18],
    [9, 10, 11, 12, 14, 15],
    [9, 10, 11, 12, 13, 14, 16, 17, 18, 19],
    [9, 10, 12, 13, 14],
  ];
  for (let r = 0; r < rows.length; r++) {
    for (const x of rows[r]) {
      pixel(png, x, 10 + r * 2, '#00ff41');
    }
  }
  // Cursor block
  rect(png, 14, 20, 2, 1, '#00ff41');
  // Mouth: slot below the text area
  slotSingle(png, 16, 18, 14, '#00ff41');
  autoOutline(png);
  return png;
}

function drawBrokenLcd() {
  const png = createEmptyPNG();
  // Gray bezel
  rect(png, 7, 7, 18, 18, '#808080');
  // Dark screen
  rect(png, 9, 9, 14, 14, '#1a1a1a');
  // Diagonal crack line
  line(png, 10, 10, 21, 21, '#333333');
  // Color bleed along crack
  pixel(png, 11, 10, '#ff00ff');
  pixel(png, 12, 11, '#00ffff');
  pixel(png, 13, 12, '#ff00ff');
  pixel(png, 14, 12, '#00ffff');
  pixel(png, 15, 13, '#ff00ff');
  pixel(png, 16, 14, '#00ffff');
  pixel(png, 17, 15, '#ff00ff');
  pixel(png, 17, 16, '#00ffff');
  pixel(png, 18, 16, '#ff00ff');
  pixel(png, 19, 17, '#00ffff');
  pixel(png, 20, 19, '#ff00ff');
  pixel(png, 20, 20, '#00ffff');
  // Bleed spread
  pixel(png, 10, 11, '#ff00ff');
  pixel(png, 13, 11, '#00ffff');
  pixel(png, 16, 15, '#ff00ff');
  pixel(png, 19, 18, '#00ffff');
  pixel(png, 21, 20, '#ff00ff');
  // Mouth: glitchy LED bar
  ledBar(png, 16, 18, 14, '#ff00ff');
  autoOutline(png);
  return png;
}

function drawSecurityMonitor() {
  const png = createEmptyPNG();
  // Gray bezel
  rect(png, 7, 7, 18, 18, '#666666');
  // 4 quadrants with slightly different shades
  rect(png, 9, 9, 6, 6, '#1a1a2e');   // top-left
  rect(png, 17, 9, 6, 6, '#1e1e32');   // top-right
  rect(png, 9, 17, 6, 6, '#22223a');   // bottom-left
  rect(png, 17, 17, 6, 6, '#1a1a2e');  // bottom-right
  // Crosshair dividers
  vline(png, 16, 9, 22, '#4a4a6a');
  hline(png, 9, 22, 16, '#4a4a6a');
  // Scan lines (subtle)
  for (let y = 9; y <= 22; y += 2) {
    for (let x = 9; x <= 22; x++) {
      if (x !== 16) {
        setPixel(png, x, y, 0x30, 0x30, 0x50, 60);
      }
    }
  }
  // REC indicator
  pixel(png, 21, 9, '#ff0000');
  pixel(png, 22, 9, '#ff0000');
  // Mouth: speaker dots below screen quadrants
  speakerDots(png, 16, 19, 14, '#4a4a6a');
  autoOutline(png);
  return png;
}

function drawLedMatrix() {
  const png = createEmptyPNG();
  // Dark body
  rect(png, 7, 7, 18, 18, '#1a1a1a');
  // LED grid - dots every 2 pixels, some lit red to form :) face
  // Smiley pattern on an 8x8 grid mapped into the screen area (9..22)
  const litPixels = [
    // Eyes
    [11, 11], [12, 11], [19, 11], [20, 11],
    [11, 12], [12, 12], [19, 12], [20, 12],
    // Mouth
    [11, 18], [12, 18], [19, 18], [20, 18],
    [13, 19], [14, 19], [17, 19], [18, 19],
    [15, 20], [16, 20],
  ];
  // Draw all LED dots as dim
  for (let y = 10; y <= 21; y += 2) {
    for (let x = 10; x <= 21; x += 2) {
      pixel(png, x, y, '#331100');
      pixel(png, x + 1, y, '#331100');
      pixel(png, x, y + 1, '#331100');
      pixel(png, x + 1, y + 1, '#331100');
    }
  }
  // Light up the smiley ones
  for (const [x, y] of litPixels) {
    pixel(png, x, y, '#ff3300');
  }
  autoOutline(png);
  return png;
}

function drawEInk() {
  const png = createEmptyPNG();
  // Light gray body (paper-like)
  rect(png, 7, 7, 18, 18, '#d4d4d0');
  // Very low contrast text lines
  for (let row = 0; row < 6; row++) {
    const y = 9 + row * 2;
    const lengths = [12, 10, 13, 9, 11, 8];
    for (let i = 0; i < lengths[row]; i++) {
      pixel(png, 9 + i, y, '#a0a09c');
    }
  }
  // Slightly darker header line
  hline(png, 9, 20, 9, '#8a8a86');
  // Thin border
  border(png, 7, 7, 18, 18, '#b0b0ac');
  // Mouth: subtle neutral line on the e-ink paper
  pixelNeutral(png, 16, 18, 14, '#8a8a86');
  autoOutline(png);
  return png;
}

function drawHologram() {
  const png = createEmptyPNG();
  // Semi-transparent blue rectangular form with scan line gaps
  for (let y = 7; y <= 24; y++) {
    if (y % 3 === 0) continue; // Scan line gap
    for (let x = 9; x <= 22; x++) {
      setPixel(png, x, y, 0x00, 0xaa, 0xff, 120);
    }
  }
  // Brighter edges
  for (let y = 7; y <= 24; y++) {
    if (y % 3 === 0) continue;
    setPixel(png, 9, y, 0x00, 0xcc, 0xff, 180);
    setPixel(png, 22, y, 0x00, 0xcc, 0xff, 180);
  }
  // Brighter top/bottom
  for (let x = 9; x <= 22; x++) {
    setPixel(png, x, 7, 0x00, 0xcc, 0xff, 180);
    setPixel(png, x, 24, 0x00, 0xcc, 0xff, 180);
  }
  // Inner glow highlight
  rect(png, 13, 12, 6, 4, '#0066cc');
  // Mouth: LED bar in the holographic field
  ledBar(png, 16, 18, 14, '#00ccff');
  autoOutline(png, '#003366');
  return png;
}

// === CAMERAS & SURVEILLANCE (5) ===

function drawCctv() {
  const png = createEmptyPNG();
  // White dome (half-circle top)
  for (let y = 7; y <= 16; y++) {
    for (let x = 8; x <= 23; x++) {
      const dist = Math.sqrt((x - 15.5) ** 2 + (y - 16) ** 2);
      if (dist <= 9 && y <= 16) {
        pixel(png, x, y, '#e0e0e0');
      }
    }
  }
  // Base mount
  rect(png, 11, 17, 10, 3, '#c0c0c0');
  // Dark lens circle center
  circle(png, 16, 14, 3, '#333333');
  circle(png, 16, 14, 1, '#1a1a1a');
  // Lens glint
  pixel(png, 15, 13, '#666666');
  // Mount bracket below
  rect(png, 14, 20, 4, 4, '#808080');
  // Mouth: slot on the base mount
  slotSingle(png, 16, 18, 10, '#555555');
  autoOutline(png);
  return png;
}

function drawWebcam() {
  const png = createEmptyPNG();
  // Circular body
  circle(png, 16, 13, 5, '#2a2a2a');
  // Inner ring
  circleOutline(png, 16, 13, 3, '#444444');
  // Lens
  circle(png, 16, 13, 2, '#1a1a1a');
  // Lens glint
  pixel(png, 15, 12, '#555555');
  // Red LED
  pixel(png, 20, 10, '#ff0000');
  // Stem/mount
  rect(png, 15, 18, 2, 3, '#444444');
  // Base
  rect(png, 12, 21, 8, 3, '#333333');
  // Mouth: LED bar on the base
  ledBar(png, 16, 19, 8, '#666666');
  autoOutline(png);
  return png;
}

function drawPolaroid() {
  const png = createEmptyPNG();
  // White body
  rect(png, 7, 7, 18, 18, '#f0f0f0');
  // Dark lens area
  circle(png, 16, 14, 4, '#333333');
  circle(png, 16, 14, 2, '#1a1a1a');
  // Lens glint
  pixel(png, 15, 13, '#555555');
  // Rainbow stripe below lens
  pixel(png, 12, 20, '#ff4444');
  pixel(png, 13, 20, '#ff8800');
  pixel(png, 14, 20, '#ffcc00');
  pixel(png, 15, 20, '#44cc44');
  pixel(png, 16, 20, '#4488ff');
  pixel(png, 17, 20, '#8844ff');
  // Flash
  rect(png, 18, 8, 3, 2, '#cccccc');
  // Viewfinder
  rect(png, 9, 8, 3, 2, '#444444');
  // Mouth: slot opening on the white body below lens
  slotSingle(png, 16, 18, 14, '#aaaaaa');
  autoOutline(png);
  return png;
}

function drawProjector() {
  const png = createEmptyPNG();
  // Dark box body
  rect(png, 7, 10, 14, 12, '#3a3a3a');
  // Lens circle
  circle(png, 20, 15, 3, '#c0c0c0');
  circle(png, 20, 15, 1, '#666666');
  // Light cone extending right
  for (let i = 1; i <= 8; i++) {
    const x = 23 + i;
    if (x >= 32) break;
    const spread = Math.floor(i / 2);
    for (let dy = -spread; dy <= spread; dy++) {
      const alpha = Math.max(40, 200 - i * 20);
      setPixel(png, x, 15 + dy, 0xff, 0xff, 0x99, alpha);
    }
  }
  // Vents on body
  hline(png, 8, 12, 12, '#2a2a2a');
  hline(png, 8, 12, 14, '#2a2a2a');
  hline(png, 8, 12, 16, '#2a2a2a');
  // Film reel bumps on top
  circle(png, 10, 9, 2, '#555555');
  circle(png, 17, 9, 2, '#555555');
  // Mouth: vent grille on projector body
  grillHorizontal(png, 12, 18, 10, '#222222');
  autoOutline(png);
  return png;
}

function drawDashcam() {
  const png = createEmptyPNG();
  // Small dark body
  rect(png, 9, 10, 14, 8, '#1a1a1a');
  // Wide lens circle
  circle(png, 16, 14, 3, '#333333');
  circle(png, 16, 14, 1, '#4488ff');
  // Lens ring
  circleOutline(png, 16, 14, 3, '#555555');
  // Status LED
  pixel(png, 21, 11, '#ff0000');
  // Suction-cup mount below
  rect(png, 14, 18, 4, 2, '#555555');
  // Suction cup
  circle(png, 16, 22, 3, '#808080');
  circle(png, 16, 22, 1, '#666666');
  // Mouth: LED segments on the dashcam body
  ledSegments(png, 16, 16, 10, '#ff0000');
  autoOutline(png);
  return png;
}

// === INDUSTRIAL & URBAN (6) ===

function drawTrafficLight() {
  const png = createEmptyPNG();
  // Dark rectangular body (narrow, tall)
  rect(png, 12, 6, 8, 20, '#333333');
  // Hood/visor on top
  rect(png, 11, 6, 10, 2, '#2a2a2a');
  // Red light (top)
  circle(png, 16, 10, 2, '#ff0000');
  // Yellow light (middle)
  circle(png, 16, 15, 2, '#ffcc00');
  // Green light (bottom, lit)
  circle(png, 16, 20, 2, '#00ff00');
  // Light housings
  circleOutline(png, 16, 10, 2, '#222222');
  circleOutline(png, 16, 15, 2, '#222222');
  circleOutline(png, 16, 20, 2, '#222222');
  autoOutline(png);
  return png;
}

function drawParkingMeter() {
  const png = createEmptyPNG();
  // Dome top
  for (let y = 7; y <= 11; y++) {
    for (let x = 11; x <= 20; x++) {
      const dist = Math.sqrt((x - 15.5) ** 2 + (y - 11) ** 2);
      if (dist <= 5) pixel(png, x, y, '#808080');
    }
  }
  // Body rectangle
  rect(png, 11, 12, 10, 8, '#c0c0c0');
  // Red "EXPIRED" band
  rect(png, 11, 13, 10, 3, '#ff4444');
  // Dial circle
  circleOutline(png, 16, 10, 2, '#333333');
  pixel(png, 16, 10, '#333333');
  // Coin slot
  rect(png, 18, 17, 2, 1, '#444444');
  // Thin post
  rect(png, 15, 20, 2, 5, '#666666');
  autoOutline(png);
  return png;
}

function drawAtm() {
  const png = createEmptyPNG();
  // Gray body
  rect(png, 7, 7, 18, 18, '#c0c0c0');
  // Blue screen
  rect(png, 9, 8, 14, 7, '#2a4a8a');
  // Screen text lines
  hline(png, 10, 16, 10, '#88aadd');
  hline(png, 10, 14, 12, '#88aadd');
  // Keypad grid (3x4)
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      const kx = 10 + col * 3;
      const ky = 17 + row * 2;
      rect(png, kx, ky, 2, 1, '#888888');
    }
  }
  // Card slot
  rect(png, 18, 18, 4, 1, '#333333');
  // Green OK button
  pixel(png, 22, 20, '#00ff00');
  // Red Cancel button
  pixel(png, 22, 22, '#ff0000');
  autoOutline(png);
  return png;
}

function drawGasPump() {
  const png = createEmptyPNG();
  // Red body
  rect(png, 9, 7, 12, 18, '#cc0000');
  // White price display
  rect(png, 11, 9, 8, 4, '#f0f0f0');
  // Price digits
  pixel(png, 12, 10, '#333333');
  pixel(png, 13, 10, '#333333');
  pixel(png, 15, 10, '#333333');
  pixel(png, 16, 10, '#333333');
  pixel(png, 18, 10, '#333333');
  // Nozzle hook on right side
  rect(png, 21, 12, 2, 1, '#808080');
  rect(png, 22, 12, 1, 6, '#808080');
  rect(png, 22, 18, 3, 1, '#808080');
  // Hose
  pixel(png, 23, 19, '#333333');
  pixel(png, 23, 20, '#333333');
  // Yellow crown/brand area
  rect(png, 11, 7, 8, 2, '#ffcc00');
  autoOutline(png);
  return png;
}

function drawCircuitBreaker() {
  const png = createEmptyPNG();
  // Gray panel
  rect(png, 7, 7, 18, 18, '#808080');
  // Inner panel
  rect(png, 8, 8, 16, 16, '#707070');
  // Grid of toggle switches (4 cols x 5 rows)
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 4; col++) {
      const sx = 9 + col * 4;
      const sy = 9 + row * 3;
      // Alternate on (orange) and off (dark)
      const isOn = (row + col) % 3 === 0;
      rect(png, sx, sy, 2, 2, isOn ? '#ff6600' : '#333333');
    }
  }
  // Main breaker at top
  rect(png, 12, 7, 8, 2, '#cc0000');
  autoOutline(png);
  return png;
}

function drawTransformer() {
  const png = createEmptyPNG();
  // Olive/gray utility box
  rect(png, 8, 10, 16, 14, '#556b2f');
  // Metal rim
  border(png, 8, 10, 16, 14, '#808080');
  // Yellow warning triangle
  line(png, 16, 13, 13, 18, '#ffcc00');
  line(png, 16, 13, 19, 18, '#ffcc00');
  hline(png, 13, 19, 18, '#ffcc00');
  // Lightning bolt inside triangle
  pixel(png, 16, 15, '#000000');
  pixel(png, 15, 16, '#000000');
  pixel(png, 16, 16, '#000000');
  pixel(png, 16, 17, '#000000');
  // Cylindrical insulators on top (3)
  rect(png, 10, 7, 3, 3, '#808080');
  rect(png, 15, 7, 3, 3, '#808080');
  rect(png, 20, 7, 3, 3, '#808080');
  // Insulator tops
  rect(png, 10, 7, 3, 1, '#c0c0c0');
  rect(png, 15, 7, 3, 1, '#c0c0c0');
  rect(png, 20, 7, 3, 1, '#c0c0c0');
  // Mouth: vent angled slats on the utility box
  ventAngled(png, 16, 20, 14, '#333333');
  autoOutline(png);
  return png;
}

// === AUDIO & MUSIC (5) ===

function drawSpeakerStack() {
  const png = createEmptyPNG();
  // Black cabinet
  rect(png, 8, 7, 16, 18, '#1a1a1a');
  // Cabinet border
  border(png, 8, 7, 16, 18, '#333333');
  // Top speaker cone (large)
  circleOutline(png, 16, 12, 4, '#444444');
  circleOutline(png, 16, 12, 2, '#555555');
  pixel(png, 16, 12, '#333333');
  // Bottom speaker cone (large)
  circleOutline(png, 16, 20, 3, '#444444');
  circleOutline(png, 16, 20, 1, '#555555');
  pixel(png, 16, 20, '#333333');
  // Gold accent line
  hline(png, 9, 22, 16, '#c0a000');
  // Gold logo area
  rect(png, 13, 7, 6, 1, '#c0a000');
  autoOutline(png);
  return png;
}

function drawVinyl() {
  const png = createEmptyPNG();
  // Black record circle
  circle(png, 16, 16, 10, '#1a1a1a');
  // Grooves (concentric)
  circleOutline(png, 16, 16, 9, '#2a2a2a');
  circleOutline(png, 16, 16, 7, '#2a2a2a');
  circleOutline(png, 16, 16, 5, '#2a2a2a');
  // Red center label
  circle(png, 16, 16, 3, '#ff3333');
  // Center hole
  pixel(png, 16, 16, '#1a1a1a');
  // Shine highlight
  pixel(png, 12, 10, '#333333');
  pixel(png, 13, 9, '#333333');
  autoOutline(png);
  return png;
}

function drawRadioVintage() {
  const png = createEmptyPNG();
  // Brown rounded body
  rect(png, 7, 8, 18, 16, '#8b4513');
  // Rounded top corners
  pixel(png, 7, 8, '#00000000'); setPixel(png, 7, 8, 0, 0, 0, 0);
  pixel(png, 24, 8, '#00000000'); setPixel(png, 24, 8, 0, 0, 0, 0);
  rect(png, 8, 7, 16, 1, '#8b4513');
  // Speaker grille (horizontal lines)
  for (let y = 10; y <= 18; y += 2) {
    hline(png, 9, 17, y, '#c0a060');
  }
  // Circular dial on right
  circleOutline(png, 21, 14, 3, '#ffcc00');
  pixel(png, 21, 14, '#ffcc00');
  // Dial indicator
  pixel(png, 21, 12, '#ff4444');
  // Gold accent band at bottom
  hline(png, 8, 23, 22, '#c0a060');
  // Tuning knobs
  rect(png, 10, 21, 2, 2, '#444444');
  rect(png, 20, 21, 2, 2, '#444444');
  autoOutline(png);
  return png;
}

function drawWalkieTalkie() {
  const png = createEmptyPNG();
  // Dark rectangular body
  rect(png, 10, 9, 12, 16, '#2a2a2a');
  // Stubby antenna on top
  rect(png, 14, 5, 4, 5, '#444444');
  rect(png, 15, 4, 2, 2, '#555555');
  // Speaker grille lines
  for (let y = 11; y <= 17; y += 2) {
    hline(png, 12, 19, y, '#444444');
  }
  // Green LED
  pixel(png, 19, 9, '#00ff00');
  // PTT button
  rect(png, 11, 19, 3, 3, '#555555');
  // Side button
  rect(png, 22, 13, 1, 3, '#666666');
  autoOutline(png);
  return png;
}

function drawSynthesizer() {
  const png = createEmptyPNG();
  // Dark panel
  rect(png, 6, 8, 20, 16, '#333333');
  // Top section border
  hline(png, 6, 25, 8, '#555555');
  // Grid of knobs (5x3)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      const kx = 8 + col * 4;
      const ky = 10 + row * 4;
      pixel(png, kx, ky, '#c0c0c0');
      pixel(png, kx + 1, ky, '#c0c0c0');
      pixel(png, kx, ky + 1, '#c0c0c0');
      pixel(png, kx + 1, ky + 1, '#c0c0c0');
    }
  }
  // Colored patch cables
  line(png, 9, 11, 13, 15, '#ff4444');
  line(png, 17, 11, 21, 15, '#4488ff');
  line(png, 13, 11, 17, 19, '#ffcc00');
  // Jack sockets
  pixel(png, 9, 22, '#222222');
  pixel(png, 13, 22, '#222222');
  pixel(png, 17, 22, '#222222');
  pixel(png, 21, 22, '#222222');
  autoOutline(png);
  return png;
}

// === RETRO TECH (5) ===

function drawFloppy() {
  const png = createEmptyPNG();
  // Blue rect body
  rect(png, 8, 7, 16, 18, '#2244aa');
  // Metal shutter across top
  rect(png, 11, 7, 10, 3, '#c0c0c0');
  // Shutter slot
  rect(png, 14, 7, 4, 2, '#1a1a1a');
  // Label area in center
  rect(png, 10, 13, 12, 6, '#e0e0e0');
  // Label text lines
  hline(png, 11, 20, 14, '#888888');
  hline(png, 11, 18, 16, '#888888');
  // Corner notch (bottom-right for write-protect)
  rect(png, 22, 22, 2, 2, '#1a1a1a');
  // Hub ring at bottom center
  rect(png, 14, 20, 4, 3, '#1a1a1a');
  circle(png, 16, 21, 1, '#c0c0c0');
  // Mouth: slot on the floppy label area
  slotDouble(png, 16, 17, 12, '#777777');
  autoOutline(png);
  return png;
}

function drawGameboy() {
  const png = createEmptyPNG();
  // Gray body
  rect(png, 8, 6, 16, 20, '#b0b0b0');
  // Screen bezel (darker gray)
  rect(png, 10, 8, 12, 9, '#888888');
  // Green-tinted screen
  rect(png, 11, 9, 10, 7, '#8bac0f');
  // Screen content (simple pattern)
  rect(png, 13, 11, 3, 3, '#306230');
  rect(png, 17, 12, 2, 2, '#306230');
  // D-pad cross
  rect(png, 10, 20, 3, 1, '#444444');
  rect(png, 11, 19, 1, 3, '#444444');
  // A/B buttons
  circle(png, 21, 20, 1, '#882244');
  circle(png, 19, 21, 1, '#882244');
  // Start/Select
  rect(png, 13, 23, 2, 1, '#666666');
  rect(png, 16, 23, 2, 1, '#666666');
  // Speaker grille dots
  pixel(png, 20, 24, '#999999');
  pixel(png, 21, 24, '#999999');
  pixel(png, 22, 24, '#999999');
  autoOutline(png);
  return png;
}

function drawPager() {
  const png = createEmptyPNG();
  // Small dark rect body
  rect(png, 9, 10, 14, 12, '#1a1a1a');
  // Body highlight
  border(png, 9, 10, 14, 12, '#333333');
  // Tiny LCD display
  rect(png, 11, 12, 10, 4, '#88ccaa');
  // Number display (simple dots)
  pixel(png, 12, 13, '#224422');
  pixel(png, 13, 13, '#224422');
  pixel(png, 15, 13, '#224422');
  pixel(png, 16, 13, '#224422');
  pixel(png, 18, 13, '#224422');
  pixel(png, 19, 13, '#224422');
  // Buttons below screen
  for (let i = 0; i < 4; i++) {
    rect(png, 11 + i * 3, 18, 2, 1, '#444444');
  }
  // Belt clip on left side
  rect(png, 8, 12, 1, 6, '#555555');
  // Mouth: LED segments on the pager display area
  ledSegments(png, 16, 19, 10, '#88ccaa');
  autoOutline(png);
  return png;
}

function drawVcr() {
  const png = createEmptyPNG();
  // Dark horizontal body (wider than tall)
  rect(png, 6, 11, 20, 10, '#2a2a2a');
  // Top panel lighter
  rect(png, 6, 11, 20, 2, '#3a3a3a');
  // Tape slot
  rect(png, 9, 13, 14, 2, '#111111');
  // Tape slot border
  border(png, 9, 13, 14, 2, '#1a1a1a');
  // Green "12:00" clock display
  pixel(png, 18, 17, '#00ff00');
  pixel(png, 19, 17, '#00ff00');
  pixel(png, 20, 17, '#003300');
  pixel(png, 21, 17, '#00ff00');
  pixel(png, 22, 17, '#00ff00');
  // Colon blink
  pixel(png, 20, 16, '#00ff00');
  pixel(png, 20, 18, '#00ff00');
  // Transport buttons
  rect(png, 8, 17, 2, 2, '#444444');
  rect(png, 11, 17, 2, 2, '#444444');
  rect(png, 14, 17, 2, 2, '#444444');
  autoOutline(png);
  return png;
}

function drawRotaryPhone() {
  const png = createEmptyPNG();
  // Dark body
  rect(png, 7, 9, 18, 15, '#1a1a1a');
  // Rounded top
  rect(png, 9, 7, 14, 2, '#1a1a1a');
  // Large dial circle
  circleOutline(png, 16, 16, 6, '#c0c0c0');
  circleOutline(png, 16, 16, 5, '#888888');
  // Number holes around dial
  const angles = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324];
  for (let i = 0; i < angles.length; i++) {
    const rad = (angles[i] * Math.PI) / 180;
    const hx = Math.round(16 + 4 * Math.cos(rad));
    const hy = Math.round(16 + 4 * Math.sin(rad));
    pixel(png, hx, hy, '#f0f0f0');
  }
  // Chrome center
  circle(png, 16, 16, 1, '#c0c0c0');
  // Handset cradle at top
  rect(png, 9, 8, 4, 2, '#333333');
  rect(png, 19, 8, 4, 2, '#333333');
  autoOutline(png);
  return png;
}

// === APPLIANCES (5) ===

function drawBlender() {
  const png = createEmptyPNG();
  // Light blue/clear tapered container
  // Wider at top, narrow at bottom
  for (let y = 7; y <= 19; y++) {
    const progress = (y - 7) / 12;
    const halfWidth = Math.round(7 - progress * 3);
    const x1 = 16 - halfWidth;
    const x2 = 16 + halfWidth;
    for (let x = x1; x <= x2; x++) {
      setPixel(png, x, y, 0xaa, 0xdd, 0xff, 180);
    }
  }
  // Liquid level inside
  for (let y = 12; y <= 19; y++) {
    const progress = (y - 7) / 12;
    const halfWidth = Math.round(7 - progress * 3) - 1;
    const x1 = 16 - halfWidth;
    const x2 = 16 + halfWidth;
    for (let x = x1; x <= x2; x++) {
      setPixel(png, x, y, 0x88, 0xcc, 0x44, 200);
    }
  }
  // Lid
  rect(png, 12, 6, 8, 2, '#c0c0c0');
  // Lid knob
  rect(png, 15, 5, 2, 1, '#808080');
  // Dark base
  rect(png, 12, 20, 8, 4, '#333333');
  // Blade lines at bottom of container
  line(png, 14, 19, 18, 19, '#c0c0c0');
  line(png, 15, 18, 17, 20, '#c0c0c0');
  // Base button
  pixel(png, 16, 22, '#00ff00');
  autoOutline(png);
  return png;
}

function drawCoffeeMaker() {
  const png = createEmptyPNG();
  // Dark body (back/tower)
  rect(png, 8, 6, 8, 18, '#1a1a1a');
  // Brown carafe (lower front)
  rect(png, 12, 14, 10, 8, '#804000');
  // Coffee level
  rect(png, 13, 16, 8, 5, '#5a2800');
  // Carafe handle
  rect(png, 22, 15, 2, 5, '#333333');
  // Carafe top (glass rim)
  rect(png, 12, 14, 10, 1, '#c0c0c0');
  // Drip area / filter
  rect(png, 10, 10, 8, 4, '#444444');
  // Water tank highlight
  rect(png, 8, 6, 2, 8, '#333333');
  // Power LED
  pixel(png, 9, 22, '#00ff00');
  // Hot plate
  rect(png, 12, 22, 10, 2, '#555555');
  autoOutline(png);
  return png;
}

function drawAirConditioner() {
  const png = createEmptyPNG();
  // White rect body
  rect(png, 6, 9, 20, 12, '#f0f0f0');
  // Horizontal vent slat lines
  for (let y = 14; y <= 19; y += 1) {
    hline(png, 7, 24, y, '#c0c0c0');
  }
  // Top panel
  rect(png, 6, 9, 20, 3, '#e0e0e0');
  // Blue accent line
  hline(png, 6, 25, 12, '#4488ff');
  // Display
  rect(png, 18, 10, 4, 2, '#224488');
  // Vent darkness (depth)
  for (let y = 15; y <= 18; y += 2) {
    hline(png, 8, 23, y, '#d0d0d0');
  }
  // Side panel lines
  vline(png, 6, 9, 20, '#d0d0d0');
  vline(png, 25, 9, 20, '#d0d0d0');
  // Mouth: grille below the vent area (baked into the AC unit)
  grillHorizontal(png, 16, 18, 16, '#b0b0b0');
  autoOutline(png);
  return png;
}

function drawSpaceHeater() {
  const png = createEmptyPNG();
  // Dark body
  rect(png, 8, 7, 16, 18, '#333333');
  // Front grille area
  rect(png, 10, 9, 12, 12, '#2a2a2a');
  // Orange glowing coils (3 horizontal)
  for (let i = 0; i < 3; i++) {
    const y = 11 + i * 4;
    hline(png, 11, 20, y, '#ff4400');
    hline(png, 11, 20, y + 1, '#ff6600');
    // Glow
    for (let x = 11; x <= 20; x++) {
      setPixel(png, x, y - 1, 0xff, 0x44, 0x00, 50);
      setPixel(png, x, y + 2, 0xff, 0x44, 0x00, 50);
    }
  }
  // Reflector behind coils
  for (let y = 10; y <= 20; y++) {
    pixel(png, 10, y, '#444444');
    pixel(png, 21, y, '#444444');
  }
  // Base/feet
  rect(png, 9, 24, 3, 1, '#555555');
  rect(png, 20, 24, 3, 1, '#555555');
  // Controls
  pixel(png, 12, 22, '#ff0000');
  pixel(png, 16, 22, '#00ff00');
  autoOutline(png);
  return png;
}

function drawVacuum() {
  const png = createEmptyPNG();
  // Red rounded body
  circle(png, 16, 14, 7, '#cc0000');
  // Body top highlight
  for (let x = 12; x <= 20; x++) {
    pixel(png, x, 8, '#dd3333');
  }
  // Gray hose connector (circle on right)
  circle(png, 23, 13, 2, '#808080');
  circle(png, 23, 13, 1, '#444444');
  // Hose extending
  pixel(png, 25, 12, '#666666');
  pixel(png, 26, 11, '#666666');
  // Wheel/base
  rect(png, 10, 21, 12, 3, '#333333');
  // Wheels
  circle(png, 12, 23, 1, '#222222');
  circle(png, 20, 23, 1, '#222222');
  // Brand circle
  circle(png, 16, 14, 2, '#aa0000');
  // Handle nub at top
  rect(png, 14, 6, 4, 2, '#888888');
  autoOutline(png);
  return png;
}

// === WEIRD/FUN (6) ===

function drawLavaLamp() {
  const png = createEmptyPNG();
  // Chrome base
  rect(png, 11, 22, 10, 3, '#c0c0c0');
  rect(png, 12, 21, 8, 1, '#aaaaaa');
  // Chrome cap
  rect(png, 12, 6, 8, 2, '#c0c0c0');
  rect(png, 13, 5, 6, 1, '#aaaaaa');
  // Transparent body
  for (let y = 8; y <= 21; y++) {
    const progress = Math.abs(y - 14.5) / 7;
    const halfWidth = Math.round(4 - progress * 1.5);
    for (let x = 16 - halfWidth; x <= 16 + halfWidth; x++) {
      setPixel(png, x, y, 0xdd, 0xcc, 0xaa, 100);
    }
  }
  // Blob 1 (magenta, lower)
  circle(png, 15, 18, 2, '#ff00ff');
  // Blob 2 (orange, upper)
  circle(png, 17, 11, 2, '#ff6600');
  // Blob 3 (small rising)
  pixel(png, 16, 14, '#ff00ff');
  pixel(png, 15, 15, '#ff6600');
  // Mouth: pixel smile in the lava lamp body
  pixelSmile(png, 16, 19, 8, '#ff6600');
  autoOutline(png);
  return png;
}

function drawDiscoBall() {
  const png = createEmptyPNG();
  // Mounting hook
  rect(png, 15, 5, 2, 3, '#808080');
  // Circle base
  circle(png, 16, 15, 8, '#c0c0c0');
  // Grid of mirrored facets
  for (let y = 8; y <= 22; y++) {
    for (let x = 9; x <= 23; x++) {
      const dist = Math.sqrt((x - 16) ** 2 + (y - 15) ** 2);
      if (dist > 8) continue;
      if ((x + y) % 2 === 0) {
        pixel(png, x, y, '#e0e0e0');
      } else {
        pixel(png, x, y, '#a0a0a0');
      }
    }
  }
  // Specular highlights
  pixel(png, 13, 11, '#ffffff');
  pixel(png, 14, 11, '#ffffff');
  pixel(png, 12, 12, '#ffffff');
  pixel(png, 18, 14, '#ffffff');
  pixel(png, 19, 13, '#ffffff');
  autoOutline(png);
  return png;
}

function drawGumball() {
  const png = createEmptyPNG();
  // Glass dome (circle)
  circle(png, 16, 13, 8, '#e8e8e8');
  // Inner area slightly different
  circle(png, 16, 13, 6, '#f0f0f0');
  // Multicolor gumball dots
  const gumballs = [
    [13, 10, '#ff0000'], [17, 9, '#ffcc00'], [20, 11, '#00cc00'],
    [12, 13, '#4488ff'], [15, 12, '#ff6600'], [19, 13, '#ff00ff'],
    [14, 15, '#00cc00'], [17, 14, '#ff0000'], [20, 15, '#ffcc00'],
    [13, 17, '#ff6600'], [16, 16, '#4488ff'], [19, 17, '#ff0000'],
    [15, 18, '#00cc00'], [18, 18, '#ff00ff'],
  ];
  for (const [gx, gy, gc] of gumballs) {
    pixel(png, gx, gy, gc);
  }
  // Red base
  rect(png, 11, 21, 10, 3, '#cc0000');
  // Dispenser
  rect(png, 14, 24, 4, 1, '#aa0000');
  // Metal trim
  hline(png, 11, 20, 21, '#888888');
  // Coin slot
  pixel(png, 21, 22, '#444444');
  // Glass shine
  pixel(png, 12, 8, '#ffffff');
  pixel(png, 13, 7, '#ffffff');
  // Mouth: pixel smile on the gumball machine base
  pixelSmile(png, 16, 19, 10, '#880000');
  autoOutline(png);
  return png;
}

function drawSlotMachine() {
  const png = createEmptyPNG();
  // Red/gold body
  rect(png, 7, 7, 18, 18, '#cc0000');
  // Gold trim
  border(png, 7, 7, 18, 18, '#c0a000');
  // 3 reel windows
  rect(png, 9, 10, 4, 6, '#f0f0f0');
  rect(png, 14, 10, 4, 6, '#f0f0f0');
  rect(png, 19, 10, 4, 6, '#f0f0f0');
  // Symbols in reels (cherry, bar, seven)
  pixel(png, 10, 12, '#ff0000'); pixel(png, 11, 12, '#ff0000'); // cherry
  pixel(png, 10, 13, '#00aa00'); // stem
  pixel(png, 15, 12, '#ffcc00'); pixel(png, 16, 12, '#ffcc00'); // BAR
  pixel(png, 15, 13, '#ffcc00'); pixel(png, 16, 13, '#ffcc00');
  pixel(png, 20, 12, '#ff4444'); pixel(png, 21, 13, '#ff4444'); // 7
  pixel(png, 20, 13, '#ff4444');
  // Payline
  hline(png, 8, 23, 13, '#ffcc00');
  // Lever on right side
  rect(png, 25, 10, 1, 8, '#c0c0c0');
  circle(png, 25, 10, 1, '#ff0000');
  // Coin tray
  rect(png, 9, 19, 14, 3, '#c0a000');
  autoOutline(png);
  return png;
}

function drawVaporwave() {
  const png = createEmptyPNG();
  // Pink/cyan bust silhouette (tapered rectangle)
  // Head area
  rect(png, 11, 6, 10, 8, '#ff71ce');
  // Neck
  rect(png, 13, 14, 6, 3, '#ff71ce');
  // Shoulders (wider)
  rect(png, 8, 17, 16, 8, '#ff71ce');
  // Horizontal grid lines (vaporwave aesthetic)
  for (let y = 7; y <= 24; y += 2) {
    for (let x = 8; x <= 23; x++) {
      const idx = (y * 32 + x) * 4;
      if (png.data[idx + 3] > 0) {
        pixel(png, x, y, '#01cdfe');
      }
    }
  }
  // Purple accents
  pixel(png, 14, 9, '#b967ff');
  pixel(png, 15, 9, '#b967ff');
  pixel(png, 17, 9, '#b967ff');
  pixel(png, 18, 9, '#b967ff');
  // Eye area (dark)
  pixel(png, 13, 10, '#440044');
  pixel(png, 14, 10, '#440044');
  pixel(png, 18, 10, '#440044');
  pixel(png, 19, 10, '#440044');
  // Sun/circle behind (lower)
  for (let y = 20; y <= 24; y++) {
    for (let x = 8; x <= 23; x++) {
      const idx = (y * 32 + x) * 4;
      if (png.data[idx + 3] > 0) {
        setPixel(png, x, y, 0xb9, 0x67, 0xff, 255);
      }
    }
  }
  // Mouth: pixel neutral on the vaporwave bust (between the neck and shoulders)
  pixelNeutral(png, 16, 19, 16, '#01cdfe');
  autoOutline(png, '#440066');
  return png;
}

function drawMagic8Ball() {
  const png = createEmptyPNG();
  // Black sphere
  circle(png, 16, 15, 9, '#1a1a1a');
  // Subtle highlight
  for (let x = 12; x <= 16; x++) {
    pixel(png, x, 8, '#333333');
  }
  pixel(png, 11, 9, '#2a2a2a');
  pixel(png, 12, 9, '#333333');
  // Blue triangle window
  // Triangle pointing up
  for (let row = 0; row < 5; row++) {
    const y = 13 + row;
    const halfW = row;
    for (let dx = -halfW; dx <= halfW; dx++) {
      pixel(png, 16 + dx, y, '#000080');
    }
  }
  // White "answer" text pixel
  pixel(png, 15, 15, '#ffffff');
  pixel(png, 16, 15, '#ffffff');
  pixel(png, 17, 15, '#ffffff');
  pixel(png, 16, 16, '#ffffff');
  // "8" in white near top
  pixel(png, 15, 10, '#ffffff');
  pixel(png, 16, 10, '#ffffff');
  pixel(png, 17, 10, '#ffffff');
  pixel(png, 15, 11, '#ffffff');
  pixel(png, 17, 11, '#ffffff');
  pixel(png, 15, 12, '#ffffff');
  pixel(png, 16, 12, '#ffffff');
  pixel(png, 17, 12, '#ffffff');
  autoOutline(png);
  return png;
}

// === COMPUTING (5) ===

function drawServerRack() {
  const png = createEmptyPNG();
  // Dark rack body
  rect(png, 8, 6, 16, 20, '#1a1a1a');
  // Rack rails
  vline(png, 8, 6, 25, '#444444');
  vline(png, 23, 6, 25, '#444444');
  // Server units (4 rows)
  for (let i = 0; i < 4; i++) {
    const y = 7 + i * 5;
    rect(png, 9, y, 14, 4, '#333333');
    hline(png, 9, 22, y, '#444444'); // top edge
    // Drive bays
    rect(png, 10, y + 1, 2, 2, '#222222');
    rect(png, 13, y + 1, 2, 2, '#222222');
    // Status LEDs
    pixel(png, 20, y + 1, '#00ff00');
    pixel(png, 21, y + 1, (i % 2 === 0) ? '#00ff00' : '#ff8800');
    pixel(png, 20, y + 2, '#00ff00');
  }
  // Ventilation at bottom
  for (let x = 10; x <= 21; x += 2) {
    pixel(png, x, 24, '#2a2a2a');
  }
  autoOutline(png);
  return png;
}

function drawHardDrive() {
  const png = createEmptyPNG();
  // Metal housing
  rect(png, 7, 8, 18, 16, '#c0c0c0');
  border(png, 7, 8, 18, 16, '#888888');
  // Platter (shiny disc)
  circle(png, 16, 16, 6, '#d0d0d0');
  circleOutline(png, 16, 16, 6, '#aaaaaa');
  circleOutline(png, 16, 16, 4, '#b8b8b8');
  // Center spindle
  circle(png, 16, 16, 1, '#888888');
  // Read arm
  line(png, 16, 16, 22, 10, '#666666');
  line(png, 16, 16, 23, 11, '#666666');
  // Arm pivot
  circle(png, 22, 10, 1, '#555555');
  // Read head
  pixel(png, 16, 16, '#444444');
  // Label sticker
  rect(png, 8, 9, 6, 4, '#f0f0f0');
  hline(png, 9, 12, 10, '#888888');
  hline(png, 9, 11, 11, '#888888');
  // PCB connector edge at bottom
  rect(png, 9, 22, 14, 2, '#006600');
  // Connector pins
  for (let x = 10; x <= 21; x += 2) {
    pixel(png, x, 23, '#c0a000');
  }
  // Mouth: LED segments on the hard drive label
  ledSegments(png, 11, 18, 8, '#006600');
  autoOutline(png);
  return png;
}

function drawUsbDrive() {
  const png = createEmptyPNG();
  // Body (blue plastic)
  rect(png, 10, 8, 12, 12, '#2244cc');
  // Rounded cap area at top
  rect(png, 10, 7, 12, 2, '#1a3399');
  // Metal USB connector at bottom
  rect(png, 12, 20, 8, 5, '#c0c0c0');
  // Connector inner
  rect(png, 13, 21, 6, 3, '#f0f0f0');
  // Connector contacts
  rect(png, 14, 22, 4, 1, '#c0a000');
  // LED indicator
  pixel(png, 16, 10, '#00ff00');
  // Brand label area
  rect(png, 12, 12, 8, 3, '#ffffff');
  hline(png, 13, 18, 13, '#aaaaaa');
  // Lanyard hole
  pixel(png, 16, 7, '#000000');
  // Mouth: slot on the USB drive body
  slotSingle(png, 16, 17, 10, '#1a3399');
  autoOutline(png);
  return png;
}

function drawMotherboard() {
  const png = createEmptyPNG();
  // Green PCB
  rect(png, 6, 6, 20, 20, '#006600');
  // Mounting holes
  pixel(png, 7, 7, '#c0c0c0');
  pixel(png, 24, 7, '#c0c0c0');
  pixel(png, 7, 24, '#c0c0c0');
  pixel(png, 24, 24, '#c0c0c0');
  // CPU socket (large IC)
  rect(png, 12, 10, 8, 8, '#333333');
  border(png, 12, 10, 8, 8, '#555555');
  // CPU die
  rect(png, 14, 12, 4, 4, '#888888');
  // RAM slots (2 horizontal)
  rect(png, 22, 10, 2, 8, '#004400');
  rect(png, 24, 10, 1, 8, '#c0c0c0');
  // Chipset
  rect(png, 9, 20, 4, 4, '#333333');
  // Trace lines
  hline(png, 8, 12, 14, '#008800');
  hline(png, 20, 22, 14, '#008800');
  vline(png, 16, 18, 20, '#008800');
  vline(png, 11, 8, 10, '#008800');
  // I/O connectors at top
  rect(png, 7, 6, 3, 2, '#c0c0c0');
  rect(png, 11, 6, 3, 2, '#c0c0c0');
  rect(png, 15, 6, 4, 2, '#4488ff');
  // Capacitors
  pixel(png, 8, 14, '#1a1a1a');
  pixel(png, 8, 16, '#1a1a1a');
  pixel(png, 8, 18, '#1a1a1a');
  autoOutline(png);
  return png;
}

function drawRouter() {
  const png = createEmptyPNG();
  // Flat body
  rect(png, 6, 14, 20, 6, '#1a1a1a');
  // Top surface slightly lighter
  rect(png, 6, 14, 20, 2, '#2a2a2a');
  // Antennas (3 upright)
  rect(png, 9, 6, 2, 8, '#333333');
  rect(png, 15, 6, 2, 8, '#333333');
  rect(png, 21, 6, 2, 8, '#333333');
  // Antenna tips
  rect(png, 9, 5, 2, 1, '#444444');
  rect(png, 15, 5, 2, 1, '#444444');
  rect(png, 21, 5, 2, 1, '#444444');
  // Status LEDs on front
  pixel(png, 8, 17, '#00ff00');
  pixel(png, 10, 17, '#00ff00');
  pixel(png, 12, 17, '#4488ff');
  pixel(png, 14, 17, '#4488ff');
  pixel(png, 16, 17, '#4488ff');
  pixel(png, 18, 17, '#4488ff');
  // Vent lines on top
  for (let x = 8; x <= 22; x += 2) {
    pixel(png, x, 15, '#222222');
  }
  // Rubber feet
  rect(png, 7, 20, 2, 1, '#444444');
  rect(png, 23, 20, 2, 1, '#444444');
  // Ethernet ports at back
  rect(png, 8, 19, 3, 1, '#c0a000');
  rect(png, 12, 19, 3, 1, '#c0a000');
  rect(png, 16, 19, 3, 1, '#c0a000');
  rect(png, 20, 19, 3, 1, '#c0a000');
  // Mouth: LED segments on the front panel
  ledSegments(png, 16, 18, 16, '#4488ff');
  autoOutline(png);
  return png;
}

// === INSTRUMENTS (4) ===

function drawSpeedometer() {
  const png = createEmptyPNG();
  // Dark circular gauge body
  circle(png, 16, 15, 10, '#1a1a1a');
  // White dial face
  circle(png, 16, 15, 8, '#f0f0f0');
  // Tick marks around edge
  const ticks = [150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345, 360, 375, 390];
  for (const deg of ticks) {
    const rad = (deg * Math.PI) / 180;
    const tx = Math.round(16 + 7 * Math.cos(rad));
    const ty = Math.round(15 + 7 * Math.sin(rad));
    pixel(png, tx, ty, '#333333');
  }
  // Needle (pointing to ~2 o'clock position)
  line(png, 16, 15, 21, 10, '#ff0000');
  // Center hub
  circle(png, 16, 15, 1, '#333333');
  // Chrome bezel
  circleOutline(png, 16, 15, 9, '#888888');
  // Number labels (simplified)
  pixel(png, 9, 18, '#333333');  // 0
  pixel(png, 10, 12, '#333333'); // 40
  pixel(png, 16, 8, '#333333');  // 80
  pixel(png, 22, 12, '#333333'); // 120
  autoOutline(png);
  return png;
}

function drawCompass() {
  const png = createEmptyPNG();
  // Brass housing
  circle(png, 16, 15, 10, '#c0a060');
  // White dial face
  circle(png, 16, 15, 8, '#f0f0f0');
  // Cardinal direction marks
  pixel(png, 16, 8, '#ff0000');  // N (red)
  pixel(png, 16, 22, '#333333'); // S
  pixel(png, 8, 15, '#333333');  // W
  pixel(png, 24, 15, '#333333'); // E
  // Degree ring
  circleOutline(png, 16, 15, 7, '#cccccc');
  // Compass needle (N-S line)
  line(png, 16, 9, 16, 15, '#ff0000');  // Red north half
  line(png, 16, 15, 16, 21, '#ffffff'); // White south half
  // Cross hairs
  pixel(png, 15, 15, '#cccccc');
  pixel(png, 17, 15, '#cccccc');
  // Center pivot
  pixel(png, 16, 15, '#333333');
  // Brass bezel
  circleOutline(png, 16, 15, 9, '#a08840');
  autoOutline(png);
  return png;
}

function drawStopwatch() {
  const png = createEmptyPNG();
  // Chrome body
  circle(png, 16, 16, 9, '#c0c0c0');
  // White face
  circle(png, 16, 16, 7, '#f0f0f0');
  // Crown button on top
  rect(png, 15, 6, 2, 2, '#888888');
  rect(png, 14, 5, 4, 2, '#999999');
  // Side button
  rect(png, 24, 13, 2, 2, '#888888');
  // Minute marks
  circleOutline(png, 16, 16, 6, '#dddddd');
  // 12/3/6/9 marks
  pixel(png, 16, 10, '#333333');
  pixel(png, 22, 16, '#333333');
  pixel(png, 16, 22, '#333333');
  pixel(png, 10, 16, '#333333');
  // Second hand
  line(png, 16, 16, 16, 10, '#ff0000');
  // Minute hand
  line(png, 16, 16, 20, 13, '#333333');
  // Center
  pixel(png, 16, 16, '#333333');
  // Sub-dial
  circleOutline(png, 16, 19, 2, '#cccccc');
  // Chrome bezel
  circleOutline(png, 16, 16, 8, '#999999');
  autoOutline(png);
  return png;
}

function drawThermostat() {
  const png = createEmptyPNG();
  // Round white body
  circle(png, 16, 15, 10, '#f0f0f0');
  // Inner ring
  circleOutline(png, 16, 15, 8, '#dddddd');
  // Digital display area
  rect(png, 11, 12, 10, 6, '#1a1a1a');
  // Temperature display "72"
  // "7"
  hline(png, 12, 14, 13, '#4488ff');
  vline(png, 14, 13, 16, '#4488ff');
  // "2"
  hline(png, 16, 18, 13, '#4488ff');
  vline(png, 18, 13, 14, '#4488ff');
  hline(png, 16, 18, 15, '#4488ff');
  vline(png, 16, 15, 16, '#4488ff');
  hline(png, 16, 18, 16, '#4488ff');
  // Degree symbol
  pixel(png, 19, 13, '#4488ff');
  // Status indicator at bottom
  pixel(png, 16, 22, '#00ff00');
  // Chrome trim
  circleOutline(png, 16, 15, 10, '#c0c0c0');
  autoOutline(png);
  return png;
}

// === SAFETY & INDUSTRIAL (4) ===

function drawFireExtinguisher() {
  const png = createEmptyPNG();
  // Red cylindrical body
  rect(png, 11, 10, 10, 14, '#cc0000');
  // Darker red sides
  vline(png, 11, 10, 23, '#aa0000');
  vline(png, 20, 10, 23, '#aa0000');
  // Handle/trigger assembly
  rect(png, 13, 6, 6, 4, '#333333');
  // Lever
  rect(png, 13, 6, 8, 1, '#444444');
  // Nozzle
  rect(png, 9, 7, 4, 2, '#333333');
  pixel(png, 8, 8, '#444444');
  // Pressure gauge
  circleOutline(png, 16, 12, 2, '#c0c0c0');
  pixel(png, 16, 11, '#00ff00');
  // Label band
  rect(png, 12, 16, 8, 3, '#ffffff');
  hline(png, 13, 18, 17, '#cc0000');
  // Base
  rect(png, 12, 24, 8, 1, '#aa0000');
  autoOutline(png);
  return png;
}

function drawSmokeDetector() {
  const png = createEmptyPNG();
  // White circular body
  circle(png, 16, 15, 10, '#f0f0f0');
  // Inner ring
  circleOutline(png, 16, 15, 7, '#e0e0e0');
  // Vent slots (radial)
  for (let angle = 0; angle < 360; angle += 30) {
    const rad = (angle * Math.PI) / 180;
    const vx = Math.round(16 + 5 * Math.cos(rad));
    const vy = Math.round(15 + 5 * Math.sin(rad));
    pixel(png, vx, vy, '#c0c0c0');
  }
  // Center sensor
  circle(png, 16, 15, 2, '#dddddd');
  // LED indicator
  pixel(png, 16, 13, '#00ff00');
  // Test button
  circle(png, 16, 18, 1, '#cccccc');
  // Outer rim
  circleOutline(png, 16, 15, 9, '#d0d0d0');
  autoOutline(png);
  return png;
}

function drawMegaphone() {
  const png = createEmptyPNG();
  // Cone (expanding left to right)
  for (let x = 10; x <= 25; x++) {
    const progress = (x - 10) / 15;
    const halfH = Math.round(1 + progress * 6);
    const cy = 14;
    for (let y = cy - halfH; y <= cy + halfH; y++) {
      pixel(png, x, y, '#c0c0c0');
    }
  }
  // Bell rim
  vline(png, 25, 8, 20, '#aaaaaa');
  // Handle/grip
  rect(png, 8, 12, 3, 5, '#333333');
  // Trigger
  pixel(png, 10, 19, '#444444');
  pixel(png, 10, 20, '#444444');
  pixel(png, 11, 20, '#444444');
  // Red accent band
  for (let x = 12; x <= 18; x++) {
    const progress = (x - 10) / 15;
    const halfH = Math.round(1 + progress * 6);
    pixel(png, x, 14 - halfH, '#ff4444');
    pixel(png, x, 14 + halfH, '#ff4444');
  }
  // Siren/horn ring
  circleOutline(png, 25, 14, 6, '#bbbbbb');
  autoOutline(png);
  return png;
}

function drawBattery() {
  const png = createEmptyPNG();
  // Cylindrical body
  rect(png, 10, 8, 12, 16, '#1a1a1a');
  // Positive terminal nub
  rect(png, 14, 6, 4, 2, '#c0c0c0');
  // Gold + ring
  hline(png, 10, 21, 8, '#c0a000');
  // Negative base
  hline(png, 10, 21, 23, '#c0c0c0');
  // Label wrap
  rect(png, 10, 10, 12, 12, '#ffcc00');
  // Brand text area
  rect(png, 12, 12, 8, 3, '#1a1a1a');
  // "AA" or similar label
  hline(png, 13, 14, 13, '#ffcc00');
  hline(png, 16, 17, 13, '#ffcc00');
  // Charge level indicator (green bars)
  rect(png, 12, 17, 8, 1, '#00ff00');
  rect(png, 12, 19, 8, 1, '#00ff00');
  rect(png, 12, 21, 5, 1, '#00ff00');
  // + symbol near top
  pixel(png, 16, 9, '#ffffff');
  hline(png, 15, 17, 9, '#ffffff');
  vline(png, 16, 8, 10, '#ffffff');
  autoOutline(png);
  return png;
}

// === SCIENCE (3) ===

function drawTelescope() {
  const png = createEmptyPNG();
  // Tube body (angled upward left-to-right)
  for (let i = 0; i < 14; i++) {
    const x = 8 + i;
    const y = 20 - i;
    rect(png, x, y, 4, 3, '#c0c0c0');
  }
  // Objective lens (large end, upper right)
  rect(png, 21, 6, 4, 5, '#4488ff');
  border(png, 21, 6, 4, 5, '#888888');
  // Eyepiece (small end, lower left)
  rect(png, 7, 20, 3, 3, '#888888');
  // Finder scope
  rect(png, 14, 10, 2, 2, '#666666');
  // Tripod legs
  line(png, 14, 20, 10, 25, '#666666');
  line(png, 14, 20, 14, 25, '#666666');
  line(png, 14, 20, 18, 25, '#666666');
  // Mount joint
  circle(png, 14, 20, 1, '#888888');
  // Mouth: LED bar on the telescope body
  ledBar(png, 15, 17, 8, '#4488ff');
  autoOutline(png);
  return png;
}

function drawMicroscope() {
  const png = createEmptyPNG();
  // Base
  rect(png, 8, 22, 16, 3, '#1a1a1a');
  // Arm/pillar
  rect(png, 10, 8, 3, 14, '#333333');
  // Eyepiece tube (top, angled)
  rect(png, 8, 6, 6, 3, '#444444');
  // Eyepiece lens
  circle(png, 8, 7, 1, '#4488ff');
  // Body tube
  rect(png, 12, 8, 3, 8, '#333333');
  // Objective turret
  rect(png, 12, 16, 4, 2, '#555555');
  // Objective lens
  rect(png, 13, 18, 2, 2, '#c0c0c0');
  // Stage
  rect(png, 8, 20, 14, 2, '#444444');
  // Stage clip
  pixel(png, 9, 20, '#c0c0c0');
  pixel(png, 20, 20, '#c0c0c0');
  // Focus knob on right side
  circle(png, 14, 14, 2, '#666666');
  circleOutline(png, 14, 14, 2, '#555555');
  // Light source
  pixel(png, 14, 21, '#ffff88');
  autoOutline(png);
  return png;
}

function drawLightbulb() {
  const png = createEmptyPNG();
  // Glass bulb (upper portion)
  circle(png, 16, 12, 7, '#ffee88');
  // Brighter center glow
  circle(png, 16, 12, 4, '#ffff99');
  circle(png, 16, 12, 2, '#ffffcc');
  // Filament
  pixel(png, 14, 12, '#ff8800');
  pixel(png, 15, 11, '#ffaa00');
  pixel(png, 16, 12, '#ffaa00');
  pixel(png, 17, 11, '#ffaa00');
  pixel(png, 18, 12, '#ff8800');
  // Filament supports
  vline(png, 14, 13, 16, '#888888');
  vline(png, 18, 13, 16, '#888888');
  // Screw base
  rect(png, 13, 18, 6, 2, '#c0c0c0');
  rect(png, 14, 20, 4, 1, '#aaaaaa');
  rect(png, 13, 21, 6, 1, '#c0c0c0');
  rect(png, 14, 22, 4, 1, '#aaaaaa');
  rect(png, 13, 23, 6, 1, '#c0c0c0');
  // Bottom contact
  rect(png, 15, 24, 2, 1, '#888888');
  // Glass highlight
  pixel(png, 12, 8, '#ffffff');
  pixel(png, 13, 7, '#ffffff');
  autoOutline(png);
  return png;
}

// === MEDIA & INPUT (5) ===

function drawJoystick() {
  const png = createEmptyPNG();
  // Black base
  rect(png, 7, 18, 18, 6, '#1a1a1a');
  // Base top surface
  rect(png, 7, 18, 18, 2, '#2a2a2a');
  // Stick shaft
  rect(png, 15, 9, 2, 9, '#c0c0c0');
  // Red ball top
  circle(png, 16, 8, 3, '#ff0000');
  // Highlight on ball
  pixel(png, 14, 7, '#ff6666');
  // Fire buttons
  circle(png, 10, 20, 1, '#ff4444');
  circle(png, 22, 20, 1, '#ff4444');
  // Rubber grip
  rect(png, 15, 13, 2, 2, '#333333');
  // Base details
  hline(png, 8, 23, 22, '#333333');
  // Cable
  pixel(png, 16, 24, '#444444');
  pixel(png, 16, 25, '#444444');
  // Mouth: buttons row on the joystick base
  buttonsRow(png, 16, 20, 14, '#555555');
  autoOutline(png);
  return png;
}

function drawClapperboard() {
  const png = createEmptyPNG();
  // Slate board (white)
  rect(png, 7, 11, 18, 12, '#f0f0f0');
  // Text lines on slate
  hline(png, 9, 18, 14, '#333333');
  hline(png, 9, 16, 16, '#333333');
  hline(png, 9, 20, 18, '#333333');
  hline(png, 9, 14, 20, '#333333');
  // Labels
  pixel(png, 8, 14, '#888888');
  pixel(png, 8, 16, '#888888');
  pixel(png, 8, 18, '#888888');
  pixel(png, 8, 20, '#888888');
  // Clapper (top, black with white stripes)
  rect(png, 7, 7, 18, 4, '#1a1a1a');
  // Diagonal stripes on clapper
  for (let i = 0; i < 6; i++) {
    const x = 8 + i * 3;
    line(png, x, 7, x + 2, 10, '#f0f0f0');
  }
  // Hinge
  rect(png, 7, 10, 2, 2, '#444444');
  // Mouth: slot on the slate board area
  slotSingle(png, 16, 17, 14, '#888888');
  autoOutline(png);
  return png;
}

function drawQrCode() {
  const png = createEmptyPNG();
  // White background square
  rect(png, 7, 7, 18, 18, '#f0f0f0');
  // Three position markers (squares within squares)
  // Top-left
  rect(png, 8, 8, 5, 5, '#1a1a1a');
  rect(png, 9, 9, 3, 3, '#f0f0f0');
  rect(png, 10, 10, 1, 1, '#1a1a1a');
  // Top-right
  rect(png, 19, 8, 5, 5, '#1a1a1a');
  rect(png, 20, 9, 3, 3, '#f0f0f0');
  rect(png, 21, 10, 1, 1, '#1a1a1a');
  // Bottom-left
  rect(png, 8, 19, 5, 5, '#1a1a1a');
  rect(png, 9, 20, 3, 3, '#f0f0f0');
  rect(png, 10, 21, 1, 1, '#1a1a1a');
  // Data modules (deterministic pattern)
  const dataPixels = [
    [14,8],[16,8],[14,9],[15,10],[17,10],
    [8,14],[9,14],[10,15],[11,14],[12,14],
    [14,14],[15,15],[16,14],[17,15],[18,14],
    [14,16],[16,16],[17,17],[15,18],
    [20,15],[21,16],[22,17],[20,19],[22,19],
    [14,20],[16,20],[15,21],[17,21],[14,22],
  ];
  for (const [dx, dy] of dataPixels) {
    pixel(png, dx, dy, '#1a1a1a');
  }
  autoOutline(png);
  return png;
}

function drawBarcode() {
  const png = createEmptyPNG();
  // White background
  rect(png, 7, 7, 18, 18, '#f0f0f0');
  // Vertical black bars (varying widths, deterministic pattern)
  const bars = [
    [8, 1], [10, 1], [11, 2], [14, 1], [16, 1], [17, 2], [20, 1],
    [22, 1], [23, 1],
  ];
  for (const [bx, bw] of bars) {
    rect(png, bx, 8, bw, 13, '#1a1a1a');
  }
  // Guard bars (taller)
  rect(png, 8, 8, 1, 14, '#1a1a1a');
  rect(png, 15, 8, 1, 14, '#1a1a1a');
  rect(png, 23, 8, 1, 14, '#1a1a1a');
  // Number area below bars
  hline(png, 9, 22, 23, '#888888');
  // "digits"
  pixel(png, 10, 23, '#333333');
  pixel(png, 12, 23, '#333333');
  pixel(png, 14, 23, '#333333');
  pixel(png, 17, 23, '#333333');
  pixel(png, 19, 23, '#333333');
  pixel(png, 21, 23, '#333333');
  autoOutline(png);
  return png;
}

function drawAlarmClock() {
  const png = createEmptyPNG();
  // Twin bells on top
  circle(png, 11, 8, 3, '#c0c0c0');
  circle(png, 21, 8, 3, '#c0c0c0');
  // Bell highlights
  pixel(png, 10, 7, '#dddddd');
  pixel(png, 20, 7, '#dddddd');
  // Clapper between bells
  rect(png, 15, 6, 2, 2, '#888888');
  // Clock body
  circle(png, 16, 16, 8, '#c0c0c0');
  // Clock face
  circle(png, 16, 16, 6, '#f0f0f0');
  // Hour marks
  pixel(png, 16, 10, '#333333');
  pixel(png, 22, 16, '#333333');
  pixel(png, 16, 22, '#333333');
  pixel(png, 10, 16, '#333333');
  // Hour hand
  line(png, 16, 16, 14, 12, '#333333');
  // Minute hand
  line(png, 16, 16, 20, 14, '#333333');
  // Center
  pixel(png, 16, 16, '#ff0000');
  // Legs
  line(png, 10, 23, 8, 25, '#888888');
  line(png, 22, 23, 24, 25, '#888888');
  // Chrome bezel
  circleOutline(png, 16, 16, 7, '#999999');
  autoOutline(png);
  return png;
}

// === SPACE & VEHICLES (4) ===

function drawFlipPhone() {
  const png = createEmptyPNG();
  // Open clamshell: screen half (top) and keypad half (bottom) with hinge

  // Top half — screen section
  rect(png, 10, 5, 12, 10, '#c0c0c0');   // Silver body top
  rect(png, 11, 6, 10, 7, '#1a1a1a');     // Screen bezel
  rect(png, 12, 7, 8, 5, '#2244aa');      // Blue screen
  // Screen content: signal bars + time
  pixel(png, 13, 7, '#00ff00');
  pixel(png, 14, 7, '#00ff00');
  pixel(png, 15, 8, '#00ff00');
  hline(png, 16, 18, 9, '#ffffff');        // text line

  // Hinge
  rect(png, 10, 15, 12, 1, '#888888');

  // Bottom half — keypad section
  rect(png, 10, 16, 12, 10, '#c0c0c0');   // Silver body bottom
  // Number keypad grid (3x4)
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      rect(png, 12 + col * 3, 17 + row * 2, 2, 1, '#444444');
    }
  }
  // Send/End buttons
  pixel(png, 12, 25, '#00cc00');           // green call
  pixel(png, 19, 25, '#cc0000');           // red end

  // Mouth: speaker dots at bottom of phone
  speakerDots(png, 16, 18, 10, '#666666');
  autoOutline(png);
  return png;
}

function drawSatelliteDish() {
  const png = createEmptyPNG();
  // Satellite dish — tilted upward at ~40°, 3/4 view
  // Asymmetric oval: wider at top (face visible), narrow at bottom (foreshortened)

  // Dish rows: [y, xStart, xEnd]
  const dishRows = [
    [5,  14, 19],
    [6,  12, 21],
    [7,  10, 23],
    [8,   9, 24],
    [9,   9, 24],
    [10,  9, 24],
    [11, 10, 23],
    [12, 11, 22],
    [13, 13, 20],
    [14, 14, 18],
  ];

  // Inner concave surface (light gray)
  for (const [y, x1, x2] of dishRows) {
    hline(png, x1, x2, y, '#dcdcdc');
  }
  // Highlight on upper face (light catching concave surface)
  for (const [y, x1, x2] of dishRows) {
    if (y <= 8) {
      const cx = Math.floor((x1 + x2) / 2);
      hline(png, cx - 3, cx + 3, y, '#eeeeee');
    }
  }
  // Shadow on lower-left (dish depth)
  for (const [y, x1, x2] of dishRows) {
    if (y >= 11) {
      hline(png, x1, Math.min(x1 + 2, x2), y, '#bbbbbb');
    }
  }
  // Rim edges
  for (const [y, x1, x2] of dishRows) {
    pixel(png, x1, y, '#aaaaaa');
    pixel(png, x2, y, '#b8b8b8');
  }
  hline(png, 14, 19, 5, '#b0b0b0');   // top rim
  hline(png, 14, 18, 14, '#a0a0a0');  // bottom rim

  // Feed arm — diagonal from dish center to LNB focal point
  line(png, 16, 9, 22, 5, '#888888');

  // LNB receiver at focal point
  rect(png, 22, 4, 2, 3, '#cc0000');

  // Support bracket where pole meets dish
  rect(png, 15, 14, 3, 2, '#888888');

  // Support pole
  rect(png, 16, 16, 2, 8, '#666666');

  // Base mount
  rect(png, 14, 24, 6, 1, '#888888');

  // Mouth: LED bar on support pole
  ledBar(png, 17, 19, 6, '#cc0000');
  autoOutline(png);
  return png;
}

function drawSpaceStation() {
  const png = createEmptyPNG();
  // Central pressurized module
  rect(png, 12, 12, 8, 6, '#c0c0c0');
  // Module detail: windows
  pixel(png, 14, 14, '#4488ff');
  pixel(png, 17, 14, '#4488ff');
  // Module hatches
  rect(png, 12, 14, 1, 2, '#888888');
  rect(png, 19, 14, 1, 2, '#888888');

  // Truss beam (horizontal)
  rect(png, 3, 14, 26, 2, '#999999');
  // Truss detail lines
  for (let x = 4; x <= 27; x += 3) {
    pixel(png, x, 14, '#777777');
    pixel(png, x, 15, '#777777');
  }

  // Solar panel arrays (left pair)
  rect(png, 3, 7, 5, 6, '#334488');
  rect(png, 3, 17, 5, 6, '#334488');
  // Solar panel grid lines
  for (let y = 8; y <= 12; y += 2) {
    hline(png, 3, 7, y, '#2a3a6a');
  }
  for (let y = 18; y <= 22; y += 2) {
    hline(png, 3, 7, y, '#2a3a6a');
  }
  vline(png, 5, 7, 12, '#2a3a6a');
  vline(png, 5, 17, 22, '#2a3a6a');

  // Solar panel arrays (right pair)
  rect(png, 24, 7, 5, 6, '#334488');
  rect(png, 24, 17, 5, 6, '#334488');
  for (let y = 8; y <= 12; y += 2) {
    hline(png, 24, 28, y, '#2a3a6a');
  }
  for (let y = 18; y <= 22; y += 2) {
    hline(png, 24, 28, y, '#2a3a6a');
  }
  vline(png, 26, 7, 12, '#2a3a6a');
  vline(png, 26, 17, 22, '#2a3a6a');

  // Docking port on top
  rect(png, 15, 10, 2, 2, '#888888');

  // Radiator panel below center
  rect(png, 13, 18, 6, 1, '#dddddd');

  // Mouth: LED segments on the central module
  ledSegments(png, 16, 17, 6, '#4488ff');
  autoOutline(png);
  return png;
}

function drawRocketShip() {
  const png = createEmptyPNG();
  // Classic retro rocket, nose pointing up

  // Nose cone (pointed top)
  pixel(png, 15, 4, '#e0e0e0');
  pixel(png, 16, 4, '#e0e0e0');
  rect(png, 14, 5, 4, 2, '#e0e0e0');
  rect(png, 13, 7, 6, 2, '#e0e0e0');

  // Main fuselage
  rect(png, 12, 9, 8, 12, '#e0e0e0');
  // Fuselage stripe (red racing stripe)
  rect(png, 12, 12, 8, 2, '#cc0000');
  // Porthole window
  circle(png, 16, 10, 1, '#4488ff');
  border(png, 14, 9, 4, 3, '#999999');

  // Side fins (left)
  for (let i = 0; i < 4; i++) {
    pixel(png, 11 - i, 18 + i, '#cc0000');
    pixel(png, 11 - i, 19 + i, '#cc0000');
  }
  // Side fins (right)
  for (let i = 0; i < 4; i++) {
    pixel(png, 20 + i, 18 + i, '#cc0000');
    pixel(png, 20 + i, 19 + i, '#cc0000');
  }

  // Engine nozzle
  rect(png, 13, 21, 6, 2, '#888888');
  rect(png, 14, 23, 4, 1, '#666666');

  // Exhaust flame
  pixel(png, 15, 24, '#ff6600');
  pixel(png, 16, 24, '#ff6600');
  pixel(png, 14, 25, '#ff6600');
  pixel(png, 15, 25, '#ffaa00');
  pixel(png, 16, 25, '#ffaa00');
  pixel(png, 17, 25, '#ff6600');
  pixel(png, 15, 26, '#ff4400');
  pixel(png, 16, 26, '#ff4400');

  // Mouth: grill on the fuselage below the stripe
  grillHorizontal(png, 16, 17, 6, '#999999');
  autoOutline(png);
  return png;
}

// ─────────────────────────────────────
// MAIN
// ─────────────────────────────────────

const HEAD_GENERATORS = {
  // Screens & Monitors
  'head-crt-static': drawCrtStatic,
  'head-oscilloscope': drawOscilloscope,
  'head-terminal': drawTerminal,
  'head-broken-lcd': drawBrokenLcd,
  'head-security-monitor': drawSecurityMonitor,
  'head-led-matrix': drawLedMatrix,
  'head-e-ink': drawEInk,
  'head-hologram': drawHologram,
  // Cameras & Surveillance
  'head-cctv': drawCctv,
  'head-webcam': drawWebcam,
  'head-polaroid': drawPolaroid,
  'head-projector': drawProjector,
  'head-dashcam': drawDashcam,
  // Industrial & Urban
  'head-traffic-light': drawTrafficLight,
  'head-parking-meter': drawParkingMeter,
  'head-atm': drawAtm,
  'head-gas-pump': drawGasPump,
  'head-circuit-breaker': drawCircuitBreaker,
  'head-transformer': drawTransformer,
  // Audio & Music
  'head-speaker-stack': drawSpeakerStack,
  'head-vinyl': drawVinyl,
  'head-radio-vintage': drawRadioVintage,
  'head-walkie-talkie': drawWalkieTalkie,
  'head-synthesizer': drawSynthesizer,
  // Retro Tech
  'head-floppy': drawFloppy,
  'head-gameboy': drawGameboy,
  'head-pager': drawPager,
  'head-vcr': drawVcr,
  'head-rotary-phone': drawRotaryPhone,
  // Appliances
  'head-blender': drawBlender,
  'head-coffee-maker': drawCoffeeMaker,
  'head-air-conditioner': drawAirConditioner,
  'head-space-heater': drawSpaceHeater,
  'head-vacuum': drawVacuum,
  // Weird/Fun
  'head-lava-lamp': drawLavaLamp,
  'head-disco-ball': drawDiscoBall,
  'head-gumball': drawGumball,
  'head-slot-machine': drawSlotMachine,
  'head-vaporwave': drawVaporwave,
  'head-magic-8ball': drawMagic8Ball,
  // Computing
  'head-server-rack': drawServerRack,
  'head-hard-drive': drawHardDrive,
  'head-usb-drive': drawUsbDrive,
  'head-motherboard': drawMotherboard,
  'head-router': drawRouter,
  // Instruments
  'head-speedometer': drawSpeedometer,
  'head-compass': drawCompass,
  'head-stopwatch': drawStopwatch,
  'head-thermostat': drawThermostat,
  // Safety & Industrial
  'head-fire-extinguisher': drawFireExtinguisher,
  'head-smoke-detector': drawSmokeDetector,
  'head-megaphone': drawMegaphone,
  'head-battery': drawBattery,
  // Science
  'head-telescope': drawTelescope,
  'head-microscope': drawMicroscope,
  'head-lightbulb': drawLightbulb,
  // Media & Input
  'head-joystick': drawJoystick,
  'head-clapperboard': drawClapperboard,
  'head-qr-code': drawQrCode,
  'head-barcode': drawBarcode,
  'head-alarm-clock': drawAlarmClock,
  // Space & Vehicles
  'head-flip-phone': drawFlipPhone,
  'head-satellite-dish': drawSatelliteDish,
  'head-space-station': drawSpaceStation,
  'head-rocket-ship': drawRocketShip,
};

async function main() {
  console.log('=== Generate New Robot Heads ===\n');

  // Read spec
  const specRaw = await fs.readFile(SPEC_PATH, 'utf-8');
  const spec = JSON.parse(specRaw);

  // Collect all head names from spec
  const specNames = [];
  for (const category of Object.values(spec.categories)) {
    for (const head of category.heads) {
      specNames.push(head.name);
    }
  }

  console.log(`Spec defines ${specNames.length} heads`);

  // Verify we have generators for all spec entries
  const missing = specNames.filter(n => !HEAD_GENERATORS[n]);
  if (missing.length > 0) {
    console.error(`Missing generators for: ${missing.join(', ')}`);
    process.exit(1);
  }

  // Ensure output dir exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Generate each head
  let count = 0;
  for (const name of specNames) {
    const generator = HEAD_GENERATORS[name];
    const png = generator();
    await savePNG(png, name);
    count++;
    console.log(`  ✓ ${name}`);
  }

  console.log(`\n✓ Generated ${count} new head PNGs`);
  console.log(`  Output: ${OUTPUT_DIR}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

/**
 * Mouth Drawing Library
 *
 * 15 robot mouth styles for Anons heads.
 * Each style function takes (png, centerX, y, width, color)
 * and draws the mouth pattern into the 32x32 PNG buffer.
 *
 * Mouth zone: rows 16-20 (below specs gap at 14-15)
 */

// ─────────────────────────────────────
// Pixel helpers (match generate-heads.js)
// ─────────────────────────────────────

function parseColor(hex) {
  if (typeof hex !== 'string') return hex;
  hex = hex.replace('#', '');
  return [
    parseInt(hex.substring(0, 2), 16),
    parseInt(hex.substring(2, 4), 16),
    parseInt(hex.substring(4, 6), 16),
  ];
}

function setPixel(png, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= 32 || y < 0 || y >= 32) return;
  const idx = (y * 32 + x) * 4;
  png.data[idx] = r;
  png.data[idx + 1] = g;
  png.data[idx + 2] = b;
  png.data[idx + 3] = a;
}

function getPixel(png, x, y) {
  if (x < 0 || x >= 32 || y < 0 || y >= 32) return { r: 0, g: 0, b: 0, a: 0 };
  const idx = (y * 32 + x) * 4;
  return {
    r: png.data[idx],
    g: png.data[idx + 1],
    b: png.data[idx + 2],
    a: png.data[idx + 3],
  };
}

function drawPixel(png, x, y, color) {
  const [r, g, b] = parseColor(color);
  setPixel(png, x, y, r, g, b);
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

function rect(png, x, y, w, h, color) {
  const [r, g, b] = parseColor(color);
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      setPixel(png, px, py, r, g, b);
    }
  }
}

// ─────────────────────────────────────
// Color helpers
// ─────────────────────────────────────

function getLuminance(r, g, b) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Sample the head's average luminance in the mouth zone
 * and return a contrasting dark or light color.
 */
export function selectMouthColor(png, mouthY) {
  let totalLum = 0;
  let count = 0;

  // Sample a few rows around the mouth zone
  for (let dy = -1; dy <= 1; dy++) {
    const y = mouthY + dy;
    if (y < 0 || y >= 32) continue;
    for (let x = 8; x < 24; x++) {
      const px = getPixel(png, x, y);
      if (px.a > 0) {
        totalLum += getLuminance(px.r, px.g, px.b);
        count++;
      }
    }
  }

  if (count === 0) return '#333333';
  const avgLum = totalLum / count;
  // Dark head → light mouth, light head → dark mouth
  return avgLum > 0.5 ? '#333333' : '#cccccc';
}

/**
 * Find the horizontal opaque extent at a given row.
 * Returns { left, right, center, width } or null if row is transparent.
 */
export function findOpaqueExtent(png, y) {
  let left = -1;
  let right = -1;
  for (let x = 0; x < 32; x++) {
    if (getPixel(png, x, y).a > 0) {
      if (left === -1) left = x;
      right = x;
    }
  }
  if (left === -1) return null;
  return {
    left,
    right,
    center: Math.round((left + right) / 2),
    width: right - left + 1,
  };
}

/**
 * Auto-detect mouth position in rows 16-20.
 * Returns { centerX, y, width } for placement.
 */
export function autoPosition(png) {
  // Find the widest opaque row in mouth zone
  let best = null;
  for (let y = 16; y <= 20; y++) {
    const ext = findOpaqueExtent(png, y);
    if (ext && (!best || ext.width > best.width)) {
      best = { centerX: ext.center, y, width: ext.width };
    }
  }
  // Fallback: use row 18, center 16
  if (!best) {
    return { centerX: 16, y: 18, width: 10 };
  }
  // Target row 18 if available, else best row
  const row18 = findOpaqueExtent(png, 18);
  if (row18 && row18.width >= best.width * 0.6) {
    return { centerX: row18.center, y: 18, width: row18.width };
  }
  return best;
}

/**
 * Check if rows 16-20 already have significant pixel variation
 * (suggesting an existing mouth or feature).
 */
export function hasMouthFeature(png) {
  let uniqueColors = new Set();
  let opaqueCount = 0;

  for (let y = 16; y <= 20; y++) {
    for (let x = 6; x < 26; x++) {
      const px = getPixel(png, x, y);
      if (px.a > 0) {
        opaqueCount++;
        // Quantize to reduce noise
        const key = `${Math.floor(px.r / 32)},${Math.floor(px.g / 32)},${Math.floor(px.b / 32)}`;
        uniqueColors.add(key);
      }
    }
  }

  // If there are 4+ distinct color groups, likely has a feature
  return uniqueColors.size >= 4;
}

// ─────────────────────────────────────
// 15 Mouth Styles
// ─────────────────────────────────────
// Each takes: (png, centerX, y, width, color)
//   centerX = horizontal center of the mouth
//   y       = vertical center row of the mouth
//   width   = available horizontal space
//   color   = hex color string

/** 3 horizontal lines with 1px gap — speakers, vents */
export function grillHorizontal(png, cx, y, w, color) {
  const hw = Math.min(Math.floor(w * 0.35), 5); // half-width
  hline(png, cx - hw, cx + hw, y - 1, color);
  hline(png, cx - hw, cx + hw, y + 1, color);
  hline(png, cx - hw, cx + hw, y + 3, color);
}

/** 3-4 vertical lines — radiators, grilles */
export function grillVertical(png, cx, y, w, color) {
  const hw = Math.min(Math.floor(w * 0.3), 4);
  const count = hw >= 3 ? 4 : 3;
  const spacing = Math.max(2, Math.floor((hw * 2) / (count - 1)));
  const startX = cx - Math.floor(spacing * (count - 1) / 2);
  for (let i = 0; i < count; i++) {
    vline(png, startX + i * spacing, y - 1, y + 1, color);
  }
}

/** 1 horizontal opening — toasters, mail slots */
export function slotSingle(png, cx, y, w, color) {
  const hw = Math.min(Math.floor(w * 0.3), 4);
  hline(png, cx - hw, cx + hw, y, color);
}

/** 2 horizontal openings — cassette decks, VCRs */
export function slotDouble(png, cx, y, w, color) {
  const hw = Math.min(Math.floor(w * 0.25), 3);
  hline(png, cx - hw, cx + hw, y - 1, color);
  hline(png, cx - hw, cx + hw, y + 1, color);
}

/** 3x3 grid of dots — boomboxes, intercoms */
export function speakerDots(png, cx, y, w, color) {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -2; dx <= 2; dx += 2) {
      drawPixel(png, cx + dx, y + dy, color);
    }
  }
}

/** Row of 3-5 small lit dots — digital displays */
export function ledSegments(png, cx, y, w, color) {
  const count = Math.min(5, Math.max(3, Math.floor(w * 0.25)));
  const startX = cx - Math.floor((count - 1) / 2);
  for (let i = 0; i < count; i++) {
    drawPixel(png, startX + i, y, color);
  }
}

/** Single small colored bar — minimal tech */
export function ledBar(png, cx, y, w, color) {
  hline(png, cx - 1, cx + 1, y, color);
}

/** Simple flat line — minimal, any head */
export function pixelNeutral(png, cx, y, w, color) {
  const hw = Math.min(Math.floor(w * 0.2), 3);
  hline(png, cx - hw, cx + hw, y, color);
}

/** Slight upward curve — friendly objects */
export function pixelSmile(png, cx, y, w, color) {
  const hw = Math.min(Math.floor(w * 0.2), 3);
  hline(png, cx - hw + 1, cx + hw - 1, y, color);
  drawPixel(png, cx - hw, y - 1, color);
  drawPixel(png, cx + hw, y - 1, color);
}

/** Slight downward curve — grumpy objects */
export function pixelFrown(png, cx, y, w, color) {
  const hw = Math.min(Math.floor(w * 0.2), 3);
  hline(png, cx - hw + 1, cx + hw - 1, y, color);
  drawPixel(png, cx - hw, y + 1, color);
  drawPixel(png, cx + hw, y + 1, color);
}

/** Diagonal slat lines — AC units, industrial */
export function ventAngled(png, cx, y, w, color) {
  const hw = Math.min(Math.floor(w * 0.25), 3);
  // 3 diagonal slats going down-right
  for (let i = -1; i <= 1; i++) {
    const baseX = cx + i * 2;
    drawPixel(png, baseX - 1, y - 1, color);
    drawPixel(png, baseX, y, color);
    drawPixel(png, baseX + 1, y + 1, color);
  }
}

/** 2-3 small squares — control panels */
export function buttonsRow(png, cx, y, w, color) {
  const count = w > 12 ? 3 : 2;
  const spacing = count === 3 ? 3 : 4;
  const startX = cx - Math.floor(spacing * (count - 1) / 2);
  for (let i = 0; i < count; i++) {
    const bx = startX + i * spacing;
    rect(png, bx, y, 2, 2, color);
  }
}

/** Tiny rectangular display — tech, monitors */
export function screenMini(png, cx, y, w, color) {
  const hw = Math.min(2, Math.floor(w * 0.15));
  rect(png, cx - hw, y - 1, hw * 2 + 1, 3, color);
}

/** Zigzag line — bags, cases */
export function zipper(png, cx, y, w, color) {
  const hw = Math.min(Math.floor(w * 0.25), 4);
  for (let dx = -hw; dx <= hw; dx++) {
    const dy = dx % 2 === 0 ? 0 : 1;
    drawPixel(png, cx + dx, y + dy, color);
  }
}

/** Blocky rectangular teeth — robots, cash registers */
export function teethSquare(png, cx, y, w, color) {
  const hw = Math.min(Math.floor(w * 0.25), 3);
  // Top row: teeth with gaps
  for (let dx = -hw; dx <= hw; dx++) {
    if (dx % 2 === 0) {
      drawPixel(png, cx + dx, y - 1, color);
      drawPixel(png, cx + dx, y, color);
    }
  }
  // Bottom bar connecting teeth
  hline(png, cx - hw, cx + hw, y + 1, color);
}

// ─────────────────────────────────────
// Style registry
// ─────────────────────────────────────

export const MOUTH_STYLES = {
  'grill-horizontal': grillHorizontal,
  'grill-vertical': grillVertical,
  'slot-single': slotSingle,
  'slot-double': slotDouble,
  'speaker-dots': speakerDots,
  'led-segments': ledSegments,
  'led-bar': ledBar,
  'pixel-neutral': pixelNeutral,
  'pixel-smile': pixelSmile,
  'pixel-frown': pixelFrown,
  'vent-angled': ventAngled,
  'buttons-row': buttonsRow,
  'screen-mini': screenMini,
  'zipper': zipper,
  'teeth-square': teethSquare,
};

/**
 * Draw a mouth by style name.
 * @param {PNG} png - pngjs PNG instance
 * @param {string} style - one of the MOUTH_STYLES keys
 * @param {number} centerX - horizontal center
 * @param {number} y - vertical center row
 * @param {number} width - available horizontal width
 * @param {string} color - hex color
 */
export function drawMouth(png, style, centerX, y, width, color) {
  const fn = MOUTH_STYLES[style];
  if (!fn) throw new Error(`Unknown mouth style: ${style}`);
  fn(png, centerX, y, width, color);
}

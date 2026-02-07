# Anons Trait Transformer

Programmatically transform Nouns CC0 traits into Anons robot traits.

## Overview

This pipeline:
1. **Decodes** Nouns RLE data from `@nouns/assets` back to 32x32 PNGs
2. **Roboticizes** organic traits (replaces flesh tones with metal, adds mechanical effects)
3. **Generates** new specs (LED visor bars) and antennas (6th trait)
4. **Encodes** everything back to RLE for on-chain deployment

## Quick Start

```bash
npm install
npm run build
npm run preview
```

## Pipeline Steps

### 1. Decode Nouns Traits

```bash
npm run decode
```

Downloads `@nouns/assets` and decodes RLE-encoded traits back to PNG:
- `decoded-traits/bodies/` - 30 body PNGs
- `decoded-traits/heads/` - 234 head PNGs
- `decoded-traits/accessories/` - 137 accessory PNGs
- `decoded-traits/glasses/` - 21 glasses PNGs (not used, replaced by specs)

### 2. Roboticize

```bash
npm run roboticize
```

Transforms organic Nouns into mechanical Anons:
- Replaces flesh tones with metal palettes (steel, chrome, rust, copper, matte black, military)
- Adds metallic sheen to all colors
- Darkens edges to suggest panel lines

Output: `roboticized-traits/`

### 3. Generate Specs

```bash
npm run generate-specs
```

Creates the signature Anons trait - horizontal LED visor bars:
- Position: Always rows 10-11, cols 6-25 (20×2 pixels)
- Shape: ◖▬◗ (rounded ends)
- Variations: Colors (dawn/dusk), patterns (scan pulse, equalizer, binary, loading bar), specials (chromatic, split)

Output: `generated-traits/specs/`

### 4. Generate Antennas

```bash
npm run generate-antennas
```

Creates the NEW 6th trait unique to Anons:
- Index 0 = "none" (transparent)
- Classic: single rod, rabbit ears, satellite dish, lightning rod
- Tech: WiFi, radar, Tesla coil, periscope
- Weird: propeller, unicorn horn, crown, flag, sprout, arrow through head, halo

Output: `generated-traits/antennas/`

### 5. Encode

```bash
npm run encode
```

Encodes all traits to RLE format:
- Builds unified color palette
- Compresses each PNG to RLE bytes
- Outputs `image-data.json` for contract deployment

Output: `output/image-data.json`

### 6. Preview

```bash
npm run preview
```

Renders sample Anons to verify the pipeline:
- Generates 10 random Anons
- Generates 1 validation Anon (all trait index 0)
- Output: `output/previews/`

## Trait Structure

### Nouns (5 traits)
```
background, body, accessory, head, glasses
```

### Anons (6 traits)
```
background, body, head, specs, antenna, accessory
```

Key differences:
- `glasses` → `specs` (renamed, completely replaced)
- `antenna` added (new 6th trait)
- Layer order changed: specs render ON TOP of head

## Customization

### Metal Palettes

Edit `roboticize.js` to add/modify metal color palettes:

```javascript
const METAL_PALETTES = {
  steel: [...],
  chrome: [...],
  rust: [...],
  // Add your own:
  custom: [
    { r: 100, g: 100, b: 110 },
    // ...
  ]
};
```

### Specs Patterns

Edit `generate-specs.js` to add new specs patterns:

```javascript
async function generateCustomPattern(name) {
  const png = createEmptyPNG();
  drawSpecsBar(png, (x, y) => {
    // Your custom color logic
    return { r, g, b };
  });
  return savePNG(png, name);
}
```

### Antennas

Edit `generate-antennas.js` to add new antenna designs:

```javascript
async function generateCustomAntenna() {
  const png = createEmptyPNG();
  // Draw your antenna using helper functions:
  // drawLine(), drawRect(), drawCircle(), setPixel()
  return savePNG(png, 'custom-antenna');
}
```

## Output Format

### image-data.json

```json
{
  "palette": ["000000", "ffffff", ...],
  "bgcolors": ["e6d3a3", ...],
  "images": {
    "bodies": [{ "filename": "body-0", "data": "base64..." }, ...],
    "heads": [...],
    "specs": [...],
    "antennas": [...],
    "accessories": [...]
  }
}
```

## Contract Integration

The output `image-data.json` is compatible with the Nouns descriptor contract pattern.

To use with modified Anons contracts:

1. Update `NounsSeeder.sol` to include 6-trait Seed struct
2. Update `NounsDescriptor.sol` to handle specs + antennas
3. Upload traits using `addMany{Bodies,Heads,Specs,Antennas,Accessories}()`
4. Deploy and mint!

See the main Anons implementation guide for full contract modifications.

## License

Nouns traits are CC0 (public domain).
Generated Anons traits are also CC0.

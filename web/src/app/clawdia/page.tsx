'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────
interface TraitEntry {
  filename: string
  data: string
}

interface ImageData {
  palette: string[]
  bgcolors: string[]
  images: {
    bodies: TraitEntry[]
    heads: TraitEntry[]
    specs: TraitEntry[]
    antennas: TraitEntry[]
    accessories: TraitEntry[]
  }
}

interface Seed {
  background: number
  body: number
  head: number
  specs: number
  antenna: number
  accessory: number
}

// ─── RLE Decoder ─────────────────────────────────────────────
// Matches the pipeline encoder format: 4 bound bytes + run-length pairs
function decodeRLE(base64Data: string, palette: string[]): (string | null)[] {
  const pixels: (string | null)[] = new Array(32 * 32).fill(null)
  if (!base64Data) return pixels

  const raw = atob(base64Data)
  const bytes: number[] = []
  for (let i = 0; i < raw.length; i++) bytes.push(raw.charCodeAt(i))

  const top = bytes[0]
  const right = bytes[1]   // exclusive
  const bottom = bytes[2]  // exclusive
  const left = bytes[3]

  let x = left, y = top, idx = 4
  while (idx + 1 < bytes.length && y < bottom) {
    const runLength = bytes[idx]
    const colorIndex = bytes[idx + 1]
    let remaining = runLength
    while (remaining > 0 && y < bottom) {
      const count = Math.min(remaining, right - x)
      for (let j = 0; j < count; j++) {
        if (x < 32 && y < 32 && colorIndex > 0 && colorIndex <= palette.length) {
          pixels[y * 32 + x] = palette[colorIndex - 1]
        }
        x++
      }
      remaining -= count
      if (x >= right) { x = left; y++ }
    }
    idx += 2
  }
  return pixels
}

// ─── Body Name Map ───────────────────────────────────────────
// Bodies are all grayscale after roboticization — names describe the tone
// Bodies span from near-white (avg 220) to dark gray (avg 70), sorted alphabetically.
// Names describe the gray tone — lightest to darkest.
const BODY_NAMES: Record<string, string> = {
  'body-bege-bsod': 'White',
  'body-bege-crt': 'Snow',
  'body-blue-sky': 'Ivory',
  'body-bluegrey': 'Cream',
  'body-cold': 'Pearl',
  'body-computerblue': 'Frost',
  'body-darkbrown': 'Bone',
  'body-darkpink': 'Porcelain',
  'body-foggrey': 'Fog',
  'body-gold': 'Silver',
  'body-grayscale-1': 'Platinum',
  'body-grayscale-7': 'Cloud',
  'body-grayscale-8': 'Ash',
  'body-grayscale-9': 'Aluminum',
  'body-green': 'Tin',
  'body-gunk': 'Nickel',
  'body-hotbrown': 'Steel',
  'body-magenta': 'Zinc',
  'body-orange-yellow': 'Pewter',
  'body-orange': 'Iron',
  'body-peachy-B': 'Alloy',
  'body-peachy-a': 'Lead',
  'body-purple': 'Slate',
  'body-red': 'Tungsten',
  'body-redpinkish': 'Gunmetal',
  'body-rust': 'Carbon',
  'body-slimegreen': 'Graphite',
  'body-teal-light': 'Charcoal',
  'body-teal': 'Onyx',
  'body-yellow': 'Obsidian',
}

// ─── Helpers ─────────────────────────────────────────────────
function displayName(filename: string): string {
  if (BODY_NAMES[filename]) return BODY_NAMES[filename]
  return filename
    .replace(/^(head|body|specs|antenna|accessory)-/, '')
    .replace(/-/g, ' ')
}

function renderPixels(
  ctx: CanvasRenderingContext2D,
  pixels: (string | null)[],
  scale: number,
) {
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const color = pixels[y * 32 + x]
      if (color) {
        ctx.fillStyle = `#${color}`
        ctx.fillRect(x * scale, y * scale, scale, scale)
      }
    }
  }
}

// ─── Thumbnail Cache ─────────────────────────────────────────
// Renders each trait to a tiny data URL for selector previews
function buildThumbnails(
  items: TraitEntry[],
  palette: string[],
  bgHex?: string,
): string[] {
  return items.map(item => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')!

    if (bgHex) {
      ctx.fillStyle = `#${bgHex}`
      ctx.fillRect(0, 0, 32, 32)
    } else {
      // Checkerboard for transparency
      for (let y = 0; y < 32; y += 2) {
        for (let x = 0; x < 32; x += 2) {
          ctx.fillStyle = '#e8e8e8'
          ctx.fillRect(x, y, 1, 1)
          ctx.fillRect(x + 1, y + 1, 1, 1)
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(x + 1, y, 1, 1)
          ctx.fillRect(x, y + 1, 1, 1)
        }
      }
    }

    const pixels = decodeRLE(item.data, palette)
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const color = pixels[y * 32 + x]
        if (color) {
          ctx.fillStyle = `#${color}`
          ctx.fillRect(x, y, 1, 1)
        }
      }
    }
    return canvas.toDataURL()
  })
}

// ─── Trait Selector Component ────────────────────────────────
function TraitSelector({
  label,
  items,
  thumbnails,
  value,
  onChange,
  searchable = false,
}: {
  label: string
  items: TraitEntry[]
  thumbnails: string[]
  value: number
  onChange: (v: number) => void
  searchable?: boolean
}) {
  const [filter, setFilter] = useState('')
  const gridRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (!filter) return items.map((item, i) => ({ item, index: i }))
    const q = filter.toLowerCase()
    return items
      .map((item, i) => ({ item, index: i }))
      .filter(({ item }) => displayName(item.filename).toLowerCase().includes(q))
  }, [items, filter])

  // Scroll selected item into view on mount
  useEffect(() => {
    if (gridRef.current) {
      const active = gridRef.current.querySelector('[data-active="true"]')
      if (active) active.scrollIntoView({ block: 'nearest' })
    }
  }, [])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-nouns-text capitalize">
          {label}{' '}
          <span className="font-normal text-nouns-muted">({items.length})</span>
        </label>
        {searchable && (
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Search..."
            className="px-2.5 py-1 text-xs rounded-lg bg-warm-bg border border-nouns-border text-nouns-text placeholder-nouns-muted/50 w-36"
          />
        )}
      </div>
      <div
        ref={gridRef}
        className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-1.5 max-h-60 overflow-y-auto pr-1"
      >
        {filtered.map(({ item, index }) => (
          <button
            key={index}
            data-active={value === index}
            onClick={() => onChange(index)}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${
              value === index
                ? 'bg-nouns-blue/20 ring-2 ring-nouns-blue'
                : 'bg-nouns-surface hover:bg-warm-bg'
            }`}
          >
            <img
              src={thumbnails[index]}
              alt={item.filename}
              className="w-10 h-10 rounded"
              style={{ imageRendering: 'pixelated' }}
            />
            <span className="text-[10px] text-nouns-muted truncate w-full text-center leading-tight">
              {displayName(item.filename)}
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-xs text-nouns-muted py-4 text-center">No matches</p>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────
export default function ClawdiaBuilder() {
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [seed, setSeed] = useState<Seed>({
    background: 0,
    body: 0,
    head: 0,
    specs: 0,
    antenna: 0,
    accessory: 0,
  })

  // Load image data on mount
  useEffect(() => {
    fetch('/image-data.json')
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch image-data.json')
        return r.json()
      })
      .then((data: ImageData) => {
        setImageData(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  // Build thumbnails (memoized, only recomputes when imageData changes)
  const thumbnails = useMemo(() => {
    if (!imageData) return null
    const { palette } = imageData
    return {
      bodies: buildThumbnails(imageData.images.bodies, palette, 'cccccc'),
      heads: buildThumbnails(imageData.images.heads, palette),
      specs: buildThumbnails(imageData.images.specs, palette, '333333'),
      antennas: buildThumbnails(imageData.images.antennas, palette),
      accessories: buildThumbnails(imageData.images.accessories, palette),
    }
  }, [imageData])

  // Render composited Anon on canvas
  useEffect(() => {
    if (!imageData || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    const { palette, bgcolors, images } = imageData
    const SCALE = 10

    // Clear + background
    ctx.fillStyle = `#${bgcolors[seed.background]}`
    ctx.fillRect(0, 0, 320, 320)

    // Layer order: body → head → specs → antenna → accessory
    const layers = [
      images.bodies[seed.body],
      images.heads[seed.head],
      images.specs[seed.specs],
      images.antennas[seed.antenna],
      images.accessories[seed.accessory],
    ]

    for (const layer of layers) {
      if (!layer?.data) continue
      const pixels = decodeRLE(layer.data, palette)
      renderPixels(ctx, pixels, SCALE)
    }
  }, [imageData, seed])

  const updateSeed = useCallback((key: keyof Seed, value: number) => {
    setSeed(prev => ({ ...prev, [key]: value }))
  }, [])

  const randomize = useCallback(() => {
    if (!imageData) return
    setSeed({
      background: Math.floor(Math.random() * imageData.bgcolors.length),
      body: Math.floor(Math.random() * imageData.images.bodies.length),
      head: Math.floor(Math.random() * imageData.images.heads.length),
      specs: Math.floor(Math.random() * imageData.images.specs.length),
      antenna: Math.floor(Math.random() * imageData.images.antennas.length),
      accessory: Math.floor(Math.random() * imageData.images.accessories.length),
    })
  }, [imageData])

  const downloadPNG = useCallback(() => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `anon-${Object.values(seed).join('-')}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }, [seed])

  // Trait counts
  const totalTraits = imageData
    ? imageData.bgcolors.length +
      imageData.images.bodies.length +
      imageData.images.heads.length +
      imageData.images.specs.length +
      imageData.images.antennas.length +
      imageData.images.accessories.length
    : 0

  // Loading states
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-nouns-blue border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-nouns-muted text-sm">Loading traits...</p>
        </div>
      </div>
    )
  }

  if (error || !imageData || !thumbnails) {
    return (
      <div className="text-center py-32 space-y-2">
        <p className="text-nouns-text font-bold">Failed to load trait data</p>
        <p className="text-nouns-muted text-sm">{error || 'image-data.json not found'}</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 pb-16">
      {/* Header */}
      <div className="text-center space-y-1 pt-4">
        <h1 className="text-3xl font-bold text-nouns-text">Anon Builder</h1>
        <p className="text-nouns-muted text-sm">
          {totalTraits} traits across {Object.keys(imageData.images).length + 1} categories
        </p>
      </div>

      <div className="grid md:grid-cols-[340px_1fr] gap-6">
        {/* Left: Preview + Actions */}
        <div className="space-y-4">
          {/* Canvas */}
          <div className="rounded-2xl overflow-hidden border-4 border-nouns-border bg-nouns-surface">
            <canvas
              ref={canvasRef}
              width={320}
              height={320}
              className="w-full h-auto"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={randomize}
              className="py-2.5 bg-nouns-blue text-white font-bold text-sm rounded-lg hover:bg-nouns-blue/80 transition"
            >
              Randomize
            </button>
            <button
              onClick={downloadPNG}
              className="py-2.5 bg-nouns-surface text-nouns-text font-bold text-sm rounded-lg hover:bg-warm-bg transition border border-nouns-border"
            >
              Download PNG
            </button>
          </div>

          {/* Current trait names */}
          <div className="bg-nouns-surface rounded-xl p-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-nouns-muted">Background</span>
              <span className="text-nouns-text font-mono">#{imageData.bgcolors[seed.background]}</span>
            </div>
            {([
              ['body', imageData.images.bodies, seed.body],
              ['head', imageData.images.heads, seed.head],
              ['specs', imageData.images.specs, seed.specs],
              ['antenna', imageData.images.antennas, seed.antenna],
              ['accessory', imageData.images.accessories, seed.accessory],
            ] as [string, TraitEntry[], number][]).map(([label, items, idx]) => (
              <div key={label} className="flex justify-between">
                <span className="text-nouns-muted capitalize">{label}</span>
                <span className="text-nouns-text">{displayName(items[idx]?.filename || '')}</span>
              </div>
            ))}
          </div>

          {/* Seed export */}
          <details className="bg-nouns-surface rounded-xl p-3">
            <summary className="text-xs font-bold text-nouns-muted cursor-pointer">Seed Values</summary>
            <pre className="mt-2 text-xs font-mono text-nouns-text bg-warm-bg rounded-lg p-2 overflow-x-auto">
              {JSON.stringify(seed, null, 2)}
            </pre>
          </details>
        </div>

        {/* Right: Trait Selectors */}
        <div className="space-y-5">
          {/* Background */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-nouns-text">
              Background <span className="font-normal text-nouns-muted">({imageData.bgcolors.length})</span>
            </label>
            <div className="flex gap-2">
              {imageData.bgcolors.map((color, i) => (
                <button
                  key={i}
                  onClick={() => updateSeed('background', i)}
                  className={`w-14 h-14 rounded-xl transition-all ${
                    seed.background === i
                      ? 'ring-2 ring-nouns-blue ring-offset-2 ring-offset-warm-bg scale-110'
                      : 'hover:scale-105 border border-nouns-border'
                  }`}
                  style={{ backgroundColor: `#${color}` }}
                  title={`#${color}`}
                />
              ))}
            </div>
          </div>

          {/* Body */}
          <TraitSelector
            label="Body"
            items={imageData.images.bodies}
            thumbnails={thumbnails.bodies}
            value={seed.body}
            onChange={v => updateSeed('body', v)}
          />

          {/* Head (searchable — 189 items) */}
          <TraitSelector
            label="Head"
            items={imageData.images.heads}
            thumbnails={thumbnails.heads}
            value={seed.head}
            onChange={v => updateSeed('head', v)}
            searchable
          />

          {/* Specs */}
          <TraitSelector
            label="Specs"
            items={imageData.images.specs}
            thumbnails={thumbnails.specs}
            value={seed.specs}
            onChange={v => updateSeed('specs', v)}
          />

          {/* Antenna */}
          <TraitSelector
            label="Antenna"
            items={imageData.images.antennas}
            thumbnails={thumbnails.antennas}
            value={seed.antenna}
            onChange={v => updateSeed('antenna', v)}
          />

          {/* Accessory (searchable — 145 items) */}
          <TraitSelector
            label="Accessory"
            items={imageData.images.accessories}
            thumbnails={thumbnails.accessories}
            value={seed.accessory}
            onChange={v => updateSeed('accessory', v)}
            searchable
          />
        </div>
      </div>
    </div>
  )
}

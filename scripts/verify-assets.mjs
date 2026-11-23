#!/usr/bin/env node
/**
 * CV-110/CV-111: assert Corvid piece SVG exports, Ravenboard colors, and play
 * sounds match DESIGN.md intent. DESIGN.md lives in the workspace root (local).
 * CI hardcodes the same hexes and sound contract.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, "..")
const workspaceRoot = resolve(repoRoot, "..")
const designPath = join(workspaceRoot, "DESIGN.md")

const PIECES = ["king", "queen", "rook", "bishop", "knight", "pawn"]
const SIDES = ["w", "b"]

/** Hexes from DESIGN.md Corvid / Ravenboard sections (must stay in sync). */
const DESIGN = {
  whiteFill: "#e8ecf4",
  whiteOutline: "#2f3d63",
  blackFill: "#1a1f2e",
  blackOutline: "#8fa3d9",
  bishopAccentLight: "#2f3d63",
  bishopAccentDark: "#c9a227",
  strokeWidth: "1.5",
  viewBox: "0 0 45 45",
  ravenboard: {
    light: { lightSquare: "#c5cddf", darkSquare: "#3a4563" },
    dark: { lightSquare: "#4a5570", darkSquare: "#1c2233" },
    lastMove: { color: "#c9a227", opacity: 0.35 },
    selected: { color: "#8fa3d9", widthPx: 2 },
    legalMove: { color: "#8fa3d9" },
    coordinates: {
      onDark: "#e6e9f2",
      onLight: "#2f3d63",
      font: "IBM Plex Mono",
      sizePx: 11,
    },
  },
}

let failed = 0
const fail = (msg) => {
  console.error(`FAIL: ${msg}`)
  failed += 1
}
const ok = (msg) => console.log(`OK: ${msg}`)

const normalizeHex = (h) => h.trim().toLowerCase()

const piecePath = (side, piece, dir) =>
  join(repoRoot, "pieces", "corvid", dir, `${side}-${piece}.svg`)

for (const side of SIDES) {
  for (const piece of PIECES) {
    const exportFile = piecePath(side, piece, ".")
    const srcFile = piecePath(side, piece, "src")
    if (!existsSync(exportFile)) {
      fail(`missing export ${exportFile}`)
      continue
    }
    if (!existsSync(srcFile)) {
      fail(`missing source ${srcFile}`)
      continue
    }
    const exportSvg = readFileSync(exportFile, "utf8")
    const srcSvg = readFileSync(srcFile, "utf8")
    if (exportSvg !== srcSvg) {
      fail(`${side}-${piece}: export must match src (byte-identical for v1)`)
    }
    if (!exportSvg.includes(`viewBox="${DESIGN.viewBox}"`)) {
      fail(`${side}-${piece}: viewBox must be "${DESIGN.viewBox}"`)
    }
    if (!/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(exportSvg)) {
      fail(`${side}-${piece}: missing SVG xmlns`)
    }
    if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(exportSvg)) {
      fail(`${side}-${piece}: emoji in SVG`)
    }
    const fill =
      side === "w" ? DESIGN.whiteFill : DESIGN.blackFill
    const outline =
      side === "w" ? DESIGN.whiteOutline : DESIGN.blackOutline
    if (!exportSvg.toLowerCase().includes(fill)) {
      fail(`${side}-${piece}: missing fill ${fill}`)
    }
    if (!exportSvg.toLowerCase().includes(outline)) {
      fail(`${side}-${piece}: missing outline ${outline}`)
    }
    if (!exportSvg.includes(`stroke-width="${DESIGN.strokeWidth}"`)) {
      fail(`${side}-${piece}: stroke-width must be ${DESIGN.strokeWidth}`)
    }
    if (!exportSvg.includes(`aria-label=`)) {
      fail(`${side}-${piece}: missing aria-label`)
    }
    if (piece === "bishop") {
      const accent =
        side === "w" ? DESIGN.bishopAccentLight : DESIGN.bishopAccentDark
      if (!exportSvg.toLowerCase().includes(accent)) {
        fail(`${side}-bishop: missing mitre accent ${accent}`)
      }
    }
    if (piece === "pawn") {
      if (/<circle\b/i.test(exportSvg)) {
        fail(`${side}-pawn: head must be a teardrop path, not a circle`)
      }
      // Teardrop head path from build-corvid (point-up silhouette).
      if (!/c0-4\.2 2\.4-9 7\.2-12\.6z/i.test(exportSvg)) {
        fail(`${side}-pawn: missing teardrop head path`)
      }
    }

    // Absolute path commands + circle attrs only (relative deltas are not positions).
    const pathDs = [...exportSvg.matchAll(/\bd="([^"]+)"/g)].map((m) => m[1])
    const absNums = pathDs.flatMap((d) =>
      [...d.matchAll(/[MLHVCSQTA][^mlhvcsqtaz]*/g)].flatMap((seg) =>
        [...seg[0].matchAll(/[-+]?\d*\.?\d+/g)].map((m) => Number(m[0]))
      )
    )
    const circleNums = [
      ...exportSvg.matchAll(/\b(?:cx|cy)="([^"]+)"/g),
    ].map((m) => Number(m[1]))
    const coords = [...absNums, ...circleNums].filter((n) => Number.isFinite(n))
    if (coords.length < 8) {
      fail(`${side}-${piece}: too few absolute coordinates to check padding`)
    } else {
      const min = Math.min(...coords)
      const max = Math.max(...coords)
      // 4% of 45 ≈ 1.8; allow stroke bleed slightly inside the pad band.
      if (min < 1.0 || max > 44.0) {
        fail(
          `${side}-${piece}: geometry outside ~4% padding band (min=${min}, max=${max})`
        )
      }
      if (max - min < 30) {
        fail(
          `${side}-${piece}: silhouette too small for 4% padding intent (span=${max - min})`
        )
      }
    }
  }
}
if (!failed) ok("12 Corvid export+src SVGs present with DESIGN colors")

const colorsPath = join(repoRoot, "boards", "ravenboard", "colors.json")
if (!existsSync(colorsPath)) {
  fail(`missing ${colorsPath}`)
} else {
  const raw = JSON.parse(readFileSync(colorsPath, "utf8"))
  const rb = DESIGN.ravenboard
  const check = (path, expected) => {
    const parts = path.split(".")
    let cur = raw
    for (const p of parts) {
      if (cur == null || typeof cur !== "object" || !(p in cur)) {
        fail(`colors.json missing ${path}`)
        return
      }
      cur = cur[p]
    }
    if (typeof expected === "string") {
      if (normalizeHex(String(cur)) !== normalizeHex(expected)) {
        fail(`colors.json ${path}: expected ${expected}, got ${cur}`)
      }
    } else if (cur !== expected) {
      fail(`colors.json ${path}: expected ${expected}, got ${cur}`)
    }
  }
  check("name", "ravenboard")
  check("light.lightSquare", rb.light.lightSquare)
  check("light.darkSquare", rb.light.darkSquare)
  check("dark.lightSquare", rb.dark.lightSquare)
  check("dark.darkSquare", rb.dark.darkSquare)
  check("lastMove.color", rb.lastMove.color)
  check("lastMove.opacity", rb.lastMove.opacity)
  check("selected.color", rb.selected.color)
  check("selected.widthPx", rb.selected.widthPx)
  check("legalMove.color", rb.legalMove.color)
  check("coordinates.onDark", rb.coordinates.onDark)
  check("coordinates.onLight", rb.coordinates.onLight)
  check("coordinates.font", rb.coordinates.font)
  check("coordinates.sizePx", rb.coordinates.sizePx)
  if (!failed) ok("Ravenboard colors.json matches DESIGN.md")
}

const cssPath = join(repoRoot, "boards", "ravenboard", "ravenboard.css")
if (!existsSync(cssPath)) {
  fail(`missing ${cssPath}`)
} else {
  const css = readFileSync(cssPath, "utf8")
  const requiredVars = [
    ["--ravenboard-light-square", DESIGN.ravenboard.light.lightSquare],
    ["--ravenboard-dark-square", DESIGN.ravenboard.light.darkSquare],
    ["--ravenboard-dark-light-square", DESIGN.ravenboard.dark.lightSquare],
    ["--ravenboard-dark-dark-square", DESIGN.ravenboard.dark.darkSquare],
    ["--ravenboard-last-move", DESIGN.ravenboard.lastMove.color],
    ["--ravenboard-selected", DESIGN.ravenboard.selected.color],
    ["--ravenboard-legal", DESIGN.ravenboard.legalMove.color],
  ]
  for (const [name, hex] of requiredVars) {
    const re = new RegExp(
      `${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*${hex}`,
      "i"
    )
    if (!re.test(css)) {
      fail(`ravenboard.css missing ${name}: ${hex}`)
    }
  }
  if (!css.includes("--ravenboard-last-move-opacity: 0.35")) {
    fail("ravenboard.css missing --ravenboard-last-move-opacity: 0.35")
  }
  if (!css.includes("--ravenboard-selected-width: 2px")) {
    fail("ravenboard.css missing --ravenboard-selected-width: 2px")
  }
  if (!css.includes("--ravenboard-coord-on-dark: #e6e9f2")) {
    fail("ravenboard.css missing --ravenboard-coord-on-dark: #e6e9f2")
  }
  if (!css.includes("--ravenboard-coord-on-light: #2f3d63")) {
    fail("ravenboard.css missing --ravenboard-coord-on-light: #2f3d63")
  }
  if (!css.includes("--ravenboard-coord-size: 11px")) {
    fail("ravenboard.css missing --ravenboard-coord-size: 11px")
  }
  if (!/IBM Plex Mono/i.test(css)) {
    fail("ravenboard.css missing IBM Plex Mono font token")
  }
  if (!failed) ok("ravenboard.css variables match DESIGN.md")
}

const manifestPath = join(repoRoot, "pieces", "corvid", "manifest.json")
if (!existsSync(manifestPath)) {
  fail(`missing ${manifestPath}`)
} else {
  const m = JSON.parse(readFileSync(manifestPath, "utf8"))
  if (m.set !== "corvid") fail('manifest.set must be "corvid"')
  if (m.viewBox !== DESIGN.viewBox) fail(`manifest.viewBox must be ${DESIGN.viewBox}`)
  if (normalizeHex(m.colors?.white?.fill) !== DESIGN.whiteFill) {
    fail("manifest white fill mismatch")
  }
  if (normalizeHex(m.colors?.white?.outline) !== DESIGN.whiteOutline) {
    fail("manifest white outline mismatch")
  }
  if (normalizeHex(m.colors?.black?.fill) !== DESIGN.blackFill) {
    fail("manifest black fill mismatch")
  }
  if (normalizeHex(m.colors?.black?.outline) !== DESIGN.blackOutline) {
    fail("manifest black outline mismatch")
  }
  if (!Array.isArray(m.pieces) || m.pieces.length !== 6) {
    fail("manifest.pieces must list six piece kinds")
  }
  if (!Array.isArray(m.files) || m.files.length !== 12) {
    fail("manifest.files must list twelve SVG filenames")
  } else {
    for (const file of m.files) {
      if (!existsSync(join(repoRoot, "pieces", "corvid", file))) {
        fail(`manifest.files lists missing export ${file}`)
      }
    }
  }
  if (m.paddingPercent !== 4) {
    fail("manifest.paddingPercent must be 4")
  }
  if (!failed) ok("corvid manifest.json matches DESIGN.md")
}

const srcDir = join(repoRoot, "pieces", "corvid", "src")
if (existsSync(srcDir)) {
  const extras = readdirSync(srcDir).filter(
    (f) => f.endsWith(".svg") && !/^[wb]-(king|queen|rook|bishop|knight|pawn)\.svg$/.test(f)
  )
  if (extras.length) fail(`unexpected SVG in src/: ${extras.join(", ")}`)
}

const forbidden =
  /\b(Stockfish|Leela|lc0|Lichess|Chess\.com|cburnett|merida|staunty|wikipedia)\b/i
for (const rel of [
  "pieces/corvid/manifest.json",
  "boards/ravenboard/colors.json",
  "boards/ravenboard/ravenboard.css",
]) {
  const p = join(repoRoot, rel)
  if (!existsSync(p)) continue
  if (forbidden.test(readFileSync(p, "utf8"))) {
    fail(`${rel}: third-party or competitor name found`)
  }
}
for (const side of SIDES) {
  for (const piece of PIECES) {
    const p = piecePath(side, piece, ".")
    if (existsSync(p) && forbidden.test(readFileSync(p, "utf8"))) {
      fail(`${side}-${piece}: third-party or competitor name found`)
    }
  }
}
if (!failed) ok("no third-party piece/board names in asset files")

if (existsSync(designPath)) {
  const design = readFileSync(designPath, "utf8")
  for (const hex of [
    DESIGN.whiteFill,
    DESIGN.whiteOutline,
    DESIGN.blackFill,
    DESIGN.blackOutline,
    DESIGN.ravenboard.light.lightSquare,
    DESIGN.ravenboard.light.darkSquare,
    DESIGN.ravenboard.dark.lightSquare,
    DESIGN.ravenboard.dark.darkSquare,
  ]) {
    if (!design.toLowerCase().includes(hex)) {
      fail(`workspace DESIGN.md missing expected hex ${hex}`)
    }
  }
  if (!/assets\/sounds\//i.test(design) && !/Original recordings\/synthesis in `assets\/sounds\/`/i.test(design)) {
    fail("workspace DESIGN.md missing assets/sounds/ principle")
  }
  if (!failed) ok("workspace DESIGN.md still lists Corvid/Ravenboard hexes and sounds path")
} else {
  ok("DESIGN.md not in CI checkout; using hardcoded DESIGN constants")
}

/** CV-111: original play SFX (WAV PCM) + mute-safe license notes. */
const SOUND_EVENTS = ["move", "capture", "check", "game-end"]
const SOUND_SAMPLE_RATE = 44100
const SOUND_CHANNELS = 1
const SOUND_BITS = 16
const SOUND_MIN_MS = 40
const SOUND_MAX_MS = 900
const SOUND_MAX_LEAD_MS = 30
const SOUND_MIN_PEAK = 20000 // peak-normalized clips stay near DESIGN ~0.9 int16
const SOUND_MAX_PEAK = 32767
const SOUND_MAX_BYTES = 200_000 // CI DoS guard; valid clips are tens of KB

const readWavPcm16Mono = (buf, label) => {
  if (buf.length > SOUND_MAX_BYTES) {
    fail(`${label}: file ${buf.length} bytes exceeds ${SOUND_MAX_BYTES}`)
    return null
  }
  if (buf.length < 44) {
    fail(`${label}: WAV too short for header`)
    return null
  }
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") {
    fail(`${label}: missing RIFF/WAVE header`)
    return null
  }
  let offset = 12
  let fmt = null
  let dataOffset = -1
  let dataSize = 0
  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4)
    const size = buf.readUInt32LE(offset + 4)
    const chunkStart = offset + 8
    if (id === "fmt ") {
      if (size < 16 || chunkStart + 16 > buf.length) {
        fail(`${label}: fmt chunk truncated`)
        return null
      }
      fmt = {
        audioFormat: buf.readUInt16LE(chunkStart),
        channels: buf.readUInt16LE(chunkStart + 2),
        sampleRate: buf.readUInt32LE(chunkStart + 4),
        bitsPerSample: buf.readUInt16LE(chunkStart + 14),
      }
    } else if (id === "data") {
      dataOffset = chunkStart
      dataSize = size
      break
    }
    offset = chunkStart + size + (size % 2)
  }
  if (!fmt) {
    fail(`${label}: missing fmt chunk`)
    return null
  }
  if (fmt.audioFormat !== 1) {
    fail(`${label}: audioFormat must be 1 (PCM), got ${fmt.audioFormat}`)
  }
  if (fmt.channels !== SOUND_CHANNELS) {
    fail(`${label}: channels must be ${SOUND_CHANNELS}, got ${fmt.channels}`)
  }
  if (fmt.sampleRate !== SOUND_SAMPLE_RATE) {
    fail(`${label}: sampleRate must be ${SOUND_SAMPLE_RATE}, got ${fmt.sampleRate}`)
  }
  if (fmt.bitsPerSample !== SOUND_BITS) {
    fail(`${label}: bitsPerSample must be ${SOUND_BITS}, got ${fmt.bitsPerSample}`)
  }
  if (dataOffset < 0 || dataOffset + dataSize > buf.length) {
    fail(`${label}: missing or truncated data chunk`)
    return null
  }
  if (dataSize < 2 || dataSize % 2 !== 0) {
    fail(`${label}: data size must be positive even PCM16 byte count`)
    return null
  }
  const samples = new Int16Array(dataSize / 2)
  for (let i = 0; i < samples.length; i++) {
    samples[i] = buf.readInt16LE(dataOffset + i * 2)
  }
  return samples
}

const soundDir = join(repoRoot, "sounds")
const soundNotesPath = join(soundDir, "LICENSE-NOTES.md")
const soundManifestPath = join(soundDir, "manifest.json")

if (!existsSync(soundDir)) {
  fail(`missing ${soundDir}`)
} else {
  for (const event of SOUND_EVENTS) {
    const wavPath = join(soundDir, `${event}.wav`)
    if (!existsSync(wavPath)) {
      fail(`missing sound ${wavPath}`)
      continue
    }
    const buf = readFileSync(wavPath)
    const samples = readWavPcm16Mono(buf, event)
    if (!samples) continue
    const durationMs = (samples.length / SOUND_SAMPLE_RATE) * 1000
    if (durationMs < SOUND_MIN_MS || durationMs > SOUND_MAX_MS) {
      fail(
        `${event}: duration ${durationMs.toFixed(1)}ms out of ${SOUND_MIN_MS}-${SOUND_MAX_MS}ms`
      )
    }
    let firstNonZero = samples.length
    for (let i = 0; i < samples.length; i++) {
      if (samples[i] !== 0) {
        firstNonZero = i
        break
      }
    }
    const leadMs = (firstNonZero / SOUND_SAMPLE_RATE) * 1000
    if (leadMs > SOUND_MAX_LEAD_MS) {
      fail(
        `${event}: lead-in silence ${leadMs.toFixed(1)}ms exceeds DESIGN start-latency budget (${SOUND_MAX_LEAD_MS}ms)`
      )
    }
    let peak = 0
    for (let i = 0; i < samples.length; i++) {
      const a = Math.abs(samples[i])
      if (a > peak) peak = a
    }
    if (peak < SOUND_MIN_PEAK) {
      fail(`${event}: peak ${peak} too quiet (min ${SOUND_MIN_PEAK})`)
    }
    if (peak > SOUND_MAX_PEAK) {
      fail(`${event}: peak ${peak} exceeds int16 max`)
    }
  }
  if (!failed) ok("four play WAV files are PCM16/44.1k mono within duration/peak/lead bounds")
}

if (!existsSync(soundManifestPath)) {
  fail(`missing ${soundManifestPath}`)
} else {
  const m = JSON.parse(readFileSync(soundManifestPath, "utf8"))
  if (m.set !== "corvin-play") fail('sounds manifest.set must be "corvin-play"')
  if (m.format !== "wav-pcm16-mono-44100") {
    fail('sounds manifest.format must be "wav-pcm16-mono-44100"')
  }
  if (m.license !== "CC-BY-SA-4.0") {
    fail('sounds manifest.license must be "CC-BY-SA-4.0"')
  }
  if (m.muteSafe !== true) {
    fail("sounds manifest.muteSafe must be true")
  }
  if (m.generator !== "scripts/synthesize-sounds.mjs") {
    fail('sounds manifest.generator must be "scripts/synthesize-sounds.mjs"')
  }
  if (m.notes !== "LICENSE-NOTES.md") {
    fail('sounds manifest.notes must be "LICENSE-NOTES.md"')
  }
  if (!existsSync(join(repoRoot, "scripts", "synthesize-sounds.mjs"))) {
    fail("missing scripts/synthesize-sounds.mjs referenced by manifest")
  }
  if (!Array.isArray(m.events) || m.events.length !== SOUND_EVENTS.length) {
    fail(`sounds manifest.events must list ${SOUND_EVENTS.length} events`)
  } else {
    for (const event of SOUND_EVENTS) {
      if (!m.events.includes(event)) fail(`sounds manifest.events missing ${event}`)
      const file = `${event}.wav`
      if (!Array.isArray(m.files) || !m.files.includes(file)) {
        fail(`sounds manifest.files missing ${file}`)
      }
      if (!existsSync(join(soundDir, file))) {
        fail(`sounds manifest lists missing ${file}`)
      }
    }
  }
  if (m.files?.includes("offer.wav")) {
    fail("offer.wav is out of CV-111 scope; omit until a dedicated task")
  }
  if (!failed) ok("sounds/manifest.json matches CV-111 contract")
}

if (!existsSync(soundNotesPath)) {
  fail(`missing ${soundNotesPath}`)
} else {
  const notes = readFileSync(soundNotesPath, "utf8")
  if (emojiReLike(notes)) fail("LICENSE-NOTES.md contains emoji")
  if (!/CC BY-SA 4\.0/i.test(notes)) {
    fail("LICENSE-NOTES.md must name CC BY-SA 4.0")
  }
  if (!/mute/i.test(notes)) {
    fail("LICENSE-NOTES.md must document mute-safe / mute allowed")
  }
  if (!/original/i.test(notes) || !/synthes/i.test(notes)) {
    fail("LICENSE-NOTES.md must state original synthesis (no third-party samples)")
  }
  if (!/no\s+obligation\s+to\s+play|may\s+be\s+muted|mute\s+is\s+allowed/i.test(notes)) {
    fail("LICENSE-NOTES.md must state clients may mute / no obligation to play")
  }
  if (forbidden.test(notes)) {
    fail("LICENSE-NOTES.md: third-party or competitor name found")
  }
  if (!failed) ok("sounds/LICENSE-NOTES.md mute-safe license notes present")
}

const soundExtras = existsSync(soundDir)
  ? readdirSync(soundDir).filter(
      (f) =>
        f.endsWith(".wav") &&
        !SOUND_EVENTS.map((e) => `${e}.wav`).includes(f)
    )
  : []
if (soundExtras.length) {
  fail(`unexpected WAV in sounds/: ${soundExtras.join(", ")}`)
}

for (const rel of ["sounds/manifest.json", "sounds/LICENSE-NOTES.md"]) {
  const p = join(repoRoot, rel)
  if (existsSync(p) && forbidden.test(readFileSync(p, "utf8"))) {
    fail(`${rel}: third-party or competitor name found`)
  }
}
if (!failed) ok("no third-party names in sound metadata")

if (failed) {
  console.error(`\n${failed} check(s) failed.`)
  process.exit(1)
}
console.log("\nAll CV-110/CV-111 Corvid/Ravenboard/sound checks passed.")

function emojiReLike(text) {
  return /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(text)
}

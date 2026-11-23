#!/usr/bin/env node
/**
 * CV-110: emit Corvid piece SVGs (src + export) from DESIGN.md geometry notes.
 * Run once when silhouettes change; CI verifies committed files, not this script.
 * Geometry uses ~4% viewBox padding on a 45x45 canvas.
 */
import { mkdirSync, writeFileSync, copyFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, "..")
const outDir = join(repoRoot, "pieces", "corvid")
const srcDir = join(outDir, "src")

mkdirSync(srcDir, { recursive: true })

const WHITE = {
  fill: "#e8ecf4",
  bevel: "#f4f6fa",
  outline: "#2f3d63",
  bishopAccent: "#2f3d63",
}
const BLACK = {
  fill: "#1a1f2e",
  bevel: "#252b3d",
  outline: "#8fa3d9",
  bishopAccent: "#c9a227",
}

const labels = {
  king: "King",
  queen: "Queen",
  rook: "Rook",
  bishop: "Bishop",
  knight: "Knight",
  pawn: "Pawn",
}

const wrap = (sideLabel, piece, body) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width="45" height="45" role="img" aria-label="${sideLabel} ${labels[piece]}">
${body}
</svg>
`

const palette = (side) => (side === "w" ? WHITE : BLACK)

/** Tall stable base; sits near the 4% bottom padding (~y 41–43). */
const pedestal = (c) => `
  <path fill="${c.fill}" stroke="${c.outline}" stroke-width="1.5" stroke-linejoin="round"
    d="M8.5 40.2h28c1.4 0 2.3.9 2.3 2v.3c0 .8-.7 1.5-1.5 1.5H7.7c-.8 0-1.5-.7-1.5-1.5v-.3c0-1.1.9-2 2.3-2z"/>
  <path fill="${c.bevel}" stroke="none"
    d="M10.2 40.5h24.6c.7 0 1.2.3 1.2.8v.4H9v-.4c0-.5.5-.8 1.2-.8z"/>
  <path fill="${c.fill}" stroke="${c.outline}" stroke-width="1.5" stroke-linejoin="round"
    d="M11.5 36.2h22l1.5 4H10z"/>
`

const kingBody = (c) => `
  ${pedestal(c)}
  <path fill="${c.fill}" stroke="${c.outline}" stroke-width="1.5" stroke-linejoin="round"
    d="M13.5 35.8c0-8.2 3.2-13.8 9-17.4 5.8 3.6 9 9.2 9 17.4z"/>
  <path fill="${c.bevel}" stroke="none"
    d="M15.8 34.2c.6-6.4 2.8-10.8 6.7-13.6 3.9 2.8 6.1 7.2 6.7 13.6z"/>
  <circle fill="${c.fill}" stroke="${c.outline}" stroke-width="1.5" cx="22.5" cy="15.2" r="4.2"/>
  <path fill="none" stroke="${c.outline}" stroke-width="1.5" stroke-linecap="round"
    d="M22.5 3.2v7.6M19.2 6.2h6.6"/>
`

const queenBody = (c) => `
  ${pedestal(c)}
  <path fill="${c.fill}" stroke="${c.outline}" stroke-width="1.5" stroke-linejoin="round"
    d="M12.2 35.8c.8-9.6 4.2-15.8 10.3-18.8 6.1 3 9.5 9.2 10.3 18.8z"/>
  <path fill="${c.bevel}" stroke="none"
    d="M14.6 34c.8-7.2 3.4-12 7.9-14.4 4.5 2.4 7.1 7.2 7.9 14.4z"/>
  <path fill="${c.fill}" stroke="${c.outline}" stroke-width="1.5" stroke-linejoin="round"
    d="M9.8 12.2l4.4 8.6 8.3-9.8 8.3 9.8 4.4-8.6-1.2 12.4H11z"/>
  <path fill="${c.bevel}" stroke="none"
    d="M12.4 13.8l3.2 6.2 6.9-8.2 6.9 8.2 3.2-6.2-.6 9H13z"/>
`

const rookBody = (c) => `
  ${pedestal(c)}
  <path fill="${c.fill}" stroke="${c.outline}" stroke-width="1.5" stroke-linejoin="round"
    d="M13.5 35.8h18V19.2h-18z"/>
  <path fill="${c.bevel}" stroke="none"
    d="M15.2 34h14.6V20.8H15.2z"/>
  <path fill="${c.fill}" stroke="${c.outline}" stroke-width="1.5" stroke-linejoin="round"
    d="M10.5 19.2h24v-3.2h-24z"/>
  <path fill="${c.fill}" stroke="${c.outline}" stroke-width="1.5" stroke-linejoin="round"
    d="M10.5 4.8h7.2v7.2h9.6V4.8h7.2v11.2H10.5z"/>
  <path fill="${c.bevel}" stroke="none"
    d="M12 6.2h5v5.4h11V6.2h5v8.4H12z"/>
`

const bishopBody = (c) => `
  ${pedestal(c)}
  <path fill="${c.fill}" stroke="${c.outline}" stroke-width="1.5" stroke-linejoin="round"
    d="M22.5 7.2c4.8 3.6 8.6 10.2 8.6 18.2 0 4-.6 7.2-3.8 9.2h-9.6c-3.2-2-3.8-5.2-3.8-9.2 0-8 3.8-14.6 8.6-18.2z"/>
  <path fill="${c.bevel}" stroke="none"
    d="M22.5 10c3.4 2.8 6.4 8 6.4 14.6 0 3-.4 5.4-2.6 7H18.7c-2.2-1.6-2.6-4-2.6-7 0-6.6 3-11.8 6.4-14.6z"/>
  <path fill="none" stroke="${c.bishopAccent}" stroke-width="1.5" stroke-linecap="round"
    d="M22.5 13.2v14.8"/>
  <circle fill="${c.fill}" stroke="${c.outline}" stroke-width="1.5" cx="22.5" cy="5.2" r="2.2"/>
`

const knightBody = (c) => `
  ${pedestal(c)}
  <path fill="${c.fill}" stroke="${c.outline}" stroke-width="1.5" stroke-linejoin="round"
    d="M9.5 35.6c1.6-8.4 3.2-14.6 7.2-18.6 1.6-1.6 3.6-2.8 5.8-3.4l2.2-5.2c.4-1 1.6-1.3 2.5-.6l3.4 2.6 3.2-.8c1.1-.3 2.1.7 1.8 1.8l-1.2 4.4c2.2 1.8 3.8 4.8 4.6 8.8.8 4.2.6 9-.2 12.4z"/>
  <path fill="${c.bevel}" stroke="none"
    d="M12.4 33.4c1.2-6.8 2.6-12 5.8-15.2 1.6-1.6 3.4-2.4 5.4-2.8l1.6-3.8 2 1.4 2.2-.6-.8 3.2c1.6 1.6 2.8 4 3.4 7.2.6 3.6.4 7.6-.2 10.6z"/>
  <path fill="none" stroke="${c.outline}" stroke-width="1.5" stroke-linecap="round"
    d="M16.8 15.2c2-.8 4-.6 5.8.6"/>
  <circle fill="${c.outline}" cx="29.6" cy="13.8" r="1.3"/>
`

/** Teardrop head (point up), no face details. */
const pawnBody = (c) => `
  ${pedestal(c)}
  <path fill="${c.fill}" stroke="${c.outline}" stroke-width="1.5" stroke-linejoin="round"
    d="M14.8 35.8c1.6-7.4 4.2-11.6 7.7-11.6s6.1 4.2 7.7 11.6z"/>
  <path fill="${c.bevel}" stroke="none"
    d="M16.8 34c1.2-5.4 3.2-8.4 5.7-8.4s4.5 3 5.7 8.4z"/>
  <path fill="${c.fill}" stroke="${c.outline}" stroke-width="1.5" stroke-linejoin="round"
    d="M22.5 6.2c4.8 3.6 7.2 8.4 7.2 12.6 0 4.4-3.2 7.2-7.2 7.2s-7.2-2.8-7.2-7.2c0-4.2 2.4-9 7.2-12.6z"/>
  <path fill="${c.bevel}" stroke="none"
    d="M22.5 9c3.4 2.6 5.2 6.2 5.2 9.4 0 3.2-2.4 5.2-5.2 5.2s-5.2-2-5.2-5.2c0-3.2 1.8-6.8 5.2-9.4z"/>
`

const bodies = {
  king: kingBody,
  queen: queenBody,
  rook: rookBody,
  bishop: bishopBody,
  knight: knightBody,
  pawn: pawnBody,
}

const pieces = Object.keys(bodies)
const sides = [
  ["w", "White"],
  ["b", "Black"],
]

for (const [side, sideLabel] of sides) {
  const c = palette(side)
  for (const piece of pieces) {
    const svg = wrap(sideLabel, piece, bodies[piece](c))
    const name = `${side}-${piece}.svg`
    const srcPath = join(srcDir, name)
    const exportPath = join(outDir, name)
    writeFileSync(srcPath, svg, "utf8")
    copyFileSync(srcPath, exportPath)
    console.log(`wrote ${name}`)
  }
}

const manifest = {
  set: "corvid",
  viewBox: "0 0 45 45",
  strokeWidth: 1.5,
  paddingPercent: 4,
  pieces,
  files: sides.flatMap(([side]) => pieces.map((p) => `${side}-${p}.svg`)),
  colors: {
    white: {
      fill: WHITE.fill,
      bevel: WHITE.bevel,
      outline: WHITE.outline,
      bishopAccent: WHITE.bishopAccent,
    },
    black: {
      fill: BLACK.fill,
      bevel: BLACK.bevel,
      outline: BLACK.outline,
      bishopAccent: BLACK.bishopAccent,
    },
  },
  notes:
    "Original Corvid set. Knight silhouette is a stylized raven head in profile. Bishop mitre slit uses gold on black pieces and indigo on white pieces. Pawn head is a teardrop. Exports use ~4% viewBox padding.",
}

writeFileSync(join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8")
console.log("wrote manifest.json")

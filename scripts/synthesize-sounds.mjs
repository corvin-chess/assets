#!/usr/bin/env node
/**
 * CV-111/CV-116: synthesize original Corvin play SFX as PCM16 mono 44.1kHz WAV.
 * Deterministic; no third-party samples. Re-run to regenerate sounds/*.wav.
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, "..")
const outDir = join(repoRoot, "sounds")

const SAMPLE_RATE = 44100
const TARGET_PEAK = 29490 // ~0.9 of int16 max; peak-normalized per DESIGN.md

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

const envelope = (t, attack, hold, release, total) => {
  if (t < 0 || t > total) return 0
  if (t < attack) return t / attack
  if (t < attack + hold) return 1
  const relT = t - attack - hold
  if (relT >= release) return 0
  return 1 - relT / release
}

const tone = (t, freq, phase = 0) => Math.sin(2 * Math.PI * freq * t + phase)

const render = (seconds, sampleAt) => {
  const n = Math.max(1, Math.floor(seconds * SAMPLE_RATE))
  const samples = new Float64Array(n)
  let peak = 0
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE
    const v = sampleAt(t, i)
    samples[i] = v
    const a = Math.abs(v)
    if (a > peak) peak = a
  }
  if (peak < 1e-9) {
    throw new Error("synthesized silence; refusing to write empty clip")
  }
  const scale = TARGET_PEAK / peak
  const pcm = Buffer.alloc(n * 2)
  for (let i = 0; i < n; i++) {
    const s = clamp(Math.round(samples[i] * scale), -32768, 32767)
    pcm.writeInt16LE(s, i * 2)
  }
  return pcm
}

const writeWav = (pcm) => {
  const dataSize = pcm.length
  const header = Buffer.alloc(44)
  header.write("RIFF", 0)
  header.writeUInt32LE(36 + dataSize, 4)
  header.write("WAVE", 8)
  header.write("fmt ", 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20) // PCM
  header.writeUInt16LE(1, 22) // mono
  header.writeUInt32LE(SAMPLE_RATE, 24)
  header.writeUInt32LE(SAMPLE_RATE * 2, 28) // byte rate
  header.writeUInt16LE(2, 32) // block align
  header.writeUInt16LE(16, 34)
  header.write("data", 36)
  header.writeUInt32LE(dataSize, 40)
  return Buffer.concat([header, pcm])
}

/** Soft wooden tap: brief mid sine with noise tick. */
const synthMove = (t) => {
  const dur = 0.09
  const env = envelope(t, 0.002, 0.012, 0.07, dur)
  if (env <= 0) return 0
  const body = tone(t, 620) * 0.72 + tone(t, 1240) * 0.18
  const tick = (Math.sin(t * 9000) > 0 ? 1 : -1) * Math.exp(-t * 180) * 0.12
  return (body + tick) * env
}

/** Capture: lower thud plus short click transient. */
const synthCapture = (t) => {
  const dur = 0.16
  const env = envelope(t, 0.0015, 0.02, 0.12, dur)
  if (env <= 0) return 0
  const thud = tone(t, 180) * Math.exp(-t * 28) + tone(t, 95) * Math.exp(-t * 18) * 0.6
  const click = tone(t, 2100) * Math.exp(-t * 90) * 0.45
  return (thud + click) * env
}

/** Check: ascending two-step alert chirp. */
const synthCheck = (t) => {
  const dur = 0.22
  const env = envelope(t, 0.004, 0.05, 0.14, dur)
  if (env <= 0) return 0
  const f = t < 0.08 ? 780 : 1040
  const wobble = 1 + 0.04 * tone(t, 12)
  return tone(t, f * wobble) * env * (t < 0.08 ? 0.85 : 1)
}

/** Game end: soft two-tone resolve (neutral, not celebratory). */
const synthGameEnd = (t) => {
  const dur = 0.45
  const env = envelope(t, 0.01, 0.18, 0.24, dur)
  if (env <= 0) return 0
  const a = tone(t, 392) * 0.55
  const b = tone(t, 523.25) * (t > 0.12 ? 0.5 : 0.15)
  return (a + b) * env
}

/** Offer: soft invitation ping (draw/takeback/rematch); gentler than check. */
const synthOffer = (t) => {
  const dur = 0.3
  const env = envelope(t, 0.005, 0.09, 0.18, dur)
  if (env <= 0) return 0
  const first = tone(t, 523.25) * Math.exp(-t * 9) * 0.7
  const second =
    t > 0.1 ? tone(t, 659.25) * Math.exp(-(t - 0.1) * 11) * 0.55 : 0
  return (first + second) * env
}

const EVENTS = {
  move: { seconds: 0.1, fn: synthMove },
  capture: { seconds: 0.18, fn: synthCapture },
  check: { seconds: 0.24, fn: synthCheck },
  "game-end": { seconds: 0.48, fn: synthGameEnd },
  offer: { seconds: 0.32, fn: synthOffer },
}

mkdirSync(outDir, { recursive: true })

for (const [name, { seconds, fn }] of Object.entries(EVENTS)) {
  const pcm = render(seconds, fn)
  const wav = writeWav(pcm)
  const path = join(outDir, `${name}.wav`)
  writeFileSync(path, wav)
  console.log(`wrote ${path} (${pcm.length / 2} samples)`)
}

console.log("CV-111/CV-116 sound synthesis complete.")

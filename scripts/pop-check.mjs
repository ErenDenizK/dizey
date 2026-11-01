// One-frame-pop detector (PR-16: nothing changes in a single frame). Reads the frames a motion-strip run saved
// and flags every grid cell that sits still, jumps in one frame, and sits still again: a step function.
// Anything that arrives through a fade or a spring passes through in-between values and is not flagged.
//
// Usage: node scripts/pop-check.mjs <framesDir> [--cell 16] [--step 14] [--still 3] [--hold 3]
//   framesDir: the outDir/frames of a motion-strip run (f0000.png ...). Needs ffmpeg; no other dependency.
// Defaults (calibrated on lesson-close before and after the outline/tag fix):
//   cell   16 px at 1x (frames are scaled down to 1x first)
//   step   14 gray levels (0..255) of change in the cell's mean within one frame
//   hold   3 frames of stillness required before the step and after it
//   still  2 gray levels: the most the cell's mean may move during those frames
// A step with a neighbouring step within 3 cells in the 2 frames either side is a moving edge, not a pop.
// Output: one line per flagged frame with its cells; exit code 1 when anything is flagged.
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const args = process.argv.slice(2)
const dir = args.find((a) => !a.startsWith('--') && !/^\d/.test(a))
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? Number(args[i + 1]) : fallback
}
if (!dir) {
  console.error(
    'usage: node scripts/pop-check.mjs <framesDir> [--cell 16] [--step 14] [--hold 3] [--still 2]',
  )
  process.exit(2)
}
const CELL = opt('cell', 16)
const STEP = opt('step', 14)
const HOLD = opt('hold', 3)
const STILL = opt('still', 2)

const names = readdirSync(dir)
  .filter((n) => /^f\d+\.png$/.test(n))
  .sort()
if (names.length < 2 * HOLD + 1) {
  console.error(`need at least ${2 * HOLD + 1} frames in ${dir}`)
  process.exit(2)
}
// Frame size from the first PNG header; scale to 1x of a 390 px wide screen.
const head = readFileSync(join(dir, names[0]))
const srcW = head.readUInt32BE(16)
const srcH = head.readUInt32BE(20)
const W = 390
const H = Math.round((srcH * W) / srcW)
const raw = execFileSync(
  'ffmpeg',
  [
    ...['-v', 'error', '-start_number', names[0].slice(1, 5), '-framerate', '60'],
    ...['-i', join(dir, 'f%04d.png'), '-frames:v', String(names.length)],
    ...['-vf', `scale=${W}:${H}:flags=area,format=gray`, '-f', 'rawvideo', '-'],
  ],
  { maxBuffer: 1 << 30 },
)
const frameSize = W * H
const count = Math.floor(raw.length / frameSize)
const cols = Math.ceil(W / CELL)
const rows = Math.ceil(H / CELL)

// Mean gray of every cell of every frame.
const mean = Array.from({ length: count }, (_, t) => {
  const out = new Float32Array(cols * rows)
  const area = new Uint32Array(cols * rows)
  const base = t * frameSize
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const c = Math.floor(y / CELL) * cols + Math.floor(x / CELL)
      out[c] += raw[base + y * W + x]
      area[c]++
    }
  }
  for (let c = 0; c < out.length; c++) out[c] /= area[c]
  return out
})

const span = (cell, from, to) => {
  let lo = Number.POSITIVE_INFINITY
  let hi = Number.NEGATIVE_INFINITY
  for (let t = from; t <= to; t++) {
    lo = Math.min(lo, mean[t][cell])
    hi = Math.max(hi, mean[t][cell])
  }
  return hi - lo
}

// Candidates: steady, one big step, steady.
const candidates = []
for (let t = HOLD; t + HOLD <= count - 1; t++) {
  for (let c = 0; c < cols * rows; c++) {
    const jump = Math.abs(mean[t][c] - mean[t - 1][c])
    if (jump <= STEP) continue
    if (span(c, t - HOLD, t - 1) > STILL || span(c, t, t + HOLD - 1) > STILL) continue
    candidates.push({ t, c, jump })
  }
}
// A moving edge (a clip folding, a stroke being drawn) crosses a cell in one frame too, but its neighbours
// step in the frames next to it. A pop has no such company: drop candidates with another big jump within `NEAR`
// cells in the 1..WAVE frames before or after.
const NEAR = 3
const WAVE = 2
const near = (a, b) =>
  Math.abs((a.c % cols) - (b.c % cols)) <= NEAR &&
  Math.abs(Math.floor(a.c / cols) - Math.floor(b.c / cols)) <= NEAR
// Any big jump counts as company, steady or not.
const jumps = []
for (let t = 1; t < count; t++) {
  for (let c = 0; c < cols * rows; c++) if (Math.abs(mean[t][c] - mean[t - 1][c]) > STEP) jumps.push({ t, c })
}
const flagged = new Map()
for (const cand of candidates) {
  const moving = jumps.some((o) => o.t !== cand.t && Math.abs(o.t - cand.t) <= WAVE && near(cand, o))
  if (moving) continue
  if (!flagged.has(cand.t)) flagged.set(cand.t, [])
  flagged.get(cand.t).push(`${cand.c % cols},${Math.floor(cand.c / cols)}(${Math.round(cand.jump)})`)
}

const label = (t) => names[t]?.replace('.png', '') ?? `f${String(t).padStart(4, '0')}`
for (const [t, cells] of flagged)
  console.log(`${label(t)}  ${cells.length} cells  x,y(jump): ${cells.join(' ')}`)
console.log(
  flagged.size === 0
    ? `pop-check: clean (${count} frames, cell ${CELL}px, step ${STEP}, hold ${HOLD}, still ${STILL})`
    : `pop-check: ${flagged.size} frames with pops (cell ${CELL}px, step ${STEP}, hold ${HOLD}, still ${STILL})`,
)
process.exit(flagged.size === 0 ? 0 : 1)

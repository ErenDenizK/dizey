// Frame strips of Mırtis's hand-off flights (src/character/flight.ts): a screenshot every 50 ms (3 frames of the
// engine's virtual clock) through each hand-off, tiled into one strip per flight, plus settled shots of the three pages.
//
// Usage: pnpm build && pnpm preview --port 4173 &
//        W=390 node scripts/flight-strips.mjs <outDir>      (strips and settled shots)
//        W=375 node scripts/flight-strips.mjs <outDir>      (settled shots only)
// Needs ImageMagick's `montage` for the tiles. Env: REVIEW_URL, PLAYWRIGHT_CHROMIUM_PATH, W.
import { execFileSync } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import { openFlightPage, runChain } from './flight-flows.mjs'

const out = process.argv[2] ?? 'flight-strips'
const width = Number(process.env.W ?? 390)
const SHOTS = 12

await mkdir(out, { recursive: true })
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
)

/** Runs one chain, keeping a screenshot of every third frame near a hand-off and the settled frames. */
async function film(options) {
  const page = await openFlightPage(browser)
  const shots = new Map()
  const settled = {}
  let marks = {}
  const { cats, marks: done } = await runChain(page, {
    ...options,
    keep: async (p, index, m) => {
      marks = m
      const near = Object.values(m).some((from) => index >= from && index < from + 90)
      if (near && index % 3 === 0) shots.set(index, await p.screenshot())
    },
    at: async (p, name) => {
      // The screens she settles on: the greeting, the end screen, and the dock she returns to.
      if (name === 'walk') settled.greet = await p.screenshot()
      if (name === 'close') settled.end = await p.screenshot()
      if (name === 'over') settled.back = await p.screenshot()
    },
  })
  await page.context().close()
  return { cats, marks: done || marks, shots, settled }
}

/** The first frame at or after `from` where the flyer has left its take-off spot, minus one shot. */
function takeoff(cats, from, to) {
  const start = cats.slice(from, to).find((f) => f.some((c) => c.fly))
  const x0 = start?.find((c) => c.fly)
  for (let i = from; i < to; i++) {
    const fly = cats[i].find((c) => c.fly)
    if (fly && x0 && Math.hypot(fly.x - x0.x, fly.y - x0.y) > 1.5) return Math.max(from, i - 3)
  }
  return from
}

function strip(name, cats, shots, from, to) {
  const begin = takeoff(cats, from, to)
  const frames = [...shots.keys()].filter((i) => i >= begin && i < to).slice(0, SHOTS)
  const files = []
  frames.forEach((index, n) => {
    const file = join(out, `${name}-${String(n).padStart(2, '0')}.png`)
    execFileSync('convert', ['png:-', file], { input: shots.get(index) })
    files.push(file)
  })
  execFileSync('montage', [
    ...files,
    '-tile',
    '6x',
    '-geometry',
    '195x422+4+4',
    '-background',
    '#222222',
    join(out, `strip-${name}.png`),
  ])
  console.log(`${name}: ${files.length} shots from frame ${frames[0]}`)
}

// Dock -> greeting, then the hero back to the dock ("Yola dön").
const dock = await film({ end: 'dock' })
await writeShot(`settled-greeting-${width}.png`, dock.settled.greet)
await writeShot(`settled-yol-after-${width}.png`, dock.settled.back)
if (width === 390) {
  strip('1-dock-to-greeting', dock.cats, dock.shots, dock.marks.greet, dock.marks.walk)
  strip('3-hero-to-dock', dock.cats, dock.shots, dock.marks.close, dock.marks.over)
}
// The gizli an's verdict to the end screen.
const end = await film({ lesson: 'd1-determinant' })
await writeShot(`settled-lesson-end-${width}.png`, end.settled.end)
if (width === 390) strip('2-verdict-to-hero', end.cats, end.shots, end.marks.finish, end.marks.close)
// "Sıradaki": the hero to the next lesson's greeting.
const next = await film({ end: 'next' })
if (width === 390) strip('3b-hero-to-next-greeting', next.cats, next.shots, next.marks.close, next.marks.over)
await browser.close()

async function writeShot(name, buffer) {
  if (!buffer) return
  execFileSync('convert', ['png:-', join(out, name)], { input: buffer })
}

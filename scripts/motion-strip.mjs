// Frame-by-frame strip of one small region through one interaction, for before/after comparisons.
//
// The engine runs on a virtual clock (window.__dzReview); every saved frame is one 60 Hz frame. The region
// is captured at 4x so a digit's path can be read.
//
// Usage: pnpm build && pnpm preview --port 4173 &
//        node scripts/motion-strip.mjs <scenario> <outDir>
// Scenarios: count (lesson counter, forward then back), verdict (a wrong pick, then the right one).
// Output: outDir/frames/*.png, outDir/strip.png (tiled), outDir/slow.mp4 (4x slower; needs ffmpeg).
// Env: REVIEW_URL (default http://localhost:4173/dizey/), PLAYWRIGHT_CHROMIUM_PATH, W (viewport width, 390).
import { execFileSync } from 'node:child_process'
import { mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const base = process.env.REVIEW_URL ?? 'http://localhost:4173/dizey/'
const [scenario = 'count', out = join('motion-strip', scenario)] = process.argv.slice(2)
const width = Number(process.env.W ?? 390)
const FRAME = 1000 / 60

const scenarios = {
  count: {
    region: '.ls-count',
    lesson: 'd1-determinant',
    run: async ({ tap, frames }) => {
      await tap('.ls-dock .sh-btn--primary')
      await frames(40)
      await tap('.ls-top__btn[aria-label="Önceki adım"]')
      await frames(40)
    },
  },
  verdict: {
    region: '.ls-dock',
    lesson: 'd1-determinant',
    before: 4,
    run: async ({ tap, frames, page }) => {
      await tap(page.locator('.ex-opt', { hasText: '26' }))
      await frames(50)
      await tap(page.locator('.ex-opt', { hasText: /^b/ }))
      await frames(60)
    },
  },
}
const plan = scenarios[scenario]
if (!plan) throw new Error(`unknown scenario ${scenario}`)

await rm(out, { recursive: true, force: true })
await mkdir(join(out, 'frames'), { recursive: true })
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
)
const context = await browser.newContext({
  viewport: { width, height: 844 },
  deviceScaleFactor: 4,
  isMobile: true,
  hasTouch: true,
  colorScheme: 'dark',
})
await context.addInitScript(() => {
  let hook
  Object.defineProperty(window, '__dzReview', {
    configurable: true,
    get: () => hook,
    set: (value) => {
      hook = value
      value.review.pause()
    },
  })
})
const page = await context.newPage()
let n = 0
const step = () => page.evaluate((ms) => window.__dzReview.review.step(ms), FRAME)
const busy = () => page.evaluate(() => window.__dzReview.engine.isActive())
async function settle(cap = 2400) {
  for (let i = 0, quiet = 0; i < cap && quiet < 12; i++) {
    await step()
    quiet = (await busy()) ? 0 : quiet + 1
  }
}
async function shot() {
  const box = await page.locator(plan.region).first().boundingBox()
  await page.screenshot({
    path: join(out, 'frames', `f${String(n++).padStart(4, '0')}.png`),
    clip: {
      x: Math.max(0, box.x - 12),
      y: Math.max(0, box.y - 6),
      width: Math.min(width, box.width + 24),
      height: box.height + 12,
    },
  })
}
async function frames(count) {
  for (let i = 0; i < count; i++) {
    await step()
    await shot()
  }
}
async function tap(target) {
  const locator = typeof target === 'string' ? page.locator(target) : target
  await locator.first().click()
  await shot()
}

await page.goto(`${base}lesson/${plan.lesson}`)
await page.waitForSelector('[data-testid="lesson-player"]')
await page.evaluate(() => document.fonts.ready)
await settle()
for (let i = 0; i < (plan.before ?? 0); i++) {
  await page.locator('.ls-dock .sh-btn--primary').click()
  await settle()
}
await shot()
await plan.run({ tap, frames, page })
await browser.close()

try {
  const pattern = join(out, 'frames', 'f%04d.png')
  execFileSync('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-framerate',
    '15',
    '-i',
    pattern,
    '-pix_fmt',
    'yuv420p',
    '-vf',
    'pad=ceil(iw/2)*2:ceil(ih/2)*2',
    join(out, 'slow.mp4'),
  ])
  execFileSync('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-i',
    pattern,
    '-vf',
    `select=not(mod(n\\,2)),tile=8x${Math.ceil(n / 16)}:padding=6:color=0x222222`,
    '-frames:v',
    '1',
    join(out, 'strip.png'),
  ])
} catch (error) {
  console.warn(`ffmpeg step skipped: ${error.message}`)
}
console.log(`${n} frames -> ${out}`)

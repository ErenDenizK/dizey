// Frame-by-frame strip of one small region through one interaction, for before/after comparisons.
//
// The engine runs on a virtual clock (window.__dzReview); every saved frame is one 60 Hz frame. The region
// is captured at 4x so a digit's path can be read.
//
// Usage: pnpm build && pnpm preview --port 4173 &
//        node scripts/motion-strip.mjs <scenario> <outDir>
// Scenarios: companion-tabs and companion-hello (the duo travelling between screens, the cold start), count (lesson counter, forward then back), verdict (a wrong pick, then the right one), press, keypad,
// tabs, sheet, progress, lesson-open and lesson-close (a tile's card, the lesson and back), each also as
// chapter-test-open / chapter-test-close (alias test-close) (Yol's chapter test node and the test), lesson-open-cells / lesson-close-cells with the matrix-cell reveal on.
// Then check for one-frame pops (PR-16, nothing changes in a single frame):
//        node scripts/pop-check.mjs <outDir>/frames   (exit 1 and the frames and cells when something steps)
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

const PEEK_ENTER = '[data-testid="lesson-peek"] .dz-button[data-kind="primary"]'
// Settings' own way out: the floating back button, or the sheet header's "Bitti".
const SHEET_CLOSE = '.sh-overlay [aria-label="Sen’e dön"], .sh-overlay button:has-text("Bitti")'
const LESSON_CLOSE = '[data-testid="lesson-player"] [aria-label="Dersten çık"]'
/** The app opens on Yol, where the path nodes live: only let it come to rest. */
async function toYol({ settle }) {
  await settle()
}
/** Opens a tile's card, enters its lesson and lets everything come to rest. */
async function enterLesson({ page, settle }) {
  await toYol({ page, settle })
  await page.locator('.pa-tile:not([data-next])').first().click()
  await settle()
  await page.locator(PEEK_ENTER).click()
  await page.waitForSelector('[data-testid="lesson-player"]')
  await settle()
}

const CHAPTER_CELL = '[data-testid="chapter-test-matrices"]'
/** Yol with the first chapter's test node in the middle of the screen, at rest. */
async function toChapterCell({ page, settle }) {
  await settle()
  await page.locator(CHAPTER_CELL).evaluate((el) => el.scrollIntoView({ block: 'center' }))
  await settle()
}

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
  press: {
    region: '.ls-dock',
    lesson: 'd1-determinant',
    run: async ({ frames, page }) => {
      const box = await page.locator('.ls-dock .sh-btn--primary').first().boundingBox()
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await frames(8)
      await page.mouse.up()
      await frames(30)
    },
  },
  keypad: {
    region: '.ls-keypad-wrap',
    lesson: 'd1-determinant',
    prep: async ({ page, settle }) => {
      const primary = page.locator('.ls-dock .sh-btn--primary').first()
      for (let i = 0; i < 4; i++) {
        await primary.click()
        await settle()
      }
      await page.locator('.ex-opt', { hasText: '26' }).first().click()
      await settle()
      await page.locator('.ex-opt', { hasText: /^b/ }).first().click()
      await settle()
      await primary.click()
      await settle()
    },
    run: async ({ tap, frames, page }) => {
      await tap(page.locator('.ls-key', { hasText: /^8$/ }))
      await frames(12)
      await tap(page.locator('.ls-key', { hasText: /^1$/ }))
      await frames(12)
      await tap('.ls-key[data-fn="true"]')
      await frames(12)
      await tap(page.locator('.ls-key', { hasText: /^8$/ }))
      await tap('.ls-key--go')
      await frames(50)
    },
  },
  tabs: {
    region: 'body',
    scale: 2,
    run: async ({ tap, frames }) => {
      await tap(tabN(1))
      await frames(40)
      await tap(tabN(0))
      await frames(40)
    },
  },
  // The companion: Yol to Sen and back (the duo travels between its anchors).
  'companion-tabs': {
    region: 'body',
    scale: 2,
    run: async ({ tap, frames }) => {
      await tap(tabN(1))
      await frames(60)
      await tap(tabN(0))
      await frames(60)
    },
  },
  // The cold start hello, filmed from the first frame (no settling first).
  'companion-hello': {
    region: 'body',
    scale: 2,
    cold: true,
    run: async ({ frames }) => {
      await frames(75)
    },
  },
  sheet: {
    region: 'body',
    scale: 2,
    prep: toYol,
    run: async ({ tap, frames, page }) => {
      await tap('.pa-tile:not([data-next])')
      await frames(50)
      await page
        .locator('.dz-scrim')
        .first()
        .click({ position: { x: 20, y: 20 } })
      await frames(50)
    },
  },
  progress: {
    region: '.ls-top',
    lesson: 'd1-determinant',
    run: async ({ tap, frames }) => {
      await tap('.ls-dock .sh-btn--primary')
      await frames(40)
      await tap('.ls-top__btn[aria-label="Önceki adım"]')
      await frames(40)
    },
  },
  'lesson-open': {
    region: 'body',
    scale: 2,
    prep: toYol,
    run: async ({ tap, frames }) => {
      await tap('.pa-tile:not([data-next])')
      await frames(30)
      await tap(PEEK_ENTER)
      await frames(60)
    },
  },
  // Open a tile, enter the lesson, let it settle, then close it: the lesson folds back into its tile.
  'lesson-close': {
    region: 'body',
    scale: 2,
    prep: enterLesson,
    run: async ({ tap, frames }) => {
      await tap(LESSON_CLOSE)
      await frames(60)
    },
  },
  // A chapter test grows out of its node on Yol and folds back into it (docs/design/motion-phases.md).
  'chapter-test-open': {
    region: 'body',
    scale: 2,
    prep: toChapterCell,
    run: async ({ tap, frames }) => {
      await tap(CHAPTER_CELL)
      await frames(60)
    },
  },
  'chapter-test-close': {
    region: 'body',
    scale: 2,
    prep: async (ctx) => {
      await toChapterCell(ctx)
      await ctx.page.locator(CHAPTER_CELL).click()
      await ctx.page.waitForSelector('[data-testid="exam-run"]')
      await ctx.settle()
    },
    run: async ({ tap, frames }) => {
      await tap('[aria-label="Testten çık, sonra devam et"]')
      await frames(60)
    },
  },
  // Settings is a plain push from Sen (no sheet, no grow from the button), and back.
  'settings-open': {
    region: 'body',
    scale: 2,
    prep: async ({ page, settle }) => {
      await page.locator('.dz-tab').nth(1).click()
      await settle()
    },
    run: async ({ tap, frames }) => {
      await tap('[data-testid="open-settings"]')
      await frames(60)
    },
  },
  'settings-close': {
    region: 'body',
    scale: 2,
    prep: async ({ page, settle }) => {
      await page.locator('.dz-tab').nth(1).click()
      await settle()
      await page.locator('[data-testid="open-settings"]').click()
      await settle()
    },
    run: async ({ page, frames, tap }) => {
      await tap(page.locator('.sh-overlay .dz-icon-button--float').first())
      await frames(60)
    },
  },
  // The same two with the matrix-cell reveal switched on (settings are read from storage before load).
  'lesson-open-cells': {
    region: 'body',
    scale: 2,
    settings: { cellReveal: true },
    prep: toYol,
    run: async ({ tap, frames }) => {
      await tap('.pa-tile:not([data-next])')
      await frames(30)
      await tap(PEEK_ENTER)
      await frames(60)
    },
  },
  'lesson-close-cells': {
    region: 'body',
    scale: 2,
    settings: { cellReveal: true },
    prep: enterLesson,
    run: async ({ tap, frames }) => {
      await tap(LESSON_CLOSE)
      await frames(60)
    },
  },
}
scenarios['test-close'] = scenarios['chapter-test-close']
const plan = scenarios[scenario]
if (!plan) throw new Error(`unknown scenario ${scenario}`)

await rm(out, { recursive: true, force: true })
await mkdir(join(out, 'frames'), { recursive: true })
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
)
const context = await browser.newContext({
  viewport: { width, height: 844 },
  deviceScaleFactor: plan.scale ?? 4,
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
if (plan.settings)
  await context.addInitScript(
    // App storage prefixes keys by build channel ("dev:" for a local build, none in production).
    (value) => {
      for (const prefix of ['', 'dev:'])
        localStorage.setItem(`${prefix}dizey.settings`, JSON.stringify(value))
    },
    plan.settings,
  )
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
  const box =
    plan.region === 'body'
      ? { x: 0, y: 0, width, height: 844 }
      : await page.locator(plan.region).first().boundingBox()
  await page.screenshot({
    path: join(out, 'frames', `f${String(n++).padStart(4, '0')}.png`),
    clip: {
      x: Math.max(0, box.x - 12),
      y: Math.max(0, box.y - 6),
      width: Math.min(width, box.width + (plan.region === 'body' ? 0 : 24)),
      height: box.height + (plan.region === 'body' ? 0 : 12),
    },
  })
}
async function frames(count) {
  for (let i = 0; i < count; i++) {
    await step()
    await shot()
  }
}
const tabN = (i) => page.locator('.dz-tab').nth(i)
async function tap(target) {
  const locator = typeof target === 'string' ? page.locator(target) : target
  await locator.first().click()
  await shot()
}

await page.goto(plan.lesson ? `${base}lesson/${plan.lesson}` : base)
await page.waitForSelector(plan.lesson ? '[data-testid="lesson-player"]' : '.dz-tab')
if (!plan.cold) {
  await page.evaluate(() => document.fonts.ready)
  await settle()
}
for (let i = 0; i < (plan.before ?? 0); i++) {
  await page.locator('.ls-dock .sh-btn--primary').click()
  await settle()
}
if (plan.prep) await plan.prep({ page, settle })
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
    `select=not(mod(n\\,2)),${plan.scale ? 'scale=iw/4:-1,' : ''}tile=8x${Math.ceil(n / 16)}:padding=6:color=0x222222`,
    '-frames:v',
    '1',
    join(out, 'strip.png'),
  ])
} catch (error) {
  console.warn(`ffmpeg step skipped: ${error.message}`)
}
console.log(`${n} frames -> ${out}`)

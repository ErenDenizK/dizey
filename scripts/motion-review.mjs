// Frame-by-frame motion review for the lab page (/lab).
//
// The engine runs on a virtual clock, so this script pauses the real-time driver and steps the clock
// by exactly one 60 Hz frame between captures: every frame is the frame the phone would show,
// independent of how slow the capture is. For each scenario it writes the frames, a contact sheet,
// and per-frame measurements (position, size, opacity) of the moving element, then checks them:
// no frame jumps more than a limit, motion settles within its time budget, and nothing overshoots
// where the spec says it must not.
//
// Usage: pnpm build && pnpm preview --port 4173 & node scripts/motion-review.mjs [outDir]
// Env: REVIEW_URL (default http://localhost:4173/dizey/lab), BROWSER (webkit | chromium),
//      PLAYWRIGHT_CHROMIUM_PATH for sandboxes without a Playwright WebKit download.
import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { chromium, webkit } from '@playwright/test'

const url = process.env.REVIEW_URL ?? 'http://localhost:4173/dizey/lab'
const out = process.argv[2] ?? 'motion-review'
const FRAME = 1000 / 60

const browserType = process.env.BROWSER === 'chromium' ? chromium : webkit
const browser = await browserType.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH && browserType === chromium
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
    : {},
)

const results = []

async function session(theme, reducedMotion = false) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: browserType === chromium,
    hasTouch: true,
    colorScheme: theme,
    reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
  })
  const page = await context.newPage()
  await page.goto(url)
  await page.waitForFunction(() => window.__dz)
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() => window.__dz.review.pause())
  await step(page, 40)
  return { page, context }
}

async function step(page, frames) {
  await page.evaluate(
    ({ frames, ms }) => {
      for (let i = 0; i < frames; i++) window.__dz.review.step(ms)
    },
    { frames, ms: FRAME },
  )
}

/** Measures `selector` (first match): rect, opacity, transform, clip-path. */
async function measure(page, selector) {
  return page.evaluate((selector) => {
    const el = document.querySelector(selector)
    if (!el) return null
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return {
      x: r.x,
      y: r.y,
      w: r.width,
      h: r.height,
      opacity: Number(cs.opacity),
      clip: cs.clipPath,
    }
  }, selector)
}

async function record(page, name, { selector, frames = 36, every = 1, act }) {
  const dir = join(out, name)
  await mkdir(dir, { recursive: true })
  await act(page)
  // Let React commit the state change (real time; the paused animation clock does not move).
  await page.waitForTimeout(80)
  const samples = []
  const shots = []
  for (let f = 0; f <= frames; f++) {
    const m = await measure(page, selector)
    samples.push({ frame: f, ms: Math.round(f * FRAME), ...m })
    if (f % every === 0) {
      const file = join(dir, `f${String(f).padStart(3, '0')}.png`)
      await page.screenshot({ path: file })
      shots.push({ file: `f${String(f).padStart(3, '0')}.png`, ms: Math.round(f * FRAME) })
    }
    await step(page, 1)
  }
  await writeFile(join(dir, 'samples.json'), JSON.stringify(samples, null, 1))
  await contactSheet(page.context(), dir, name, shots)
  return samples
}

async function contactSheet(context, dir, name, shots) {
  const page = await context.browser().newPage({ viewport: { width: 1600, height: 900 } })
  const cells = shots
    .map((s) => `<figure><img src="${s.file}"><figcaption>${s.ms} ms</figcaption></figure>`)
    .join('')
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:16px;font:13px system-ui;background:#888}
    h1{font-size:16px;margin:0 0 12px}
    .grid{display:grid;grid-template-columns:repeat(8,1fr);gap:8px}
    figure{margin:0;background:#fff;border-radius:6px;overflow:hidden}
    img{width:100%;display:block}figcaption{padding:2px 6px}
  </style><h1>${name}</h1><div class="grid">${cells}</div>`
  const file = join(dir, 'index.html')
  await writeFile(file, html)
  await page.goto(`file://${resolve(file)}`)
  await page.screenshot({ path: join(dir, 'contact-sheet.png'), fullPage: true })
  await page.close()
}

/** Checks a series of samples against the motion spec. */
function check(name, samples, key, { maxJump, settleBy, noOvershoot, target }) {
  const values = samples.map((s) => s?.[key]).filter((v) => typeof v === 'number')
  const end = target ?? values[values.length - 1]
  const jumps = values.slice(1).map((v, i) => Math.abs(v - values[i]))
  const biggest = Math.max(...jumps)
  const settledAt = samples.find((_s, i) => values.slice(i).every((v) => Math.abs(v - end) < 1))?.ms
  const start = values[0]
  const dir = Math.sign(end - start)
  const over = noOvershoot ? Math.max(0, ...values.map((v) => (v - end) * dir)) : 0
  const ok = biggest <= maxJump && (settledAt ?? Number.POSITIVE_INFINITY) <= settleBy && over < 0.5
  results.push({
    name,
    key,
    biggestJumpPx: +biggest.toFixed(2),
    settledAtMs: settledAt,
    overshootPx: +over.toFixed(2),
    ok,
  })
}

const themes = ['light', 'dark']
for (const theme of themes) {
  const { page, context } = await session(theme)

  // Static screens.
  for (const tab of ['today', 'map', 'exam', 'me']) {
    await page.evaluate((t) => window.__dz.selectTab(t), tab)
    await step(page, 40)
    await mkdir(join(out, 'screens'), { recursive: true })
    await page.screenshot({ path: join(out, 'screens', `${tab}-${theme}.png`) })
  }
  await page.evaluate(() => window.__dz.selectTab('today'))
  await step(page, 40)

  // Tab switch: the lens's leading edge leads, the trailing edge follows.
  let s = await record(page, `tab-${theme}`, {
    selector: '.dz-tabbar-lens',
    frames: 36,
    act: (p) => p.getByRole('button', { name: 'Sınav' }).click(),
  })
  check(`tab lens x (${theme})`, s, 'x', { maxJump: 40, settleBy: 600 })
  check(`tab lens width (${theme})`, s, 'w', { maxJump: 30, settleBy: 600 })
  await page.evaluate(() => window.__dz.selectTab('today'))
  await step(page, 40)

  // Press: hold, then release.
  s = await record(page, `press-${theme}`, {
    selector: '.lab-continue',
    frames: 30,
    act: async (p) => {
      const box = await p.locator('.lab-continue').boundingBox()
      await p.mouse.move(box.x + 40, box.y + 40)
      await p.mouse.down()
      await step(p, 10)
      await p.evaluate(() => {
        const el = document.querySelector('.lab-continue')
        el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 }))
      })
      await p.mouse.up()
    },
  })
  // The release was a tap, so the lesson stage opened: close it before the next scenario.
  await page.evaluate(() => window.__dz.closeStage())
  await page.waitForTimeout(80)
  await step(page, 90)

  // Push and pop.
  s = await record(page, `push-${theme}`, {
    selector: '.lab-pane:first-child .dz-screen[data-pushed]',
    frames: 40,
    act: (p) => p.evaluate(() => window.__dz.push()),
  })
  check(`push x (${theme})`, s, 'x', { maxJump: 80, settleBy: 700, noOvershoot: true, target: 0 })
  s = await record(page, `pop-${theme}`, {
    selector: '.lab-pane:first-child .lab-root',
    frames: 40,
    act: (p) => p.evaluate(() => window.__dz.pop()),
  })
  check(`pop: root returns (${theme})`, s, 'x', { maxJump: 30, settleBy: 700, noOvershoot: true, target: 0 })

  // Sheet: open to medium, grow to large, close.
  s = await record(page, `sheet-open-${theme}`, {
    selector: '.dz-sheet',
    frames: 40,
    act: (p) => p.evaluate(() => window.__dz.openSheet()),
  })
  check(`sheet open y (${theme})`, s, 'y', { maxJump: 90, settleBy: 700, noOvershoot: true })
  s = await record(page, `sheet-large-${theme}`, {
    selector: '.dz-stage',
    frames: 36,
    act: (p) => p.locator('.dz-grabber-hit').click(),
  })
  s = await record(page, `sheet-close-${theme}`, {
    selector: '.dz-sheet',
    frames: 40,
    act: (p) => p.evaluate(() => window.__dz.closeSheet()),
  })
  await step(page, 30)

  // Card grows into the lesson stage and back.
  s = await record(page, `stage-open-${theme}`, {
    selector: '.dz-morph',
    frames: 42,
    act: (p) => p.locator('.lab-continue').click(),
  })
  s = await record(page, `stage-close-${theme}`, {
    selector: '.dz-morph',
    frames: 42,
    act: (p) => p.evaluate(() => window.__dz.closeStage()),
  })
  await step(page, 30)

  // Switch.
  await page.evaluate(() => window.__dz.selectTab('me'))
  await step(page, 30)
  s = await record(page, `switch-${theme}`, {
    selector: '.dz-switch-knob',
    frames: 24,
    act: (p) => p.getByRole('switch', { name: 'Ses' }).click(),
  })
  check(`switch knob x (${theme})`, s, 'x', { maxJump: 12, settleBy: 450 })
  await context.close()
}

// Reduced motion: travel lands at once, effects still fade.
{
  const { page, context } = await session('light', true)
  const s = await record(page, 'push-reduced', {
    selector: '.lab-pane:first-child .dz-screen[data-pushed]',
    frames: 12,
    act: (p) => p.evaluate(() => window.__dz.push()),
  })
  results.push({
    name: 'reduced motion: push lands in one frame',
    ok: s[1]?.x === 0,
    firstFrameX: s[1]?.x,
  })
  await context.close()
}

await browser.close()
await writeFile(join(out, 'checks.json'), JSON.stringify(results, null, 1))
console.table(results)
if (results.some((r) => !r.ok)) process.exitCode = 1

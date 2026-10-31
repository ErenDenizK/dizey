// Frame-by-frame review of a whole lesson play-through.
//
// The app's one engine runs on a virtual clock. This script stops the real-time driver before the app
// starts (so even the first step's entrance is stepped), then plays a scripted session: every step,
// wrong and right answers, pause, play, replay, finishing a beat early, going back. Between captures the
// clock moves exactly one 60 Hz frame, so every saved frame is the frame a phone would show.
//
// Output (outDir, default lesson-review/<lesson>-<theme>):
//   frames/f00000.jpg ...   every frame
//   video.mp4               the frames at 60 fps (needs ffmpeg on PATH)
//   samples.json            per-frame measurements of the lesson's parts
//   findings.json           automatic findings: one-frame jumps, pops, resizes, overflow, stalls
//   sheets/<segment>.png    contact sheet per segment (every 3rd frame)
//
// Usage: pnpm build && pnpm preview --port 4173 &
//        node scripts/lesson-review.mjs [lessonId] [theme] [outDir]
// Env: REVIEW_URL (default http://localhost:4173/dizey/), PLAYWRIGHT_CHROMIUM_PATH, SHOTS=0 to skip frames.
import { execFileSync } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { chromium } from '@playwright/test'

const base = process.env.REVIEW_URL ?? 'http://localhost:4173/dizey/'
const lessonId = process.argv[2] ?? 'd1-determinant'
const theme = process.argv[3] ?? 'light'
const out = process.argv[4] ?? join('lesson-review', `${lessonId}-${theme}`)
const shots = process.env.SHOTS !== '0'
const FRAME = 1000 / 60

await rm(out, { recursive: true, force: true })
await mkdir(join(out, 'frames'), { recursive: true })
await mkdir(join(out, 'sheets'), { recursive: true })

const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
)
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  colorScheme: theme,
})
// Stop the real-time driver the moment the app publishes its review hook, before anything moves.
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

/** Parts of the lesson screen measured on every frame. */
const PARTS = {
  eyebrow: '.ls-eyebrow',
  title: '.ls-title',
  body: '.ls-body',
  narr: '.ls-narr',
  stage: '.ls-stage',
  scene: '.ls-scene',
  work: '.ls-work',
  area: '.ls-area',
  result: '.ls-result',
  transport: '.ls-replay',
  dock: '.ls-dock',
  primary: '.ls-dock .sh-btn--primary',
  options: '.ls-opts',
  keypad: '.ls-keypad-wrap',
  feedback: '.ls-feedback',
  progress: '.ls-progress__fill',
  count: '.ls-count',
}

const samples = []
const segments = []
let frameNo = 0
let clock = 0
let segment = null

async function flush() {
  // Let React commit what the last clock step scheduled (state set inside cues).
  await page.evaluate(() => new Promise((r) => setTimeout(r, 0)))
}

async function capture() {
  await flush()
  const m = await page.evaluate((parts) => {
    const rect = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      return {
        x: +r.x.toFixed(2),
        y: +r.y.toFixed(2),
        w: +r.width.toFixed(2),
        h: +r.height.toFixed(2),
        o: +Number(cs.opacity).toFixed(3),
      }
    }
    const out = {}
    for (const [name, sel] of Object.entries(parts)) out[name] = rect(document.querySelector(sel))
    const stage = document.querySelector('.ls-stage')
    out.cell = stage ? getComputedStyle(stage).getPropertyValue('--cell').trim() : null
    out.chips = document.querySelectorAll('.ls-chip').length
    out.label = document.querySelector('.ls-dock .sh-btn--primary')?.textContent ?? null
    out.stepTitle = document.querySelector('.ls-title')?.textContent ?? null
    const narr = document.querySelector('.ls-narr')
    out.narrOverflow = narr ? narr.scrollHeight - narr.clientHeight : 0
    // Stage content outside the stage's padding box is cut off by overflow: hidden.
    if (stage) {
      const s = stage.getBoundingClientRect()
      const cut = []
      for (const sel of ['.ls-scene', '.ls-work', '.ls-area', '.ls-minor', '.ls-copy']) {
        for (const el of stage.querySelectorAll(sel)) {
          const r = el.getBoundingClientRect()
          const over = Math.max(s.top - r.top, r.bottom - s.bottom, s.left - r.left, r.right - s.right)
          if (over > 0.5) cut.push({ sel, over: +over.toFixed(1) })
        }
      }
      out.cut = cut
      const t = document.querySelector('.ls-replay')?.getBoundingClientRect()
      const scene = document.querySelector('.ls-scene')?.getBoundingClientRect()
      out.transportOverlap =
        t && scene
          ? Math.max(0, Math.min(t.right, scene.right) - Math.max(t.left, scene.left)) *
              Math.max(0, Math.min(t.bottom, scene.bottom) - Math.max(t.top, scene.top)) >
            0
          : false
    }
    out.busy = window.__dzReview.engine.isActive()
    return out
  }, PARTS)
  const sample = { f: frameNo, ms: Math.round(clock), seg: segment?.name, ...m }
  samples.push(sample)
  if (shots) {
    await page.screenshot({
      path: join(out, 'frames', `f${String(frameNo).padStart(5, '0')}.jpg`),
      type: 'jpeg',
      quality: 82,
    })
  }
  segment?.frames.push(frameNo)
  frameNo++
  return sample
}

async function tick(n = 1) {
  for (let i = 0; i < n; i++) {
    await page.evaluate((ms) => window.__dzReview.review.step(ms), FRAME)
    clock += FRAME
    await capture()
  }
}

/** Steps until nothing moves or waits for `quiet` frames (capped). */
async function settle(quiet = 12, cap = 2400) {
  let still = 0
  for (let i = 0; i < cap && still < quiet; i++) {
    await tick()
    still = samples.at(-1).busy ? 0 : still + 1
  }
}

function begin(name, note) {
  segment = { name, note, start: frameNo, frames: [] }
  segments.push(segment)
}

const primary = () => page.locator('.ls-dock .sh-btn--primary')
async function tap(locator) {
  await locator.click()
  await capture()
}

await page.goto(`${base}lesson/${lessonId}`)
await page.waitForSelector('[data-testid="lesson-player"]')
await page.evaluate(() => document.fonts.ready)

const plan = {
  'd1-determinant': async () => {
    begin('01-hook', 'Lesson opens on step 1')
    await capture()
    await settle()
    for (const [name, note] of [
      ['02-area', 'Next: area beat'],
      ['03-rule', 'Next: 2x2 rule beat; pause, play, then replay'],
    ]) {
      begin(name, note)
      await tap(primary())
      if (name === '03-rule') {
        await tick(90)
        await tap(page.locator('.ls-replay'))
        await tick(30)
        await tap(page.locator('.ls-replay'))
      }
      await settle()
    }
    begin('03b-replay', 'Replay the rule beat')
    await tap(page.locator('.ls-replay'))
    await settle()
    begin('04-worked', 'Next: worked 2x2, finish the beat early with the primary button')
    await tap(primary())
    await tick(100)
    await tap(primary())
    await settle()
    begin('05-try-b-wrong', 'Next: choice, wrong answer')
    await tap(primary())
    await settle()
    await tap(page.locator('.ex-opt', { hasText: '26' }))
    await settle()
    begin('05b-try-b-right', 'Right answer and its reveal')
    await tap(page.locator('.ex-opt', { hasText: /^b/ }))
    await settle()
    begin('06-try-c', 'Next: keypad, wrong then right')
    await tap(primary())
    await settle()
    await tap(page.locator('.ls-key', { hasText: /^8$/ }))
    await tick(10)
    await tap(page.locator('.ls-key--go'))
    await settle()
    await tap(page.locator('.ls-key', { hasText: /^1$/ }))
    await tick(6)
    await tap(page.locator('.ls-key', { hasText: /^1$/ }))
    await tick(6)
    await tap(page.locator('.ls-key--go'))
    await settle()
    for (const [name, note] of [
      ['07-singular', 'Next: det, column marks and area sequence'],
      ['08-try-k', 'Next: parameter choice, right first try'],
    ]) {
      begin(name, note)
      await tap(primary())
      await settle()
    }
    await tap(page.locator('.ex-opt', { hasText: '−4' }))
    await settle()
    for (const [name, note] of [
      ['09-sarrus-why', 'Next: Sarrus copy columns'],
      ['10-sarrus-rule', 'Next: Sarrus full rule'],
      ['11-try-n', 'Next: keypad, wrong, then show answer'],
    ]) {
      begin(name, note)
      await tap(primary())
      await settle()
    }
    await tap(page.locator('.ls-key', { hasText: /^2$/ }))
    await tap(page.locator('.ls-key', { hasText: /^5$/ }))
    await tap(page.locator('.ls-key--go'))
    await settle()
    await tap(page.locator('.ls-dock .sh-btn--soft'))
    await settle()
    for (const [name, note] of [
      ['12-trap', 'Next: text-only step'],
      ['13-exam-k', 'Next: five-option exam question, right'],
    ]) {
      begin(name, note)
      await tap(primary())
      await settle()
    }
    await tap(page.locator('.ex-opt').nth(2))
    await settle()
    begin('14-summary', 'Next: summary')
    await tap(primary())
    await settle()
    begin('15-back', 'Back chevron to the exam question')
    await tap(page.locator('.ls-top__btn').nth(1))
    await settle()
  },
}

const run = plan[lessonId]
if (!run) throw new Error(`No play-through scripted for ${lessonId}`)
await run()

await writeFile(join(out, 'samples.json'), JSON.stringify(samples))

// Findings. A "jump" is a change that happens in one frame with no motion on either side: layout
// teleporting rather than moving. A "pop" is the same for opacity.
const findings = []
const KEYS = ['x', 'y', 'w', 'h']
for (const part of Object.keys(PARTS)) {
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1][part]
    const b = samples[i][part]
    if (!a || !b) {
      if (Boolean(a) !== Boolean(b) && samples[i].seg === samples[i - 1].seg)
        findings.push({ f: i, seg: samples[i].seg, part, kind: b ? 'appears' : 'disappears' })
      continue
    }
    const prev = samples[i - 2]?.[part]
    const next = samples[i + 1]?.[part]
    for (const k of KEYS) {
      const d = b[k] - a[k]
      const before = prev ? Math.abs(a[k] - prev[k]) : 0
      const after = next ? Math.abs(next[k] - b[k]) : 0
      if (Math.abs(d) >= 3 && before < 0.5 && after < 0.5)
        findings.push({ f: i, seg: samples[i].seg, part, kind: 'jump', key: k, by: +d.toFixed(1) })
    }
    const dOp = b.o - a.o
    if (Math.abs(dOp) >= 0.4)
      findings.push({ f: i, seg: samples[i].seg, part, kind: 'pop', by: +dOp.toFixed(2) })
  }
}
for (let i = 1; i < samples.length; i++) {
  const s = samples[i]
  if (s.cell !== samples[i - 1].cell && s.seg === samples[i - 1].seg)
    findings.push({ f: i, seg: s.seg, part: 'stage', kind: 'cell', from: samples[i - 1].cell, to: s.cell })
  if (s.cut?.length) findings.push({ f: i, seg: s.seg, part: 'stage', kind: 'cut', cut: s.cut })
  if (s.transportOverlap) findings.push({ f: i, seg: s.seg, part: 'transport', kind: 'overlaps-scene' })
  if (s.label !== samples[i - 1].label && s.seg === samples[i - 1].seg)
    findings.push({
      f: i,
      seg: s.seg,
      part: 'primary',
      kind: 'label',
      from: samples[i - 1].label,
      to: s.label,
    })
}
// Collapse repeats (same part, kind and key on consecutive frames) to the first frame and a count.
const collapsed = []
for (const f of findings) {
  const last = collapsed.at(-1)
  if (last && last.part === f.part && last.kind === f.kind && last.key === f.key && f.f - last.lastF <= 1) {
    last.frames++
    last.lastF = f.f
  } else collapsed.push({ ...f, frames: 1, lastF: f.f })
}
await writeFile(
  join(out, 'findings.json'),
  JSON.stringify(
    {
      segments: segments.map(({ frames, ...s }) => ({ ...s, end: s.start + frames.length })),
      findings: collapsed,
    },
    null,
    1,
  ),
)

if (shots) {
  for (const seg of segments) {
    const picks = seg.frames.filter((_f, i) => i % 3 === 0).slice(0, 96)
    const cells = picks
      .map((f) => {
        const s = samples[f]
        return `<figure><img src="../frames/f${String(f).padStart(5, '0')}.jpg"><figcaption>#${f} ${s.ms} ms</figcaption></figure>`
      })
      .join('')
    const html = `<!doctype html><meta charset="utf-8"><style>body{margin:12px;font:12px system-ui;background:#777}
h1{font-size:15px;margin:0 0 8px;color:#fff}.g{display:grid;grid-template-columns:repeat(12,1fr);gap:6px}
figure{margin:0;background:#fff;border-radius:4px;overflow:hidden}img{width:100%;display:block}figcaption{padding:1px 4px}</style>
<h1>${seg.name}: ${seg.note}</h1><div class="g">${cells}</div>`
    const file = join(out, 'sheets', `${seg.name}.html`)
    await writeFile(file, html)
    const sheet = await browser.newPage({ viewport: { width: 2000, height: 900 } })
    await sheet.goto(`file://${resolve(file)}`)
    await sheet.waitForLoadState('load')
    await sheet.screenshot({ path: join(out, 'sheets', `${seg.name}.png`), fullPage: true })
    await sheet.close()
  }
  try {
    execFileSync('ffmpeg', [
      '-y',
      '-loglevel',
      'error',
      '-framerate',
      '60',
      '-i',
      join(out, 'frames', 'f%05d.jpg'),
      '-vf',
      'scale=390:-2',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-crf',
      '24',
      join(out, 'video.mp4'),
    ])
  } catch (error) {
    console.warn('ffmpeg failed; frames are kept', error.message)
  }
}

console.log(
  `${frameNo} frames (${(clock / 1000).toFixed(1)} s of lesson time), ${collapsed.length} findings -> ${out}`,
)
await browser.close()

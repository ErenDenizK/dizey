// Jump audit (PR-16: nothing appears, disappears, moves or changes in a single frame), read from the DOM.
//
// Walks whole lessons on the engine's virtual clock (window.__dzReview) and samples every visible leaf on
// screen each 60 Hz frame: its box, its effective opacity (the product of its ancestors' opacity) and its
// text. Then flags step functions: a leaf that sits still, changes in one frame, and sits still again.
// Unlike pop-check (pixels) it names the element, needs no ffmpeg, and covers every step of every lesson.
//
// Usage: pnpm build && pnpm preview --port 4173 &
//        node scripts/jump-audit.mjs [lessonId ...]      (default: every lesson on the path)
// Env: REVIEW_URL (default http://localhost:4173/dizey/), PLAYWRIGHT_CHROMIUM_PATH, W (390), H (844).
// Output: one line per jump; exit code 1 when anything is flagged.
import { chromium } from '@playwright/test'

const base = process.env.REVIEW_URL ?? 'http://localhost:4173/dizey/'
const width = Number(process.env.W ?? 390)
const height = Number(process.env.H ?? 844)
const FRAME = 1000 / 60
/** Thresholds: px of travel and opacity in one frame, frames of stillness either side. */
const MOVE = 3
const FADE = 0.35
const HOLD = 2

export async function openAuditPage(browser, url) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    colorScheme: 'dark',
  })
  await context.addInitScript(() => {
    localStorage.setItem('dizey.onboarding.safari', '1')
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
  await context.addInitScript(() => {
    const ids = new WeakMap()
    let serial = 0
    window.__dzSample = () => {
      const out = []
      const vw = innerWidth
      const vh = innerHeight
      for (const el of document.body.querySelectorAll('*')) {
        if (el.closest('svg') && el.tagName !== 'svg') continue
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
        if (!own && el.tagName !== 'svg' && el.tagName !== 'IMG') continue
        const r = el.getBoundingClientRect()
        if (r.width < 1 || r.height < 1 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue
        let opacity = 1
        let hidden = false
        for (let p = el; p && p !== document.documentElement; p = p.parentElement) {
          const cs = getComputedStyle(p)
          if (cs.visibility === 'hidden' || cs.display === 'none') hidden = true
          opacity *= Number(cs.opacity)
          const ink = /opacity\(([\d.]+)\)/.exec(cs.filter)
          if (ink) opacity *= Number(ink[1])
        }
        if (hidden || opacity < 0.02) continue
        if (!ids.has(el)) ids.set(el, ++serial)
        const text = el.tagName === 'svg' ? '' : el.textContent.trim().slice(0, 24)
        const name = (n) =>
          (n && typeof n.className === 'string' && n.className.split(' ')[0]) || n?.tagName || ''
        const cls = `${name(el.parentElement)}>${name(el) || el.tagName}`
        out.push([
          ids.get(el),
          cls || el.tagName,
          r.x,
          r.y,
          r.width,
          r.height,
          opacity,
          text,
          Boolean(el.closest('.ls-leaving')),
        ])
      }
      return out
    }
  })
  const page = await context.newPage()
  if (url) await page.goto(url)
  return page
}

/** Steps the virtual clock until the engine is idle, sampling every frame. */
export const hooks = { onFrame: null }
export async function film(page, frames, cap = 900) {
  for (let i = 0, quiet = 0; i < cap && quiet < 8; i++) {
    const [busy, sample] = await page.evaluate((ms) => {
      window.__dzReview.review.step(ms)
      return [window.__dzReview.engine.isActive(), window.__dzSample()]
    }, FRAME)
    frames.push(sample)
    if (hooks.onFrame) await hooks.onFrame(page, frames.length - 1)
    quiet = busy ? 0 : quiet + 1
  }
}

/** Finds step functions in a filmed sequence. Returns [{frame, cls, text, kind, delta}]. */
export function findJumps(frames) {
  const found = []
  const tracks = new Map()
  frames.forEach((sample, f) => {
    for (const [id, cls, x, y, w, h, o, text, copy] of sample) {
      if (!tracks.has(id)) tracks.set(id, { cls, copy, rows: [] })
      tracks.get(id).rows.push({ f, x, y, w, h, o, text })
    }
  })
  const still = (a, b) =>
    a &&
    b &&
    b.f - a.f === 1 &&
    Math.abs(a.x - b.x) < 0.5 &&
    Math.abs(a.y - b.y) < 0.5 &&
    Math.abs(a.o - b.o) < 0.02
  for (const [, { cls, copy, rows }] of tracks) {
    const at = (i) => rows[i]
    for (let i = 1; i < rows.length; i++) {
      const a = rows[i - 1]
      const b = rows[i]
      if (b.f - a.f !== 1) continue
      let calm = true
      for (let k = 1; k <= HOLD; k++)
        calm &&= still(at(i - 1 - k), at(i - k)) && still(at(i + k - 1), at(i + k))
      if (!calm) continue
      const move = Math.max(
        Math.abs(a.x - b.x),
        Math.abs(a.y - b.y),
        Math.abs(a.w - b.w),
        Math.abs(a.h - b.h),
      )
      if (move > MOVE) found.push({ frame: b.f, cls, text: b.text, kind: 'move', delta: move.toFixed(1) })
      if (Math.abs(a.o - b.o) > FADE)
        found.push({ frame: b.f, cls, text: b.text, kind: 'fade', delta: (b.o - a.o).toFixed(2) })
      // The step counter's roller (RollNumber) is checked in pixels by pop-check.
      if (/dz-roll|ls-count/.test(cls)) continue
      if (a.text !== b.text && b.o > 0.5)
        found.push({ frame: b.f, cls, text: `${a.text} → ${b.text}`, kind: 'text', delta: '' })
    }
    // Arrivals and departures at full ink, with the frames either side calm.
    const first = rows[0]
    const last = rows[rows.length - 1]
    const calmAround = (f) => f > HOLD && f < frames.length - HOLD
    const ghost = (f, row, dir) =>
      // A remount: the same text at the same place on the other side of the frame is not a visible change.
      (frames[f + dir] ?? []).some(
        ([, , x, y, w, h, , t]) =>
          t === row.text &&
          Math.abs(x + w / 2 - row.x - row.w / 2) < 4 &&
          Math.abs(y + h / 2 - row.y - row.h / 2) < 4,
      )
    if (
      !copy &&
      !/dz-roll|ls-answer/.test(cls) &&
      first.f > 0 &&
      first.o > FADE &&
      calmAround(first.f) &&
      !ghost(first.f, first, -1)
    )
      found.push({ frame: first.f, cls, text: first.text, kind: 'appear', delta: first.o.toFixed(2) })
    if (
      !/ls-answer/.test(cls) &&
      last.f < frames.length - 1 &&
      last.o > FADE &&
      calmAround(last.f) &&
      !ghost(last.f, last, 1)
    )
      found.push({ frame: last.f + 1, cls, text: last.text, kind: 'vanish', delta: last.o.toFixed(2) })
  }
  return found.sort((p, q) => p.frame - q.frame)
}

/** Walks one lesson: every step, a wrong pick then the way on, the keypad, to the end screen. */
export async function walkLesson(page, lessonId, frames) {
  await page.goto(`${base}lesson/${lessonId}`)
  await page.waitForFunction(() => window.__dzReview && window.__dzSample)
  await film(page, frames)
  const primary = page.locator('.ls-dock:not(.ls-leaving) .sh-btn--primary')
  const tap = async (locator) => {
    await locator.click({ timeout: 2000 })
    await film(page, frames)
  }
  for (let n = 0; n < 60; n++) {
    if (await page.locator('.ls-end').count()) return
    const options = page.locator('.ls-dock:not(.ls-leaving) .ls-opts .ex-opt:not([disabled])')
    if (await options.count()) {
      await tap(options.last())
      if (!(await page.locator('.ls-verdict').count())) {
        const soft = page.locator('.ls-dock:not(.ls-leaving) .sh-btn--soft:not([disabled])')
        if (await soft.count()) await tap(soft.first())
        else if (await options.count()) await tap(options.first())
      }
    } else if (await page.locator('.ls-keypad').count()) {
      await tap(page.locator('.ls-key').first())
      await tap(page.locator('.ls-key--go'))
      if (!(await page.locator('.ls-verdict').count())) {
        const soft = page.locator('.ls-dock:not(.ls-leaving) .sh-btn--soft:not([disabled])')
        if (await soft.count()) await tap(soft.first())
      }
    }
    if (!(await primary.count())) return
    await tap(primary.first())
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { readdirSync } = await import('node:fs')
  const ids =
    process.argv.slice(2).length > 0
      ? process.argv.slice(2)
      : readdirSync(new URL('../src/content/lessons/', import.meta.url))
          .filter((n) => /^[a-z]\d+-.*\.ts$/.test(n) && !n.endsWith('.test.ts'))
          .map((n) => n.replace(/\.ts$/, ''))
  const browser = await chromium.launch(
    process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
  )
  let total = 0
  for (const id of ids) {
    const page = await openAuditPage(browser)
    const frames = []
    try {
      await walkLesson(page, id, frames)
    } catch (error) {
      console.log(`${id}: walk stopped (${error.message.split('\n').slice(0, 12).join(' | ')})`)
    }
    const jumps = findJumps(frames)
    total += jumps.length
    console.log(`${id}: ${frames.length} frames, ${jumps.length} jumps`)
    for (const j of jumps) console.log(`  f${j.frame} ${j.kind} ${j.delta} .${j.cls} "${j.text}"`)
    await page.context().close()
  }
  await browser.close()
  process.exit(total ? 1 : 0)
}

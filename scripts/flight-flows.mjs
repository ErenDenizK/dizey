// Mırtis hand-off flights (src/character/flight.ts), filmed on the engine's virtual clock (window.__dzReview).
// One chain walks the whole route: Yol's dock "Başla" -> the lesson's greeting (flight 1), the last answer -> the lesson
// end (flight 2), then "Yola dön" back to the dock (flight 3) or "Sıradaki" to the next lesson's greeting (flight 3b).
// Shared by e2e/mirtis-flight.spec.ts (the guard) and scripts/flight-strips.mjs (the frame strips).
import { drive, film, hooks, openAuditPage } from './jump-audit.mjs'

const base = process.env.REVIEW_URL ?? 'http://localhost:4173/dizey/'

/** Every Mırtis svg that can be seen right now: not inert, not hidden, not transparent. The flyer is marked `fly`. */
const catSample = () => {
  const out = []
  for (const el of document.querySelectorAll('svg.mirtis')) {
    if (el.closest('[inert]') && !el.closest('.sh-onb')) continue
    // A cat under the first-run scene's opaque paper is not seen.
    const cover = document.querySelector('.sh-onb')
    if (cover && !cover.contains(el) && Number(getComputedStyle(cover).opacity) > 0.98) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none') continue
    const r = el.getBoundingClientRect()
    if (r.width < 1 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue
    let o = 1
    for (let p = el; p && p !== document.documentElement; p = p.parentElement)
      o *= Number(getComputedStyle(p).opacity)
    // A perched cat rising from behind her card's edge is only seen above the edge line.
    const perch = el.closest('.mt-perch')
    if (perch) o *= Math.max(0, Math.min(1, (perch.getBoundingClientRect().bottom - r.top) / r.height))
    if (o < 0.05) continue
    out.push({ fly: el.classList.contains('mt-flyer'), x: r.x, y: r.y, w: r.width, h: r.height, o })
  }
  return out
}

export async function openFlightPage(browser, { reduced = false, fresh = false } = {}) {
  const page = await openAuditPage(browser, undefined, { fresh })
  await page.addInitScript(`window.__dzCats = ${catSample.toString()}`)
  if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' })
  return page
}

/**
 * Walks the chain and returns every frame's cats plus the frame index each hand-off starts at.
 * `end` is how the lesson is left: 'dock' ("Yola dön") or 'next' ("Sıradaki"). `keep(page, index, marks)` runs after
 * every filmed frame (the strips take their screenshots there).
 */
export async function runChain(
  page,
  { end = 'dock', lesson = '', keep = async () => {}, at = async () => {} } = {},
) {
  const cats = []
  const marks = {}
  hooks.onFrame = async (p, index) => {
    cats.push(await p.evaluate(() => window.__dzCats()))
    await keep(p, index, marks)
  }
  const frames = []
  /** Names the frame a hand-off starts at; `at` sees the page there (settled, before the tap). */
  const mark = async (name) => {
    marks[name] = cats.length
    await at(page, name)
  }
  const settle = () => film(page, frames)
  // Between hand-offs only the clock has to move: no frame is checked there, and sampling every frame of a whole
  // lesson walk is what made the gizli an chain run for minutes.
  let walking = false
  const step = () => (walking ? drive(page) : settle())
  try {
    await page.goto(lesson ? `${base}lesson/${lesson}` : base)
    await page.waitForFunction(() => window.__dzReview && window.__dzCats)
    await settle()
    await mark('greet')
    if (!lesson) {
      // Flight 1: the dock to the first card's greeting.
      await page.getByTestId('today-next').click()
      await settle()
    }
    await mark('walk')
    walking = true
    const primary = page.locator('.ls-dock:not(.ls-leaving) .sh-btn--primary')
    const finishing = async () =>
      (await primary.count()) > 0 && /bitir/.test((await primary.first().textContent()) ?? '')
    for (let n = 0; n < 80; n++) {
      if (await finishing()) break
      const options = page.locator('.ls-dock:not(.ls-leaving) .ls-opts .ex-opt:not([disabled])')
      if (await options.count()) {
        await options.last().click({ timeout: 2000 })
        await step()
        if (!(await page.locator('.ls-verdict').count())) {
          const soft = page.locator('.ls-dock:not(.ls-leaving) .sh-btn--soft:not([disabled])')
          if (await soft.count()) {
            await soft.first().click()
            await step()
          } else if (await options.count()) {
            await options.first().click()
            await step()
          }
        }
      } else if (await page.locator('.ls-keypad').count()) {
        await page.locator('.ls-key').first().click()
        await step()
        await page.locator('.ls-key--go').click()
        await step()
        if (!(await page.locator('.ls-verdict').count())) {
          await page.locator('.ls-dock:not(.ls-leaving) .sh-btn--soft:not([disabled])').first().click()
          await step()
        }
      }
      await primary.first().click({ timeout: 2000 })
      await step()
    }
    await primary.first().click()
    await step()
    // Flight 2: the gizli an's verdict (the one place a lesson ends on a verdict) to the lesson end.
    if (await page.locator('.ls-top__skip').count()) {
      for (let n = 0; n < 6 && !(await page.locator('.ls-verdict').count()); n++) {
        await page.locator('.ls-dock:not(.ls-leaving) .ls-opts .ex-opt:not([disabled])').first().click()
        await step()
      }
      walking = false
      await mark('finish')
      await primary.first().click()
      await step()
    } else {
      walking = false
      await mark('finish')
    }
    // Flight 3: the hero to the dock, or to the next lesson's greeting.
    await mark('close')
    if (end === 'next') await page.locator('.ls-end__next').click()
    else await page.locator('.ls-end__dock a').last().click()
    await settle()
    await mark('over')
  } finally {
    hooks.onFrame = null
  }
  return { cats, marks }
}

/** The single cat of each frame in a window as {x, y, w}, or null when there is not exactly one. */
export const track = (cats, from, to) =>
  cats
    .slice(from, to)
    .map((f) => (f.length === 1 ? { ...f[0], cx: f[0].x + f[0].w / 2, cy: f[0].y + f[0].h / 2 } : null))

/** Frame-to-frame travel above `limit` px (or a size change above 30 %) in a window of one-cat frames. */
export function jumps(cats, from, to, limit = 90) {
  const rows = track(cats, from, to)
  const out = []
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1]
    const b = rows[i]
    if (!a || !b) continue
    const move = Math.hypot(a.cx - b.cx, a.cy - b.cy)
    const grow = Math.abs(b.w / a.w - 1)
    if (move > limit || grow > 0.3)
      out.push({ frame: from + i, move: move.toFixed(1), grow: grow.toFixed(2) })
  }
  return out
}

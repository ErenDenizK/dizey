import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Page } from '@playwright/test'

/**
 * The walk's harness: seeding, real-tap navigation helpers and the measuring functions the guards share.
 * Every screen is reached by taps the way a person reaches it (no route jumps except where the manifest says so).
 */

export const channel = process.env.E2E_CHANNEL ?? 'production'
export const prefix = channel === 'production' ? '' : `${channel}:`

/** The size classes the walk measures, as the design names them (decision 0021). The CSS and TS constants are tested separately. */
export const SIZES = {
  'phone-390': { width: 390, height: 844 },
  'phone-320': { width: 320, height: 568 },
  'medium-820': { width: 820, height: 1180 },
  'expanded-1024': { width: 1024, height: 768 },
  'expanded-1180': { width: 1180, height: 820 },
  'expanded-1440': { width: 1440, height: 900 },
} as const
export type SizeName = keyof typeof SIZES

/** Declared measures, in px, written out here on purpose: the guard must not read them from the code it guards. */
export const MEASURE = {
  gutter: 16,
  page: 640,
  read: { medium: 640, expanded: 720 },
  stage: { medium: 640, expanded: 1120 },
}

export function sizeClassOf(width: number): 'compact' | 'medium' | 'expanded' {
  return width < 600 ? 'compact' : width < 1024 ? 'medium' : 'expanded'
}

export type Measure = 'page' | 'read' | 'stage'
export function declaredWidth(measure: Measure, width: number): number {
  const cls = sizeClassOf(width)
  if (cls === 'compact') return width - 2 * MEASURE.gutter
  const m = measure === 'page' ? MEASURE.page : MEASURE[measure][cls]
  return Math.min(m, width - 2 * MEASURE.gutter)
}

const lessonDir = path.resolve(import.meta.dirname, '../../src/content/lessons')
const matrices = [
  'm1-reading-a-matrix',
  'm2-matrix-types',
  'm4-matrix-arithmetic',
  'm5-matrix-product',
  'm3-trace',
]
function firstQuestionStep(id: string): string | null {
  const text = fs.readFileSync(path.join(lessonDir, `${id}.ts`), 'utf8')
  const match = text.match(/id: '([^']+)',\s*\n\s*kind: '(?:choice|keypad)'/)
  return match?.[1] ?? null
}
const doneRecord = (n: number) => ({ at: null, doneAt: 1700000000000 + n, answers: {} })

/** Four lessons done, the fifth (m3-trace) open at its first question, one wrong rehearsal answer in the mistake log. */
export function seed(): Record<string, unknown> {
  const lessons: Record<string, unknown> = {}
  matrices.slice(0, 4).forEach((id, n) => {
    lessons[id] = doneRecord(n)
  })
  const resumeAt = firstQuestionStep('m3-trace')
  lessons['m3-trace'] = { at: resumeAt, doneAt: null, answers: {} }
  // A second lesson that is open but not the next one: its tile opens a card, so the card shows "Devam et".
  lessons['m6-transpose'] = { at: firstQuestionStep('m6-transpose'), doneAt: null, answers: {} }
  return {
    'dizey.profile': { v: 1, name: 'Eren' },
    'dizey.lessons': lessons,
    'dizey.exam.outcomes': { 'v1-2024s-01': { correct: false, given: 'a', at: 1 } },
  }
}

/** A fixed clock: the daily question, the exam timer and every date on screen stay the same from run to run. */
export const FIXED_TIME = new Date('2026-11-03T10:00:00+03:00')

export async function prepare(page: Page, { onboarded = true }: { onboarded?: boolean } = {}) {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' })
  await page.clock.setFixedTime(FIXED_TIME)
  const data = seed()
  await page.addInitScript(
    ([p, state, skip]) => {
      if (localStorage.getItem('__seeded')) return
      localStorage.setItem('__seeded', '1')
      if (skip) localStorage.setItem(`${p}dizey.onboarding.safari`, '1')
      for (const [key, value] of Object.entries(state as Record<string, unknown>))
        localStorage.setItem(`${p}${key}`, JSON.stringify(value))
    },
    [prefix, data, onboarded] as const,
  )
}

export class Walk {
  constructor(readonly page: Page) {}

  get pane() {
    return '.sh-pane:not([inert])'
  }

  async settle(ms = 420) {
    await this.page.waitForTimeout(ms)
  }

  /** Loads the app from scratch on Yol (or Sen). */
  async fresh(tab: 'yol' | 'sen' = 'yol') {
    await this.page.goto('./')
    await this.page.getByRole('navigation', { name: 'Bölümler' }).waitFor({ timeout: 10_000 })
    if (tab === 'sen') {
      await this.page.getByRole('navigation', { name: 'Bölümler' }).getByText('Sen').click()
    }
    await this.settle(500)
  }

  async tap(selector: string, timeout = 3000): Promise<boolean> {
    try {
      await this.page.locator(selector).first().click({ timeout })
      return true
    } catch {
      return false
    }
  }

  /** Sen, then Ayarlar, with the labs revealed. */
  async openLabs() {
    await this.fresh('sen')
    if (!(await this.tap('[data-testid=open-settings]'))) throw new Error('no gear')
    await this.page.waitForURL(/settings/, { timeout: 6000 })
    await this.settle(1200)
    await this.revealLabs()
  }

  /** Holds the version line until the labs show (Ayarlar). */
  async revealLabs() {
    const foot = this.page.locator('[data-testid=version-foot]')
    await foot.scrollIntoViewIfNeeded()
    await this.settle(250)
    const box = await foot.boundingBox()
    if (!box) throw new Error('no version line')
    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await this.page.mouse.down()
    await this.page.waitForTimeout(1600)
    await this.page.mouse.up()
    await this.settle(500)
  }

  async scrollPane(to: 'top' | 'end') {
    await this.page.evaluate((where) => {
      const scroller = document.querySelector<HTMLElement>('.sh-pane:not([inert]) .dz-screen')
      if (scroller) scroller.scrollTo(0, where === 'top' ? 0 : scroller.scrollHeight)
    }, to)
    await this.settle(250)
  }

  async intoView(selector: string) {
    await this.page.evaluate((sel) => {
      document.querySelector(sel)?.scrollIntoView({ block: 'center' })
    }, selector)
    await this.settle(250)
  }

  /** Which kind of lesson step is showing. */
  async stepKind(): Promise<'end' | 'keypad' | 'choice' | 'plain'> {
    return this.page.evaluate(() => {
      if (document.querySelector('[data-testid=lesson-end]')) return 'end'
      if (document.querySelector('.ls-keypad')) return 'keypad'
      if (document.querySelector('.ex-opts')) return 'choice'
      return 'plain'
    })
  }

  /** Does one step of whatever is showing (answers a question, then moves on). */
  async advance() {
    const { page } = this
    const kind = await this.stepKind()
    if (kind === 'choice') {
      await page
        .locator('.ex-opts button:not([disabled])')
        .first()
        .click({ timeout: 1500 })
        .catch(() => {})
      await this.settle(220)
    }
    if (kind === 'keypad') {
      await page
        .locator('.ls-key:has-text("1")')
        .first()
        .click({ timeout: 1500 })
        .catch(() => {})
      await page
        .locator('.ls-key--go')
        .click({ timeout: 1500 })
        .catch(() => {})
      await this.settle(220)
    }
    const show = page.locator('button:has-text("Cevabı göster")')
    if (
      (await show.count()) &&
      (await show
        .first()
        .isVisible()
        .catch(() => false))
    ) {
      await show
        .first()
        .click({ timeout: 1500 })
        .catch(() => {})
      await this.settle(220)
    }
    await page
      .locator('.sh-btn--primary')
      .last()
      .click({ timeout: 2000 })
      .catch(() => {})
    await this.settle(320)
  }

  async advanceUntil(kind: 'keypad' | 'choice' | 'plain' | 'end', limit = 40) {
    for (let i = 0; i < limit; i++) {
      if ((await this.stepKind()) === kind) return true
      await this.advance()
    }
    return false
  }
}

/* ---- Measuring ---------------------------------------------------------------------------------------------- */

export type Box = { left: number; right: number; width: number; centre: number }

/** The box a surface's content occupies: the content box (inside padding) or the border box. */
export async function boxOf(page: Page, selector: string, kind: 'content' | 'border'): Promise<Box | null> {
  return page.evaluate(
    ([sel, how]) => {
      const el = [...document.querySelectorAll<HTMLElement>(sel)].find((e) => {
        const r = e.getBoundingClientRect()
        return r.width > 0 && r.height > 0
      })
      if (!el) return null
      const r = el.getBoundingClientRect()
      const s = getComputedStyle(el)
      const pl =
        how === 'content' ? Number.parseFloat(s.paddingLeft) + Number.parseFloat(s.borderLeftWidth) : 0
      const pr =
        how === 'content' ? Number.parseFloat(s.paddingRight) + Number.parseFloat(s.borderRightWidth) : 0
      const left = r.left + pl
      const right = r.right - pr
      return { left, right, width: right - left, centre: (left + right) / 2 }
    },
    [selector, kind] as const,
  )
}

export async function overflowsSideways(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const vw = window.innerWidth
    if (document.documentElement.scrollWidth > vw) return 'document'
    for (const el of document.querySelectorAll<HTMLElement>(
      '.dz-screen, .ls-run, .exr-frame, .sh-overlay__content',
    )) {
      if (el.getBoundingClientRect().width > 0 && el.scrollWidth > el.clientWidth + 1)
        return `${el.className} ${el.scrollWidth}>${el.clientWidth}`
    }
    return null
  })
}

/** The longest rendered text line (characters) among the visible text under `root`. */
export async function longestLine(page: Page, root: string): Promise<number> {
  return page.evaluate((sel) => {
    const host = document.querySelector(sel)
    if (!host) return 0
    let longest = 0
    const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? ''
      if (text.trim().length < 60) continue
      const parent = node.parentElement
      if (!parent || getComputedStyle(parent).visibility === 'hidden') continue
      const range = document.createRange()
      const lines = new Map<number, number>()
      for (let i = 0; i < text.length; i++) {
        range.setStart(node, i)
        range.setEnd(node, i + 1)
        const rect = range.getClientRects()[0]
        if (!rect || rect.width === 0) continue
        const key = Math.round(rect.top / 4)
        lines.set(key, (lines.get(key) ?? 0) + 1)
      }
      for (const count of lines.values()) longest = Math.max(longest, count)
    }
    return longest
  }, root)
}

/** Reads pixels out of a PNG inside the page (no image dependency in the test runner). */
export async function readPixels(
  page: Page,
  png: Buffer,
  points: readonly (readonly [number, number])[],
): Promise<number[][]> {
  return page.evaluate(
    async ([b64, pts]) => {
      const img = new Image()
      img.src = `data:image/png;base64,${b64}`
      await img.decode()
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return []
      ctx.drawImage(img, 0, 0)
      return (pts as number[][]).map(([x, y]) => [...ctx.getImageData(x as number, y as number, 1, 1).data])
    },
    [png.toString('base64'), points.map((p) => [...p])] as const,
  )
}

/** The page colour as it paints: a one-pixel probe in `var(--bg)` at the top left of the window. */
export async function withProbe<T>(page: Page, token: string, run: () => Promise<T>): Promise<T> {
  await page.evaluate((t) => {
    const probe = document.createElement('div')
    probe.id = '__probe'
    probe.style.cssText = `position:fixed;left:0;top:0;width:4px;height:4px;z-index:2147483647;background:var(${t})`
    document.body.append(probe)
  }, token)
  try {
    return await run()
  } finally {
    await page.evaluate(() => document.getElementById('__probe')?.remove())
  }
}

/* ---- Phone layout snapshot -------------------------------------------------------------------------------------- */

export type LayoutNode = {
  key: string
  rect: [number, number, number, number]
  style: Record<string, string>
}

/** Always left out of a snapshot: values that change with the build or the clock. */
const VOLATILE = [
  '[data-testid=version-foot]',
  '[data-testid=app-version]',
  'time',
  // A looping ambient pulse: its rect and opacity depend on the instant the snapshot is taken.
  '.ls-end__halo',
]

/**
 * Every visible element in DOM order: a tag + test id or class key, its rect rounded to 0.5 px and the computed styles
 * that make a screen look the way it does. Text pixels are not compared, so it is the same on every rasteriser.
 */
export async function layoutSnapshot(page: Page, skip: string[] = []): Promise<LayoutNode[]> {
  // Springs settle at slightly different instants: read until two reads 150 ms apart agree (at most 10 tries).
  let last = await readLayout(page, skip)
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(150)
    const next = await readLayout(page, skip)
    if (JSON.stringify(next) === JSON.stringify(last)) return next
    last = next
  }
  return last
}

async function readLayout(page: Page, skip: string[]): Promise<LayoutNode[]> {
  return page.evaluate(
    ({ skipSelectors }) => {
      const half = (n: number) => Math.round(n * 2) / 2
      const props = ['color', 'background-color', 'font-size', 'font-weight', 'border-radius', 'opacity']
      const out: { key: string; rect: [number, number, number, number]; style: Record<string, string> }[] = []
      const skipped = (el: Element) => skipSelectors.some((s) => el.closest(s))
      for (const el of Array.from(document.body.querySelectorAll('*'))) {
        if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue
        if (['SCRIPT', 'STYLE', 'LINK', 'META', 'TEMPLATE'].includes(el.tagName)) continue
        if (skipped(el)) continue
        const cs = getComputedStyle(el)
        if (cs.display === 'none' || cs.visibility === 'hidden') continue
        const r = el.getBoundingClientRect()
        if (r.width === 0 && r.height === 0) continue
        const testId = el.getAttribute('data-testid')
        const cls = (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean).join('.')
        const key = el.tagName.toLowerCase() + (testId ? `[${testId}]` : cls ? `.${cls}` : '')
        const style: Record<string, string> = {}
        for (const p of props) style[p] = cs.getPropertyValue(p)
        // A spring that has not finished its last 0.1% would make opacity differ by the instant of the read.
        style.opacity = (Math.round(Number(style.opacity) * 10) / 10).toString()
        out.push({ key, rect: [half(r.left), half(r.top), half(r.width), half(r.height)], style })
      }
      return out
    },
    { skipSelectors: [...VOLATILE, ...skip] },
  )
}

const BASELINES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'baselines')

/** Compare with e2e/wide-walk/baselines/<name>.json, or write it when UPDATE_LAYOUT=1. Returns a diff summary or null. */
export function compareLayout(name: string, nodes: LayoutNode[]): string | null {
  const file = path.join(BASELINES, `${name}.json`)
  const json = `${JSON.stringify(nodes, null, 1)}\n`
  if (process.env.UPDATE_LAYOUT === '1') {
    fs.mkdirSync(BASELINES, { recursive: true })
    fs.writeFileSync(file, json)
    return null
  }
  if (!fs.existsSync(file)) return `no baseline ${name}.json (run with UPDATE_LAYOUT=1)`
  const want = JSON.parse(fs.readFileSync(file, 'utf8')) as LayoutNode[]
  const same = JSON.stringify(want) === JSON.stringify(nodes)
  if (same) return null
  const i = want.findIndex((w, k) => JSON.stringify(w) !== JSON.stringify(nodes[k]))
  const at = i === -1 ? want.length : i
  return `layout differs from ${name}.json (${nodes.length} elements, baseline ${want.length}); first at #${at}: got ${JSON.stringify(nodes[at])} want ${JSON.stringify(want[at])}`
}

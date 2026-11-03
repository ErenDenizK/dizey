import fs from 'node:fs'
import path from 'node:path'
import { expect, type Page, test } from '@playwright/test'
import {
  boxOf,
  declaredWidth,
  longestLine,
  overflowsSideways,
  prepare,
  readPixels,
  SIZES,
  type SizeName,
  sizeClassOf,
  Walk,
  withProbe,
} from './wide-walk/harness'
import { type Entry, manifest } from './wide-walk/manifest'

/**
 * The wide walk: every screen and overlay of the app, reached by real taps, measured at four wide sizes and compared
 * with the phone's baselines at 390 and 320 px. One browser context per size, navigation reused where screens chain.
 * Lessons: docs/lessons.md, "Widescreen 0.62.0 shipped broken". A new screen goes into e2e/wide-walk/manifest.ts.
 *
 * Wide sizes assert (1) the content column is centred on the window centre (1 px), (2) it has the declared measure,
 * (3) nothing scrolls sideways, (4) dialogs sit under a full-window scrim with nothing above it and close on Escape and an
 * outside tap, (5) the window edges are the surface colour (no bars), (6) no text line passes 80 characters, (7) the side
 * column is in the flow. Phone sizes compare screenshots with baselines rendered from main before the layout work
 * (maxDiffPixels 0).
 */

const DESKTOP_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const IPAD_UA =
  'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const SHOTS = process.env.WIDE_SHOTS_DIR

const WIDE: SizeName[] = ['medium-820', 'expanded-1024', 'expanded-1180', 'expanded-1440']
const PHONE: SizeName[] = ['phone-390', 'phone-320']

test.skip(
  ({ browserName }) => browserName !== 'chromium',
  'Chromium only: baselines and pixel reads are Chromium renders',
)
test.describe.configure({ mode: 'parallel' })

for (const size of [...WIDE, ...PHONE]) {
  const { width, height } = SIZES[size]
  const phone = PHONE.includes(size)
  test.describe(size, () => {
    test.use({
      viewport: { width, height },
      deviceScaleFactor: 1,
      isMobile: phone,
      hasTouch: phone,
      userAgent: phone ? undefined : DESKTOP_UA,
      locale: 'tr-TR',
      timezoneId: 'Europe/Istanbul',
    })

    test(`walk every screen at ${width} x ${height}`, async ({ page }) => {
      test.setTimeout(240_000)
      await prepare(page)
      page.setDefaultTimeout(5000)
      const walk = new Walk(page)
      const problems: string[] = []
      const entries = manifest.filter((e) => (size === 'phone-320' ? e.small : true))
      let n = 0
      for (const entry of entries) {
        n++
        const note = (msg: string) => problems.push(`[${size}] ${entry.id}: ${msg}`)
        try {
          await entry.reach(walk)
        } catch (error) {
          note(`could not be reached: ${(error as Error).message.split('\n')[0]}`)
          continue
        }
        if (phone) {
          await phoneShot(page, size, entry, note)
          // A phone's sheet closes on Escape too, or on a tap on the dimmed screen above it.
          if (entry.dialog && !(await closeWithEscape(page, entry))) await page.mouse.click(6, 6)
          if (entry.dialog) await page.waitForTimeout(700)
        } else {
          await wideChecks(page, size, entry, n, note)
        }
      }
      expect(problems, problems.join('\n')).toEqual([])
    })
  })
}

/* ---- Phone: pixel-identical to the baselines rendered from main ----------------------------------------------- */

async function phoneShot(page: Page, size: SizeName, entry: Entry, note: (msg: string) => void) {
  try {
    await expect(page).toHaveScreenshot(`${size}-${entry.id}.png`, {
      maxDiffPixels: 0,
      mask: (entry.mask ?? []).map((selector) => page.locator(selector)),
      ...(entry.clipTop
        ? { clip: { x: 0, y: entry.clipTop, width: SIZES[size].width, height: SIZES[size].height - entry.clipTop } }
        : {}),
      animations: 'disabled',
      caret: 'hide',
    })
  } catch (error) {
    note(`phone screenshot differs: ${(error as Error).message.split('\n')[0]}`)
  }
}

/* ---- Wide: geometry, dialogs, edges, lines ---------------------------------------------------------------------- */

async function wideChecks(page: Page, size: SizeName, entry: Entry, n: number, note: (msg: string) => void) {
  const { width, height } = SIZES[size]
  const cls = sizeClassOf(width)
  const boxKind = entry.box ?? 'content'

  // (1) + (2): one axis, declared measure.
  const box = await boxOf(page, entry.primary, boxKind)
  if (!box) {
    note(`no visible ${entry.primary}`)
  } else {
    if (Math.abs(box.centre - width / 2) > 1)
      note(`content centre ${box.centre.toFixed(1)} is off the window centre ${width / 2}`)
    const want = declaredWidth(entry.measure, width)
    if (Math.abs(box.width - want) > 1)
      note(`content width ${box.width.toFixed(1)} should be ${want} (${entry.measure}, ${cls})`)
  }

  // (3): nothing scrolls sideways.
  const sideways = await overflowsSideways(page)
  if (sideways) note(`horizontal overflow: ${sideways}`)

  // (6): no line over 80 characters.
  const line = await longestLine(page, entry.primary)
  if (line > 80) note(`a text line has ${line} characters`)

  // (7): the side column is in flow.
  if (entry.side && cls === 'expanded') {
    const side = await page.evaluate((sel) => {
      const el = document.querySelector<HTMLElement>(sel)
      if (!el) return null
      const style = getComputedStyle(el)
      return {
        position: style.position,
        overflowY: style.overflowY,
        scrolls: el.scrollHeight > el.clientHeight + 1,
      }
    }, entry.side)
    if (!side) note(`no side column ${entry.side}`)
    else {
      if (!['static', 'sticky', 'relative'].includes(side.position)) note(`side column is ${side.position}`)
      if (side.overflowY !== 'visible' || side.scrolls) note('side column is a scroll container')
    }
  }

  // (4) + (5): edges and scrim, then one screenshot read for the pixels.
  const png = await withProbe(page, entry.bg ?? '--bg', () => page.screenshot())
  if (SHOTS) {
    fs.mkdirSync(SHOTS, { recursive: true })
    fs.writeFileSync(path.join(SHOTS, `${size}-${String(n).padStart(2, '0')}-${entry.id}.png`), png)
  }
  const ys = [0.3, 0.5, 0.7].map((f) => Math.round(height * f))
  const points = ys.flatMap((y) =>
    [y, y + 1, y + 2].flatMap((yy) => [
      [2, yy],
      [width - 3, yy],
    ]),
  ) as [number, number][]
  const px = await readPixels(page, png, [[1, 1], ...points])
  const expected = px[0]
  const near = (a: number[] | undefined, b: number[] | undefined, tol = 3) =>
    !!a && !!b && [0, 1, 2].every((i) => Math.abs((a[i] ?? 0) - (b[i] ?? 0)) <= tol)
  // Per row of three samples, two must agree (a grid line may cross one).
  for (let r = 0; r < ys.length; r++) {
    const slice = px.slice(1 + r * 6, 1 + r * 6 + 6)
    const left = slice.filter((_, i) => i % 2 === 0)
    const right = slice.filter((_, i) => i % 2 === 1)
    const vote = (list: number[][], want: number[] | undefined) =>
      list.filter((c) => near(c, want)).length >= 2
    if (entry.dialog) {
      if (!near(left[0], right[0], 2)) note(`edge pixels differ at y=${ys[r]}: ${left[0]} vs ${right[0]}`)
    } else if (!vote(left, expected) || !vote(right, expected)) {
      note(`edge pixels at y=${ys[r]} are ${left[0]} / ${right[0]}, not the surface colour ${expected}`)
    }
  }

  if (entry.dialog) {
    const hits = await page.evaluate(
      ([w, h, dialog]) => {
        const pts: [string, number, number][] = [
          ['top-left', 4, 4],
          ['top-right', w - 4, 4],
          ['bottom-left', 4, h - 4],
          ['bottom-right', w - 4, h - 4],
        ]
        const bar = document.querySelector('.dz-tabbar')?.getBoundingClientRect()
        if (bar && bar.width > 0 && bar.bottom <= h)
          pts.push(['tab-bar', bar.left + bar.width / 2, bar.top + bar.height / 2])
        // The side card and the cat on its edge are content like any other: the scrim covers them too.
        for (const el of document.querySelectorAll('.ph-dock, .me-aside')) {
          const r = el.getBoundingClientRect()
          if (r.width > 0 && r.height > 0) {
            pts.push(['side-card', r.left + r.width / 2, r.top + r.height / 2])
            pts.push(['side-card-edge', r.right - 28, r.top - 14])
          }
        }
        // Whatever is on top at a point is the scrim or the dialog itself: never the tab bar, a side card or the screen.
        return pts.map(([name, x, y]) => {
          const hit = document.elementFromPoint(x, y)
          return { name, scrim: !!hit?.closest('.dz-scrim') || !!hit?.closest(dialog) }
        })
      },
      [width, height, entry.primary] as const,
    )
    for (const hit of hits) if (!hit.scrim) note(`the scrim does not cover ${hit.name}`)

    // Escape closes it; an outside tap closes it again after it is reopened.
    if (!(await closeWithEscape(page, entry))) note('Escape does not close it')
    try {
      await entry.reach(new Walk(page))
      await page.mouse.click(6, 6)
      await page.waitForTimeout(700)
      if (await visible(page, entry.primary)) note('an outside tap does not close it')
    } catch (error) {
      note(`could not reopen it for the outside tap: ${(error as Error).message.split('\n')[0]}`)
    }
    if (await visible(page, entry.primary)) await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  }
}

async function visible(page: Page, selector: string) {
  return page.evaluate(
    (sel) =>
      [...document.querySelectorAll<HTMLElement>(sel)].some((el) => {
        const r = el.getBoundingClientRect()
        return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
      }),
    selector,
  )
}

async function closeWithEscape(page: Page, entry: Entry): Promise<boolean> {
  // Focus is in the dialog when it opened; click nothing, just press the key.
  await page.keyboard.press('Escape')
  await page.waitForTimeout(700)
  return !(await visible(page, entry.primary))
}

/* ---- Onboarding (iPad Safari, not installed) ------------------------------------------------------------------ */

for (const size of WIDE) {
  const { width, height } = SIZES[size]
  test.describe(`${size} onboarding`, () => {
    test.use({
      viewport: { width, height },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: true,
      userAgent: IPAD_UA,
      locale: 'tr-TR',
      timezoneId: 'Europe/Istanbul',
    })
    test(`onboarding is one centred page column at ${width} x ${height}`, async ({ page }) => {
      await prepare(page, { onboarded: false })
      await page.goto('./')
      await page.locator('.sh-onb').waitFor({ timeout: 10_000 })
      await page.waitForTimeout(500)
      const box = await boxOf(page, '.sh-onb', 'content')
      expect(box, 'onboarding is visible').not.toBeNull()
      expect(Math.abs((box?.centre ?? 0) - width / 2)).toBeLessThanOrEqual(1)
      expect(Math.abs((box?.width ?? 0) - Math.min(640, width - 32))).toBeLessThanOrEqual(1)
      expect(await overflowsSideways(page)).toBeNull()
      const png = await withProbe(page, '--sh-bg', () => page.screenshot())
      if (SHOTS) {
        fs.mkdirSync(SHOTS, { recursive: true })
        fs.writeFileSync(path.join(SHOTS, `${size}-00-onboarding.png`), png)
      }
      const [want, left, right] = await readPixels(page, png, [
        [1, 1],
        [2, Math.round(height / 2)],
        [width - 3, Math.round(height / 2)],
      ])
      for (const edge of [left, right])
        for (let i = 0; i < 3; i++)
          expect(Math.abs((edge?.[i] ?? 0) - (want?.[i] ?? 0))).toBeLessThanOrEqual(3)
    })
  })
}

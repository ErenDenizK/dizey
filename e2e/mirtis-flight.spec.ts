import { expect, test } from '@playwright/test'
// @ts-expect-error: a plain ESM script shared with the review tooling (scripts/flight-flows.mjs)
import { jumps, openFlightPage, runChain } from '../scripts/flight-flows.mjs'

/**
 * Guard for Mırtis's hand-off flights (decision 0017, "Hand-offs"; src/character/flight.ts). Filmed on the engine's
 * virtual clock, frame by frame: through each hand-off there is exactly one cat on screen in every frame (never zero,
 * never two), nothing steps by more than one frame's honest travel, and the flyer is gone once she has landed.
 * Under reduced motion nothing flies: a short crossfade, so at most two cats for a few frames and never none.
 */
type Cat = { fly: boolean; x: number; y: number; w: number; h: number; o: number }
type Marks = Record<'greet' | 'walk' | 'finish' | 'close' | 'over', number>

test.describe('Mırtis hand-off flights', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'the virtual clock walk is engine-level')
  test.setTimeout(300_000)

  const oneCat = (cats: Cat[][], from: number, to: number) =>
    cats
      .slice(from, to)
      .flatMap((frame, at) => (frame.length === 1 ? [] : [`f${from + at}: ${frame.length} cats`]))
  const flew = (cats: Cat[][], from: number, to: number) =>
    cats.slice(from, to).filter((frame) => frame.some((cat) => cat.fly)).length

  test('dock to the greeting, and the hero back to the dock', async ({ browser }) => {
    const page = await openFlightPage(browser)
    const { cats, marks } = (await runChain(page, { end: 'dock' })) as { cats: Cat[][]; marks: Marks }
    // Flight 1: from the tap on "Başla" to the greeting, one cat in every frame, a real flight, a clean landing.
    expect(oneCat(cats, marks.greet, marks.walk)).toEqual([])
    expect(flew(cats, marks.greet, marks.walk)).toBeGreaterThan(10)
    expect(cats[marks.walk - 1]?.some((cat) => cat.fly)).toBe(false)
    expect(jumps(cats, marks.greet, marks.walk)).toEqual([])
    await expect(page.locator('.mt-flyer')).toHaveCount(0)
    // Flight 3: "Yola dön" lands her on the dock's card; no cat is ever missing on the way.
    expect(oneCat(cats, marks.close, marks.over)).toEqual([])
    expect(flew(cats, marks.close, marks.over)).toBeGreaterThan(10)
    expect(jumps(cats, marks.close, marks.over)).toEqual([])
    const last = cats[marks.over - 1] as Cat[]
    expect(last.map((cat) => cat.fly)).toEqual([false])
    expect(last[0]?.w).toBeGreaterThanOrEqual(70)
    await page.context().close()
  })

  test('the gizli an verdict to the lesson end, and the hero back to the dock', async ({ browser }) => {
    const page = await openFlightPage(browser)
    const { cats, marks } = (await runChain(page, { lesson: 'd1-determinant' })) as {
      cats: Cat[][]
      marks: Marks
    }
    // Flight 2: from the last verdict's tap to the end screen the hero's rect, one cat per frame.
    expect(oneCat(cats, marks.finish, marks.close)).toEqual([])
    expect(flew(cats, marks.finish, marks.close)).toBeGreaterThan(10)
    expect(cats[marks.close - 1]?.some((cat) => cat.fly)).toBe(false)
    expect(cats[marks.close - 1]?.[0]?.w).toBeGreaterThanOrEqual(110)
    expect(jumps(cats, marks.finish, marks.close)).toEqual([])
    expect(oneCat(cats, marks.close, marks.over)).toEqual([])
    await expect(page.locator('.mt-flyer')).toHaveCount(0)
    await page.context().close()
  })

  test('"Sıradaki" flies the hero to the next lesson\'s greeting', async ({ browser }) => {
    const page = await openFlightPage(browser)
    const { cats, marks } = (await runChain(page, { end: 'next' })) as { cats: Cat[][]; marks: Marks }
    expect(oneCat(cats, marks.close, marks.over)).toEqual([])
    expect(flew(cats, marks.close, marks.over)).toBeGreaterThan(10)
    expect(jumps(cats, marks.close, marks.over)).toEqual([])
    const last = cats[marks.over - 1] as Cat[]
    expect(last.map((cat) => cat.fly)).toEqual([false])
    // The greeting's 56 px cat on the first card's top edge, not the dock's.
    expect(last[0]?.w).toBeLessThan(60)
    await page.context().close()
  })

  test('reduced motion: a crossfade, never a cut and never a flight', async ({ browser }) => {
    const page = await openFlightPage(browser, { reduced: true })
    const { cats, marks } = (await runChain(page, { lesson: 'd1-determinant' })) as {
      cats: Cat[][]
      marks: Marks
    }
    for (const [from, to] of [
      [marks.finish, marks.close],
      [marks.close, marks.over],
    ] as const) {
      const counts = cats.slice(from, to).map((frame) => frame.length)
      expect(Math.min(...counts)).toBe(1)
      expect(Math.max(...counts)).toBeLessThanOrEqual(2)
      // The flyer never travels: wherever it shows, it stands where the cat was.
      const xs = cats
        .slice(from, to)
        .flatMap((frame) => frame.filter((cat) => cat.fly).map((cat) => Math.round(cat.x)))
      expect(new Set(xs).size).toBeLessThanOrEqual(1)
    }
    expect(cats[marks.over - 1]?.map((cat) => cat.fly)).toEqual([false])
    await page.context().close()
  })

  test('a tap during a flight lands her at once', async ({ browser }) => {
    const page = await openFlightPage(browser)
    await page.goto('./')
    await page.waitForFunction(() => '__dzReview' in window)
    await page.evaluate(() =>
      (window as unknown as { __dzReview: { review: { step: (n: number) => void } } }).__dzReview.review.step(
        1500,
      ),
    )
    await page.getByTestId('today-next').click()
    // Step into the flight itself (the flyer waits for the lesson, then flies), then tap.
    for (let i = 0; i < 80 && !(await page.locator('.mt-flyer').count()); i++) await page.waitForTimeout(10)
    await expect(page.locator('.mt-flyer')).toHaveCount(1)
    const step = (n: number) =>
      page.evaluate(
        (ms: number) =>
          (
            window as unknown as { __dzReview: { review: { step: (n: number) => void } } }
          ).__dzReview.review.step(ms),
        n,
      )
    await step(420)
    await page.evaluate(() => document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })))
    await step(16)
    await expect(page.locator('.mt-flyer')).toHaveCount(0)
    await page.context().close()
  })
})

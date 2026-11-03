import { expect, test } from '@playwright/test'
// @ts-expect-error: a plain ESM script shared with the review tooling (scripts/flight-flows.mjs)
import { jumps, openFlightPage } from '../scripts/flight-flows.mjs'
// @ts-expect-error: a plain ESM script shared with the review tooling (scripts/jump-audit.mjs)
import { film, hooks, onboardingFlows, openAuditPage, shellJumps, shellTap } from '../scripts/jump-audit.mjs'

/**
 * PR-16 guard for the first-run scene: on a fresh install, the story to the hand-off flight, the wrong-answer path
 * and the skip never make anything appear, vanish or jump in one frame (scripts/onboarding-audit.mjs runs them on
 * demand). Filmed on the engine's virtual clock, one 60 Hz frame at a time.
 */
test.describe('first-run scene: nothing appears, vanishes or jumps in one frame', () => {
  // A fresh install: the config's "already onboarded" storage is dropped (it also reaches `browser.newContext`).
  test.use({ storageState: { cookies: [], origins: [] } })
  test.skip(({ browserName }) => browserName !== 'chromium', 'the virtual clock walk is engine-level')
  test.setTimeout(300_000)

  for (const name of Object.keys(onboardingFlows)) {
    test(name, async ({ browser, baseURL }) => {
      const page = await openAuditPage(browser, undefined, { fresh: true })
      await page.goto(baseURL ?? './')
      await page.waitForFunction(() => '__dzReview' in window && '__dzSample' in window)
      const frames: unknown[] = []
      await film(page, frames)
      const { tap, scrolled } = shellTap(page, frames)
      await onboardingFlows[name]({ tap, page })
      type Jump = { frame: number; kind: string; cls: string; text: string; delta: string }
      // The hand-off swaps the scene's cat for the flyer at the same rect in one frame (flight.ts, by design): the cat's
      // own continuity is guarded by the one-cat test below.
      const swap = /onb-cat>svg|mt-flight>svg/
      const found = (shellJumps(frames, scrolled) as Jump[])
        .filter((j) => !swap.test(j.cls))
        .map((j) => `f${j.frame} ${j.kind} ${j.delta} .${j.cls} "${j.text}"`)
      expect(frames.length, `${name} filmed`).toBeGreaterThan(100)
      expect(found).toEqual([])
      await expect(page.locator('.sh-onb')).toHaveCount(0)
      await page.context().close()
    })
  }

  test('one cat in every frame, and the hand-off flight is one clean hop to the dock', async ({
    browser,
    baseURL,
  }) => {
    type Cat = { fly: boolean; x: number; y: number; w: number; h: number; o: number }
    const page = await openFlightPage(browser, { fresh: true })
    const cats: Cat[][] = []
    hooks.onFrame = async (p: import('@playwright/test').Page) => {
      cats.push(await p.evaluate(() => (window as unknown as { __dzCats: () => Cat[] }).__dzCats()))
    }
    await page.goto(baseURL ?? './')
    await page.waitForFunction(() => '__dzReview' in window && '__dzCats' in window)
    const frames: unknown[] = []
    const tap = async (selector: string) => {
      await page.locator(selector).first().click({ timeout: 3000 })
      await film(page, frames)
    }
    await film(page, frames)
    await tap('.onb-wake')
    await tap('button:has-text("Tanışalım")')
    await tap('[data-testid="onb-choice-2"]')
    await tap('button:has-text("Devam")')
    const start = cats.length
    await tap('button:has-text("Yola çık")')
    hooks.onFrame = null

    // From the first frame she is seen, never none and never two.
    const seen = cats.findIndex((frame) => frame.length > 0)
    const wrong = cats.flatMap((frame, i) =>
      i >= seen && frame.length !== 1 ? [`f${i}: ${frame.length} cats`] : [],
    )
    expect(wrong).toEqual([])
    expect(cats.slice(start).filter((frame) => frame.some((cat) => cat.fly)).length).toBeGreaterThan(10)
    expect(jumps(cats, start, cats.length)).toEqual([])
    const last = cats[cats.length - 1] as Cat[]
    expect(last.map((cat) => cat.fly)).toEqual([false])
    expect(last[0]?.w).toBeGreaterThanOrEqual(70)
    await expect(page.locator('.mt-flyer')).toHaveCount(0)
    await page.context().close()
  })
})

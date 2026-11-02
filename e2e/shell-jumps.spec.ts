import { expect, test } from '@playwright/test'
// @ts-expect-error: a plain ESM script shared with the review tooling (scripts/jump-audit.mjs)
import { film, openAuditPage, shellFlows, shellJumps, shellTap, walkLesson } from '../scripts/jump-audit.mjs'

/**
 * PR-16 guard for the menus: with real progress (one lesson walked, so a rozet and mistakes exist), the
 * tab switch, opening and closing a rozet and the mistake book's groups never make anything appear,
 * vanish or jump in one frame (scripts/shell-audit.mjs runs these and the remaining flows on demand).
 */
const FLOWS = ['tabs', 'rozet', 'mistakes']

test('menus: nothing appears, vanishes or jumps in one frame', async ({ browser, browserName }) => {
  test.skip(browserName !== 'chromium', 'the virtual clock walk is engine-level; one engine is enough')
  test.setTimeout(300_000)
  const page = await openAuditPage(browser)
  await walkLesson(page, 'm1-reading-a-matrix', [])
  const found: string[] = []
  const home = new URL('../', page.url()).href
  for (const name of FLOWS) {
    await page.goto(home)
    await page.waitForFunction(() => '__dzReview' in window && '__dzSample' in window)
    const frames: unknown[] = []
    await film(page, frames)
    const start = frames.length
    const { tap, scrolled } = shellTap(page, frames)
    await shellFlows[name]({ tap, page })
    type Jump = { frame: number; kind: string; cls: string; text: string; delta: string }
    for (const j of shellJumps(frames, scrolled) as Jump[])
      if (j.frame > start) found.push(`${name} f${j.frame} ${j.kind} ${j.delta} .${j.cls} "${j.text}"`)
    expect(frames.length - start, `${name} filmed`).toBeGreaterThan(40)
  }
  expect(found).toEqual([])
  await page.context().close()
})

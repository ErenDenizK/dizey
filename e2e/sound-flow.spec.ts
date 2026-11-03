import { expect, test } from '@playwright/test'

/**
 * Sound flow guard: a scripted 70 s session (lesson open, ten steps, six taps within a second, a
 * select/land/merge burst, wrong, correct, streak, halfway, the lesson end, then home music) is
 * rendered offline through the real synth and conductor (src/sound/measure.ts renderSession):
 * - no click anywhere: the largest 4th difference stays 40 dB under the peak;
 * - no dropout in the music: its 50 ms RMS, rendered alone, never falls 30 dB under its running
 *   median outside the windows where a reward or the lesson end has the floor.
 */
type Session = {
  clickDb: number
  peakDb: number
  dropouts: { at: number; db: number; median: number }[]
  windows: [number, number][]
}

test('a whole session has no click and no music dropout', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'offline rendering is engine-independent; one engine is enough')
  test.setTimeout(180_000)
  await page.goto('./lab/sounds')
  await page.waitForFunction(() => (window as unknown as { __dzMeasure?: unknown }).__dzMeasure)
  const session = await page.evaluate(async () => {
    const m = (window as unknown as { __dzMeasure: { renderSession: () => Promise<Session> } }).__dzMeasure
    return m.renderSession()
  })
  expect(session.windows.length).toBeGreaterThanOrEqual(2)
  expect(session.clickDb).toBeLessThanOrEqual(-40)
  expect(session.dropouts).toEqual([])
})

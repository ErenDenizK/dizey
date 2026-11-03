import { expect, test } from '@playwright/test'

/**
 * Sound flow guard: a scripted 70 s session (lesson open, ten steps, six taps within a second, a
 * select/land/merge burst, wrong, correct, streak, halfway, the lesson end, then home music) is
 * rendered offline through the real synth and conductor (src/sound/measure.ts renderSession):
 * - no click anywhere: the largest 4th difference stays 40 dB under the peak;
 * - no dropout in the music: its 50 ms RMS, rendered alone (ducked under the cues as in the app), never
 *   falls 30 dB under its running median anywhere, the halfway reward and the lesson end included: the
 *   music never stops for a recorded cue (decision 0020), it only ducks and rests its melody.
 */
type Session = {
  clickDb: number
  peakDb: number
  dropouts: { at: number; db: number; median: number }[]
  worstDipDb: number
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
  expect(session.clickDb).toBeLessThanOrEqual(-40)
  expect(session.dropouts).toEqual([])
  // Strict: the music's quietest 50 ms never sinks more than 20 dB under its running median, cues included.
  expect(session.worstDipDb).toBeGreaterThanOrEqual(-20)
})

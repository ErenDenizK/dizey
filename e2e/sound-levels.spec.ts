import { expect, test } from '@playwright/test'

/**
 * Sound level guard: renders every sound offline (src/sound/measure.ts, exposed by the sound lab) and
 * holds the bar the instrument was calibrated to:
 * - loudness: each event within 1.5 LU of its target in score.ts (the TRIM table still fits the synth);
 * - headroom: no peak above -6 dBFS at the normal level, so the limiter never squashes a sound;
 * - clicks: no sample step within 40 dB of the peak (an unsmoothed start or stop shows near 0 dB);
 * - heard over the music: every sound stands at least 3 LU over the lesson music at its loudest, once
 *   the music has ducked by that sound's tier (synth.ts MUSIC_DUCK), so the music never masks it.
 * Default palette only: the others share the calibration code path and cost three times the time.
 */
type Row = { event: string; tier: string; target: number; loudness: number; peakDb: number; clickDb: number }
type Measurer = {
  EVENTS: Record<string, { loudness: number; tier: string }>
  MUSIC_DUCK: Record<string, number>
  measure: (event: string, options: object) => Promise<{ loudness: number; peakDb: number; clickDb: number }>
  measureLessonMusic: (palette: string, masterDb: number) => Promise<{ loudness: number }>
}

test('every sound meets its loudness, headroom and click bar, and the music stays under them', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'offline rendering is engine-independent; one engine is enough')
  test.setTimeout(180_000)
  await page.goto('./lab/sounds')
  await page.waitForFunction(() => (window as unknown as { __dzMeasure?: unknown }).__dzMeasure)
  const { rows, duck, music } = await page.evaluate(async () => {
    const m = (window as unknown as { __dzMeasure: Measurer }).__dzMeasure
    const rows: Row[] = []
    for (const [event, spec] of Object.entries(m.EVENTS)) {
      const level = await m.measure(event, { masterDb: 0 })
      const normal = await m.measure(event, {})
      rows.push({
        event,
        tier: spec.tier,
        target: spec.loudness,
        loudness: level.loudness,
        peakDb: normal.peakDb,
        clickDb: normal.clickDb,
      })
    }
    return { rows, duck: m.MUSIC_DUCK, music: (await m.measureLessonMusic('rhodes', 0)).loudness }
  })
  expect(rows.length).toBeGreaterThanOrEqual(19)
  const off = rows.filter((r) => Math.abs(r.loudness - r.target) > 1.5)
  expect(off.map((r) => `${r.event}: ${r.loudness} LUFS, target ${r.target}`)).toEqual([])
  expect(rows.filter((r) => r.peakDb > -6).map((r) => `${r.event}: peak ${r.peakDb} dBFS`)).toEqual([])
  expect(rows.filter((r) => r.clickDb > -40).map((r) => `${r.event}: click ${r.clickDb} dB`)).toEqual([])
  const masked = rows.filter((r) => r.loudness - (music + (duck[r.tier] ?? 0)) < 3)
  expect(
    masked.map((r) => `${r.event}: ${r.loudness} LUFS over music ${music} ducked ${duck[r.tier]}`),
  ).toEqual([])
})

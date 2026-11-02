import { expect, test } from '@playwright/test'
// @ts-expect-error: a plain ESM script shared with the review tooling (scripts/jump-audit.mjs)
import { findJumps, openAuditPage, walkLesson } from '../scripts/jump-audit.mjs'

/**
 * PR-16 guard for the lesson screen: walks whole lessons on the engine's virtual clock and fails on any
 * element that appears, vanishes, moves or changes text in one frame (scripts/jump-audit.mjs). m1 covers a
 * stage, options, a wrong try's hint, the keypad and the reveal; m2 covers questions without a stage and
 * options that are matrices. The lesson end belongs to the character's layer and is filmed separately.
 */
const LESSONS = ['m1-reading-a-matrix', 'm2-matrix-types']
/** The first frames are the app loading the lesson route, not a transition. */
const LOAD_FRAMES = 20

test.describe('lesson transitions', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'the virtual clock walk is engine-level; one engine is enough',
  )
  for (const lesson of LESSONS) {
    test(`${lesson}: nothing appears, vanishes or jumps in one frame`, async ({ browser }) => {
      test.setTimeout(240_000)
      const page = await openAuditPage(browser)
      const frames: unknown[] = []
      await walkLesson(page, lesson, frames)
      type Jump = { frame: number; kind: string; cls: string; text: string; delta: string }
      const jumps = (findJumps(frames) as Jump[]).filter(
        (j) => j.frame > LOAD_FRAMES && !/ls-end|badge-reveal/.test(j.cls),
      )
      expect(jumps.map((j) => `f${j.frame} ${j.kind} ${j.delta} .${j.cls} "${j.text}"`)).toEqual([])
      expect(frames.length).toBeGreaterThan(1000)
      await page.context().close()
    })
  }
})

import { strings } from '../content/strings'
import type { MirtisMood, PlayName } from './mirtis'

/**
 * When Mırtis steps into a lesson (decision 0017, "Moments"). Pure and deterministic: the lesson hands over what just
 * happened and gets back what she plays and says, or null for a plain verdict. A moment only ever appears on a verdict
 * (after the answer) or on an explain step, never on a question that is still being solved.
 */

export type MomentContext = {
  /** 0-based index of the step on screen. */
  index: number
  /** Number of steps in the lesson. */
  count: number
  kind: 'explain' | 'question'
  /** First-try answers in a row, counting the one just given. */
  run: number
  /** The last question before this one was missed (a wrong try or a given-up answer). */
  prevMissed: boolean
  /** Wrong tries on this question. */
  wrong: number
  solved: boolean
  /** The verdict is showing (solved, or the learner asked for the answer). */
  revealed: boolean
  /** Index of the last step that showed a moment, or null. */
  lastAt: number | null
  /** The halfway moment has had its turn. */
  halfDone: boolean
}

export type StringKey = keyof typeof strings.mirtis

export type Moment = {
  play: PlayName
  line: StringKey
  /** The number a counted line speaks (the streak). */
  n?: number
}

/** At most one moment this many steps apart (a streak ignores it). */
export const GAP = 3
/** First-try answers in a row that make a streak, and the spacing of the next ones. */
export const STREAK_EVERY = 3

/** Whether this verdict is the first at or past the lesson's midpoint. */
export const pastHalf = (index: number, count: number) => count > 0 && (index + 1) * 2 >= count

export function pickMoment(c: MomentContext): Moment | null {
  if (c.kind === 'explain') return c.index === 0 ? { play: 'wake', line: 'start' } : null
  if (!c.revealed) return null

  if (c.solved && c.wrong === 0 && c.run > 0 && c.run % STREAK_EVERY === 0)
    return { play: 'wow', line: 'streak', n: c.run }

  if (c.lastAt !== null && c.index - c.lastAt < GAP) return null

  if (c.solved && (c.wrong > 0 || c.prevMissed))
    return { play: 'proud', line: c.index % 2 === 0 ? 'comebackA' : 'comebackB' }
  if (!c.solved && c.wrong >= 2) return { play: 'think', line: 'together' }
  if (!c.halfDone && pastHalf(c.index, c.count))
    return { play: c.solved && c.wrong === 0 ? 'correct' : 'proud', line: 'halfway' }
  return null
}

/** The words of a moment. */
export function lineOf(m: Moment): string {
  const text = strings.mirtis[m.line]
  return typeof text === 'function' ? text(m.n ?? 0) : text
}

/** The app mood that plays a storyboard on the verdict's cat. */
export const MOOD_OF: Record<PlayName, MirtisMood> = {
  rest: 'rest',
  correct: 'happy',
  wrong: 'oops',
  wow: 'wow',
  proud: 'proud',
  wake: 'sleep',
  purr: 'purr',
  think: 'think',
  sleep: 'sleep',
}

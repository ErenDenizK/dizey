import { describe, expect, it } from 'vitest'
import { lessons } from '../content/lessons'
import { actStarts, hashOf, planLesson, type StepKind } from './form'

const E: StepKind = 'explain'
const C: StepKind = 'choice'
const K: StepKind = 'keypad'
const isQuestion = (kind: StepKind) => kind === 'choice' || kind === 'keypad'

const synthetic: Record<string, StepKind[]> = {
  'explain x12': Array(12).fill(E),
  'explain x30': Array(30).fill(E),
  alternating: Array.from({ length: 12 }, (_, i) => (i % 2 ? C : E)),
  'consecutive questions': [E, E, C, C, K, K, E, E, C, K, E, E],
  'ends on a question': [E, E, E, C],
  'starts on a question': [C, E, E, K, E],
  'one step': [E],
  'two steps': [E, C],
  'two explains': [E, E],
}
const real = Object.fromEntries(lessons.map((l) => [l.id, l.steps.map((s) => s.kind as StepKind)]))
const cases = { ...synthetic, ...real }

describe('lesson form', () => {
  for (const [name, kinds] of Object.entries(cases)) {
    it(`plans ${name} as a piece`, () => {
      const plan = planLesson(kinds, hashOf(name))
      const n = kinds.length
      expect(plan).toHaveLength(n)
      for (let i = 1; i < n; i++) expect(plan[i]?.chord, `step ${i}`).not.toBe(plan[i - 1]?.chord)
      expect(plan[0]?.chord).toBe('I')
      if (n > 1) expect(plan[n - 1]?.chord).toBe('IV')
      const starts = actStarts(kinds)
      for (let i = 1; i < n; i++)
        if (isQuestion(kinds[i - 1] as StepKind) && !isQuestion(kinds[i] as StepKind))
          expect(plan[i]?.chord === 'I' || starts.includes(i), `step ${i}`).toBe(true)
      for (const cue of plan) {
        expect(cue.energy).toBeGreaterThanOrEqual(0)
        expect(cue.energy).toBeLessThanOrEqual(1)
      }
      const atStarts = starts.map((s) => plan[s]?.energy as number)
      for (let k = 1; k < atStarts.length; k++)
        expect(atStarts[k]).toBeGreaterThanOrEqual(atStarts[k - 1] as number)
      for (const [k, s] of starts.entries()) expect((starts[k + 1] ?? n) - s).toBeLessThanOrEqual(5)
      expect(planLesson(kinds, hashOf(name))).toEqual(plan)
    })
  }

  it('gives different lessons different motif seeds', () => {
    expect(hashOf('d1-determinant')).not.toBe(hashOf('d2-cofactor-expansion'))
  })
})

import { describe, expect, it } from 'vitest'
import { lightScore } from './shine'

describe('lightScore: the light follows the reward music', () => {
  it('finds one onset per chord of the lesson end (ii, V, I), home last', () => {
    const score = lightScore('lessonEnd')
    expect(score.chords).toHaveLength(3)
    expect(score.shines).toHaveLength(0)
    expect(score.chords[0]).toBe(0)
  })

  it('gives every arpeggio note of a reward its own spark onset, before the home chord', () => {
    for (const [event, chords, shines] of [
      ['halfway', 2, 5],
      ['milestone', 3, 6],
    ] as const) {
      const score = lightScore(event)
      expect(score.chords).toHaveLength(chords)
      expect(score.shines).toHaveLength(shines)
      const home = score.chords[score.chords.length - 1] as number
      for (const at of score.shines) expect(at).toBeLessThan(home)
    }
  })
})

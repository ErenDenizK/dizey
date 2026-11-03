import { describe, expect, it } from 'vitest'
import { lightScore } from './shine'

describe('lightScore: the light follows the reward music', () => {
  it('finds one onset per chord of the lesson end (I, IV, V7, I), home last', () => {
    const score = lightScore('lessonEnd')
    expect(score.chords).toHaveLength(4)
    // The melody notes before home, from the recorded cue's timeline.
    expect(score.shines).toHaveLength(7)
    expect(score.chords[0]).toBe(0)
    expect(score.chords[3]).toBe(1.5)
  })

  it('gives every melody note of a reward its own spark onset, before the home chord', () => {
    for (const [event, chords, shines] of [
      ['halfway', 2, 3],
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

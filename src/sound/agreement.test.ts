import { describe, expect, it } from 'vitest'
import { CHORDS, type ChordId, intervalOf, PROGRESSION, seeded } from './harmony'
import { IDLE } from './music'
import { createScore, EVENTS, type SoundContext, type SoundEvent } from './score'

/**
 * Sounds and music never clash: every note a frequent or touch sound plays is a tone of the chord
 * the music holds at that moment. Answers lean on a suspended 4th on purpose; the music is ducked
 * 16 dB under them (synth.ts), so they are checked separately: only that one leaning voice is new.
 */

const tonesOf = (id: ChordId) => {
  const c = CHORDS[id]
  return new Set(
    [...c.voicing, c.bass, ...c.arpeggio.map((i) => c.root + i)].map((pitch) => intervalOf(c, pitch)),
  )
}

const quick = (Object.keys(EVENTS) as SoundEvent[]).filter((e) =>
  ['touch', 'frequent'].includes(EVENTS[e].tier),
)

function check(event: SoundEvent, context: SoundContext, chord: ChordId) {
  const score = createScore(seeded(4))
  for (let index = 0; index < 6; index++) {
    const plan = score.plan(event, { ...context, index })
    for (const note of plan.notes) {
      if (note.kind === 'thump') continue
      expect(tonesOf(chord), `${event} on ${chord}: ${note.pitch}`).toContain(
        intervalOf(CHORDS[chord], note.pitch),
      )
    }
  }
}

describe('sounds agree with the music', () => {
  it('outside a lesson, every quick sound plays the chord the music holds', () => {
    for (const chord of IDLE) for (const event of quick) check(event, { chord }, chord)
  })

  it('inside a lesson, every quick sound plays the step chord the music follows', () => {
    PROGRESSION.forEach((chord, step) => {
      for (const event of quick) check(event, { step, steps: PROGRESSION.length }, chord)
    })
  })

  it('an answer adds only its leaning 4th over the chord, and resolves it', () => {
    PROGRESSION.forEach((chord, step) => {
      const plan = createScore(seeded(2)).plan('correct', { step, steps: PROGRESSION.length })
      const outside = plan.notes.filter(
        (n) => n.kind !== 'thump' && !tonesOf(chord).has(intervalOf(CHORDS[chord], n.pitch)),
      )
      expect(outside.length).toBeLessThanOrEqual(2)
      // The leaning notes stop before the resolution has finished sounding.
      for (const note of outside) expect(note.ring).toBeLessThan(0.7)
    })
  })
})

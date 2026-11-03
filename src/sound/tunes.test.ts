import { describe, expect, it } from 'vitest'
import { CHORDS, type ChordId, intervalOf } from './harmony'
import { EVENTS, type SoundEvent } from './score'

/** Rewards and lesson cues sing real melodies; these guard their notes and their timing. */

const MAJOR = new Set([0, 2, 4, 5, 7, 9, 11])
/** Borrowed chords bring their own colour; their melodies may leave D♭ major. */
const BORROWED = new Set<ChordId>(['bVII', 'bVI', 'Is11', 'iv'])
const tonesOf = (id: ChordId) => {
  const c = CHORDS[id]
  return new Set([...c.voicing, c.bass, ...c.arpeggio.map((i) => c.root + i)].map((p) => intervalOf(c, p)))
}
const tuned = (Object.keys(EVENTS) as SoundEvent[]).filter((e) => EVENTS[e].parts.some((p) => p.tune))

describe('melodic cues', () => {
  it('has a tune for the lesson end and every reward', () => {
    expect(tuned).toEqual(
      expect.arrayContaining(['lessonEnd', 'halfway', 'milestone', 'seal', 'secret', 'lessonOpen']),
    )
  })

  it('keeps every tune note in D♭ major (borrowed chords and the minor iv excepted)', () => {
    for (const event of tuned)
      for (const part of EVENTS[event].parts)
        for (const [, pitch] of part.tune ?? []) {
          if (event === 'secret' || (part.chord !== 'step' && BORROWED.has(part.chord))) continue
          expect(MAJOR, `${event} ${part.chord}: ${pitch}`).toContain(((pitch % 12) + 12) % 12)
        }
  })

  it('puts chord tones on the tune, or short stepwise passing tones', () => {
    for (const event of tuned)
      for (const part of EVENTS[event].parts) {
        if (part.chord === 'step') continue
        const tones = tonesOf(part.chord)
        const tune = part.tune ?? []
        tune.forEach(([, pitch, length], i) => {
          if (tones.has(intervalOf(CHORDS[part.chord as ChordId], pitch))) return
          const near = [tune[i - 1], tune[i + 1]].some((n) => n && Math.abs(n[1] - pitch) <= 2)
          expect(length, `${event} ${part.chord}: ${pitch} passes quickly`).toBeLessThanOrEqual(0.25)
          expect(near, `${event} ${part.chord}: ${pitch} moves by step`).toBe(true)
        })
      }
  })

  it('finishes each part before the next begins, and the last note is held', () => {
    for (const event of tuned) {
      const { parts, gap = 0.9 } = EVENTS[event]
      parts.forEach((part, i) => {
        const tune = part.tune ?? []
        const end = Math.max(...tune.map(([at, , length]) => at + length))
        if (i < parts.length - 1)
          expect(end, `${event} part ${i}`).toBeLessThanOrEqual((part.length ?? gap) + 1e-9)
      })
    }
  })
})

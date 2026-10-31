import { describe, expect, it } from 'vitest'
import { CHORDS, intervalOf, PROGRESSION, seeded } from './harmony'
import { composeSection, idleChord, SECTION } from './music'

describe('background music', () => {
  it('walks the lesson line slowly when no lesson picks the chord', () => {
    const walk = Array.from({ length: 12 }, (_, n) => idleChord(n))
    expect(walk.filter((_, n) => n % 2 === 0)).toEqual(PROGRESSION)
    expect(walk[1]).toBe(walk[0])
  })

  it('plays only the chord of its section, so it never clashes with a sound', () => {
    const random = seeded(5)
    let last: number | undefined
    for (const chord of PROGRESSION)
      for (let k = 0; k < 20; k++) {
        const section = composeSection(chord, 10, random, last)
        last = section.last
        const tones = new Set(
          [
            ...CHORDS[chord].voicing,
            CHORDS[chord].bass,
            ...CHORDS[chord].arpeggio.map((i) => CHORDS[chord].root + i),
          ].map((p) => intervalOf(CHORDS[chord], p)),
        )
        for (const note of section.notes) expect(tones).toContain(intervalOf(CHORDS[chord], note.pitch))
      }
  })

  it('keeps every section inside its length, sparse, and its melody moving by step', () => {
    const random = seeded(9)
    for (let k = 0; k < 50; k++) {
      const section = composeSection('vi', 0, random)
      const melody = section.notes.filter((n) => n.kind === 'main' && n.pitch > 0)
      expect(melody.length).toBeGreaterThanOrEqual(2)
      expect(melody.length).toBeLessThanOrEqual(4)
      for (const note of section.notes) expect(note.at).toBeLessThan(SECTION)
      for (let i = 1; i < melody.length; i++)
        expect(Math.abs((melody[i]?.pitch ?? 0) - (melody[i - 1]?.pitch ?? 0))).toBeLessThanOrEqual(7)
      for (const note of melody) {
        expect(note.pitch).toBeGreaterThanOrEqual(6)
        expect(note.pitch).toBeLessThanOrEqual(19)
      }
    }
  })
})

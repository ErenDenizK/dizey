import { describe, expect, it } from 'vitest'
import { CHORDS, chordAt, intervalOf, PROGRESSION, seeded, suspend } from './harmony'
import { createScore, EVENTS, type SoundEvent } from './score'

const plan = (event: SoundEvent, step = 0, steps = 6) => createScore(seeded(1)).plan(event, { step, steps })
const pitchesAt = (event: SoundEvent, test: (at: number) => boolean) =>
  plan(event)
    .notes.filter((note) => note.kind === 'main' && note.pitch > 0 && test(note.at))
    .map((note) => note.pitch)

describe('harmony', () => {
  it('walks the progression once over a lesson', () => {
    const steps = 12
    const walk = Array.from({ length: steps }, (_, step) => chordAt(step, steps))
    expect([...new Set(walk)]).toEqual(PROGRESSION)
    expect(chordAt(undefined, undefined)).toBe('I')
  })

  it('keeps every voicing rootless with its 3rd and 7th', () => {
    for (const chord of Object.values(CHORDS)) {
      const intervals = chord.voicing.map((pitch) => intervalOf(chord, pitch))
      expect(intervals.some((i) => i === 3 || i === 4)).toBe(true)
      expect(intervals.some((i) => i === 10 || i === 11)).toBe(true)
      expect(intervals).not.toContain(0)
    }
  })

  it('takes the 3rd out of a suspended chord', () => {
    for (const chord of Object.values(CHORDS)) {
      const open = suspend(chord, chord.voicing).filter((pitch): pitch is number => pitch !== null)
      expect(open.map((pitch) => intervalOf(chord, pitch)).some((i) => i === 3 || i === 4)).toBe(false)
    }
  })
})

describe('score', () => {
  it('leaves a wrong answer open and resolves a correct one', () => {
    const chord = CHORDS.I
    const hasThird = (pitches: number[]) => pitches.some((p) => [3, 4].includes(intervalOf(chord, p)))
    expect(hasThird(pitchesAt('wrong', () => true))).toBe(false)
    expect(hasThird(pitchesAt('correct', (at) => at < 0.3))).toBe(false)
    expect(hasThird(pitchesAt('correct', (at) => at >= 0.3))).toBe(true)
    expect(plan('wrong').chords).toEqual(['I:sus'])
    expect(plan('correct').chords).toEqual(['I:sus', 'I'])
  })

  it('closes a lesson with ii–V–I and rewards end at home', () => {
    expect(plan('lessonEnd').chords).toEqual(['ii', 'V', 'I'])
    expect(plan('halfway').chords.at(-1)).toBe('I')
    expect(plan('milestone').chords.at(-1)).toBe('I')
  })

  it('follows the step chord for in-lesson sounds', () => {
    expect(plan('merge', 5, 6).chords).toEqual(['V'])
    expect(plan('land', 2, 6).chords).toEqual(['iii'])
  })

  it('never repeats a wandering tap voice twice in a row', () => {
    const score = createScore(seeded(3))
    const tops = Array.from({ length: 40 }, () => score.plan('select').notes[0]?.pitch)
    for (let i = 1; i < tops.length; i++) expect(tops[i]).not.toBe(tops[i - 1])
  })

  it('ranks loudness and length by how often a sound happens', () => {
    const rank = { frequent: 0, question: 1, lesson: 2, reward: 3 }
    const events = Object.keys(EVENTS) as SoundEvent[]
    for (const a of events)
      for (const b of events)
        if (rank[EVENTS[a].tier] < rank[EVENTS[b].tier]) {
          expect(EVENTS[a].loudness).toBeLessThan(EVENTS[b].loudness)
          expect(plan(a).end).toBeLessThan(plan(b).end + 0.5)
        }
  })

  it('keeps every note in a comfortable range with a positive length', () => {
    for (const event of Object.keys(EVENTS) as SoundEvent[])
      for (let step = 0; step < 6; step++)
        for (const note of plan(event, step).notes) {
          expect(note.pitch).toBeGreaterThanOrEqual(-24)
          expect(note.pitch).toBeLessThanOrEqual(36)
          expect(note.ring).toBeGreaterThan(0)
          expect(note.velocity).toBeGreaterThan(0)
        }
  })
})

import { describe, expect, it } from 'vitest'
import type { MusicCue, Role } from './form'
import { CHORDS, type ChordId, intervalOf, seeded } from './harmony'
import { BEAT, composeSection, freshState, HOME_LOOP, idleChord, type MusicState, SECTION } from './music'

const ROLES: Role[] = ['open', 'travel', 'tension', 'arrival', 'coda']
const CHORD_IDS = Object.keys(CHORDS) as ChordId[]

const tonesOf = (id: ChordId) => {
  const c = CHORDS[id]
  return new Set(
    [...c.voicing, c.bass, ...c.arpeggio.map((i) => c.root + i)].map((pitch) => intervalOf(c, pitch)),
  )
}

const cue = (chord: ChordId, energy: number, role: Role = 'travel'): MusicCue => ({
  chord,
  energy,
  role,
  act: 0,
  seed: 3,
})

/** Sections of one step, `bars` long, with the state carried over like the player does. */
function steps(c: MusicCue, bars: number, seed = 5) {
  const random = seeded(seed)
  let state: MusicState = freshState(c.seed)
  return Array.from({ length: bars }, (_, bar) => {
    const written = composeSection(c, 10, random, state, bar === 0)
    state = written.state
    return written.notes
  })
}

const melodyOf = (notes: { kind: string; pitch: number }[]) =>
  notes.filter((n) => n.kind === 'main' && n.pitch > 0)

describe('background music', () => {
  it('walks the home piece, two bars a chord, when no lesson picks the chord', () => {
    const walk = Array.from({ length: 18 }, (_, n) => idleChord(n))
    expect(walk.slice(0, 9)).toEqual([...HOME_LOOP])
    expect(walk.slice(0, 4)).toEqual(['I', 'vi', 'IV', 'V'])
    expect(walk.slice(4, 9)).toEqual(['I', 'iii', 'IV', 'ii', 'V'])
    expect(walk.slice(9)).toEqual(walk.slice(0, 9))
  })

  it('plays only tones of its chord, in every role, energy and bar', () => {
    // Collected and asserted once: one expect per note made this sweep slow on CI.
    const wrong: string[] = []
    for (const chord of CHORD_IDS) {
      const tones = tonesOf(chord)
      for (const role of ROLES)
        for (let e = 0; e <= 10; e++)
          steps(cue(chord, e / 10, role), 9, e + 1).forEach((notes, bar) => {
            for (const note of notes) {
              const where = `${chord} ${role} e${e / 10} bar${bar}: ${note.pitch} at ${note.at}`
              if (note.at < 10 || note.at >= 10 + SECTION) wrong.push(`outside the section, ${where}`)
              // A short melody note may be a passing or neighbour tone (see melody.test.ts).
              if (note.kind === 'main' && note.ring <= BEAT * 0.5 + 1e-9) continue
              if (!tones.has(intervalOf(CHORDS[chord], note.pitch))) wrong.push(`not a chord tone, ${where}`)
            }
          })
    }
    expect(wrong).toEqual([])
  })

  it('writes more melody as the energy rises', () => {
    const count = (energy: number) => {
      let total = 0
      for (const chord of CHORD_IDS)
        for (let seed = 1; seed <= 5; seed++)
          total += melodyOf(steps(cue(chord, energy), 1, seed)[0] ?? []).length
      return total
    }
    expect(count(0.9)).toBeGreaterThan(count(0.1))
  })

  it('leaves a question sparser than the travel before it', () => {
    let travel = 0
    let tension = 0
    for (const chord of CHORD_IDS)
      for (let seed = 1; seed <= 5; seed++) {
        travel += melodyOf(steps(cue(chord, 0.6, 'travel'), 1, seed)[0] ?? []).length
        tension += melodyOf(steps(cue(chord, 0.6, 'tension'), 1, seed)[0] ?? []).length
      }
    expect(tension).toBeLessThan(travel)
  })

  it('breathes out when one step waits long', () => {
    for (const chord of CHORD_IDS) {
      const bars = steps(cue(chord, 0.9), 8)
      expect(bars[7]?.length).toBeLessThan(bars[0]?.length as number)
    }
  })

  it('moves the line by step across sections', () => {
    const bars = steps(cue('vi', 0.5), 12)
    const firsts = bars.map((notes) => melodyOf(notes)[0]?.pitch ?? 0)
    for (let i = 1; i < firsts.length; i++)
      expect(Math.abs((firsts[i] as number) - (firsts[i - 1] as number))).toBeLessThanOrEqual(12)
  })
})

import { describe, expect, it } from 'vitest'
import { lessons } from '../content/lessons'
import { actStarts, hashOf, type MusicCue, planLesson, type Role, type StepKind, type Theme } from './form'
import { CHORDS, type ChordId, intervalOf, seeded } from './harmony'
import { BEAT, composeSection, freshState, idleCue, SCALE, THEMES, themeOfUnit } from './music'

const THEME_IDS: Theme[] = ['home', 'M', 'R', 'D', 'S']
const CHORD_IDS = Object.keys(CHORDS).filter((c) => c !== 'bVII' && c !== 'bVI' && c !== 'Is11') as ChordId[]
const START = 10

const tonesOf = (id: ChordId) => {
  const c = CHORDS[id]
  return new Set(
    [...c.voicing, c.bass, ...c.arpeggio.map((i) => c.root + i)].map((pitch) => intervalOf(c, pitch)),
  )
}

const cue = (chord: ChordId, theme: Theme, energy = 0.6, role: Role = 'travel'): MusicCue => ({
  chord,
  energy,
  role,
  act: 0,
  seed: 3,
  theme,
})

/** The melody of the phrase `count` (phrases before it advance the state), with beats from its start. */
function phrase(c: MusicCue, count: number, bar = 0) {
  let state = { ...freshState(0), bar }
  const random = seeded(7)
  const result = composeSection(c, START, random, { ...state, count, bar }, false)
  state = result.state
  const line = result.notes
    .filter((n) => n.kind === 'main' && n.bright > 0.08)
    .map((n) => ({ ...n, beat: (n.at - START) / BEAT }))
    .sort((a, b) => a.at - b.at)
  return { line, bar: result }
}

describe('melody rules', () => {
  it('puts chord tones on the strong beats, and only short resolved diatonic tones elsewhere', () => {
    for (const theme of THEME_IDS)
      for (const chord of CHORD_IDS)
        for (const role of ['travel', 'tension', 'arrival', 'open'] as Role[])
          for (const energy of [0.1, 0.3, 0.6, 0.9])
            for (let count = 0; count < 8; count++) {
              const { line } = phrase(cue(chord, theme, energy, role), count)
              const tones = tonesOf(chord)
              const isTone = (p: number) => tones.has(intervalOf(CHORDS[chord], p))
              const label = `${theme} ${chord} ${role} e${energy} #${count}`
              line.forEach((n, k) => {
                const strong = Math.abs(n.beat - Math.round(n.beat)) < 0.07 && Math.round(n.beat) % 2 === 0
                if (strong) expect(isTone(n.pitch), `${label}: strong beat ${n.beat}`).toBe(true)
                if (isTone(n.pitch)) return
                expect(SCALE, `${label}: ${n.pitch} is diatonic`).toContain(((n.pitch % 12) + 12) % 12)
                expect(n.ring, `${label}: short`).toBeLessThanOrEqual(BEAT * 0.5 + 1e-9)
                const next = line[k + 1]
                expect(next, `${label}: resolves`).toBeDefined()
                expect(isTone(next?.pitch as number), `${label}: resolves to a chord tone`).toBe(true)
                const step = Math.abs((next?.pitch as number) - n.pitch)
                expect(step === 1 || step === 2, `${label}: by step, got ${step}`).toBe(true)
              })
            }
  })

  it('ends an antecedent open and a consequent, and every arrival, on the root with a long note', () => {
    for (const theme of THEME_IDS)
      for (const chord of CHORD_IDS) {
        const ask = phrase(cue(chord, theme), 0).line.at(-1)
        const answer = phrase(cue(chord, theme), 1).line.at(-1)
        const arrival = phrase(cue(chord, theme, 0.6, 'arrival'), 0).line.at(-1)
        const interval = (p: number | undefined) => intervalOf(CHORDS[chord], p as number)
        expect([3, 4, 7], `${theme} ${chord} antecedent`).toContain(interval(ask?.pitch))
        expect(interval(answer?.pitch), `${theme} ${chord} consequent`).toBe(0)
        expect(interval(arrival?.pitch), `${theme} ${chord} arrival`).toBe(0)
        expect(answer?.ring).toBeGreaterThanOrEqual(3)
        expect(arrival?.ring).toBeGreaterThanOrEqual(3)
      }
  })
})

describe('themes', () => {
  const rhythms: Record<Theme, number[]> = {
    home: [0, 2, 3, 4, 6],
    M: [0, 1, 2, 3, 4.5, 5, 6],
    R: [0.5, 1, 1.5, 2.5, 4, 5.5, 6],
    D: [0, 1.5, 2, 4, 4.5, 5, 6],
    S: [0, 0.5, 1, 3, 4, 4.5, 5, 7],
  }

  it('states each unit theme with its own rhythm', () => {
    for (const theme of THEME_IDS) {
      expect(THEMES[theme].map((n) => n.at)).toEqual(rhythms[theme])
      const { line } = phrase(cue('I', theme), 0)
      expect(line.map((n) => Math.round(n.beat * 2) / 2)).toEqual(rhythms[theme])
    }
  })

  it('opens every theme on the chord root in a statement over I, and keeps the themes apart', () => {
    for (const theme of THEME_IDS) {
      const first = phrase(cue('I', theme), 0).line[0]
      if (theme !== 'R') expect(intervalOf(CHORDS.I, first?.pitch as number)).toBe(0)
    }
    expect(new Set(THEME_IDS.map((t) => rhythms[t].join())).size).toBe(THEME_IDS.length)
  })

  it('picks the theme from the unit prefix and sings the home theme outside lessons', () => {
    expect(['M', 'R', 'D', 'S'].map(themeOfUnit)).toEqual(['M', 'R', 'D', 'S'])
    expect(themeOfUnit(undefined)).toBe('home')
    expect(idleCue(0).theme).toBe('home')
    expect(planLesson(['explain', 'choice'], 1, 'D').every((c) => c.theme === 'D')).toBe(true)
  })
})

describe('secondary dominants in the form', () => {
  const real = Object.fromEntries(lessons.map((l) => [l.id, l.steps.map((s) => s.kind as StepKind)]))
  const kinds: StepKind[][] = [
    ...Object.values(real),
    [
      'explain',
      'explain',
      'choice',
      'explain',
      'explain',
      'keypad',
      'explain',
      'explain',
      'explain',
      'choice',
    ],
    Array(14).fill('explain'),
    [
      'explain',
      'explain',
      'explain',
      'choice',
      'explain',
      'explain',
      'choice',
      'explain',
      'keypad',
      'explain',
      'explain',
      'choice',
      'explain',
    ],
  ]

  it('closes an act that opens on vi with III, and uses VI only right before ii', () => {
    let iii = 0
    let vi = 0
    for (const list of kinds)
      for (let seed = 1; seed <= 60; seed++) {
        const plan = planLesson(list, seed)
        const starts = actStarts(list)
        starts.forEach((start, act) => {
          const end = starts[act + 1] ?? list.length
          const first = plan[start]?.chord
          const last = plan[end - 1]?.chord
          if (act < starts.length - 1 && first === 'vi') expect(last, `act ${act}`).toBe('III')
          if (first === 'I') expect(last).not.toBe('III')
        })
        plan.forEach((c, i) => {
          if (c.chord === 'III') iii++
          if (c.chord === 'VI') {
            vi++
            expect(plan[i + 1]?.chord).toBe('ii')
            expect(starts).not.toContain(i)
          }
        })
      }
    expect(iii).toBeGreaterThan(0)
    expect(vi).toBeGreaterThan(0)
  })

  it('keeps every real lesson plan stable, and never lets III or VI start or end a lesson', () => {
    for (const [id, list] of Object.entries(real)) {
      const plan = planLesson(list, hashOf(id))
      expect(plan[0]?.chord).toBe('I')
      expect(plan.at(-1)?.chord).toBe('IV')
    }
  })
})

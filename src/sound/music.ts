import type { Flourish, MusicCue } from './form'
import { CHORDS, type ChordId, clamp, mod, nearest } from './harmony'
import type { Note } from './score'

/**
 * Background music: generated, never a recording and never a loop you can learn by heart. Each
 * section holds one chord of the same harmony the sounds use, so music and sounds always agree.
 *
 * Inside a lesson the music is one piece (form.ts plans its chords and energy step by step). It is
 * built in layers that enter as the energy rises: a pad and a slow bass first, then the lesson's own
 * motif, then a moving bass and a soft glass pulse, then a high shimmer. The motif comes back varied
 * in every section (stated, raised, turned upside down, answered backwards), and the pads move to
 * the nearest voicing, so chords join like a pianist's hands rather than jump. A question thins the
 * music to leave room to think; the step after it lands on its chord, a small resolution. Waiting a
 * long time on one step lets the music breathe out instead of looping at full strength.
 *
 * Outside a lesson the music walks the old app's home loop (I–vi–IV–V) slowly, at low energy.
 */

/** Seconds per beat (72 bpm), beats per bar, and the two-bar phrase (a "section") the composer writes. */
export const BEAT = 60 / 72
export const BAR_BEATS = 4
export const BAR = BEAT * BAR_BEATS
export const SECTION_BEATS = 8
export const SECTION = BEAT * SECTION_BEATS

/** Outside a lesson: the old app's home loop, I–vi–IV–V, two sections per chord. */
export const IDLE: readonly ChordId[] = ['I', 'vi', 'IV', 'V']
/** Energy of the music outside a lesson: pad, bass and a sparse line only. */
export const IDLE_ENERGY = 0.22

/** The chord of section `n` when no lesson picks one. */
export const idleChord = (n: number): ChordId => IDLE[mod(Math.floor(n / 2), IDLE.length)] as ChordId

/** A motif: when its notes fall (beats from the section start) and how it moves through chord tones. */
export type Motif = { rhythm: readonly number[]; contour: readonly number[] }

const RHYTHMS: readonly (readonly number[])[] = [
  [1, 1.5, 2, 3],
  [0.5, 1, 2, 2.5],
  [1, 2, 2.5, 3.5],
  [1.5, 2, 2.5, 3],
]
const CONTOURS: readonly (readonly number[])[] = [
  [0, 1, 2, 1],
  [0, -1, 1, 2],
  [0, 2, 1, 0],
  [0, 1, -1, -2],
]

/** The lesson's own motif, the same every time the lesson is played. */
export function motifOf(seed: number): Motif {
  return {
    rhythm: RHYTHMS[mod(seed, RHYTHMS.length)] as readonly number[],
    contour: CONTOURS[mod(Math.floor(seed / RHYTHMS.length), CONTOURS.length)] as readonly number[],
  }
}

/** What the music remembers from one section to the next. */
export type MusicState = {
  motif: Motif
  /** Sections written so far: picks the motif's variation. */
  count: number
  /** Sections written on the current step (or idle chord): long waits breathe out. */
  bar: number
  /** Last melody note, so the line moves by step across sections. */
  last?: number
  /** Last pad voicing, so pads move to the nearest one. */
  voicing?: number[]
}

export const freshState = (seed = 0): MusicState => ({ motif: motifOf(seed), count: 0, bar: 0 })

/** Sections on one step before the music starts to breathe out. */
const BREATHE_AFTER = 4

/** The cue outside a lesson. */
export const idleCue = (n: number): MusicCue => ({
  chord: idleChord(n),
  energy: IDLE_ENERGY,
  role: 'travel',
  act: 0,
  seed: 0,
})

/** The motif in variation `v`: stated, raised a chord tone, inverted, or played backwards. */
function vary(motif: Motif, v: number): { contour: number[]; lift: number } {
  const c = [...motif.contour]
  switch (mod(v, 4)) {
    case 1:
      return { contour: c, lift: 1 }
    case 2:
      return { contour: c.map((x) => -x), lift: 0 }
    case 3:
      return { contour: c.reverse().map((x) => x - (c[0] as number)), lift: 0 }
    default:
      return { contour: c, lift: 0 }
  }
}

/** A sixteenth note at 72 bpm. */
const SIXTEENTH = BEAT / 4

/** All tones of the chord's arpeggio in `low..high` (semitones above the tonic), ascending. */
function toneRange(chord: ChordId, low: number, high: number): number[] {
  const c = CHORDS[chord]
  const base = mod(c.root + 6, 12) - 6
  return [...new Set(c.arpeggio.flatMap((interval) => [-1, 0, 1, 2, 3].map((o) => base + interval + 12 * o)))]
    .filter((p) => p >= low && p <= high)
    .sort((a, b) => a - b)
}

/**
 * A flourish: the music answering a key moment, on the first beat of the new phrase, as `shine`
 * notes (never ducked away, they come after the answer sound). Chord tones of `chord` only.
 * - rise: an ascending arpeggio, six sixteenths, landing on a held tone;
 * - peak: nine sixteenths, about two octaves, plus a halo swell;
 * - cascade: five notes falling onto the root.
 */
export function flourishNotes(kind: Flourish, chord: ChordId, start: number): Note[] {
  const c = CHORDS[chord]
  const note = (pitch: number, at: number, velocity: number, ring: number): Note => ({
    kind: 'shine',
    pitch,
    at,
    ring,
    velocity,
    bright: 0.35,
  })
  const at0 = start + 0.03
  if (kind === 'cascade') {
    const root = toneRange(chord, 4, 17).find((p) => mod(p - c.root, 12) === 0) ?? c.root
    const above = toneRange(chord, root + 1, root + 19)
      .slice(0, 4)
      .reverse()
    return [...above, root].map((p, k, all) =>
      note(
        p,
        at0 + k * SIXTEENTH * 1.25,
        k === all.length - 1 ? 0.2 : 0.11 + 0.012 * k,
        k === all.length - 1 ? 2.8 : 1.1,
      ),
    )
  }
  const count = kind === 'rise' ? 6 : 9
  const tones = toneRange(chord, kind === 'rise' ? 4 : -3, 40)
  const first = 0
  const notes = tones.slice(first, first + count).map((p, k, all) => {
    const last = k === all.length - 1
    return note(p, at0 + k * SIXTEENTH, last ? 0.2 : 0.1 + 0.07 * (k / all.length), last ? 2.8 : 0.9)
  })
  if (kind === 'peak')
    for (const pitch of CHORDS[chord].voicing.slice(-2))
      notes.push({
        kind: 'halo',
        pitch: pitch + 12,
        at: start + 0.1,
        ring: 3.2,
        velocity: 0.22,
        bright: 0,
        rise: 1.2,
      })
  return notes
}

/**
 * One section starting at `start` (context time). `entering`: the chord just changed, so the pad
 * comes in quickly instead of swelling. Returns the notes and the state for the next section.
 */
export function composeSection(
  cue: MusicCue,
  start: number,
  random: () => number,
  state: MusicState,
  entering = false,
): { notes: Note[]; state: MusicState } {
  const c = CHORDS[cue.chord]
  const notes: Note[] = []
  const tired = state.bar >= BREATHE_AFTER
  // Long waits lose a layer every two sections, down to the pad, bass and a sparse line.
  const energy = tired
    ? Math.max(0.12, cue.energy - 0.15 * (state.bar - BREATHE_AFTER + 2) * 0.5)
    : cue.energy
  const tension = cue.role === 'tension'

  // Pad: the nearest voicing to the last one, swelling in. One strike per bar: the first bar's pad rings
  // into the second's soft re-strike, so there is no gap at the bar line.
  const voicing = state.voicing ? nearest(c.voicing, state.voicing) : [...c.voicing]
  const padVelocity = 0.42 + 0.14 * energy
  for (const pitch of voicing) {
    notes.push({
      kind: 'pad',
      pitch,
      at: start,
      ring: BAR + 1.4,
      velocity: padVelocity,
      bright: 0,
      rise: entering ? 0.3 : 2.4,
    })
    notes.push({
      kind: 'pad',
      pitch,
      at: start + BAR,
      ring: BAR + 2.6,
      velocity: padVelocity * 0.9,
      bright: 0,
      rise: 0.6,
    })
  }
  // High shimmer on the top two voices, only near the peak.
  if (energy >= 0.72 && !tired)
    for (const pitch of voicing.slice(-2)) {
      notes.push({
        kind: 'halo',
        pitch: pitch + 12,
        at: start + 0.4,
        ring: BAR + 0.8,
        velocity: 0.2 + 0.2 * (energy - 0.72),
        bright: 0,
        rise: 2.2,
      })
      notes.push({
        kind: 'halo',
        pitch: pitch + 12,
        at: start + BAR + 0.4,
        ring: BAR + 1.5,
        velocity: 0.2 + 0.2 * (energy - 0.72),
        bright: 0,
        rise: 1.2,
      })
    }

  // Bass: one root; then root and a 5th; then a slow walk (root, 5th, octave, 5th).
  const bass = (beat: number, pitch: number, velocity: number, ring: number) =>
    notes.push({ kind: 'main', pitch, at: start + beat * BEAT + 0.02, ring, velocity, bright: 0.05 })
  const landing = cue.role === 'arrival' && state.bar === 0
  bass(0, c.bass, landing ? 0.42 : 0.36, 5.5)
  if (energy < 0.35) bass(4, c.bass, 0.22, 4)
  else if (energy < 0.62) {
    bass(3, c.bass + 7, 0.2, 2)
    bass(4, c.bass, 0.24, 4)
  } else {
    bass(2, c.bass + 7, 0.2, 1.8)
    bass(4, c.bass + 12, 0.22, 1.8)
    bass(6, c.bass + 7, 0.2, 1.8)
  }

  // Melody: chord tones in a window that climbs with the energy.
  const low = 6 + Math.round(energy * 4)
  const high = low + 13
  const base = mod(c.root + 6, 12) - 6
  const tones = [
    ...new Set(
      c.arpeggio.flatMap((interval) => [base + interval, base + interval + 12, base + interval + 24]),
    ),
  ]
    .filter((p) => p >= low && p <= high)
    .sort((a, b) => a - b)
  const nearestTo = (pitch: number) =>
    tones.reduce(
      (best, p, k) => (Math.abs(p - pitch) < Math.abs((tones[best] as number) - pitch) ? k : best),
      0,
    )
  const at = (k: number) => clamp(k, 0, tones.length - 1)
  let index = state.last === undefined ? Math.floor(tones.length / 2) : nearestTo(state.last)
  let last = state.last

  // An arrival lands first: the chord's own root, a little louder, on the downbeat.
  if (landing) {
    const root = tones.findIndex((p) => mod(p - c.root, 12) === 0 && p >= low + 2)
    if (root >= 0) index = root
    notes.push({
      kind: 'main',
      pitch: tones[index] as number,
      at: start + 0.04,
      ring: 3,
      velocity: 0.33,
      bright: 0.2,
    })
    last = tones[index]
  }

  const phrase = (from: number, v: number, count: number, velocity: number) => {
    const { contour, lift } = vary(state.motif, v)
    const rhythm = state.motif.rhythm
    const anchor = at(index + lift)
    for (let k = 0; k < count; k++) {
      const i = at(anchor + (contour[k] as number))
      const pitch = tones[i] as number
      notes.push({
        kind: 'main',
        pitch,
        at: start + (from + (rhythm[k] as number)) * BEAT,
        // The phrase's last note rings longest.
        ring: k === count - 1 ? 3 : 2.2,
        velocity: velocity * (0.94 + random() * 0.12),
        bright: 0.18,
      })
      index = i
      last = pitch
    }
  }
  // How much line: two notes at the start, four near the peak; a question keeps it sparse.
  const melodyIn = cue.role !== 'open' || state.bar > 0 || energy >= 0.2
  let count = clamp(Math.round(1.6 + energy * 2.8), 2, 4)
  if (tension || tired) count = Math.max(2, count - 1)
  if (melodyIn) phrase(landing ? 1 : 0, state.count, count, 0.27)
  // The answer phrase: the same motif varied another way, in the section's second half.
  if (energy >= 0.5 && !tension && !tired) phrase(4, state.count + 2, count - 1, 0.24)

  // A soft glass pulse on the off-beats keeps the music moving forward; it doubles near the peak.
  if (energy >= 0.45 && !(tired && state.bar >= BREATHE_AFTER + 2)) {
    const dense = energy >= 0.7 && !tired
    const offsets = dense ? [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5] : [0.5, 2.5, 4.5, 6.5]
    const pattern = [1, 2, 3, 2]
    offsets.forEach((beat, k) => {
      notes.push({
        kind: 'shine',
        pitch: voicing[pattern[mod(k + state.count, pattern.length)] as number] as number,
        at: start + beat * BEAT,
        ring: 1.1,
        velocity: (tension ? 0.08 : 0.11) + 0.07 * energy,
        bright: 0.35,
      })
    })
  }

  if (cue.flourish) notes.push(...flourishNotes(cue.flourish, cue.chord, start))

  return {
    notes,
    state: {
      ...state,
      count: state.count + 1,
      bar: state.bar + 1,
      voicing,
      ...(last === undefined ? {} : { last }),
    },
  }
}

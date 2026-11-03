import type { Flourish, MusicCue, Theme } from './form'
import { CHORDS, type ChordId, clamp, intervalOf, mod, nearest } from './harmony'
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

/**
 * Outside a lesson: the home piece, two bars (one phrase) a chord. The old app's I–vi–IV–V, then a
 * longer turn I–iii–IV–ii–V, round and round.
 */
export const HOME_LOOP: readonly ChordId[] = ['I', 'vi', 'IV', 'V', 'I', 'iii', 'IV', 'ii', 'V']
/** Energy of the music outside a lesson: pad, bass and a sparse line only. */
export const IDLE_ENERGY = 0.22

/** The chord of phrase `n` when no lesson picks one. */
export const idleChord = (n: number): ChordId => HOME_LOOP[mod(n, HOME_LOOP.length)] as ChordId

/** A theme note: where it falls in the two-bar phrase (beats), how far it sits from the anchor (scale steps), held. */
type ThemeNote = { at: number; step: number; held?: true }
const h = true as const

/** One theme per unit, sung over whatever chord the lesson is on (ADR 0018, section B). */
export const THEMES: Record<Theme, readonly ThemeNote[]> = {
  home: [
    { at: 0, step: 0, held: h },
    { at: 2, step: 2 },
    { at: 3, step: 1 },
    { at: 4, step: -1, held: h },
    { at: 6, step: 0, held: h },
  ],
  M: [
    { at: 0, step: 0 },
    { at: 1, step: 1 },
    { at: 2, step: 2 },
    { at: 3, step: 1 },
    { at: 4.5, step: 3 },
    { at: 5, step: 2 },
    { at: 6, step: 0, held: h },
  ],
  R: [
    { at: 0.5, step: 0 },
    { at: 1, step: -1 },
    { at: 1.5, step: 0 },
    { at: 2.5, step: 2, held: h },
    { at: 4, step: 4 },
    { at: 5.5, step: 3 },
    { at: 6, step: 2, held: h },
  ],
  D: [
    { at: 0, step: 0, held: h },
    { at: 1.5, step: 4 },
    { at: 2, step: 3 },
    { at: 4, step: 2 },
    { at: 4.5, step: 1 },
    { at: 5, step: 2 },
    { at: 6, step: -1, held: h },
  ],
  S: [
    { at: 0, step: 0 },
    { at: 0.5, step: 1 },
    { at: 1, step: 2 },
    { at: 3, step: -1, held: h },
    { at: 4, step: 2 },
    { at: 4.5, step: 3 },
    { at: 5, step: 4 },
    { at: 7, step: 1 },
  ],
}

/** The theme of a lesson's unit (units.ts prefix); anything else sings the home theme. */
export const themeOfUnit = (prefix: string | undefined): Theme =>
  prefix === 'M' || prefix === 'R' || prefix === 'D' || prefix === 'S' ? prefix : 'home'

/** D♭ major, as semitones above the tonic: the only notes a passing or neighbour tone may be. */
export const SCALE: readonly number[] = [0, 2, 4, 5, 7, 9, 11]
const scalePitch = (index: number) => 12 * Math.floor(index / 7) + (SCALE[mod(index, 7)] as number)
/** Scale index of the highest scale tone at or below `pitch`. */
const scaleIndex = (pitch: number) => {
  let i = Math.floor(pitch / 12) * 7 + 6
  while (scalePitch(i) > pitch) i--
  return i
}

/** What the music remembers from one phrase to the next. */
export type MusicState = {
  /** The lesson's seed: shifts which variation a phrase starts with. */
  seed: number
  /** Phrases written so far: picks the variation and whether the phrase asks (antecedent) or answers. */
  count: number
  /** Phrases written on the current step (or idle chord): long waits breathe out. */
  bar: number
  /** Last melody note, so the line moves by step across phrases. */
  last?: number
  /** Last pad voicing, so pads move to the nearest one. */
  voicing?: number[]
}

export const freshState = (seed = 0): MusicState => ({ seed, count: 0, bar: 0 })

/** Sections on one step before the music starts to breathe out. */
const BREATHE_AFTER = 4

/** The cue outside a lesson. */
export const idleCue = (n: number): MusicCue => ({
  chord: idleChord(n),
  energy: IDLE_ENERGY,
  role: 'travel',
  act: 0,
  seed: 0,
  theme: 'home',
})

/** Pitch classes (above the root) the chord's own voicing, bass and arpeggio use: what counts as a chord tone. */
type Chord = (typeof CHORDS)[ChordId]
const chordPitchClasses = (chord: Chord) =>
  new Set(
    [...chord.voicing, chord.bass, ...chord.arpeggio.map((i) => chord.root + i)].map((p) =>
      intervalOf(chord, p),
    ),
  )

/** The pitch nearest `target` whose interval above the chord's root satisfies `want`. */
function nearestTone(target: number, want: (interval: number) => boolean, chord: Chord): number {
  for (let d = 0; d < 12; d++)
    for (const p of [target - d, target + d]) if (want(intervalOf(chord, p))) return p
  return target
}

type Sung = { at: number; pitch: number; ring: number; velocity: number; passing: boolean }

/**
 * The theme for this phrase, realised over the cue's chord.
 * - The contour is in D♭ major steps from the chord's root; the variation follows the phrase number:
 *   statement, sequence (from a higher anchor), inversion, statement. Thin music (a question, a long
 *   wait) sings every other note, held longer; very low energy sings the first three notes and a held
 *   tone; near the peak, passing eighths fill the long gaps.
 * - Strong beats (1 and 3 of a bar) take chord tones. A weak beat may keep a diatonic passing or
 *   neighbour tone if the next note is a chord tone a step away; it lasts at most half a beat.
 *   Otherwise it snaps to the nearest chord tone.
 * - An even phrase asks (it ends open, on the 3rd or 5th); an odd one, and every arrival, answers on
 *   the root with a long note.
 */
function melodyOf(
  cue: MusicCue,
  state: MusicState,
  opts: { low: number; high: number; energy: number; thin: boolean; landing: boolean },
): Sung[] {
  const chord = CHORDS[cue.chord]
  const pcs = chordPitchClasses(chord)
  const isTone = (p: number) => pcs.has(intervalOf(chord, p))
  const snap = (p: number) => nearestTone(p, (i) => pcs.has(i), chord)
  const { low, high, energy, thin, landing } = opts
  const theme = THEMES[cue.theme ?? 'home']
  const variation = (Math.floor(state.count / 2) + state.seed) % 4
  const sign = variation === 2 ? -1 : 1
  const lift = variation === 1 ? 2 : 0

  const lastNote = theme[theme.length - 1] as ThemeNote
  const fragment = !thin && energy < 0.2
  let shape: ThemeNote[] = [...theme]
  if (thin) shape = [...theme.filter((_, k) => k % 2 === 0 && k < theme.length - 1), lastNote]
  else if (fragment) shape = [...theme.slice(0, 3), lastNote]

  // Anchor: the chord's root nearest where the line was.
  const reference = state.last ?? (low + high) / 2
  const anchor = nearestTone(Math.round(reference), (i) => i === 0, chord)
  const anchorIndex = scaleIndex(anchor)
  let targets = shape.map((n) => scalePitch(anchorIndex + sign * n.step + lift))
  if (Math.max(...targets) > high + 2) targets = targets.map((p) => p - 12)
  else if (Math.min(...targets) < low - 2) targets = targets.map((p) => p + 12)

  const strong = (at: number) => Number.isInteger(at) && at % 2 === 0
  const answer = landing || state.count % 2 === 1
  const lastK = shape.length - 1
  const finalPitch: number[] = new Array(shape.length)
  finalPitch[lastK] = answer
    ? nearestTone(targets[lastK] as number, (i) => i === 0, chord)
    : nearestTone(targets[lastK] as number, (i) => (i === 3 || i === 4 || i === 7) && pcs.has(i), chord)
  for (let k = lastK - 1; k >= 0; k--) {
    const p = targets[k] as number
    const next = finalPitch[k + 1] as number
    const passing =
      !strong((shape[k] as ThemeNote).at) && !isTone(p) && isTone(next) && Math.abs(next - p) <= 2
    finalPitch[k] = isTone(p) || passing ? p : snap(p)
  }
  if (landing && (shape[0] as ThemeNote).at < 0.25)
    finalPitch[0] = nearestTone(finalPitch[0] as number, (i) => i === 0, chord)

  const out: Sung[] = shape.map((n, k) => {
    const pitch = finalPitch[k] as number
    const passing = !isTone(pitch)
    return {
      at: n.at,
      pitch,
      passing,
      ring: passing ? BEAT * 0.45 : k === lastK ? 3.4 : n.held ? 3.2 : thin ? 2.8 : 2.0,
      velocity: (landing && k === 0 ? 0.3 : 0.23) * (passing ? 0.8 : 1),
    }
  })

  // Near the peak: a passing eighth before the next note where the line leaps or waits.
  if (energy >= 0.8 && !thin && !fragment) {
    for (let k = out.length - 1; k >= 1; k--) {
      const a = out[k - 1] as Sung
      const b = out[k] as Sung
      const at = b.at - 0.5
      if (b.at - a.at < 1 || at < a.at + 0.5 || strong(at) || a.passing || b.passing) continue
      const pitch = scalePitch(scaleIndex(b.pitch) + (a.pitch > b.pitch ? 1 : -1))
      if (pitch === a.pitch || Math.abs(pitch - b.pitch) > 2) continue
      out.splice(k, 0, {
        at,
        pitch,
        passing: !isTone(pitch),
        ring: isTone(pitch) ? 1.2 : BEAT * 0.45,
        velocity: 0.2,
      })
    }
  }
  return out
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
  // Flourish notes alternate left and right, +-0.25.
  let side = 1
  const flip = () => {
    side = -side
    return side
  }
  const note = (pitch: number, at: number, velocity: number, ring: number): Note => ({
    kind: 'shine',
    pitch,
    at,
    ring,
    velocity,
    bright: 0.35,
    pan: flip() * 0.25,
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
        k === all.length - 1 ? 0.15 : 0.085 + 0.01 * k,
        k === all.length - 1 ? 2.8 : 1.1,
      ),
    )
  }
  const count = kind === 'rise' ? 6 : 9
  const tones = toneRange(chord, kind === 'rise' ? 4 : -3, 40)
  const first = 0
  const notes = tones.slice(first, first + count).map((p, k, all) => {
    const last = k === all.length - 1
    return note(p, at0 + k * SIXTEENTH, last ? 0.15 : 0.075 + 0.05 * (k / all.length), last ? 2.8 : 0.9)
  })
  if (kind === 'peak')
    for (const pitch of CHORDS[chord].voicing.slice(-2))
      notes.push({
        kind: 'halo',
        pitch: pitch + 12,
        at: start + 0.1,
        ring: 3.2,
        velocity: 0.16,
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
  const padVelocity = 0.42 + 0.02 * energy
  voicing.forEach((pitch, v) => {
    // Voices spread left to right, +-0.35.
    const pan = -0.35 + (0.7 * v) / Math.max(1, voicing.length - 1)
    notes.push({
      kind: 'pad',
      pitch,
      pan,
      at: start,
      ring: BAR + 1.4,
      velocity: padVelocity,
      bright: 0,
      rise: entering ? 0.3 : 2.4,
    })
    notes.push({
      kind: 'pad',
      pitch,
      pan,
      at: start + BAR,
      ring: BAR + 2.6,
      velocity: padVelocity * 0.9,
      bright: 0,
      rise: 0.6,
    })
  })
  // High shimmer on the top two voices, only near the peak.
  if (energy >= 0.72 && !tired)
    for (const pitch of voicing.slice(-2)) {
      notes.push({
        kind: 'halo',
        pitch: pitch + 12,
        pan: 0.2,
        at: start + 0.4,
        ring: BAR + 0.8,
        velocity: 0.13 + 0.14 * (energy - 0.72),
        bright: 0,
        rise: 2.2,
      })
      notes.push({
        kind: 'halo',
        pitch: pitch + 12,
        pan: -0.2,
        at: start + BAR + 0.4,
        ring: BAR + 1.5,
        velocity: 0.13 + 0.14 * (energy - 0.72),
        bright: 0,
        rise: 1.2,
      })
    }

  // Bass: one root; then root and a 5th; then a slow walk (root, 5th, octave, 5th).
  const bass = (beat: number, pitch: number, velocity: number, ring: number) =>
    notes.push({ kind: 'main', pitch, at: start + beat * BEAT + 0.02, ring, velocity, bright: 0.05 })
  const isArrival = cue.role === 'arrival' && state.bar === 0
  bass(0, c.bass, isArrival ? 0.42 : 0.36, 5.5)
  if (energy < 0.35) bass(4, c.bass, 0.22, 4)
  else if (energy < 0.62) {
    bass(3, c.bass + 7, 0.2, 2)
    bass(4, c.bass, 0.24, 4)
  } else {
    bass(2, c.bass + 7, 0.2, 1.8)
    bass(4, c.bass + 12, 0.22, 1.8)
    bass(6, c.bass + 7, 0.2, 1.8)
  }

  // Melody: the unit's theme, sung over this chord (see melodyOf).
  const low = 6 + Math.round(energy * 4)
  const high = low + 13
  let last = state.last
  const melodyIn = cue.role !== 'open' || state.bar > 0 || energy >= 0.2
  if (melodyIn) {
    const landing = cue.role === 'arrival' && state.bar === 0
    const line = melodyOf(cue, state, { low, high, energy, thin: tension || tired, landing })
    for (const n of line)
      notes.push({
        kind: 'main',
        pitch: n.pitch,
        at: start + n.at * BEAT + (n.at === 0 ? 0.04 : 0),
        ring: n.ring,
        velocity: n.velocity,
        bright: n.passing ? 0.1 : 0.18,
      })
    // An arrival lands first: the chord's own root, a little louder, on the downbeat.
    if (landing && !line.some((n) => n.at < 0.25)) {
      const root = nearestTone(state.last ?? low + 6, (i) => i === 0, c)
      notes.push({ kind: 'main', pitch: root, at: start + 0.04, ring: 3, velocity: 0.33, bright: 0.2 })
    }
    if (line.length) last = line[line.length - 1]?.pitch
  }

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
        velocity: (tension ? 0.07 : 0.095) + 0.05 * energy,
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

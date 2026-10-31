/**
 * The harmony every sound is drawn from. Pitches are semitones above the tonic, D♭4 (MIDI 61), so the
 * whole app sits in one key and any two sounds agree. Voicings are rootless (3rd and 7th always
 * present) and kept close together, so a change of chord is heard as colour, not as a melody.
 */

export const TONIC_MIDI = 61

export const mod = (x: number, m: number) => ((x % m) + m) % m
export const clamp = (x: number, low: number, high: number) => Math.min(high, Math.max(low, x))
export const midiToHz = (midi: number) => 440 * 2 ** ((midi - 69) / 12)
export const dbToGain = (db: number) => 10 ** (db / 20)

export type ChordId = 'I' | 'IV' | 'iii' | 'vi' | 'ii' | 'V' | 'iv' | 'bVII' | 'bVI' | 'Is11'

export type Chord = {
  /** Root, semitones above the tonic. */
  root: number
  /** Bass note, below the voicing. */
  bass: number
  /** Four-voice rootless voicing, ascending. */
  voicing: readonly number[]
  /** Chord tones stacked in thirds above the root, for rising arpeggios. */
  arpeggio: readonly number[]
}

export const CHORDS: Record<ChordId, Chord> = {
  I: { root: 0, bass: -12, voicing: [4, 7, 11, 14], arpeggio: [0, 4, 7, 11, 14] },
  IV: { root: 5, bass: -7, voicing: [7, 9, 12, 16], arpeggio: [0, 4, 7, 11, 14] },
  iii: { root: 4, bass: -8, voicing: [7, 9, 11, 14], arpeggio: [0, 3, 7, 10, 17] },
  vi: { root: 9, bass: -15, voicing: [7, 11, 12, 16], arpeggio: [0, 3, 7, 10, 14] },
  ii: { root: 2, bass: -10, voicing: [5, 9, 12, 16], arpeggio: [0, 3, 7, 10, 14] },
  V: { root: 7, bass: -17, voicing: [5, 9, 11, 16], arpeggio: [0, 4, 7, 10, 14] },
  iv: { root: 5, bass: -7, voicing: [8, 12, 15, 19], arpeggio: [0, 3, 7, 10, 14] },
  bVII: { root: 10, bass: -14, voicing: [8, 12, 14, 19], arpeggio: [0, 4, 7, 10, 14, 21] },
  // A borrowed colour (A maj7♯11) and the Lydian tonic it resolves to: heard only for a rare insight.
  bVI: { root: 8, bass: -16, voicing: [3, 7, 12, 14], arpeggio: [0, 4, 7, 11, 18] },
  Is11: { root: 0, bass: -12, voicing: [4, 7, 11, 18], arpeggio: [0, 4, 7, 11, 18] },
}

/**
 * A lesson walks this line from its first step to its last: home, then the circle of fifths back
 * towards home. The lesson's end closes it with ii–V–I.
 */
export const PROGRESSION: readonly ChordId[] = ['I', 'IV', 'iii', 'vi', 'ii', 'V']

export function chordAt(step: number | undefined, steps: number | undefined): ChordId {
  if (step === undefined || !steps) return 'I'
  const slot = clamp(Math.floor((step * PROGRESSION.length) / steps), 0, PROGRESSION.length - 1)
  return PROGRESSION[slot] as ChordId
}

/** Interval of a pitch above the chord's root, 0–11. */
export const intervalOf = (chord: Chord, pitch: number) => mod(pitch - chord.root, 12)
const isThird = (interval: number) => interval === 3 || interval === 4

/**
 * Suspended form of a voicing: the 3rd is replaced by the 4th, so the chord is open and asks to
 * resolve. A major 7th moves up to the root (it would make a tritone with the 4th), and a voice
 * that already sits on the 4th is dropped (null) while a 3rd is present, so the suspension has no
 * 3rd at all.
 */
export function suspend(chord: Chord, voicing: readonly number[]): (number | null)[] {
  const hasThird = voicing.some((pitch) => isThird(intervalOf(chord, pitch)))
  return voicing.map((pitch) => {
    const interval = intervalOf(chord, pitch)
    if (isThird(interval)) return pitch + 5 - interval
    if (interval === 11) return pitch + 1
    if (interval === 5 && hasThird) return null
    return pitch
  })
}

/** The inversion of `voicing` that moves the voices least from `previous`, kept in a singing range. */
export function nearest(voicing: readonly number[], previous: readonly number[]): number[] {
  const options: number[][] = [[...voicing]]
  for (let k = 1; k < voicing.length; k++) {
    options.push([...voicing.slice(k), ...voicing.slice(0, k).map((x) => x + 12)].sort((a, b) => a - b))
    options.push(
      [...voicing.slice(voicing.length - k).map((x) => x - 12), ...voicing.slice(0, voicing.length - k)].sort(
        (a, b) => a - b,
      ),
    )
  }
  const fits = (option: number[]) => {
    const top = option.at(-1) as number
    const below = option.at(-2) as number
    // No minor 9th between any two voices: it reads as a wrong note in a soft chord.
    const noMinorNinth = option.every((x, i) => option.every((y, j) => j <= i || y - x !== 13))
    return (option[0] as number) >= 2 && top <= 19 && top - below > 1 && noMinorNinth
  }
  const cost = (option: number[]) => option.reduce((sum, x, i) => sum + Math.abs(x - (previous[i] ?? x)), 0)
  return options
    .filter(fits)
    .reduce((best, option) => (cost(option) < cost(best) ? option : best), [...voicing])
}

/** mulberry32: a small full-period PRNG, so renders and tests can be repeated exactly. */
export function seeded(seed: number) {
  let state = seed | 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

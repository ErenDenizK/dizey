import { CHORDS, type ChordId, mod, PROGRESSION } from './harmony'
import type { Note } from './score'

/**
 * Background music: generated, never a recording and never a loop you can learn by heart. Each
 * section holds one chord of the same harmony the sounds use, so music and sounds always agree:
 * a slow pad, a soft bass, and a few unhurried notes on top that wander by step through the
 * chord's own tones. Inside a lesson the chord is the step's; elsewhere the music walks the
 * lesson's line slowly, home first.
 */

/** Seconds per beat (about 67 bpm) and beats per section. */
export const BEAT = 0.9
export const SECTION_BEATS = 8
export const SECTION = BEAT * SECTION_BEATS

/** Where melody notes may fall, in beats: off the downbeat, never busy. */
const SLOTS = [1.5, 2, 3, 3.5, 4.5, 5, 6, 6.5]

/** The chord of section `n` when no lesson picks one: the lesson line, two sections per chord. */
export const idleChord = (n: number): ChordId =>
  PROGRESSION[mod(Math.floor(n / 2), PROGRESSION.length)] as ChordId

export type Section = { chord: ChordId; notes: Note[] }

/**
 * One section starting at `start` (context time). `last` is the previous melody note, so the line
 * moves by step across sections instead of jumping.
 */
export function composeSection(chord: ChordId, start: number, random: () => number, last?: number) {
  const c = CHORDS[chord]
  const notes: Note[] = []
  // Pad: the voicing swelling in over the downbeat, ringing into the next section for a seamless join.
  for (const pitch of c.voicing)
    notes.push({ kind: 'pad', pitch, at: start, ring: SECTION + 2.6, velocity: 0.5, bright: 0, rise: 2.4 })
  // Bass: the root on beat 1 and, softer, on beat 5.
  notes.push({ kind: 'main', pitch: c.bass, at: start + 0.02, ring: 5.5, velocity: 0.36, bright: 0.05 })
  notes.push({ kind: 'main', pitch: c.bass, at: start + 4 * BEAT, ring: 4, velocity: 0.22, bright: 0.05 })

  // Melody: the chord's tones placed between G4 and G5, two to four notes, moving by step through them.
  const base = mod(c.root + 6, 12) - 6 + 12
  const tones = [
    ...new Set(c.arpeggio.map((interval) => base + interval).map((p) => (p > 19 ? p - 12 : p))),
  ].sort((a, b) => a - b)
  const count = 2 + Math.floor(random() * 3)
  const slots = [...SLOTS].sort(() => random() - 0.5).slice(0, count)
  slots.sort((a, b) => a - b)
  let i =
    last === undefined
      ? Math.floor(random() * tones.length)
      : tones.reduce(
          (best, p, k) => (Math.abs(p - last) < Math.abs((tones[best] as number) - last) ? k : best),
          0,
        )
  let pitch = tones[i] as number
  for (const slot of slots) {
    const move = random() < 0.5 ? -1 : 1
    i = Math.min(tones.length - 1, Math.max(0, i + move))
    pitch = tones[i] as number
    notes.push({
      kind: 'main',
      pitch,
      at: start + slot * BEAT,
      ring: 2.6,
      velocity: 0.26 + random() * 0.06,
      bright: 0.18,
    })
  }
  return { chord, notes, last: pitch }
}

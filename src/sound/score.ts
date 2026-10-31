import {
  CHORDS,
  type ChordId,
  chordAt,
  clamp,
  intervalOf,
  mod,
  nearest,
  suspend,
  TONIC_MIDI,
} from './harmony'

/**
 * What each sound means, as music. Pure: an event and its context become a list of notes; the synth
 * (synth.ts) turns notes into audio. Frequent sounds are the quietest and shortest; rewards are the
 * loudest and longest, so the ear learns the ranking without being told.
 */

export type SoundEvent =
  | 'select'
  | 'land'
  | 'merge'
  | 'wrong'
  | 'correct'
  | 'streak'
  | 'lessonEnd'
  | 'halfway'
  | 'milestone'
  | 'seal'
  | 'secret'
  | 'tap'
  | 'tab'
  | 'toggleOn'
  | 'toggleOff'
  | 'open'
  | 'close'
  | 'step'
  | 'lessonOpen'

/**
 * touch: the interface itself (buttons, tabs, switches, sheets), the quietest and shortest of all;
 * frequent: the lesson's own beats; question: an answer; lesson: a lesson's start and end; reward: rare.
 */
export type Tier = 'touch' | 'frequent' | 'question' | 'lesson' | 'reward'

type Part = {
  /** 'step' follows the lesson's chord at the current step. */
  chord: ChordId | 'step'
  /** one: a single voice; guide: the 3rd and 7th; all: the whole voicing. */
  part?: 'one' | 'guide' | 'all'
  /**
   * one-voice choice: wander between the top voices, zigzag through the voicing per cell, or take
   * the voice the context's index names (a tab always sounds its own note).
   */
  pick?: 'wander' | 'cell' | 'index'
  /**
   * A short figure instead of a chord: voices of the voicing in order (4 and up are an octave
   * higher), `roll` s apart. Used by the interface sounds: a switch rises when it turns on and falls
   * when it turns off.
   */
  line?: number[]
  /** piano: the electric piano; glass: the soft bright voice of the reward arpeggios. */
  voice?: 'piano' | 'glass'
  /** resolve: the 4th falls to the 3rd after RESOLVE s; hold: the chord stays open. */
  sus?: 'resolve' | 'hold'
  velocity?: number
  /** Bass level relative to the chord, 0 for none. */
  bass?: number
  /** Seconds between voices, lowest first. */
  roll?: number
  /** Ring time to silence, s. */
  ring?: number
  /** Slow pad swell under the chord, relative level. */
  bloom?: number
  /** Octave shimmer over the top two voices, relative level. */
  halo?: number
  /** A rising arpeggio of chord tones. */
  arpeggio?: { count: number; from?: number; at?: number }
  /** A soft contact thump, relative level. */
  thump?: number
}

export type EventSpec = {
  tier: Tier
  /** Loudness target, LUFS momentary max at full volume (calibrated into TRIM). */
  loudness: number
  /** Low-pass cut-off, Hz: frequent sounds are darker. */
  cutoff: number
  /** Reverb send. */
  wet: number
  /** Seconds before the next chord of a multi-chord event. */
  gap?: number
  /**
   * false: this sound never lifts the pedal on what is still ringing. Interface sounds are short and
   * quiet, and a tap must not cut off the lesson end that is still sounding.
   */
  pedal?: false
  parts: Part[]
}

const DEFAULT_PART = {
  part: 'all',
  velocity: 0.44,
  roll: 0.035,
  bass: 0.45,
  ring: 2,
  bloom: 0,
  halo: 0,
} as const
const RESOLVE = 0.38
const ARPEGGIO_STEP = 0.14
/** Each arpeggio note comes a little later than the last: unhurried, never a coin. */
const ARPEGGIO_SLOWING = 1.07
/** Voices for consecutive cells: a zigzag, never a ladder. */
const CELL_ORDER = [3, 1, 2, 0]
/** Interface sounds: a short, soft touch of the chord on screen. */
const TOUCH = { bass: 0, roll: 0.055, velocity: 0.42 } as const

export const EVENTS: Record<SoundEvent, EventSpec> = {
  select: {
    tier: 'frequent',
    loudness: -45,
    cutoff: 4200,
    wet: 0.8,
    parts: [{ chord: 'step', part: 'one', pick: 'wander', bass: 0, ring: 1.3, velocity: 0.5 }],
  },
  land: {
    tier: 'frequent',
    loudness: -43,
    cutoff: 3400,
    wet: 0.8,
    parts: [{ chord: 'step', part: 'one', pick: 'cell', bass: 0.35, thump: 0.4, ring: 1.7, velocity: 0.55 }],
  },
  merge: {
    tier: 'frequent',
    loudness: -41,
    cutoff: 3800,
    wet: 0.9,
    parts: [{ chord: 'step', part: 'guide', bass: 0, roll: 0.06, ring: 2, velocity: 0.48 }],
  },
  wrong: {
    tier: 'question',
    loudness: -37,
    cutoff: 2100,
    wet: 1,
    parts: [{ chord: 'step', sus: 'hold', roll: 0.045, bass: 0.4, ring: 2.2, bloom: 0.2, velocity: 0.42 }],
  },
  correct: {
    tier: 'question',
    loudness: -32,
    cutoff: 4600,
    wet: 1,
    parts: [{ chord: 'step', sus: 'resolve', ring: 3, bloom: 0.5, velocity: 0.46 }],
  },
  streak: {
    tier: 'question',
    loudness: -31,
    cutoff: 5200,
    wet: 1.1,
    parts: [
      {
        chord: 'step',
        sus: 'resolve',
        ring: 3.2,
        bloom: 0.5,
        velocity: 0.46,
        arpeggio: { count: 3, from: 2, at: 0.62 },
      },
    ],
  },
  lessonEnd: {
    tier: 'lesson',
    loudness: -28,
    cutoff: 5000,
    wet: 1.1,
    gap: 0.9,
    parts: [
      { chord: 'ii', ring: 1.6 },
      { chord: 'V', ring: 1.6 },
      { chord: 'I', ring: 4.2, bloom: 0.8 },
    ],
  },
  halfway: {
    tier: 'reward',
    loudness: -27,
    cutoff: 5600,
    wet: 1.2,
    parts: [
      { chord: 'iv', ring: 2, bloom: 0.3, arpeggio: { count: 5 } },
      { chord: 'I', ring: 4.8, bloom: 0.8, halo: 0.5 },
    ],
  },
  milestone: {
    tier: 'reward',
    loudness: -26,
    cutoff: 6000,
    wet: 1.3,
    gap: 1,
    parts: [
      { chord: 'iv', ring: 1.8 },
      { chord: 'bVII', ring: 2.2, bloom: 0.3, arpeggio: { count: 6 } },
      { chord: 'I', ring: 5, bloom: 1, halo: 0.8 },
    ],
  },
  // A mastery seal closes: the dominant, held open, rises into home.
  seal: {
    tier: 'reward',
    loudness: -27.5,
    cutoff: 5600,
    wet: 1.2,
    parts: [
      { chord: 'V', sus: 'hold', ring: 1.8, bloom: 0.3, arpeggio: { count: 4 } },
      { chord: 'I', ring: 5.8, bloom: 0.8, halo: 0.4 },
    ],
  },
  // A hidden insight found: a colour heard nowhere else (♭VI to a Lydian tonic).
  secret: {
    tier: 'reward',
    loudness: -27,
    cutoff: 6400,
    wet: 1.3,
    parts: [
      { chord: 'bVI', ring: 2.4, bloom: 0.5, arpeggio: { count: 5 } },
      { chord: 'Is11', ring: 4.6, bloom: 0.9, halo: 0.8 },
    ],
  },
  tap: {
    tier: 'touch',
    loudness: -50,
    cutoff: 2600,
    wet: 0.45,
    pedal: false,
    parts: [{ ...TOUCH, chord: 'step', part: 'one', pick: 'wander', ring: 0.45, thump: 0.25, velocity: 0.4 }],
  },
  tab: {
    tier: 'touch',
    loudness: -47,
    cutoff: 5200,
    wet: 0.7,
    pedal: false,
    parts: [{ ...TOUCH, chord: 'step', part: 'one', pick: 'index', voice: 'glass', ring: 1 }],
  },
  toggleOn: {
    tier: 'touch',
    loudness: -47,
    cutoff: 4200,
    wet: 0.6,
    pedal: false,
    parts: [{ ...TOUCH, chord: 'step', line: [1, 3], ring: 0.8 }],
  },
  toggleOff: {
    tier: 'touch',
    loudness: -48,
    cutoff: 2400,
    wet: 0.5,
    pedal: false,
    parts: [{ ...TOUCH, chord: 'step', line: [3, 1], ring: 0.6 }],
  },
  open: {
    tier: 'touch',
    loudness: -46,
    cutoff: 4400,
    wet: 0.8,
    pedal: false,
    parts: [{ ...TOUCH, chord: 'step', line: [0, 1, 2, 3], roll: 0.035, ring: 1, bloom: 0.25 }],
  },
  close: {
    tier: 'touch',
    loudness: -49,
    cutoff: 2600,
    wet: 0.6,
    pedal: false,
    parts: [{ ...TOUCH, chord: 'step', line: [3, 1], roll: 0.045, ring: 0.6 }],
  },
  step: {
    tier: 'touch',
    loudness: -47,
    cutoff: 3000,
    wet: 0.8,
    parts: [{ chord: 'step', part: 'guide', bass: 0.5, roll: 0.03, ring: 1.2, velocity: 0.4 }],
  },
  // Opening a lesson is one deliberate moment: as loud as an answer, well under the lesson's end.
  lessonOpen: {
    tier: 'question',
    loudness: -36,
    cutoff: 5000,
    wet: 1,
    parts: [{ chord: 'I', roll: 0.05, ring: 2.4, bloom: 0.4, arpeggio: { count: 3, from: 1, at: 0.22 } }],
  },
}

/**
 * main: the instrument voice; pad: a slow swell; halo: an octave shimmer; shine: an arpeggio note;
 * thump: the felt contact of a value landing.
 */
export type NoteKind = 'main' | 'pad' | 'halo' | 'shine' | 'thump'

export type Note = {
  kind: NoteKind
  /** Semitones above the tonic. */
  pitch: number
  /** Start, s. */
  at: number
  /** Ring time, s. */
  ring: number
  velocity: number
  /** 0–1: how much upper partial the strike has. */
  bright: number
  /** Swell time for pads, s. */
  rise?: number
}

export type SoundContext = {
  /** Current lesson step and the lesson's length: they choose the chord. */
  step?: number
  steps?: number
  /** Cell or option number: it chooses the voice, so the same cell always sounds the same. */
  index?: number
  /**
   * The chord the background music is holding outside a lesson: a 'step' sound plays it instead of
   * the home chord, so a tap never sounds against the music.
   */
  chord?: ChordId
}

export type Plan = {
  event: SoundEvent
  notes: Note[]
  /** Last moment anything is still ringing, s. */
  end: number
  /**
   * The harmony this event leaves ringing ('*' for a multi-chord event). A new event with a
   * different harmony fades the old tails, as a pianist lifts the pedal.
   */
  harmony: string
  /** Chords in the order they sound; a suspension is named with ':sus'. */
  chords: string[]
}

/** Higher notes ring shorter, as on a real instrument. */
const ringScale = (pitch: number) => clamp(1 - (TONIC_MIDI + pitch - 66) * 0.012, 0.6, 1.25)

export function createScore(random: () => number) {
  let lastWander = -1
  let nextCell = 0

  function plan(event: SoundEvent, context: SoundContext = {}, start = 0): Plan {
    const spec = EVENTS[event]
    const notes: Note[] = []
    const chords: string[] = []
    let at = start
    let end = start
    let previous: number[] | null = null
    let harmony = '*'
    const add = (note: Note) => {
      note.ring *= ringScale(note.pitch)
      notes.push(note)
      end = Math.max(end, note.at + note.ring)
    }

    for (const raw of spec.parts) {
      const part = { ...DEFAULT_PART, ...raw }
      const id =
        part.chord !== 'step'
          ? part.chord
          : context.steps
            ? chordAt(context.step, context.steps)
            : (context.chord ?? chordAt(context.step, context.steps))
      const chord = CHORDS[id]
      const voicing: number[] = previous ? nearest(chord.voicing, previous) : [...chord.voicing]
      const voiceKind: NoteKind = part.voice === 'glass' ? 'shine' : 'main'
      const brightFor = (pitch: number) =>
        [0, 3, 4, 7, 10, 11].includes(intervalOf(chord, pitch)) ? 0.3 : 0.26
      if (spec.parts.length === 1) harmony = id + (part.sus === 'hold' ? ':sus' : '')
      if (spec.pedal === false) harmony = '-'
      if (part.bass)
        add({
          kind: 'main',
          pitch: chord.bass,
          at,
          ring: part.ring * 1.1,
          velocity: part.velocity * part.bass,
          bright: 0.05,
        })
      if (part.thump) notes.push({ kind: 'thump', pitch: 0, at, ring: 0.04, velocity: part.thump, bright: 0 })

      let settled: number[] = voicing
      let swellAt = at
      if (part.part === 'one') {
        let voice: number
        if (part.pick === 'wander') {
          // One of the top three voices, never the same twice in a row, so taps never climb a scale.
          if (context.index !== undefined) voice = mod(context.index, 3)
          else {
            voice = Math.floor(random() * 2)
            if (voice >= lastWander) voice += 1
          }
          lastWander = voice
          voice += 1
        } else if (part.pick === 'index') {
          voice = mod(context.index ?? 0, voicing.length)
        } else {
          const cell = context.index ?? nextCell++
          voice = CELL_ORDER[mod(cell, CELL_ORDER.length)] as number
        }
        add({
          kind: voiceKind,
          pitch: voicing[voice] as number,
          at,
          ring: part.ring,
          velocity: part.velocity,
          bright: 0.3,
        })
        chords.push(id)
      } else if (part.line) {
        part.line.forEach((voice, i) => {
          add({
            kind: voiceKind,
            pitch: (voicing[mod(voice, voicing.length)] as number) + 12 * Math.floor(voice / voicing.length),
            at: at + i * part.roll,
            ring: part.ring,
            // Each later note a little softer: a gesture, not a scale.
            velocity: part.velocity * 0.92 ** i,
            bright: 0.28,
          })
        })
        chords.push(id)
      } else if (part.part === 'guide') {
        const guide = voicing.filter((pitch) => [3, 4, 10, 11].includes(intervalOf(chord, pitch)))
        guide.forEach((pitch, i) => {
          add({
            kind: 'main',
            pitch,
            at: at + i * part.roll,
            ring: part.ring,
            velocity: part.velocity,
            bright: 0.28,
          })
        })
        chords.push(id)
      } else {
        const open = part.sus ? suspend(chord, voicing) : voicing
        const resolveAt = at + RESOLVE
        open.forEach((pitch, i) => {
          const voiceAt = at + i * part.roll
          const target = voicing[i] as number
          if (pitch === target) {
            add({
              kind: 'main',
              pitch,
              at: voiceAt,
              ring: part.ring,
              velocity: part.velocity,
              bright: part.sus === 'hold' ? 0.12 : brightFor(pitch),
            })
          } else if (part.sus === 'resolve') {
            if (pitch !== null)
              add({
                kind: 'main',
                pitch,
                at: voiceAt,
                ring: RESOLVE + 0.16,
                velocity: part.velocity,
                bright: 0.3,
              })
            add({
              kind: 'main',
              pitch: target,
              at: resolveAt + i * 0.012,
              ring: part.ring - RESOLVE,
              velocity: part.velocity * 0.85,
              bright: 0.26,
            })
          } else if (pitch !== null) {
            add({ kind: 'main', pitch, at: voiceAt, ring: part.ring, velocity: part.velocity, bright: 0.12 })
          }
        })
        if (part.sus) chords.push(`${id}:sus`)
        if (part.sus === 'resolve') swellAt = resolveAt
        if (part.sus === 'hold') settled = open.filter((pitch): pitch is number => pitch !== null)
        if (part.sus !== 'hold') chords.push(id)
      }

      if (part.bloom)
        for (const pitch of settled)
          add({
            kind: 'pad',
            pitch,
            at: swellAt,
            ring: part.ring * 1.1,
            velocity: part.velocity * part.bloom,
            bright: 0,
            rise: 0.6,
          })
      if (part.halo)
        for (const pitch of settled.slice(-2))
          add({
            kind: 'halo',
            pitch: pitch + 12,
            at: swellAt + 0.15,
            ring: part.ring * 1.1,
            velocity: part.velocity * part.halo * 0.5,
            bright: 0,
            rise: 0.9,
          })

      let next = at + (spec.gap ?? 0.9)
      if (part.arpeggio) {
        const { count, from = 0 } = part.arpeggio
        // Arpeggio root between B♭3 and A4, whatever the chord.
        const base = mod(chord.root + 3, 12) - 3
        const tones = chord.arpeggio.map(
          (interval) => base + (part.sus && (interval === 3 || interval === 4) ? 5 : interval),
        )
        let noteAt = at + (part.arpeggio.at ?? 0.06)
        let step = ARPEGGIO_STEP
        for (let i = 0; i < count; i++) {
          const last = i === count - 1
          add({
            kind: 'shine',
            pitch: tones[from + i] as number,
            at: noteAt,
            ring: last ? 2.4 : 1.6,
            velocity: 0.38,
            bright: 0.5,
          })
          if (!last) {
            noteAt += step
            step *= ARPEGGIO_SLOWING
          }
        }
        next = noteAt + step * 1.4
      }
      previous = settled
      at = next
    }
    return { event, notes, end, harmony, chords }
  }

  return { plan }
}

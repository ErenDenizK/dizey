import type { Flourish, MusicCue } from './form'
import type { ChordId } from './harmony'
import { BAR, BEAT, composeSection, freshState, type MusicState, SECTION } from './music'
import type { Note } from './score'

/**
 * The music conductor: a transport on a continuous beat grid, and the state machine that writes
 * music onto it one bar at a time. It knows nothing about Web Audio: time comes from an injected
 * clock and sound goes to an injected sink, so the scheduling is testable with a fake of each.
 *
 * - The grid is BEAT = 60/72 s, bars of 4 beats, and never restarts while music plays. A late tick
 *   skips to the next grid point; it never re-anchors at "now".
 * - A bar is written about LOOKAHEAD ahead, its notes grouped per beat (the pad rides with beat 0),
 *   so a change can drop what has not started yet.
 * - A change (`request`) takes effect on the next grid beat: groups from there on are dropped,
 *   ringing ones are released from there (tau 0.3), and a new phrase begins on that beat. The
 *   musical state carries over; the piece continues.
 */

/** How far ahead a bar is written, s. */
export const LOOKAHEAD = 2.4
/** Time constant of the old chord's release at a change, s. */
export const CHANGE_TAU = 0.3
/** Time constant of the fade under a lesson end or a reward, s. */
export const FADE_TAU = 0.8
/** Grid points closer than this to "now" are too late to write. */
const MIN_AHEAD = 0.02
const EPS = 1e-6

export type MusicSink = {
  /** Plays a group of notes that belongs to grid time `at`. */
  play(notes: Note[], at: number): void
  /** Drops groups with start >= `at`, releases ringing ones from `at` with time constant `tau`. */
  cut(at: number, tau: number): void
}

export type ConductorOptions = {
  now: () => number
  sink: MusicSink
  random: () => number
  /** The cue to play for phrase number `phrase` (counted from the start of the music). */
  wanted: (phrase: number) => MusicCue
}

type Phrase = { bars: Note[][]; index: number; chord: ChordId }

export function createConductor(options: ConductorOptions) {
  const { now, sink, random, wanted } = options
  let running = false
  let origin = 0
  /** Start of the next bar to write. */
  let nextAt = 0
  let phrase: Phrase | null = null
  let phraseNumber = 0
  let entering = true
  let flourish: Flourish | undefined
  /** Lesson end or reward: no music until this context time. 0 = not paused. */
  let pausedUntil = 0
  let seed = 0
  let state: MusicState = freshState(0)
  let written: { at: number; chord: ChordId }[] = []

  /** First grid beat at or after `time`. */
  const gridAt = (time: number) => origin + Math.ceil((time - origin) / BEAT - EPS) * BEAT

  function start() {
    running = true
    origin = now() + 0.05
    nextAt = origin
    phrase = null
    entering = true
  }

  function writeBar(notes: Note[], at: number, chord: ChordId) {
    const groups = new Map<number, Note[]>()
    for (const note of notes) {
      const beat = Math.min(3, Math.max(0, Math.floor((note.at - at) / BEAT + EPS)))
      groups.set(beat, [...(groups.get(beat) ?? []), note])
    }
    for (const [beat, group] of [...groups].sort((a, b) => a[0] - b[0])) sink.play(group, at + beat * BEAT)
    written = [...written.filter((w) => w.at > now() - SECTION * 2), { at, chord }]
  }

  /** Writes the bars that are due. Call every few hundred ms while music is wanted. */
  function tick() {
    const t = now()
    if (t < pausedUntil) return
    if (pausedUntil) {
      // Back from a lesson end or reward: the same grid, on the next beat, with a soft pad.
      pausedUntil = 0
      nextAt = gridAt(t + MIN_AHEAD)
      phrase = null
      entering = true
    }
    if (!running) start()
    while (nextAt - t <= LOOKAHEAD) {
      if (nextAt < t + MIN_AHEAD) {
        // Late: skip to the next grid point and begin a phrase there.
        nextAt = gridAt(t + MIN_AHEAD)
        phrase = null
        entering = true
        continue
      }
      if (!phrase) {
        const cue: MusicCue = { ...wanted(phraseNumber), ...(flourish ? { flourish } : {}) }
        flourish = undefined
        const composed = composeSection(cue, nextAt, random, state, entering)
        entering = false
        state = composed.state
        const split = nextAt + BAR - EPS
        phrase = {
          bars: [composed.notes.filter((n) => n.at < split), composed.notes.filter((n) => n.at >= split)],
          index: 0,
          chord: cue.chord,
        }
        phraseNumber++
      }
      writeBar(phrase.bars[phrase.index] ?? [], nextAt, phrase.chord)
      phrase.index++
      nextAt += BAR
      if (phrase.index >= phrase.bars.length) phrase = null
    }
  }

  return {
    tick,

    /**
     * A new cue is wanted (a step changed): it takes effect on the next beat. `flourish` plays on
     * that beat. Does nothing audible when the music is not playing.
     */
    request(answer?: Flourish) {
      state = { ...state, bar: 0 }
      if (!running || pausedUntil) return
      const at = gridAt(now() + MIN_AHEAD)
      sink.cut(at, CHANGE_TAU)
      written = written.filter((w) => w.at < at - EPS)
      phrase = null
      nextAt = at
      entering = true
      flourish = answer
      tick()
    },

    /** A lesson end or reward is ringing: fade all music and stay out until `until`. */
    fade(until: number) {
      sink.cut(now(), FADE_TAU)
      phrase = null
      written = []
      flourish = undefined
      pausedUntil = Math.max(until, now() + 0.01)
    },

    /** Cancels a pause (a new lesson opens over a lesson end still ringing). */
    resume() {
      // Still "paused" for the next tick, which then re-enters on the grid with a soft pad.
      if (pausedUntil) pausedUntil = Number.MIN_VALUE
    },

    /** Stops the music with a fade; the grid restarts the next time it plays. */
    stop(tau = FADE_TAU) {
      if (!running) {
        pausedUntil = 0
        return
      }
      sink.cut(now(), tau)
      running = false
      phrase = null
      written = []
      pausedUntil = 0
      flourish = undefined
    },

    /** A new lesson plays its own motif; leaving one returns to the home walk. State otherwise carries over. */
    setSeed(next: number) {
      if (next === seed) return
      seed = next
      state = { ...freshState(next), ...(state.last === undefined ? {} : { last: state.last }) }
    },

    /** The chord the music holds at `time`, or undefined when it is not playing. */
    chordAt(time: number): ChordId | undefined {
      if (!running || now() < pausedUntil) return undefined
      let chord: ChordId | undefined
      for (const w of written) if (w.at <= time + 0.05) chord = w.chord
      return chord
    },

    get playing() {
      return running
    },
    get paused() {
      return now() < pausedUntil
    },
    get grid() {
      return { origin, beat: BEAT }
    },
  }
}

export type Conductor = ReturnType<typeof createConductor>

/** What the learner's answers do to the music (shared by the player and the listening-sample renderer). */
export const STREAK_ENERGY = 0.08
export const STREAK_ENERGY_CAP = 0.2
export const WRONG_ENERGY = -0.15

export function createLearner() {
  /** The last answer on the step just left; a step change uses it and clears it. */
  let last: 'correct' | 'streak' | 'wrong' | undefined
  /** First-try answers in the current streak. */
  let run = 0
  /** The step that follows a wrong answer plays a little softer. */
  let softer: number | undefined
  return {
    /** Feed every sound the lesson plays; only the answers matter. */
    heard(event: string) {
      if (event === 'wrong') {
        last = 'wrong'
        run = 0
      } else if ((event === 'correct' || event === 'streak') && last !== 'wrong') {
        // A correct answer after a miss on the same step is not a first-try one.
        last = event
        run++
      }
    },
    /** A step change: the flourish it opens with (or none). */
    stepped(step: number | undefined, role: string | undefined, fromLesson: boolean): Flourish | undefined {
      let flourish: Flourish | undefined
      if (fromLesson && step !== undefined) {
        if (last === 'streak') flourish = 'peak'
        else if (last === 'correct') flourish = 'rise'
        else if (role === 'arrival') flourish = 'cascade'
        softer = last === 'wrong' ? step : undefined
      } else softer = undefined
      last = undefined
      return flourish
    },
    /** A new lesson starts clean. */
    reset() {
      last = undefined
      run = 0
      softer = undefined
    },
    /** Planned energy adjusted for how the learner is doing. */
    energy(planned: number, step: number | undefined) {
      const lift = Math.min(STREAK_ENERGY_CAP, STREAK_ENERGY * run)
      const soften = step !== undefined && step === softer ? WRONG_ENERGY : 0
      return Math.min(1, Math.max(0, planned + lift + soften))
    },
  }
}

export type Learner = ReturnType<typeof createLearner>

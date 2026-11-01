import { type ChordId, clamp, seeded } from './harmony'

/**
 * A lesson's music has a form, like a piece: it is planned once for the whole lesson, so it never
 * marks time. The lesson is cut into acts. An act opens on a stable chord, travels, and ends on a
 * chord that asks to come home; the step after a question answers it (the solved question is heard
 * as a small resolution). Energy rises across the whole lesson and again inside every act, and the
 * lesson's last step leaves the music open on IV, which the lesson end (ii–V–I) finally resolves.
 *
 * The plan names the chord of every step. Sounds and music both take it from here, so they agree.
 */

export type StepKind = 'explain' | 'choice' | 'keypad' | 'summary'

/**
 * open: the first step; travel: moving away; tension: a question, held open while the learner thinks;
 * arrival: the first step of an act, a small resolution; coda: the last step, the peak before the end.
 */
export type Role = 'open' | 'travel' | 'tension' | 'arrival' | 'coda'

export type MusicCue = {
  chord: ChordId
  /** 0–1: how many layers play and how high the line sits. */
  energy: number
  role: Role
  /** Act number, from 0. */
  act: number
  /** Same for every step of one lesson: picks the lesson's own motif. */
  seed: number
}

/** Chords that travel: never home (kept for arrivals) and never the dominant (kept for cadences). */
const TRAVEL: readonly ChordId[] = ['IV', 'vi', 'ii', 'iii']
/** Before a cadence the line should sit on a pre-dominant. */
const BEFORE_CADENCE: readonly ChordId[] = ['ii', 'IV']
/** Longest act without a question before it is split in two. */
const LONGEST_ACT = 5

const isQuestion = (kind: StepKind) => kind === 'choice' || kind === 'keypad'

/** A small stable hash, so a lesson always gets the same motif. */
export function hashOf(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

/** First step of every act. */
export function actStarts(kinds: readonly StepKind[]): number[] {
  const n = kinds.length
  const starts = [0]
  for (let i = 1; i < n; i++)
    if (isQuestion(kinds[i - 1] as StepKind) && !isQuestion(kinds[i] as StepKind)) starts.push(i)
  // Long stretches of explanation are cut in halves, so the music still breathes.
  const split: number[] = []
  starts.forEach((start, k) => {
    const end = starts[k + 1] ?? n
    split.push(start)
    let length = end - start
    let at = start
    while (length > LONGEST_ACT) {
      const pieces = Math.ceil(length / LONGEST_ACT)
      const size = Math.round(length / pieces)
      at += size
      length -= size
      split.push(at)
    }
  })
  return split
}

export function planLesson(kinds: readonly StepKind[], seed = 1): MusicCue[] {
  const n = kinds.length
  if (!n) return []
  const random = seeded(seed)
  const starts = actStarts(kinds)
  const chords: ChordId[] = new Array(n)
  const roles: Role[] = new Array(n)
  const actOf: number[] = new Array(n)
  const recent: ChordId[] = []
  const pick = (options: readonly ChordId[], avoid: readonly (ChordId | undefined)[]) => {
    const allowed = options.filter((c) => !avoid.includes(c))
    const pool = allowed.length ? allowed : options
    // The least recently heard chord wins; ties are broken by the seed.
    const age = (c: ChordId) => {
      const at = recent.lastIndexOf(c)
      return at < 0 ? Number.POSITIVE_INFINITY : recent.length - at
    }
    const best = Math.max(...pool.map(age))
    const fresh = pool.filter((c) => age(c) === best)
    return fresh[Math.floor(random() * fresh.length)] as ChordId
  }

  starts.forEach((start, act) => {
    const end = starts[act + 1] ?? n
    const last = act === starts.length - 1
    const afterQuestion = start > 0 && isQuestion(kinds[start - 1] as StepKind)
    // How the act opens: home, after a solved question home again; after a split, a softer landing.
    const opening: ChordId = start === 0 || afterQuestion ? 'I' : 'vi'
    // How it closes: the dominant, or in later acts the minor iv (a plagal close, warmer and darker).
    // The last act stays open on IV for the lesson end's ii–V–I.
    const nextOpening: ChordId | undefined = last
      ? undefined
      : isQuestion(kinds[end - 1] as StepKind) && !isQuestion(kinds[end] as StepKind)
        ? 'I'
        : 'vi'
    const closing: ChordId = last ? 'IV' : nextOpening === 'I' && act >= 2 && random() < 0.5 ? 'iv' : 'V'
    for (let i = start; i < end; i++) {
      actOf[i] = act
      let chord: ChordId
      // The lesson's last step always leaves the music open on IV, even alone in its act.
      if (i === start && last && i > 0 && end - start === 1) chord = 'IV'
      else if (i === start) chord = opening
      else if (i === end - 1) chord = closing
      else {
        const beforeClose = i === end - 2
        const options = beforeClose && closing !== 'IV' ? BEFORE_CADENCE : TRAVEL
        chord = pick(options, [chords[i - 1], beforeClose ? closing : undefined])
      }
      // A one-step final act lands on its opening; it must not repeat the step before it.
      if (i === start && i === end - 1 && last && chord === chords[i - 1]) chord = 'IV'
      if (i > 0 && chord === chords[i - 1]) chord = pick(TRAVEL, [chords[i - 1], chords[i + 1]])
      chords[i] = chord
      recent.push(chord)
      roles[i] =
        i === n - 1
          ? 'coda'
          : i === 0
            ? 'open'
            : isQuestion(kinds[i] as StepKind)
              ? 'tension'
              : i === start
                ? 'arrival'
                : 'travel'
    }
  })

  return chords.map((chord, i) => {
    const act = actOf[i] as number
    const start = starts[act] as number
    const end = starts[act + 1] ?? n
    const whole = n > 1 ? i / (n - 1) : 1
    const local = end - start > 1 ? (i - start) / (end - start - 1) : 0
    const energy = clamp(0.12 + 0.62 * whole + 0.26 * local, 0, 1)
    return { chord, energy: Math.round(energy * 100) / 100, role: roles[i] as Role, act, seed }
  })
}

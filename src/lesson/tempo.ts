import type { Beat, Lesson, Step } from '../content/lessons/types'
import type { TempoClass } from '../engine/tokens'

/** Beat kinds whose numbers travel and combine: their first showing in a lesson teaches. */
const CALCULATING = new Set<Beat['kind']>(['det2', 'sarrus', 'expand', 'rowOps'])

function kindsOf(beat: Beat | undefined): Beat['kind'][] {
  if (!beat) return []
  if (beat.kind === 'sequence') return beat.beats.flatMap(kindsOf)
  // Lighting the Sarrus diagonals calculates nothing: it is a layout beat.
  if (beat.kind === 'sarrus' && beat.diagonalsOnly) return ['frames']
  return [beat.kind]
}

function beatsOf(step: Step): (Beat | undefined)[] {
  if (step.kind === 'explain') return [step.beat]
  return 'reveal' in step ? [step.reveal] : []
}

/**
 * A beat's tempo class comes from what it teaches (old tempoClass): a calculation the lesson has not
 * shown before plays at the teaching pace; one it has already shown plays at the repeat pace; marks,
 * labels and layout play quick. A wrong answer's reveal always teaches.
 */
export function tempoClassOf(
  lesson: Lesson,
  index: number,
  beat: Beat | undefined,
  wrong = false,
): TempoClass {
  const kinds = kindsOf(beat).filter((kind) => CALCULATING.has(kind))
  if (!kinds.length) return 'quick'
  if (wrong) return 'teach'
  const seen = new Set(lesson.steps.slice(0, index).flatMap(beatsOf).flatMap(kindsOf))
  return kinds.every((kind) => seen.has(kind)) ? 'repeat' : 'teach'
}

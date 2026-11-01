import { GENERATED_EXAM, type Option, type OptionKey, optionKeys, type Question } from '../types'
import { renderValue, sameValue } from './format'
import { genericFit } from './phone-fit'
import { hashSeed, Rng } from './prng'
import type { DraftDistractor, Family, GeneratedMeta, OptionValue } from './types'

/** Exam-sized: integers up to a few hundred, fractions with small denominators. */
export const MAX_NUMERATOR = 500n
export const MAX_DENOMINATOR = 64n
const MAX_ATTEMPTS = 400

function tidy(value: OptionValue): boolean {
  const numbers = value.kind === 'num' ? [value.value] : value.roots
  return numbers.every((n) => (n.num < 0n ? -n.num : n.num) <= MAX_NUMERATOR && n.den <= MAX_DENOMINATOR)
}

/**
 * Builds one question from a family and a seed. Deterministic: the same (family, seed) always gives the same
 * question. A draft whose options collide, look ugly, or do not fit a phone is thrown away and the family is
 * asked again with the next attempt number, which is part of the stream seed.
 */
export function buildQuestion(family: Family, seed: number, meta: GeneratedMeta): Question {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const rng = new Rng(hashSeed(family.id, seed, attempt))
    const draft = family.generate(rng)
    if (!draft || !tidy(draft.correct)) continue

    const chosen: DraftDistractor[] = []
    for (const candidate of rng.shuffle(draft.distractors)) {
      if (chosen.length === 4) break
      if (sameValue(candidate.value, draft.correct) || !tidy(candidate.value)) continue
      if (chosen.some((c) => sameValue(c.value, candidate.value))) continue
      chosen.push(candidate)
    }
    if (chosen.length < 4) continue

    const laid = rng.shuffle([
      { value: draft.correct, distractor: null as DraftDistractor | null },
      ...chosen.map((c) => ({ value: c.value, distractor: c as DraftDistractor | null })),
    ])
    const options = laid.map(({ value, distractor }, i): Option => {
      const key = optionKeys[i] as OptionKey
      return distractor
        ? {
            key,
            content: [renderValue(value)],
            errorType: distractor.errorType,
            feedback: distractor.feedback,
          }
        : { key, content: [renderValue(value)] }
    }) as unknown as Question['options']
    const answer = optionKeys[laid.findIndex((l) => l.distractor === null)] as OptionKey

    const question: Question = {
      id: meta.id,
      node: family.node,
      ...(family.alsoNodes ? { alsoNodes: family.alsoNodes } : {}),
      source: { exam: GENERATED_EXAM, item: meta.item },
      stem: draft.stem,
      options,
      answer,
      explanation: draft.explanation,
    }
    if (genericFit(question).length > 0) continue
    return question
  }
  throw new Error(`Family ${family.id} found no valid draft for seed ${seed}`)
}

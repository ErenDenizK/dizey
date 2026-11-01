import type { Rational } from '../../../lib/math/rational'
import type { Block, NodeId, Question } from '../types'
import type { Rng } from './prng'

/** What an option says: a number, or the set of k values of a "k = p ya da k = q" answer. */
export type OptionValue =
  | { readonly kind: 'num'; readonly value: Rational }
  | { readonly kind: 'set'; readonly roots: readonly Rational[] }

/** One wrong option: the value, the named student mistake that produces it, and honest Turkish feedback. */
export interface DraftDistractor {
  readonly value: OptionValue
  /** Short English slug naming the mistake; the verifier has a model for every slug. */
  readonly errorType: string
  readonly feedback: string
}

/** A generated item before options are laid out. */
export interface Draft {
  readonly stem: readonly Block[]
  readonly correct: OptionValue
  /** More candidates than needed is fine; the assembler keeps four distinct, tidy ones. */
  readonly distractors: readonly DraftDistractor[]
  /** Turkish worked solution, shortest exam route first. */
  readonly explanation: string
}

/** A family of generated questions on one skill. `generate` may return null to be re-drawn. */
export interface Family {
  /** Slug used in ids: `v1-gen-<id>-NN`. */
  readonly id: string
  readonly node: NodeId
  readonly alsoNodes?: readonly NodeId[]
  generate(rng: Rng): Draft | null
}

export interface GeneratedMeta {
  readonly id: string
  /** Number printed in `source.item`. */
  readonly item: number
}

export type { Question }

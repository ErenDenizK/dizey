import type { Question } from './types'
import { vize1Summer2024 } from './vize1-2024-summer'
import { vize1PracticeA } from './vize1-practice-a'
import { vize1PracticeB } from './vize1-practice-b'

export type { Block, NodeId, Option, OptionKey, Question, QuestionSource } from './types'

/** Every question in the bank. Ids are stable once merged. */
export const questions: readonly Question[] = [...vize1Summer2024, ...vize1PracticeA, ...vize1PracticeB]

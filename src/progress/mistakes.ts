import type { Lesson } from '../content/lessons/types'
import type { NodeId, Question } from '../content/questions'
import { isQuestion, type LessonRecord } from '../lesson/progress'

/** One open entry in the mistake log: where it happened and the sentence that names the mistake. */
export type Mistake =
  | { source: 'lesson'; node: NodeId; lessonId: string; stepId: string; title: string; text: string }
  | { source: 'exam'; node: NodeId; questionId: string; text: string }

/** Per exam question: the latest graded answer, newest attempt wins. */
export type ExamOutcomes = Record<string, { correct: boolean; given: string | null; at: number }>

/**
 * Lesson mistakes are first tries that went wrong and were not cleared by a first-try right answer
 * on a later visit. Exam mistakes are questions whose latest graded answer was wrong.
 */
export function openMistakes(
  lessons: readonly Lesson[],
  records: Readonly<Record<string, LessonRecord>>,
  bank: readonly Question[],
  outcomes: ExamOutcomes,
): Mistake[] {
  const list: Mistake[] = []
  for (const lesson of lessons) {
    const record = records[lesson.id]
    if (!record) continue
    for (const step of lesson.steps) {
      if (!isQuestion(step)) continue
      const first = record.answers[step.id]
      if (!first || first.correct || record.cleared?.[step.id]) continue
      const text =
        step.kind === 'choice'
          ? (step.options.find((option) => option.key === first.given)?.feedback ?? step.solution)
          : step.feedbackWrong
      list.push({
        source: 'lesson',
        node: lesson.node,
        lessonId: lesson.id,
        stepId: step.id,
        title: step.title,
        text,
      })
    }
  }
  for (const question of bank) {
    const outcome = outcomes[question.id]
    if (!outcome || outcome.correct || outcome.given === null) continue
    const option = question.options.find((candidate) => candidate.key === outcome.given)
    list.push({
      source: 'exam',
      node: question.node,
      questionId: question.id,
      text: option?.feedback ?? question.explanation,
    })
  }
  return list
}

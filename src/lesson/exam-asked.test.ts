import { describe, expect, it } from 'vitest'
import { lessons } from '../content/lessons'
import { questions } from '../content/questions'
import { determinantQuestions } from '../content/questions/generated/determinant'
import { createSession, examSets } from '../exam/session'
import { examQuestionFor } from './ExamAsked'

describe('examQuestionFor', () => {
  it('finds a bank question of the lesson node, or nothing', () => {
    const lesson = lessons.find((l) =>
      questions.some((q) => q.node === l.node && q.source.exam !== 'dizey-generated'),
    )
    if (!lesson) throw new Error('no lesson shares a node with a real exam question')
    expect(examQuestionFor(lesson.node)?.node).toBe(lesson.node)
    expect(examQuestionFor('none')).toBeNull()
  })

  it('never offers a generated item as a real exam question', () => {
    const generated = determinantQuestions[0]
    if (!generated) throw new Error('no generated question')
    expect(examQuestionFor(generated.node, [generated])).toBeNull()
    const real = questions.find((q) => q.node === generated.node && q.source.exam !== 'dizey-generated')
    expect(examQuestionFor(generated.node, [generated, ...(real ? [real] : [])])?.id).toBe(real?.id)
    for (const lesson of lessons)
      expect(examQuestionFor(lesson.node)?.source.exam).not.toBe('dizey-generated')
  })

  it('keeps the printed 2024 paper free of generated items', () => {
    const paper = createSession(questions, 'summer-2024', 0, 1)
    expect(paper.questionIds.every((id) => !id.startsWith('v1-gen-'))).toBe(true)
    expect(examSets(questions)[0]?.size).toBe(paper.questionIds.length)
  })
})

import { describe, expect, it } from 'vitest'
import { lessons } from '../content/lessons'
import { questions } from '../content/questions'
import { examQuestionFor } from './ExamAsked'

describe('examQuestionFor', () => {
  it('finds a bank question of the lesson node, or nothing', () => {
    const lesson = lessons.find((l) => questions.some((q) => q.node === l.node))
    if (!lesson) throw new Error('no lesson shares a node with the bank')
    expect(examQuestionFor(lesson.node)?.node).toBe(lesson.node)
    expect(examQuestionFor('none')).toBeNull()
  })
})

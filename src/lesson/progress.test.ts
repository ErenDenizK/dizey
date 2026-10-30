import { describe, expect, it } from 'vitest'
import { lessons } from '../content/lessons'
import { checkKeypad, emptyRecord, firstTryScore, recordAnswer, resumeIndex } from './progress'

const lesson = lessons[0]
if (!lesson) throw new Error('no lessons')

describe('lesson progress', () => {
  it('resumes by step id and falls back to the start', () => {
    const second = lesson.steps[2]?.id ?? ''
    expect(resumeIndex(lesson, { ...emptyRecord, at: second })).toBe(2)
    expect(resumeIndex(lesson, { ...emptyRecord, at: 'removed-step' })).toBe(0)
    expect(resumeIndex(lesson, emptyRecord)).toBe(0)
  })
  it('compares keypad answers exactly', () => {
    expect(checkKeypad('11', '11')).toBe(true)
    expect(checkKeypad('-4/3', '−8/6')).toBe(true)
    expect(checkKeypad('11', '-11')).toBe(false)
    expect(checkKeypad('11', '')).toBe(false)
  })
  it('keeps only the first answer', () => {
    const once = recordAnswer(emptyRecord, 'try-b', 'a', false)
    expect(recordAnswer(once, 'try-b', 'b', true).answers['try-b']).toEqual({ given: 'a', correct: false })
    expect(firstTryScore(lesson, once).correct).toBe(0)
  })
})

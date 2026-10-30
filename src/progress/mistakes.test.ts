import { describe, expect, it } from 'vitest'
import { lessons } from '../content/lessons'
import { questions } from '../content/questions'
import { emptyRecord, recordTry } from '../lesson/progress'
import { openMistakes } from './mistakes'
import { parseSettings } from './settings'

const d1 = lessons.find((lesson) => lesson.id === 'd1-determinant')
if (!d1) throw new Error('D1 missing')

describe('openMistakes', () => {
  it('names a wrong first try with the option feedback until a later visit fixes it', () => {
    const wrong = recordTry(emptyRecord, 'try-b', 'a', false, true, 1)
    const list = openMistakes(lessons, { [d1.id]: wrong }, questions, {})
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ source: 'lesson', node: 'D1', stepId: 'try-b' })
    expect(list[0]?.text.length).toBeGreaterThan(10)
    const fixed = recordTry(wrong, 'try-b', 'b', true, true, 2)
    expect(openMistakes(lessons, { [d1.id]: fixed }, questions, {})).toHaveLength(0)
  })
  it('lists exam questions whose latest answer was wrong', () => {
    const question = questions[0]
    if (!question) throw new Error('empty bank')
    const wrongKey = question.options.find((option) => option.key !== question.answer)?.key ?? 'a'
    expect(
      openMistakes([], {}, questions, { [question.id]: { correct: false, given: wrongKey, at: 1 } }),
    ).toMatchObject([{ source: 'exam', questionId: question.id }])
    expect(
      openMistakes([], {}, questions, { [question.id]: { correct: true, given: question.answer, at: 2 } }),
    ).toEqual([])
  })
})

describe('parseSettings', () => {
  it('keeps a valid exam date and drops anything else', () => {
    expect(parseSettings('{"examDate":"2026-11-19"}')).toEqual({ examDate: '2026-11-19' })
    expect(parseSettings('{"examDate":"19 Kasım"}')).toEqual({})
    expect(parseSettings('not json')).toEqual({})
    expect(parseSettings(null)).toEqual({})
  })
})

describe('parseSettings hideExamClock', () => {
  it('keeps only true', () => {
    expect(parseSettings('{"hideExamClock":true}')).toEqual({ hideExamClock: true })
    expect(parseSettings('{"hideExamClock":"yes"}')).toEqual({})
  })
})

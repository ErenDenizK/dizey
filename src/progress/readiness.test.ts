import { describe, expect, it } from 'vitest'
import { lessons } from '../content/lessons'
import { isQuestion, type LessonRecord } from '../lesson/progress'
import { hasNewProgress, moodOf, parseSeen, readinessOf } from './readiness'

const lesson =
  lessons.find((l) => l.steps.filter(isQuestion).length >= 4) ?? (lessons[0] as (typeof lessons)[number])
const ids = lesson.steps.filter(isQuestion).map((step) => step.id)
const record = (right: number, wrong: number, doneAt: number | null = null): LessonRecord => ({
  at: null,
  doneAt,
  answers: Object.fromEntries(
    ids.slice(0, right + wrong).map((id, i) => [id, { given: 'x', correct: i < right }]),
  ),
})

describe('readinessOf', () => {
  it('is empty before the lesson is started or any question met', () => {
    expect(readinessOf(lesson, undefined)).toBe('none')
    expect(readinessOf(lesson, { at: ids[0] ?? null, doneAt: null, answers: {} })).toBe('none')
  })
  it('colours by first-try share of the questions met', () => {
    expect(readinessOf(lesson, record(4, 0))).toBe('ok')
    expect(readinessOf(lesson, record(3, 1))).toBe('ok')
    expect(readinessOf(lesson, record(2, 2))).toBe('mid')
    expect(readinessOf(lesson, record(1, 3))).toBe('bad')
    expect(readinessOf(lesson, record(0, 2))).toBe('bad')
  })
  it('gives a finished lesson without answers a neutral mark', () => {
    expect(readinessOf(lesson, { at: null, doneAt: 1, answers: {} })).toBe('done')
  })
})

describe('moodOf', () => {
  it('follows progress', () => {
    expect(moodOf(0, 0)).toBe('neutral')
    expect(moodOf(3, 0)).toBe('happy')
    expect(moodOf(5, 1)).toBe('proud')
  })
})

describe('new progress', () => {
  it('reacts only when more is done than last seen', () => {
    expect(hasNewProgress(0, null)).toBe(false)
    expect(hasNewProgress(1, null)).toBe(true)
    expect(hasNewProgress(2, 2)).toBe(false)
    expect(hasNewProgress(3, 2)).toBe(true)
  })
  it('reads a stored count defensively', () => {
    expect(parseSeen(null)).toBeNull()
    expect(parseSeen('x')).toBeNull()
    expect(parseSeen('-1')).toBeNull()
    expect(parseSeen('4')).toBe(4)
  })
})

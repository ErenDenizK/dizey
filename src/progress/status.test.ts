import { describe, expect, it } from 'vitest'
import { chapters } from '../content/path'
import type { LessonRecord } from '../lesson/progress'
import type { Mistake } from './mistakes'
import {
  firstTryRate,
  fixedCount,
  groupMistakes,
  pathProgress,
  pathSegments,
  percent,
  recentDays,
} from './status'

const record = (over: Partial<LessonRecord>): LessonRecord => ({
  at: null,
  doneAt: null,
  answers: {},
  ...over,
})
const first = chapters[0]?.lessons[0]?.id ?? ''
const second = chapters[0]?.lessons[1]?.id ?? ''

describe('pathProgress and pathSegments', () => {
  it('is zero of all lessons with nothing studied', () => {
    const total = chapters.reduce((sum, chapter) => sum + chapter.lessons.length, 0)
    expect(pathProgress({}, chapters)).toEqual({ done: 0, total })
    expect(pathSegments({}, chapters).every((c) => c.fills.every((f) => f === 0))).toBe(true)
  })
  it('fills done lessons fully and begun ones by half, one segment per lesson', () => {
    const records = { [first]: record({ at: 's', doneAt: 2 }), [second]: record({ at: 's' }) }
    const segments = pathSegments(records, chapters)
    expect(segments).toHaveLength(chapters.length)
    expect(segments[0]?.fills.slice(0, 3)).toEqual([1, 0.5, 0])
    expect(segments[0]?.fills).toHaveLength(chapters[0]?.lessons.length ?? 0)
    expect(pathProgress(records, chapters).done).toBe(1)
  })
})

describe('percent and firstTryRate', () => {
  it('rounds, clamps and never divides by zero', () => {
    expect(percent(1, 3)).toBe(33)
    expect(percent(5, 0)).toBe(0)
    expect(percent(9, 3)).toBe(100)
  })
  it('has no rate before anything is answered', () => {
    expect(firstTryRate({}).percent).toBeNull()
  })
  it('counts right first tries over lesson questions asked', () => {
    const records = {
      a: record({ answers: { q1: { given: 'a', correct: true }, q2: { given: 'b', correct: false } } }),
      b: record({ answers: { q1: { given: 'a', correct: true } } }),
    }
    expect(firstTryRate(records)).toEqual({ right: 2, asked: 3, percent: 67 })
  })
})

describe('recentDays', () => {
  it('lists 14 local days oldest first, ending today, marking active ones', () => {
    const days = recentDays(new Set(['2026-03-10', '2026-03-01', '2026-02-20']), new Date(2026, 2, 10, 9))
    expect(days).toHaveLength(14)
    expect(days[13]).toEqual({ key: '2026-03-10', active: true })
    expect(days[0]?.key).toBe('2026-02-25')
    expect(days.filter((d) => d.active).map((d) => d.key)).toEqual(['2026-03-01', '2026-03-10'])
  })
  it('has no active day without activity', () => {
    expect(recentDays(new Set(), new Date(2026, 0, 3)).some((d) => d.active)).toBe(false)
  })
})

describe('groupMistakes', () => {
  const lesson = (lessonId: string, stepId: string): Mistake => ({
    source: 'lesson',
    node: 'D1',
    lessonId,
    stepId,
    title: 't',
    text: 'x',
  })
  it('groups lesson mistakes by lesson and exam ones by node, keeping order', () => {
    const exam: Mistake = { source: 'exam', node: 'D1', questionId: 'q', text: 'x' }
    const groups = groupMistakes([lesson('l1', 'a'), exam, lesson('l2', 'a'), lesson('l1', 'b')])
    expect(groups.map((g) => [g.key, g.mistakes.length])).toEqual([
      ['lesson:l1', 2],
      ['exam:D1', 1],
      ['lesson:l2', 1],
    ])
  })
  it('is empty for no mistakes', () => {
    expect(groupMistakes([])).toEqual([])
  })
})

describe('fixedCount', () => {
  it('sums cleared mistakes across lessons', () => {
    expect(fixedCount({})).toBe(0)
    expect(fixedCount({ a: record({ cleared: { q1: 1, q2: 2 } }), b: record({ cleared: { q1: 3 } }) })).toBe(
      3,
    )
  })
})

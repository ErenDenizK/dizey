import { describe, expect, it } from 'vitest'
import { chapters } from '../content/path'
import type { HistoryEntry } from '../exam/store'
import type { LessonRecord } from '../lesson/progress'
import { chaptersDone, profileStats } from './profile-stats'

const record = (over: Partial<LessonRecord>): LessonRecord => ({
  at: null,
  doneAt: null,
  answers: {},
  ...over,
})
const entry = (correct: number, wrong: number, finishedAt: number): HistoryEntry => ({
  correct,
  wrong,
  blank: 3,
  total: correct + wrong + 3,
  percent: 0,
  set: 'summer-2024' as HistoryEntry['set'],
  finishedAt,
  usedMs: 1,
})
const day = (y: number, m: number, d: number) => new Date(y, m, d, 12).getTime()

describe('profileStats', () => {
  it('is all zero with nothing studied', () => {
    expect(profileStats({ records: {}, history: [], outcomes: {}, chapters: {}, recorded: [] })).toEqual({
      lessons: 0,
      answered: 0,
      firstTry: 0,
      days: 0,
      fixed: 0,
    })
  })
  it('counts lessons, first tries, fixes, tests and distinct days', () => {
    const records = {
      a: record({
        doneAt: day(2026, 10, 1),
        answers: { s1: { given: 'x', correct: true }, s2: { given: 'y', correct: false } },
        cleared: { s2: day(2026, 10, 2) },
      }),
      b: record({ at: 's1', answers: { s1: { given: 'x', correct: true } } }),
    }
    const stats = profileStats({
      records,
      history: [entry(5, 4, day(2026, 10, 2))],
      outcomes: {},
      chapters: {},
      recorded: ['2026-11-01', '2026-11-05'],
    })
    expect(stats).toEqual({ lessons: 1, answered: 3 + 9, firstTry: 2, days: 3, fixed: 1 })
  })
  it('never drops when more is studied', () => {
    const base = { history: [], outcomes: {}, chapters: {}, recorded: [] as string[] }
    const before = profileStats({
      ...base,
      records: { a: record({ answers: { s: { given: '1', correct: false } } }) },
    })
    const after = profileStats({
      ...base,
      records: {
        a: record({
          doneAt: 5,
          answers: { s: { given: '1', correct: false }, t: { given: '2', correct: true } },
        }),
      },
    })
    for (const key of Object.keys(before) as (keyof typeof before)[])
      expect(after[key]).toBeGreaterThanOrEqual(before[key])
  })
})

describe('chaptersDone', () => {
  it('counts chapters with every lesson done', () => {
    const first = chapters[0]
    if (!first) throw new Error('no chapters')
    const records = Object.fromEntries(first.lessons.map((l) => [l.id, record({ doneAt: 1 })]))
    expect(chaptersDone({}, chapters)).toBe(0)
    expect(chaptersDone(records, chapters)).toBe(1)
    const partial = { ...records, [first.lessons[0]?.id as string]: record({ at: 'x' }) }
    expect(chaptersDone(partial, chapters)).toBe(0)
  })
})

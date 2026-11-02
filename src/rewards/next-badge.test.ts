import { describe, expect, it } from 'vitest'
import { lessons } from '../content/lessons'
import type { LessonRecord } from '../lesson/progress'
import { BADGES, NOTEBOOK_FIXES, type Progress } from './badges'
import { NEEDS, nextBadge, remainingFor } from './next-badge'

const done: LessonRecord = { at: null, doneAt: 1, answers: {} }
const empty: Progress = { records: {}, history: [], moments: {} }

describe('nextBadge', () => {
  it('starts with the first badge for a fresh user', () => {
    expect(nextBadge(empty)?.badge.id).toBe('first-lesson')
  })

  it('moves on once a badge is earned', () => {
    const next = nextBadge({ ...empty, records: { 'm1-reading-a-matrix': done } })
    expect(next?.badge.id).toBe('sarrus')
    expect(next?.remaining).toEqual({ kind: 'lessons', lessonId: 'd1-determinant', count: 1 })
  })

  it('is gone when every badge is earned', () => {
    const everything: Progress = {
      records: {
        'd1-determinant': done,
        'd2-cofactor-expansion': done,
        'r1-row-operations': done,
        'r2-echelon-forms': done,
        'r4-inverse': done,
        's4-cramer': done,
        'x-cleared': {
          ...done,
          cleared: Object.fromEntries(Array.from({ length: NOTEBOOK_FIXES }, (_, i) => [`s${i}`, 1])),
        },
      },
      history: [{} as never],
      moments: { a: 'solved' },
    }
    expect(nextBadge(everything)).toBeNull()
    expect(BADGES.length).toBeGreaterThan(0)
  })

  it('counts what is left', () => {
    expect(remainingFor('gauss', { ...empty, records: { 'r1-row-operations': done } })).toEqual({
      kind: 'lessons',
      lessonId: 'r2-echelon-forms',
      count: 1,
    })
    expect(remainingFor('clean-notebook', empty)).toEqual({ kind: 'fixes', count: NOTEBOOK_FIXES })
    expect(remainingFor('fixed', empty)).toEqual({ kind: 'plain' })
  })

  it('only asks for lessons that exist in the course', () => {
    const known = new Set(lessons.map((lesson) => lesson.id))
    for (const [badge, needs] of Object.entries(NEEDS)) {
      for (const id of needs?.ids ?? []) expect(known.has(id), `${badge} needs ${id}`).toBe(true)
    }
  })
})

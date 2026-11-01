import { describe, expect, it } from 'vitest'
import { lessons } from '../content/lessons'
import { strings } from '../content/strings'
import type { LessonRecord } from '../lesson/progress'
import { BADGES, earnedBadges, NOTEBOOK_FIXES } from './badges'
import { parseShown, unshown } from './store'

const done = (answers: LessonRecord['answers'] = {}): LessonRecord => ({ at: null, doneAt: 1, answers })
const ids = (
  records: Record<string, LessonRecord>,
  history: unknown[] = [],
  moments: Record<string, string> = {},
) => earnedBadges({ records, history: history as never, moments }).map((badge) => badge.id)

describe('rozetler', () => {
  it('has a name and a sentence for every badge', () => {
    for (const badge of BADGES) expect(strings.badges.items[badge.id].line.length).toBeGreaterThan(10)
  })

  it('names only lessons that exist', () => {
    const known = new Set(lessons.map((lesson) => lesson.id))
    for (const id of [
      'd1-determinant',
      'd2-cofactor-expansion',
      'r1-row-operations',
      'r2-echelon-forms',
      'r4-inverse',
      'd4-adjugate-inverse',
      's4-cramer',
    ])
      expect(known.has(id)).toBe(true)
  })

  it('starts with nothing earned', () => {
    expect(ids({})).toEqual([])
  })

  it('rewards finishing, whatever the score', () => {
    const allWrong = done({ a: { given: 'x', correct: false }, b: { given: 'y', correct: false } })
    expect(ids({ 'd1-determinant': allWrong })).toEqual(['first-lesson', 'sarrus'])
  })

  it('needs both row-operation lessons for Gauss', () => {
    expect(ids({ 'r1-row-operations': done() })).not.toContain('gauss')
    expect(ids({ 'r1-row-operations': done(), 'r2-echelon-forms': done() })).toContain('gauss')
  })

  it('counts fixed mistakes across lessons', () => {
    const fixedOne = { ...done(), cleared: { a: 1 } }
    expect(ids({ x: fixedOne })).toContain('fixed')
    expect(ids({ x: fixedOne })).not.toContain('clean-notebook')
    const many = Object.fromEntries(Array.from({ length: NOTEBOOK_FIXES }, (_, n) => [`s${n}`, n]))
    expect(ids({ x: { ...done(), cleared: many } })).toContain('clean-notebook')
  })

  it('gives the sezgi mührü badge once any gizli an is solved, not for a skip', () => {
    expect(ids({}, [], { 'd1-determinant': 'skipped', x: 'open' })).toEqual([])
    expect(ids({}, [], { 'd1-determinant': 'solved' })).toEqual(['insight'])
  })

  it('gives the rehearsal badge for a finished rehearsal', () => {
    expect(ids({}, [{}])).toEqual(['rehearsal'])
  })

  it('reads stored shown times defensively and keeps unknown ids', () => {
    expect(parseShown('nonsense')).toEqual({})
    expect(parseShown('[1]')).toEqual({})
    expect(parseShown('{"sarrus":5,"later-badge":7,"bad":"x"}')).toEqual({ sarrus: 5, 'later-badge': 7 })
    const earned = earnedBadges({ records: { 'd1-determinant': done() }, history: [], moments: {} })
    expect(unshown(earned, { sarrus: 5 }).map((badge) => badge.id)).toEqual(['first-lesson'])
  })
})

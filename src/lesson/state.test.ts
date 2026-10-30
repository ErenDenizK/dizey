import { describe, expect, it } from 'vitest'
import { lessons } from '../content/lessons'
import { unitOf, units } from '../content/units'
import { emptyRecord } from './progress'
import { stateOf, upNext } from './state'

describe('lesson state', () => {
  it('maps a record to new, current or done', () => {
    expect(stateOf(undefined)).toBe('new')
    expect(stateOf({ ...emptyRecord, at: 'x' })).toBe('current')
    expect(stateOf({ ...emptyRecord, doneAt: 1 })).toBe('done')
  })
  it('puts the lesson in progress first, then the first unfinished ones', () => {
    const [first, second, third] = lessons
    if (!first || !second || !third) throw new Error('too few lessons')
    expect(upNext(lessons, {}, 2)).toEqual({ main: first, after: [second, third] })
    const records = { [first.id]: { ...emptyRecord, doneAt: 1 }, [third.id]: { ...emptyRecord, at: 's' } }
    expect(upNext(lessons, records, 1)).toEqual({ main: third, after: [second] })
  })
  it('places every lesson in a unit and the units add up to the 34 past items', () => {
    for (const lesson of lessons) expect(unitOf(lesson), lesson.id).toBeDefined()
    expect(units.reduce((sum, unit) => sum + unit.examItems, 0)).toBe(34)
  })
})

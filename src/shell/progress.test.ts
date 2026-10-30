import { describe, expect, it } from 'vitest'
import type { LessonCatalog } from '../legacy/bridge'
import { lessonState, parseDone, parseSaved, resumePoint, upNext } from './progress'

const catalog: LessonCatalog = {
  units: [
    {
      id: 'A',
      label: 'Matrisler',
      lessons: [
        ['A3', 'Matris çarpımı'],
        ['A9', 'Rank'],
      ],
    },
    {
      id: 'B',
      label: 'Determinant',
      lessons: [
        ['B1', 'Determinant'],
        ['B2', 'Kofaktör'],
      ],
    },
  ],
  ready: ['A3', 'B1', 'B2'],
  steps: { A3: 10, B1: 18, B2: 12 },
}

describe('resumePoint', () => {
  it('starts a first visit with determinants', () => {
    expect(resumePoint(catalog, {}, null)).toEqual({ code: 'B1', step: 0 })
  })
  it('resumes a lesson saved mid-way', () => {
    expect(resumePoint(catalog, {}, { lesson: 'A3', step: 4 })).toEqual({ code: 'A3', step: 4 })
  })
  it('restarts a lesson whose saved step no longer exists', () => {
    expect(resumePoint(catalog, {}, { lesson: 'A3', step: 99 })).toEqual({ code: 'A3', step: 0 })
  })
  it('moves past a finished lesson to the first undone one', () => {
    expect(resumePoint(catalog, { A3: 1 }, { lesson: 'A3', step: 0 })).toEqual({ code: 'B1', step: 0 })
  })
  it('keeps the pick when every lesson is done', () => {
    expect(resumePoint(catalog, { A3: 1, B1: 1, B2: 1 }, { lesson: 'B2', step: 0 })).toEqual({
      code: 'B2',
      step: 0,
    })
  })
  it('ignores a save for a lesson that is not ready', () => {
    expect(resumePoint(catalog, {}, { lesson: 'A9', step: 2 })).toEqual({ code: 'B1', step: 0 })
  })
})

describe('lesson states and up next', () => {
  it('labels each lesson', () => {
    const resume = { code: 'B1', step: 3 }
    expect(lessonState('B1', catalog, {}, resume)).toBe('current')
    expect(lessonState('A3', catalog, { A3: 1 }, resume)).toBe('done')
    expect(lessonState('B2', catalog, {}, resume)).toBe('new')
    expect(lessonState('A9', catalog, {}, resume)).toBe('soon')
  })
  it('lists undone lessons after the resume point, wrapping around', () => {
    expect(upNext(catalog, {}, { code: 'B1', step: 0 }, 3)).toEqual(['B2', 'A3'])
    expect(upNext(catalog, { B2: 1 }, { code: 'B1', step: 0 }, 3)).toEqual(['A3'])
  })
})

describe('stored values', () => {
  it('reads saves defensively', () => {
    expect(parseSaved('{"lesson":"B1","step":2}')).toEqual({ lesson: 'B1', step: 2 })
    expect(parseSaved('nonsense')).toBeNull()
    expect(parseSaved(null)).toBeNull()
    expect(parseDone('[1]')).toEqual({})
    expect(parseDone('{"B1":5}')).toEqual({ B1: 5 })
  })
})

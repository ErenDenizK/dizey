import { describe, expect, it } from 'vitest'
import { lessons } from './lessons'
import { chapters, codeOfNode, examItemTotal, pathCode } from './path'

describe('lesson path', () => {
  it('cuts the study order into chapters without leaving out, repeating or reordering a lesson', () => {
    expect(chapters.flatMap((chapter) => chapter.lessons)).toEqual(lessons)
  })
  it('never counts more past exam items than there were', () => {
    const counted = chapters.reduce((sum, chapter) => sum + (chapter.examItems ?? 0), 0)
    expect(counted).toBeLessThanOrEqual(examItemTotal)
  })
  it('numbers lessons in path order, world-style', () => {
    const codes = lessons.map((lesson) => pathCode(lesson))
    expect(codes.slice(0, 5)).toEqual(['1.1', '1.2', '1.3', '1.4', '1.5'])
    expect(new Set(codes).size).toBe(lessons.length)
    expect(codeOfNode('M11')).toBe('4.1')
    expect(codeOfNode('X9')).toBe('X9')
  })
})

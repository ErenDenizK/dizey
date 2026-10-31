import { describe, expect, it } from 'vitest'
import { lessons } from './lessons'
import { chapters, examItemTotal } from './path'

describe('lesson path', () => {
  it('cuts the study order into chapters without leaving out, repeating or reordering a lesson', () => {
    expect(chapters.flatMap((chapter) => chapter.lessons)).toEqual(lessons)
  })
  it('never counts more past exam items than there were', () => {
    const counted = chapters.reduce((sum, chapter) => sum + (chapter.examItems ?? 0), 0)
    expect(counted).toBeLessThanOrEqual(examItemTotal)
  })
})

import { describe, expect, it } from 'vitest'
import { lessons } from '../content/lessons'
import { chapters } from '../content/path'
import { endResults, nextLesson, sealColumns } from './end'
import { emptyRecord, isQuestion } from './progress'

const d1 = lessons.find((lesson) => lesson.id === 'd1-determinant')
if (!d1) throw new Error('d1 missing')
const questions = d1.steps.filter(isQuestion)

describe('endResults', () => {
  it('reads the first try of each question, in lesson order', () => {
    const [first, second] = questions
    const record = {
      ...emptyRecord,
      answers: {
        [first?.id ?? '']: { given: 'b', correct: true },
        [second?.id ?? '']: { given: '0', correct: false },
      },
    }
    const results = endResults(d1, record)
    expect(results).toHaveLength(questions.length)
    expect(results.slice(0, 3)).toEqual(['right', 'miss', 'unknown'])
  })
})

describe('nextLesson', () => {
  it('follows the path across chapters and stops at its end', () => {
    const path = chapters.flatMap((chapter) => chapter.lessons)
    expect(nextLesson(path[0] as never, chapters, lessons)).toBe(path[1])
    const lastOfFirst = chapters[0]?.lessons.at(-1)
    expect(nextLesson(lastOfFirst as never, chapters, lessons)).toBe(chapters[1]?.lessons[0])
    expect(nextLesson(path.at(-1) as never, chapters, lessons)).toBeNull()
  })
})

describe('sealColumns', () => {
  it.each([
    [1, 1],
    [3, 3],
    [4, 4],
    [5, 3],
    [6, 3],
    [8, 4],
    [9, 3],
  ])('%i questions sit in %i columns', (count, cols) => {
    expect(sealColumns(count)).toBe(cols)
  })
})

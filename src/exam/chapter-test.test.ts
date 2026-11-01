import { describe, expect, it } from 'vitest'
import { chapters } from '../content/path'
import { questions } from '../content/questions'
import {
  CHAPTER_TEST_SIZE,
  chapterQuestions,
  chapterSetId,
  chapterTestState,
  createChapterSession,
  drawChapterTest,
  isChapterSet,
  setTitle,
} from './chapter-test'
import { score } from './session'

const ready = chapters.filter((chapter) => chapterTestState(questions, chapter).ready)

describe('chapter tests', () => {
  it('draws only questions whose node belongs to the chapter', () => {
    for (const chapter of chapters) {
      const nodes = new Set<string>(chapter.lessons.map((lesson) => lesson.node))
      for (const question of drawChapterTest(questions, chapter, 7))
        expect(nodes.has(question.node)).toBe(true)
    }
  })

  it('is deterministic for a seed, six distinct questions when the bank allows', () => {
    expect(ready.length).toBeGreaterThan(0)
    for (const chapter of ready) {
      const a = drawChapterTest(questions, chapter, 42).map((question) => question.id)
      const b = drawChapterTest(questions, chapter, 42).map((question) => question.id)
      expect(a).toEqual(b)
      expect(new Set(a).size).toBe(CHAPTER_TEST_SIZE)
    }
  })

  it('a chapter with fewer than six questions is preparing', () => {
    for (const chapter of chapters) {
      const { ready: isReady, available } = chapterTestState(questions, chapter)
      expect(available).toBe(chapterQuestions(questions, chapter).length)
      expect(isReady).toBe(available >= CHAPTER_TEST_SIZE)
    }
    const small = chapterTestState(
      chapterQuestions(questions, chapters[0] as never).slice(0, 5),
      chapters[0] as never,
    )
    expect(small).toEqual({ ready: false, available: 5 })
  })

  it('spreads the draw across nodes before repeating one', () => {
    const chapter = chapters[0]
    if (!chapter) throw new Error('no chapters')
    const nodes = new Set(chapterQuestions(questions, chapter).map((question) => question.node))
    const drawn = drawChapterTest(questions, chapter, 3)
    expect(new Set(drawn.map((question) => question.node)).size).toBe(Math.min(nodes.size, drawn.length))
  })

  it('builds an untimed session under a chapter set id that scores like any paper', () => {
    const chapter = ready[0]
    if (!chapter) throw new Error('no ready chapter')
    const session = createChapterSession(questions, chapter, 1000, 5)
    expect(session.set).toBe(chapterSetId(chapter))
    expect(isChapterSet(session.set)).toBe(true)
    expect(session.questionIds).toHaveLength(CHAPTER_TEST_SIZE)
    expect(session.durationMs).toBeGreaterThan(3_600_000)
    expect(score(session, questions).total).toBe(CHAPTER_TEST_SIZE)
    expect(setTitle(session.set, chapters)).toContain(chapter.label)
    expect(isChapterSet('mixed')).toBe(false)
  })
})

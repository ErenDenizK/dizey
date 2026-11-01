import type { Chapter } from '../content/path'
import type { Question } from '../content/questions'
import { strings } from '../content/strings'
import { type ExamSession, shuffled } from './session'

/** Questions in one chapter test. */
export const CHAPTER_TEST_SIZE = 6

/** A chapter test is untimed: the stored session carries a day-long allowance that nothing displays. */
export const UNTIMED_MS = 24 * 3_600_000

const PREFIX = 'chapter:'

export type ChapterSetId = `chapter:${string}`

export const chapterSetId = (chapter: Chapter): ChapterSetId => `${PREFIX}${chapter.id}`

export const isChapterSet = (set: string): set is ChapterSetId => set.startsWith(PREFIX)

export const chapterIdOf = (set: ChapterSetId): string => set.slice(PREFIX.length)

/** Bank questions whose node belongs to a lesson of the chapter, in bank order. */
export function chapterQuestions(bank: readonly Question[], chapter: Chapter): Question[] {
  const nodes = new Set<string>(chapter.lessons.map((lesson) => lesson.node))
  return bank.filter((question) => nodes.has(question.node))
}

/** A chapter with fewer than six bank questions is still being written. */
export function chapterTestState(
  bank: readonly Question[],
  chapter: Chapter,
): { ready: boolean; available: number } {
  const available = chapterQuestions(bank, chapter).length
  return { ready: available >= CHAPTER_TEST_SIZE, available }
}

/**
 * Six questions for a seed. The pool is shuffled, then dealt one node at a time, so a chapter with several
 * topics is covered across them instead of by whichever topic has the most items. Same seed, same test.
 */
export function drawChapterTest(bank: readonly Question[], chapter: Chapter, seed: number): Question[] {
  const byNode = new Map<string, Question[]>()
  for (const question of shuffled(chapterQuestions(bank, chapter), seed)) {
    byNode.set(question.node, [...(byNode.get(question.node) ?? []), question])
  }
  const queues = [...byNode.values()]
  const drawn: Question[] = []
  while (drawn.length < CHAPTER_TEST_SIZE && queues.some((queue) => queue.length)) {
    for (const queue of queues) {
      const next = queue.shift()
      if (next && drawn.length < CHAPTER_TEST_SIZE) drawn.push(next)
    }
  }
  return drawn
}

export function createChapterSession(
  bank: readonly Question[],
  chapter: Chapter,
  now: number,
  seed: number,
): ExamSession {
  const questionIds = drawChapterTest(bank, chapter, seed).map((question) => question.id)
  return {
    format: 1,
    set: chapterSetId(chapter),
    questionIds,
    answers: Object.fromEntries(questionIds.map((id) => [id, null])),
    flagged: [],
    current: 0,
    startedAt: now,
    durationMs: UNTIMED_MS,
    finishedAt: null,
  }
}

/** The name of any set, an exam rehearsal or a chapter test. */
export function setTitle(set: ExamSession['set'], chapters: readonly Chapter[]): string {
  if (!isChapterSet(set)) return strings.exam.setTitle[set]
  const chapter = chapters.find((candidate) => candidate.id === chapterIdOf(set))
  return strings.exam.chapterTestTitle(chapter?.label ?? '')
}

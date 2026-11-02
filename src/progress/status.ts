import type { LessonRecord } from '../lesson/progress'
import { stateOf } from '../lesson/state'
import { dayKey } from './daily'
import type { Mistake } from './mistakes'

type Records = Readonly<Record<string, LessonRecord>>
type PathChapters = readonly { id: string; lessons: readonly { id: string }[] }[]

/** How much of one lesson counts: 1 = done, 0.5 = begun, 0 = not started. */
export type SegmentFill = 0 | 0.5 | 1

export type ChapterSegments = { id: string; fills: SegmentFill[] }

/** One segment per lesson, grouped by chapter, in path order. */
export function pathSegments(records: Records, chapters: PathChapters): ChapterSegments[] {
  return chapters.map((chapter) => ({
    id: chapter.id,
    fills: chapter.lessons.map((lesson): SegmentFill => {
      const state = stateOf(records[lesson.id])
      return state === 'done' ? 1 : state === 'current' ? 0.5 : 0
    }),
  }))
}

/** Lessons done and all lessons on the path (the Vize 1 readiness is their ratio). */
export function pathProgress(records: Records, chapters: PathChapters): { done: number; total: number } {
  let done = 0
  let total = 0
  for (const chapter of chapters) {
    for (const lesson of chapter.lessons) {
      total += 1
      if (stateOf(records[lesson.id]) === 'done') done += 1
    }
  }
  return { done, total }
}

/** Whole-number percentage, 0 when there is nothing to divide by. Never above 100. */
export function percent(part: number, whole: number): number {
  if (!(whole > 0) || !(part > 0)) return 0
  return Math.min(100, Math.round((part / whole) * 100))
}

/** First tries in lessons: how many were asked and how many were right. Null percent when nothing was answered. */
export function firstTryRate(records: Records): { right: number; asked: number; percent: number | null } {
  let right = 0
  let asked = 0
  for (const record of Object.values(records)) {
    const answers = Object.values(record.answers ?? {})
    asked += answers.length
    right += answers.filter((answer) => answer.correct).length
  }
  return { right, asked, percent: asked > 0 ? percent(right, asked) : null }
}

/** The last `count` local days ending at `today`, oldest first, each marked when it holds study activity. */
export function recentDays(
  active: ReadonlySet<string>,
  today: Date,
  count = 14,
): { key: string; active: boolean }[] {
  const days: { key: string; active: boolean }[] = []
  for (let back = count - 1; back >= 0; back--) {
    const key = dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - back, 12))
    days.push({ key, active: active.has(key) })
  }
  return days
}

/** Open mistakes of one lesson, or of the exam questions on one node. */
export type MistakeGroup = {
  key: string
  source: Mistake['source']
  node: Mistake['node']
  /** The lesson id for lesson mistakes. */
  lessonId: string | null
  mistakes: Mistake[]
}

/** Groups open mistakes by lesson (exam questions by node), keeping first-seen order. */
export function groupMistakes(list: readonly Mistake[]): MistakeGroup[] {
  const groups = new Map<string, MistakeGroup>()
  for (const mistake of list) {
    const lessonId = mistake.source === 'lesson' ? mistake.lessonId : null
    const key = lessonId ? `lesson:${lessonId}` : `exam:${mistake.node}`
    const group = groups.get(key)
    if (group) group.mistakes.push(mistake)
    else groups.set(key, { key, source: mistake.source, node: mistake.node, lessonId, mistakes: [mistake] })
  }
  return [...groups.values()]
}

/** Mistakes fixed in lessons (first-try right answers that cleared an earlier wrong one). */
export function fixedCount(records: Records): number {
  let fixed = 0
  for (const record of Object.values(records)) fixed += Object.keys(record.cleared ?? {}).length
  return fixed
}

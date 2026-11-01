export type TodayBlock = 'lesson' | 'review' | 'daily' | 'exam'

/** Decision 0012: at most four blocks on Bugün. */
export const MAX_BLOCKS = 4

/**
 * Which blocks Bugün shows, in priority order: the lesson card (or the all-done card), Tekrar, the question
 * of the day, the rehearsal. A block with nothing to show is left out, never drawn empty.
 */
export function todayBlocks(has: { review: boolean; daily: boolean; exam: boolean }): TodayBlock[] {
  const list: TodayBlock[] = ['lesson']
  if (has.review) list.push('review')
  if (has.daily) list.push('daily')
  if (has.exam) list.push('exam')
  return list.slice(0, MAX_BLOCKS)
}

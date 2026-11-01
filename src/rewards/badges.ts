import type { HistoryEntry } from '../exam/store'
import type { LessonRecord } from '../lesson/progress'

/**
 * Rozetler: marks of practice and diligence, never of a perfect score (Eren 2026-10-27: "Award ve mühürler
 * çalışkanlığı ödüllendirmeli başarıyı değil"). Every rule reads what was done (a lesson finished with any
 * score, a mistake fixed, a rehearsal finished); none reads how many first tries were right, none counts days,
 * and nothing is ever shown as "not yet". Earned state is derived from stored progress, so it needs no
 * migration and can never be lost; only the moment it was first shown is stored (store.ts).
 */
export type BadgeId =
  | 'first-lesson'
  | 'sarrus'
  | 'laplace'
  | 'gauss'
  | 'inverse'
  | 'cramer'
  | 'fixed'
  | 'clean-notebook'
  | 'rehearsal'
  | 'insight'

/** The badge's colour family: the math roles, the verdict green, the spark and the action honey. */
export type BadgeHue = 'row' | 'col' | 'ok' | 'spark' | 'action'

export type Badge = {
  id: BadgeId
  hue: BadgeHue
  /** Kind: a technique practised, or a habit of working. */
  kind: 'technique' | 'habit'
}

export type Progress = {
  records: Readonly<Record<string, LessonRecord>>
  history: readonly HistoryEntry[]
  /** Gizli an state per lesson id (src/lesson/moments.ts). */
  moments: Readonly<Record<string, string>>
}

/** Shelf order: the path's order for techniques, then habits. */
export const BADGES: readonly Badge[] = [
  { id: 'first-lesson', hue: 'action', kind: 'habit' },
  { id: 'sarrus', hue: 'row', kind: 'technique' },
  { id: 'laplace', hue: 'col', kind: 'technique' },
  { id: 'gauss', hue: 'row', kind: 'technique' },
  { id: 'inverse', hue: 'col', kind: 'technique' },
  { id: 'cramer', hue: 'spark', kind: 'technique' },
  { id: 'fixed', hue: 'ok', kind: 'habit' },
  { id: 'clean-notebook', hue: 'ok', kind: 'habit' },
  { id: 'rehearsal', hue: 'spark', kind: 'habit' },
  { id: 'insight', hue: 'col', kind: 'habit' },
]

/** Mistakes fixed for the notebook badge. */
export const NOTEBOOK_FIXES = 5

const done = (p: Progress, id: string) => Boolean(p.records[id]?.doneAt)
const fixes = (p: Progress) =>
  Object.values(p.records).reduce((sum, record) => sum + Object.keys(record.cleared ?? {}).length, 0)

const RULES: Record<BadgeId, (p: Progress) => boolean> = {
  'first-lesson': (p) => Object.values(p.records).some((record) => record.doneAt),
  sarrus: (p) => done(p, 'd1-determinant'),
  laplace: (p) => done(p, 'd2-cofactor-expansion'),
  gauss: (p) => done(p, 'r1-row-operations') && done(p, 'r2-echelon-forms'),
  inverse: (p) => done(p, 'r4-inverse') || done(p, 'd4-adjugate-inverse'),
  cramer: (p) => done(p, 's4-cramer'),
  fixed: (p) => fixes(p) >= 1,
  'clean-notebook': (p) => fixes(p) >= NOTEBOOK_FIXES,
  rehearsal: (p) => p.history.length >= 1,
  insight: (p) => Object.values(p.moments).some((state) => state === 'solved'),
}

export function earnedBadges(progress: Progress): Badge[] {
  return BADGES.filter((badge) => RULES[badge.id](progress))
}

export function badgeOf(id: BadgeId): Badge {
  return BADGES.find((badge) => badge.id === id) as Badge
}

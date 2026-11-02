import { BADGES, type Badge, type BadgeId, earnedBadges, NOTEBOOK_FIXES, type Progress } from './badges'

/** What is left before a badge is earned: lessons to finish in a chapter, mistakes to fix, or a single action. */
export type Remaining =
  | { kind: 'lessons'; lessonId: string; count: number }
  | { kind: 'fixes'; count: number }
  | { kind: 'plain' }

/** Lessons a badge asks for: all of them, or any one of them (the first listed is the one to point at). */
export const NEEDS: Partial<Record<BadgeId, { ids: readonly string[]; any?: true }>> = {
  sarrus: { ids: ['d1-determinant'] },
  laplace: { ids: ['d2-cofactor-expansion'] },
  gauss: { ids: ['r1-row-operations', 'r2-echelon-forms'] },
  inverse: { ids: ['r4-inverse', 'd4-adjugate-inverse'], any: true },
  cramer: { ids: ['s4-cramer'] },
}

const fixes = (p: Progress) =>
  Object.values(p.records).reduce((sum, record) => sum + Object.keys(record.cleared ?? {}).length, 0)

export function remainingFor(id: BadgeId, p: Progress): Remaining {
  const needs = NEEDS[id]
  if (needs) {
    const left = needs.ids.filter((lessonId) => !p.records[lessonId]?.doneAt)
    const first = left[0]
    if (first) return { kind: 'lessons', lessonId: first, count: needs.any ? 1 : left.length }
  }
  if (id === 'clean-notebook') return { kind: 'fixes', count: Math.max(1, NOTEBOOK_FIXES - fixes(p)) }
  return { kind: 'plain' }
}

/** The next badge to aim for: the first one on the shelf not earned yet, with what is left. None when all are earned. */
export function nextBadge(p: Progress): { badge: Badge; remaining: Remaining } | null {
  const earned = new Set(earnedBadges(p).map((badge) => badge.id))
  const badge = BADGES.find((item) => !earned.has(item.id))
  return badge ? { badge, remaining: remainingFor(badge.id, p) } : null
}

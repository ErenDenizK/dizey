import type { LessonCatalog } from '../legacy/bridge'

/** What the kept lesson layer stores (keys 'satir.v3.progress' and 'satir.v3.done'). */
export type SavedProgress = { lesson: string; step: number } | null
export type DoneMap = Readonly<Record<string, number>>

export type LessonState = 'new' | 'current' | 'done' | 'soon'

export type ResumePoint = { code: string; step: number }

/**
 * Where "continue" goes. Mirrors the kept layer's own pick (v21 `savedProgress`), so the shell and
 * the lesson always agree: a mid-lesson save resumes; otherwise the first undone lesson, starting
 * with determinants (the heaviest exam topic) on a first visit.
 */
export function resumePoint(catalog: LessonCatalog, done: DoneMap, saved: SavedProgress): ResumePoint | null {
  const { ready, steps } = catalog
  if (ready.length === 0) return null
  const first = ready.includes('B1') ? 'B1' : (ready[0] as string)
  const undone = ready.find((code) => !done[code])
  const pick = (code: string): ResumePoint => ({ code: done[code] && undone ? undone : code, step: 0 })
  if (!saved || !ready.includes(saved.lesson)) return pick(first)
  const total = steps[saved.lesson] ?? 0
  const inside = Number.isInteger(saved.step) && saved.step > 0 && saved.step < total
  return inside ? { code: saved.lesson, step: saved.step } : pick(saved.lesson)
}

export function lessonState(
  code: string,
  catalog: LessonCatalog,
  done: DoneMap,
  resume: ResumePoint | null,
): LessonState {
  if (!catalog.ready.includes(code)) return 'soon'
  if (resume && resume.code === code && resume.step > 0) return 'current'
  return done[code] ? 'done' : 'new'
}

/** The next few undone lessons after the resume point, in course order. */
export function upNext(
  catalog: LessonCatalog,
  done: DoneMap,
  resume: ResumePoint | null,
  count: number,
): string[] {
  const start = resume ? catalog.ready.indexOf(resume.code) : -1
  const order = [...catalog.ready.slice(start + 1), ...catalog.ready.slice(0, Math.max(start, 0))]
  return order.filter((code) => !done[code] && code !== resume?.code).slice(0, count)
}

export function lessonName(catalog: LessonCatalog, code: string): string {
  for (const unit of catalog.units) {
    const found = unit.lessons.find(([id]) => id === code)
    if (found) return found[1]
  }
  return code
}

export function unitOf(catalog: LessonCatalog, code: string) {
  return catalog.units.find((unit) => unit.lessons.some(([id]) => id === code)) ?? null
}

export function parseSaved(raw: string | null): SavedProgress {
  try {
    const value: unknown = raw ? JSON.parse(raw) : null
    if (value && typeof value === 'object' && 'lesson' in value && 'step' in value) {
      const { lesson, step } = value as { lesson: unknown; step: unknown }
      if (typeof lesson === 'string' && typeof step === 'number') return { lesson, step }
    }
  } catch {
    // Unreadable save: start fresh, like the lesson layer does.
  }
  return null
}

export function parseDone(raw: string | null): DoneMap {
  try {
    const value: unknown = raw ? JSON.parse(raw) : {}
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as DoneMap
  } catch {
    // Same fallback as the lesson layer.
  }
  return {}
}

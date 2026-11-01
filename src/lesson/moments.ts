import { useSyncExternalStore } from 'react'
import { appStorage } from '../lib/storage/app-storage'

/** A lesson's gizli an: not met yet, skipped, or solved. It only moves forward. */
export type MomentState = 'open' | 'skipped' | 'solved'

/** State per lesson id. Unknown ids and states from a later version are kept as they are. */
export type Moments = Record<string, string>

const KEY = 'dizey.moments'
const RANK: Record<MomentState, number> = { open: 0, skipped: 1, solved: 2 }
const known = (value: unknown): value is MomentState => typeof value === 'string' && value in RANK

export function parseMoments(raw: string | null): Moments {
  try {
    const value: unknown = JSON.parse(raw ?? '{}')
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
    const moments: Moments = {}
    for (const [id, state] of Object.entries(value)) if (typeof state === 'string') moments[id] = state
    return moments
  } catch {
    return {}
  }
}

/** A lesson's state; anything unreadable counts as open. */
export const momentState = (moments: Moments, id: string): MomentState => {
  const state = moments[id]
  return known(state) ? state : 'open'
}

/** The state after `to`; it never moves backwards (solved stays solved). */
export function advanceMoment(moments: Moments, id: string, to: MomentState): Moments {
  const current = moments[id]
  if (known(current) && RANK[current] >= RANK[to]) return moments
  return { ...moments, [id]: to }
}

/** Lesson ids whose moment is solved. */
export const solvedMoments = (moments: Moments): string[] =>
  Object.keys(moments).filter((id) => moments[id] === 'solved')

let moments: Moments | null = null
const listeners = new Set<() => void>()
const read = () => {
  moments ??= parseMoments(appStorage.getItem(KEY))
  return moments
}

appStorage.watch(KEY, () => {
  // Another tab: merge by rank so a stale read can never move a state back.
  const incoming = parseMoments(appStorage.getItem(KEY))
  let merged = incoming
  for (const [id, state] of Object.entries(read()))
    if (known(state)) merged = advanceMoment(merged, id, state)
  moments = merged
  for (const listener of listeners) listener()
})

export const readMoments = read

export function setMoment(id: string, state: MomentState) {
  const next = advanceMoment(read(), id, state)
  if (next === moments) return
  moments = next
  appStorage.setItem(KEY, JSON.stringify(next))
  for (const listener of listeners) listener()
}

export function useMoments(): Moments {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    read,
    read,
  )
}

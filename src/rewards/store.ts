import { useSyncExternalStore } from 'react'
import { appStorage } from '../lib/storage/app-storage'
import type { Badge, BadgeId } from './badges'

/** When each badge was first shown: its id and a time. Unknown ids from a later version are kept as they are. */
export type Shown = Record<string, number>

const KEY = 'dizey.badges'

export function parseShown(raw: string | null): Shown {
  try {
    const value: unknown = JSON.parse(raw ?? '{}')
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
    const shown: Shown = {}
    for (const [id, at] of Object.entries(value)) if (typeof at === 'number') shown[id] = at
    return shown
  } catch {
    return {}
  }
}

let shown: Shown | null = null
const listeners = new Set<() => void>()
const read = () => {
  shown ??= parseShown(appStorage.getItem(KEY))
  return shown
}

appStorage.watch(KEY, () => {
  shown = parseShown(appStorage.getItem(KEY))
  for (const listener of listeners) listener()
})

/** Earned badges not shown yet, in shelf order. */
export function unshown(earned: readonly Badge[], list: Shown = read()): Badge[] {
  return earned.filter((badge) => list[badge.id] === undefined)
}

/** Marks badges as shown now; a badge keeps its first time. */
export function markShown(ids: readonly BadgeId[], now: number) {
  const next = { ...read() }
  for (const id of ids) next[id] ??= now
  shown = next
  appStorage.setItem(KEY, JSON.stringify(next))
  for (const listener of listeners) listener()
}

export function useShown(): Shown {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    read,
    read,
  )
}

import { useSyncExternalStore } from 'react'
import { appStorage } from '../lib/storage/app-storage'
import { parseActivity, serializeActivity, withDay } from './activity'

const KEY = 'dizey.activity'

let days: readonly string[] = parseActivity(appStorage.getItem(KEY))
const listeners = new Set<() => void>()
const notify = () => {
  for (const listener of listeners) listener()
}

// Another tab saved: take its days, so this tab never writes a stale copy back.
appStorage.watch(KEY, () => {
  days = parseActivity(appStorage.getItem(KEY))
  notify()
})

export function useActivityDays(): readonly string[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    () => days,
  )
}

/** Notes that something was studied on the day of `at` (a lesson step, a test, the daily question). */
export function markActive(at: number = Date.now()) {
  const stored = parseActivity(appStorage.getItem(KEY))
  const merged = withDay(stored, new Date(at))
  if (merged === stored) return
  days = merged
  appStorage.setItem(KEY, serializeActivity(merged))
  notify()
}

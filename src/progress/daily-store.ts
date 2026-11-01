import { useSyncExternalStore } from 'react'
import { appStorage } from '../lib/storage/app-storage'
import { type DailyAnswer, parseDaily, serializeDaily } from './daily'

const KEY = 'dizey.daily'

let answer = parseDaily(appStorage.getItem(KEY))
const listeners = new Set<() => void>()

appStorage.watch(KEY, () => {
  answer = parseDaily(appStorage.getItem(KEY))
  for (const listener of listeners) listener()
})

/** The latest daily answer; callers check it is today's with `answeredOn`. */
export function useDailyAnswer(): DailyAnswer | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    () => answer,
  )
}

export function saveDailyAnswer(next: DailyAnswer) {
  answer = next
  appStorage.setItem(KEY, serializeDaily(next))
  for (const listener of listeners) listener()
}

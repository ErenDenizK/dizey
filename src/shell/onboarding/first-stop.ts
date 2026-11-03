import { useSyncExternalStore } from 'react'

/**
 * The one line Mırtis says on the Yol dock right after the onboarding hand-off ("İlk durak burası."): armed when she
 * lands, cleared when the bubble has gone. Never persisted: it is a moment, not a setting.
 */
let armed = false
const listeners = new Set<() => void>()
const set = (value: boolean) => {
  if (armed === value) return
  armed = value
  for (const listener of listeners) listener()
}

export const armFirstStop = () => set(true)
export const clearFirstStop = () => set(false)

export function useFirstStop(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    () => armed,
    () => false,
  )
}

import { useSyncExternalStore } from 'react'
import { appStorage } from '../lib/storage/app-storage'
import { cleanName, type Profile, parseProfile, serializeProfile } from './profile'

const KEY = 'dizey.profile'

let profile: Profile = parseProfile(appStorage.getItem(KEY))
const listeners = new Set<() => void>()
const notify = () => {
  for (const listener of listeners) listener()
}

// Another tab saved: take its profile, so this tab never writes a stale copy back.
appStorage.watch(KEY, () => {
  profile = parseProfile(appStorage.getItem(KEY))
  notify()
})

export function useProfile(): Profile {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    () => profile,
  )
}

/** Saves the name (trimmed, 24 characters at most); an empty name clears it. */
export function saveName(name: string) {
  const next = { name: cleanName(name) }
  if (next.name === profile.name) return
  profile = next
  appStorage.setItem(KEY, serializeProfile(next))
  notify()
}

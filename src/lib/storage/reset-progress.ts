import { appStorage } from './app-storage'

/** Kept on a reset: sound, appearance and the other preferences are not progress. */
export const KEPT_KEYS: readonly string[] = ['dizey.settings']

/** Which of `keys` a progress reset erases: everything except the preferences. */
export function keysToErase(keys: readonly string[]): string[] {
  return keys.filter((key) => !KEPT_KEYS.includes(key))
}

/**
 * Erases all progress of this channel (lessons, badges, mistakes, exam results, name, intro) and reloads the app
 * root. Progress lives only in localStorage (the Dexie database in db.ts is not used by any feature), so nothing
 * else needs clearing.
 */
export function resetProgress(): void {
  for (const key of keysToErase(appStorage.keys())) appStorage.removeItem(key)
  window.location.assign(import.meta.env.BASE_URL)
}

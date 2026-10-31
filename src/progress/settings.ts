import { useSyncExternalStore } from 'react'
import { appStorage } from '../lib/storage/app-storage'

/** Learner settings the shell owns. Every field is optional so older saves keep parsing. */
export type Settings = {
  /** Vize 1 day as YYYY-MM-DD once Eren knows it; until then the app says "around 15 Kasım". */
  examDate?: string
  /** Exam rehearsal clock hidden (for students who get anxious watching it). */
  hideExamClock?: boolean
  /** Manual appearance; absent follows the system. */
  theme?: 'light' | 'dark'
  /** Lesson sounds turned off; absent means on (iPhone's silent switch still silences them). */
  sound?: false
  /** Sounds play even with iPhone's silent switch on (pauses other apps' music); absent means they obey it. */
  soundInSilent?: true
  /** Haptic ticks turned off; absent means on. */
  haptics?: false
}

const KEY = 'dizey.settings'

export function parseSettings(raw: string | null): Settings {
  try {
    const value: unknown = JSON.parse(raw ?? '{}')
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
    const { examDate, hideExamClock, theme, sound, soundInSilent, haptics } = value as Record<string, unknown>
    const settings: Settings = {}
    if (typeof examDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(examDate)) settings.examDate = examDate
    if (hideExamClock === true) settings.hideExamClock = true
    if (theme === 'light' || theme === 'dark') settings.theme = theme
    if (sound === false) settings.sound = false
    if (soundInSilent === true) settings.soundInSilent = true
    if (haptics === false) settings.haptics = false
    return settings
  } catch {
    return {}
  }
}

// Read on first use so the pure parser stays importable outside a browser.
let settings: Settings | null = null
export const readSettings = () => {
  settings ??= parseSettings(appStorage.getItem(KEY))
  return settings
}
const listeners = new Set<() => void>()

// Another tab changed a setting: read it again.
appStorage.watch(KEY, () => {
  settings = parseSettings(appStorage.getItem(KEY))
  for (const listener of listeners) listener()
})

export function useSettings(): Settings {
  return useSyncExternalStore((listener) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, readSettings)
}

export function saveSettings(next: Settings) {
  settings = next
  appStorage.setItem(KEY, JSON.stringify(next))
  for (const listener of listeners) listener()
}

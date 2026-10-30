import { useSyncExternalStore } from 'react'
import { appStorage } from '../legacy/storage'

/** Learner settings the shell owns. Every field is optional so older saves keep parsing. */
export type Settings = {
  /** Vize 1 day as YYYY-MM-DD once Eren knows it; until then the app says "around 15 Kasım". */
  examDate?: string
  /** Exam rehearsal clock hidden (for students who get anxious watching it). */
  hideExamClock?: boolean
}

const KEY = 'dizey.settings'

export function parseSettings(raw: string | null): Settings {
  try {
    const value: unknown = JSON.parse(raw ?? '{}')
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
    const { examDate, hideExamClock } = value as Record<string, unknown>
    const settings: Settings = {}
    if (typeof examDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(examDate)) settings.examDate = examDate
    if (hideExamClock === true) settings.hideExamClock = true
    return settings
  } catch {
    return {}
  }
}

// Read on first use so the pure parser stays importable outside a browser.
let settings: Settings | null = null
const current = () => {
  settings ??= parseSettings(appStorage.getItem(KEY))
  return settings
}
const listeners = new Set<() => void>()

export function useSettings(): Settings {
  return useSyncExternalStore((listener) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, current)
}

export function saveSettings(next: Settings) {
  settings = next
  appStorage.setItem(KEY, JSON.stringify(next))
  for (const listener of listeners) listener()
}

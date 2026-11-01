import { useSyncExternalStore } from 'react'
import { appStorage } from '../lib/storage/app-storage'
import { markActive } from '../progress/activity-store'
import { emptyRecord, type LessonRecord } from './progress'

const KEY = 'dizey.lessons'

type Records = Record<string, LessonRecord>

/** Stored records; an unreadable value is kept aside (keepCorrupt) and reads as no progress. */
export function readRecords(raw: string | null): { records: Records; corrupt: boolean } {
  if (raw === null) return { records: {}, corrupt: false }
  try {
    const value: unknown = JSON.parse(raw)
    if (value && typeof value === 'object' && !Array.isArray(value))
      return { records: value as Records, corrupt: false }
  } catch {
    // Falls through to corrupt.
  }
  return { records: {}, corrupt: true }
}

function read(): Records {
  const raw = appStorage.getItem(KEY)
  const { records, corrupt } = readRecords(raw)
  if (corrupt && raw !== null) appStorage.keepCorrupt(KEY, raw)
  return records
}

let records = read()
const listeners = new Set<() => void>()
const notify = () => {
  for (const listener of listeners) listener()
}

// Another tab saved: take its records, so this tab never writes a stale copy back.
appStorage.watch(KEY, () => {
  records = read()
  notify()
})

export function useLessonRecords(): Records {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    () => records,
  )
}

export function recordOf(id: string): LessonRecord {
  return records[id] ?? emptyRecord
}

/** Saves one lesson's record, merged into what is stored now (another tab may have saved others). */
export function saveRecord(id: string, record: LessonRecord) {
  records = { ...read(), [id]: record }
  appStorage.setItem(KEY, JSON.stringify(records))
  notify()
  markActive()
}

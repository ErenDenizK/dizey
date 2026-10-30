import { useSyncExternalStore } from 'react'
import { appStorage } from '../legacy/storage'
import { emptyRecord, type LessonRecord } from './progress'

const KEY = 'dizey.lessons'

type Records = Record<string, LessonRecord>

function read(): Records {
  try {
    const value: unknown = JSON.parse(appStorage.getItem(KEY) ?? '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Records) : {}
  } catch {
    return {}
  }
}

let records = read()
const listeners = new Set<() => void>()

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

export function saveRecord(id: string, record: LessonRecord) {
  records = { ...records, [id]: record }
  appStorage.setItem(KEY, JSON.stringify(records))
  for (const listener of listeners) listener()
}

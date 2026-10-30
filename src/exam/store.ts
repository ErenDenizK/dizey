import { useSyncExternalStore } from 'react'
import { questions } from '../content/questions'
import { appStorage } from '../legacy/storage'
import { type ExamResult, type ExamSession, finish, parseSession, score } from './session'

const CURRENT = 'dizey.exam.current'
const HISTORY = 'dizey.exam.history'

export type HistoryEntry = ExamResult & { set: ExamSession['set']; finishedAt: number; usedMs: number }

type Snapshot = { session: ExamSession | null; history: HistoryEntry[] }

function readHistory(): HistoryEntry[] {
  try {
    const value: unknown = JSON.parse(appStorage.getItem(HISTORY) ?? '[]')
    return Array.isArray(value) ? (value as HistoryEntry[]) : []
  } catch {
    return []
  }
}

function read(): Snapshot {
  return { session: parseSession(appStorage.getItem(CURRENT), questions), history: readHistory() }
}

let snapshot = read()
const listeners = new Set<() => void>()

function commit(session: ExamSession | null, history = snapshot.history) {
  if (session) appStorage.setItem(CURRENT, JSON.stringify(session))
  else appStorage.removeItem(CURRENT)
  appStorage.setItem(HISTORY, JSON.stringify(history))
  snapshot = { session, history }
  for (const listener of listeners) listener()
}

export function useExam(): Snapshot {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    () => snapshot,
  )
}

export function saveSession(session: ExamSession) {
  commit(session)
}

/** Ends the attempt, records it in the history and keeps it for review. */
export function endSession(now: number) {
  const session = snapshot.session
  if (!session || session.finishedAt !== null) return
  const done = finish(session, now)
  const entry: HistoryEntry = {
    ...score(done, questions),
    set: done.set,
    finishedAt: done.finishedAt ?? now,
    usedMs: (done.finishedAt ?? now) - done.startedAt,
  }
  commit(done, [entry, ...snapshot.history].slice(0, 20))
}

export function discardSession() {
  commit(null)
}

import { useSyncExternalStore } from 'react'
import { questions } from '../content/questions'
import { appStorage } from '../legacy/storage'
import type { ExamOutcomes } from '../progress/mistakes'
import { type ExamResult, type ExamSession, finish, parseSession, score } from './session'

const CURRENT = 'dizey.exam.current'
const HISTORY = 'dizey.exam.history'
const OUTCOMES = 'dizey.exam.outcomes'

export type HistoryEntry = ExamResult & { set: ExamSession['set']; finishedAt: number; usedMs: number }

type Snapshot = { session: ExamSession | null; history: HistoryEntry[]; outcomes: ExamOutcomes }

function readOutcomes(): ExamOutcomes {
  try {
    const value: unknown = JSON.parse(appStorage.getItem(OUTCOMES) ?? '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as ExamOutcomes) : {}
  } catch {
    return {}
  }
}

/** Latest graded answer per question; a blank leaves the earlier outcome alone. */
export function mergeOutcomes(outcomes: ExamOutcomes, session: ExamSession, at: number): ExamOutcomes {
  const next = { ...outcomes }
  const byId = new Map(questions.map((question) => [question.id, question]))
  for (const id of session.questionIds) {
    const given = session.answers[id] ?? null
    const question = byId.get(id)
    if (!question || given === null) continue
    next[id] = { correct: given === question.answer, given, at }
  }
  return next
}

function readHistory(): HistoryEntry[] {
  try {
    const value: unknown = JSON.parse(appStorage.getItem(HISTORY) ?? '[]')
    return Array.isArray(value) ? (value as HistoryEntry[]) : []
  } catch {
    return []
  }
}

function read(): Snapshot {
  return {
    session: parseSession(appStorage.getItem(CURRENT), questions),
    history: readHistory(),
    outcomes: readOutcomes(),
  }
}

let snapshot = read()
const listeners = new Set<() => void>()

function commit(session: ExamSession | null, history = snapshot.history, outcomes = snapshot.outcomes) {
  if (session) appStorage.setItem(CURRENT, JSON.stringify(session))
  else appStorage.removeItem(CURRENT)
  appStorage.setItem(HISTORY, JSON.stringify(history))
  if (outcomes !== snapshot.outcomes) appStorage.setItem(OUTCOMES, JSON.stringify(outcomes))
  snapshot = { session, history, outcomes }
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
  const at = done.finishedAt ?? now
  commit(done, [entry, ...snapshot.history].slice(0, 20), mergeOutcomes(snapshot.outcomes, done, at))
}

export function discardSession() {
  commit(null)
}

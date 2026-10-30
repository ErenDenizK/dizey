import { useSyncExternalStore } from 'react'
import { type LessonCatalog, shellBridge } from '../legacy/bridge'
import { appStorage } from '../legacy/storage'
import { type DoneMap, parseDone, parseSaved, type ResumePoint, resumePoint } from './progress'

export type ShellSnapshot = {
  catalog: LessonCatalog | null
  done: DoneMap
  resume: ResumePoint | null
  /** The lesson on screen, or null while the shell is showing. */
  openLesson: string | null
}

type SatirHook = { openLesson(step: number, code: string, source?: Element | null): void }

let openLesson: string | null = null
let snapshot = read()
const listeners = new Set<() => void>()

function read(): ShellSnapshot {
  const catalog = shellBridge.catalog()
  const done = parseDone(appStorage.getItem('satir.v3.done'))
  const saved = parseSaved(appStorage.getItem('satir.v3.progress'))
  return { catalog, done, resume: catalog ? resumePoint(catalog, done, saved) : null, openLesson }
}

function refresh() {
  snapshot = read()
  for (const listener of listeners) listener()
}

shellBridge.subscribe(refresh)
shellBridge.onExit(() => {
  openLesson = null
  delete document.documentElement.dataset.lesson
})

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useShell(): ShellSnapshot {
  return useSyncExternalStore(subscribe, () => snapshot)
}

/**
 * Hands the screen to the kept lesson layer. `origin` is the element the lesson grows out of (the
 * layer's shared-element morph); the shell fades behind it.
 */
export function startLesson(code: string, origin: Element | null) {
  const satir = (window as { satir?: SatirHook }).satir
  if (!satir) return
  const step = snapshot.resume?.code === code ? snapshot.resume.step : 0
  openLesson = code
  document.documentElement.dataset.lesson = 'open'
  refresh()
  satir.openLesson(step, code, origin)
}

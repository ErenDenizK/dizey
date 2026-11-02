import Dexie, { type EntityTable } from 'dexie'
import { buildInfo } from '../build-info'

export interface LessonProgress {
  lessonId: string
  /** Index of the furthest step reached. */
  step: number
  completedAt: number | null
  updatedAt: number
}

/**
 * Progress lives in IndexedDB. The database name carries the deployment channel, so a PR preview
 * on the same origin can never read or migrate real progress. Schema changes add a new
 * `version(n)` with an upgrade; existing versions are never edited.
 */
export class DizeyDatabase extends Dexie {
  progress!: EntityTable<LessonProgress, 'lessonId'>

  constructor(channel: string) {
    super(channel === 'production' ? 'dizey' : `dizey-${channel}`)
    this.version(1).stores({ progress: 'lessonId, updatedAt' })
  }
}

export const db = new DizeyDatabase(buildInfo.channel)

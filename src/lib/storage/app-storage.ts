import { buildInfo } from '../build-info'

/**
 * localStorage for app progress, namespaced by deployment channel: a PR preview shares
 * the production origin, so its keys get a prefix and can never read or overwrite real progress.
 *
 * Never throws. Storage can be blocked (some private modes), full, or missing; then values live in
 * memory for this visit, so the app keeps working and nothing is lost before the page closes.
 */
const prefix = buildInfo.channel === 'production' ? '' : `${buildInfo.channel}:`

const memory = new Map<string, string>()

function local(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export const appStorage = {
  getItem(key: string): string | null {
    if (memory.has(key)) return memory.get(key) ?? null
    try {
      return local()?.getItem(prefix + key) ?? null
    } catch {
      return null
    }
  },
  /** Saves a value; false when storage refused it (it is then kept in memory for this visit). */
  setItem(key: string, value: string): boolean {
    try {
      const storage = local()
      if (!storage) throw new Error('no storage')
      storage.setItem(prefix + key, value)
      memory.delete(key)
      return true
    } catch {
      memory.set(key, value)
      return false
    }
  },
  removeItem(key: string): void {
    memory.delete(key)
    try {
      local()?.removeItem(prefix + key)
    } catch {
      // Nothing to remove when storage is unavailable.
    }
  },
  /** Keys of this channel, without the prefix. */
  keys(): string[] {
    let stored: string[] = []
    try {
      const storage = local()
      stored = storage ? Object.keys(storage) : []
    } catch {
      stored = []
    }
    const own = stored
      .filter((key) => (prefix ? key.startsWith(prefix) : !/^pr-\d+:/.test(key)))
      .map((key) => key.slice(prefix.length))
    return [...new Set([...own, ...memory.keys()])]
  },
  /**
   * Calls `fn` when another tab of this app changes `key`, so open tabs never write over each other's
   * progress with stale copies. Returns the unsubscribe.
   */
  watch(key: string, fn: () => void): () => void {
    const target = typeof globalThis.addEventListener === 'function' ? globalThis : null
    if (!target) return () => {}
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === prefix + key) fn()
    }
    target.addEventListener('storage', onStorage)
    return () => target.removeEventListener('storage', onStorage)
  },
  /**
   * Keeps an unreadable value under a dated key before it is replaced, so a bug in a parser can be
   * recovered from instead of silently losing progress.
   */
  keepCorrupt(key: string, raw: string): void {
    const backup = `${key}.corrupt.${new Date().toISOString().slice(0, 19)}`
    if (appStorage.getItem(backup) === null) appStorage.setItem(backup, raw)
  },
}

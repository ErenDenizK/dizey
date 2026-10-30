/**
 * Progress backup: every stored key of this deployment channel in one JSON file. Restoring replaces
 * the channel's keys. Format changes bump `format` and keep a reader for every older one.
 */
export type Backup = {
  app: 'dizey'
  format: 1
  exportedAt: string
  channel: string
  entries: Record<string, string>
}

export function createBackup(entries: Record<string, string>, channel: string, now: Date): Backup {
  return { app: 'dizey', format: 1, exportedAt: now.toISOString(), channel, entries: { ...entries } }
}

export function parseBackup(text: string): Backup | null {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return null
  }
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<Backup>
  if (candidate.app !== 'dizey' || candidate.format !== 1) return null
  if (typeof candidate.exportedAt !== 'string' || Number.isNaN(Date.parse(candidate.exportedAt))) return null
  const entries = candidate.entries
  if (!entries || typeof entries !== 'object' || Array.isArray(entries)) return null
  if (!Object.values(entries).every((entry) => typeof entry === 'string')) return null
  return {
    app: 'dizey',
    format: 1,
    exportedAt: candidate.exportedAt,
    channel: typeof candidate.channel === 'string' ? candidate.channel : 'unknown',
    entries: { ...entries },
  }
}

type KeyStore = {
  keys(): string[]
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function readEntries(store: KeyStore): Record<string, string> {
  const entries: Record<string, string> = {}
  for (const key of store.keys()) {
    const value = store.getItem(key)
    if (value !== null) entries[key] = value
  }
  return entries
}

export function restoreEntries(store: KeyStore, backup: Backup): void {
  for (const key of store.keys()) store.removeItem(key)
  for (const [key, value] of Object.entries(backup.entries)) store.setItem(key, value)
}

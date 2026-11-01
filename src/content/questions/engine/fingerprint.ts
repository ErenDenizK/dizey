import type { Question } from '../types'

/** 64-bit FNV-1a of the question's JSON: any change to what a student sees or reads changes it. */
export function fingerprint(question: Question): string {
  let hash = 0xcbf29ce484222325n
  for (const byte of new TextEncoder().encode(JSON.stringify(question))) {
    hash ^= BigInt(byte)
    hash = (hash * 0x100000001b3n) & 0xffffffffffffffffn
  }
  return hash.toString(16).padStart(16, '0')
}

/** Problems between a lock (id -> fingerprint) and the questions now generated. Empty means stable. */
export function lockProblems(
  lock: Readonly<Record<string, string>>,
  current: Readonly<Record<string, string>>,
): string[] {
  const problems: string[] = []
  for (const [id, locked] of Object.entries(lock)) {
    if (!(id in current)) problems.push(`${id} is locked but no longer generated`)
    else if (current[id] !== locked)
      problems.push(`${id} changed after it was locked (ids are stable forever; add a new id instead)`)
  }
  for (const id of Object.keys(current)) {
    if (!(id in lock)) problems.push(`${id} is new: run "pnpm lock:questions" to lock it`)
  }
  return problems
}

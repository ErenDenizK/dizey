import { readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { fingerprint, lockProblems } from '../engine/fingerprint'
import { generatedQuestions } from './all'

/**
 * Stability guard for generated questions. Attempt and mistake records key on question ids, so a locked id
 * must keep exactly the same content forever. `lock.json` maps each generated id to a fingerprint of its
 * content. To add NEW generated items, append their seeds in the family file, then run
 *   pnpm lock:questions
 * which only adds fingerprints for ids that are not locked yet; it never rewrites a locked one. Changing a
 * locked item means a new id, not a new fingerprint.
 */

const path = new URL('./lock.json', import.meta.url)
const README =
  'Fingerprints of generated questions, id -> content. Only add via "pnpm lock:questions"; never edit a locked entry. See lock.test.ts.'

const current = Object.fromEntries(generatedQuestions.map((q) => [q.id, fingerprint(q)]))

function readLock(): Record<string, string> {
  return (JSON.parse(readFileSync(path, 'utf8')) as { fingerprints: Record<string, string> }).fingerprints
}

describe('generated question lock', () => {
  if (process.env.UPDATE_QUESTION_LOCK === '1') {
    it('adds fingerprints for new ids', () => {
      const lock = readLock()
      const merged = {
        ...Object.fromEntries(Object.entries(current).filter(([id]) => !(id in lock))),
        ...lock,
      }
      const sorted = Object.fromEntries(Object.entries(merged).sort(([a], [b]) => a.localeCompare(b)))
      writeFileSync(path, `${JSON.stringify({ _readme: README, fingerprints: sorted }, null, 2)}\n`)
    })
  }

  it('keeps every locked id exactly as it was and locks every generated id', () => {
    expect(lockProblems(readLock(), current)).toEqual([])
  })

  it('notices a changed, a vanished and an unlocked id', () => {
    expect(lockProblems({ a: '1', b: '2' }, { a: '1', b: '3' })).toHaveLength(1)
    expect(lockProblems({ a: '1', b: '2' }, { a: '1' })).toHaveLength(1)
    expect(lockProblems({ a: '1' }, { a: '1', c: '9' })).toHaveLength(1)
    expect(lockProblems({ a: '1' }, { a: '1' })).toEqual([])
  })
})

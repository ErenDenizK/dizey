import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * First-load weight guard: Dexie (about 95 KB of the main chunk) once rode along only because a one-function helper
 * lived next to the unused database class. Nothing statically reachable from the entry may import it.
 */
function staticImports(file: string): string[] {
  const text = readFileSync(file, 'utf8')
  return [...text.matchAll(/^\s*(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]/gm)].map(
    (m) => m[1] as string,
  )
}

function reachable(entry: string): { files: Set<string>; packages: Set<string> } {
  const files = new Set<string>()
  const packages = new Set<string>()
  const walk = (file: string) => {
    if (files.has(file)) return
    files.add(file)
    for (const spec of staticImports(file)) {
      if (!spec.startsWith('.')) {
        packages.add(spec)
        continue
      }
      const base = resolve(dirname(file), spec)
      for (const candidate of [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]) {
        try {
          readFileSync(candidate)
          walk(candidate)
          break
        } catch {
          // try the next extension
        }
      }
    }
  }
  walk(entry)
  return { files, packages }
}

describe('first-load graph', () => {
  it('does not pull Dexie into the entry chunk', () => {
    const { packages } = reachable(resolve(__dirname, '../../main.tsx'))
    expect([...packages]).not.toContain('dexie')
  })
})

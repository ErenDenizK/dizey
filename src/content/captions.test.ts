import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * No explanatory captions: a screen does not explain itself in small print under its content.
 * A string key ending in Hint, Sub or Caption must not be shown by any screen component under
 * shell, exam, lesson or ui, unless it is listed below with the reason it is data and not an explanation.
 */
const ALLOWED: Record<string, string> = {
  // The row's value on Bugün: the size of the rehearsal ("15 soru"), a fact like a count, not an explanation.
  'today.examSub': 'a value (question count), not a caption',
}

const strings = readFileSync(new URL('./strings.ts', import.meta.url), 'utf8')

/** Every "section.key" whose key ends in Hint, Sub or Caption, found by tracking the top-level sections. */
function captionKeys(): string[] {
  const keys: string[] = []
  let section = ''
  for (const line of strings.split('\n')) {
    const open = line.match(/^ {2}(\w+): \{/)
    if (open) section = open[1] as string
    const flat = line.match(/^ {2}(\w+): [^{]/)
    if (flat && /(Hint|Sub|Caption)$/.test(flat[1] as string)) keys.push(`${flat[1]}`)
    const key = line.match(/^ {4}(\w+(?:Hint|Sub|Caption)):/)
    if (key && section) keys.push(`${section}.${key[1]}`)
  }
  return keys
}

function tsxFiles(dir: URL): URL[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir)
    if (entry.isDirectory()) return tsxFiles(url)
    return entry.name.endsWith('.tsx') ? [url] : []
  })
}

describe('no explanatory captions', () => {
  const keys = captionKeys()
  const sources = ['../shell/', '../exam/', '../lesson/', '../ui/']
    .flatMap((dir) => tsxFiles(new URL(dir, import.meta.url)))
    .map((url) => readFileSync(url, 'utf8'))

  it('finds the caption keys it guards', () => {
    expect(keys).toContain('today.examSub')
  })

  it('shows no Hint, Sub or Caption string outside the allowlist', () => {
    const used = keys.filter((key) => {
      const [section, name] = key.split('.') as [string, string]
      return sources.some((source) => new RegExp(`strings\\.${section}\\.${name}\\b`).test(source))
    })
    expect(used.filter((key) => !(key in ALLOWED))).toEqual([])
  })

  it('keeps the allowlist free of stale entries', () => {
    for (const key of Object.keys(ALLOWED)) expect(keys).toContain(key)
  })
})

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Every movement in the app runs on the spring engine (src/engine). CSS transitions, keyframes and
 * the Web Animations API would move things on fixed curves instead, outside the engine's physics,
 * its reduced-motion handling and its "tap to land" channels. This guard keeps them out.
 */
const root = new URL('../', import.meta.url).pathname

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
}

/**
 * Known offenders, each owed a move onto the engine. Remove an entry once its file is clean: the last
 * test fails while a listed file no longer needs the exemption.
 */
const PENDING = new Set<string>()
const offends = (path: string) =>
  /(^|[\s;{])(transition|animation)(-[\w-]+)?\s*:|@keyframes/m.test(code(path))

const source = files(root).filter((path) => !path.includes('.test.') && /\.(css|tsx?)$/.test(path))
const code = (path: string) =>
  readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

describe('motion runs on the spring engine only', () => {
  it.each(
    source
      .filter((path) => path.endsWith('.css'))
      .map((path) => [path.slice(root.length)])
      .filter(([path]) => !PENDING.has(path as string)),
  )('%s declares no transition, animation or keyframes', (path) => {
    expect(offends(join(root, path))).toBe(false)
  })

  it.each([...PENDING].map((path) => [path]))('%s still needs its exemption', (path) => {
    expect(offends(join(root, path))).toBe(true)
  })

  it('no script animates outside the engine', () => {
    const offenders = source
      .filter((path) => /\.tsx?$/.test(path) && !path.includes('/engine/'))
      .filter((path) => /\.animate\(|\btransition\s*:|requestAnimationFrame/.test(code(path)))
      .map((path) => path.slice(root.length))
    expect(offenders).toEqual([])
  })
})

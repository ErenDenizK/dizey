import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Every corner comes from the corner scale (--corner-* in src/styles/tokens.css), or is a hairline corner of
 * 4 px or less (brackets and bars), or an em of the math it wraps. Type and spacing have their own guard
 * (type-space.test.ts). One-off radii are how a design stops looking like one system.
 */
const sheets = ['../shell/shell.css', '../shell/me.css', '../shell/path.css', '../ui/ui.css', './app.css']

const declarations = (file: string, prop: string) =>
  [
    ...readFileSync(new URL(file, import.meta.url), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .matchAll(new RegExp(`(?:^|[\\s;{])${prop}:\\s*([^;]+);`, 'g')),
  ].map((m) => (m[1] as string).trim())

describe.each(sheets)('%s', (file) => {
  it('rounds corners only from the corner scale', () => {
    const ok = (part: string) =>
      /^(var\(--corner-[\w-]+(,\s*\d+px)?\)|[0-4](px)?|[\d.]+em|inherit)$/.test(part)
    const off = declarations(file, 'border-radius').filter((v) => !v.split(/\s+(?![^(]*\))/).every(ok))
    expect(off).toEqual([])
  })
})

/** Every source file that can style something: stylesheets and the components that set inline custom properties. */
const sources = (dir: URL): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir)
    if (entry.isDirectory()) return sources(url)
    return /\.(css|tsx?)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [url.pathname] : []
  })

describe('custom properties', () => {
  // The sound lab is being rebuilt from the app's own parts (PR #57); it joins this guard when that lands.
  const files = sources(new URL('../', import.meta.url)).filter((f) => !f.includes('/src/lab/'))
  const text = files.map((f) => readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')).join('\n')
  // Declared in a sheet (--name: …) or set from a component ('--name' in a style object or setProperty).
  const defined = new Set([...text.matchAll(/(--[\w-]+)\s*:|['"`](--[\w-]+)['"`]/g)].map((m) => m[1] ?? m[2]))

  it('uses no token that is never defined (a typo or a removed token silently falls back)', () => {
    const used = new Set([...text.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1] as string))
    expect([...used].filter((name) => !defined.has(name)).sort()).toEqual([])
  })

  it('writes no raw colour outside the token sheets', () => {
    const raw = files
      .filter((f) => f.endsWith('.css') && !f.endsWith('/styles/tokens.css'))
      .flatMap((f) =>
        readFileSync(f, 'utf8')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .split('\n')
          .filter((line) => /#[\da-f]{3,8}\b|\b(?:oklch|rgba?|hsla?)\(/i.test(line))
          // A custom property declaration is a (local) token; shadows may darken with plain black.
          .filter((line) => !/^\s*--[\w-]+:/.test(line) && !/oklch\(0 0 0 \/ [\d.]+\)/.test(line))
          .map((line) => `${f.split('/src/')[1]}: ${line.trim()}`),
      )
    expect(raw).toEqual([])
  })
})

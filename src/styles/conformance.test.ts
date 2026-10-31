import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Every corner comes from the corner scale (--corner-* in src/styles/tokens.css), or is a hairline corner of
 * 4 px or less (brackets and bars), or an em of the math it wraps. Type and spacing have their own guard
 * (type-space.test.ts). One-off radii are how a design stops looking like one system.
 */
const sheets = ['../shell/shell.css', '../shell/me.css', '../shell/path.css']

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

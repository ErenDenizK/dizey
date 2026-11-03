import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { SIZE_FROM, sizeClassOf } from './size-class'

const src = path.resolve(import.meta.dirname, '..')

function cssFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return cssFiles(full)
    return entry.name.endsWith('.css') ? [full] : []
  })
}

describe('size classes', () => {
  const tokens = fs.readFileSync(path.join(src, 'styles/tokens.css'), 'utf8')

  it('the tokens block and the TS constants agree', () => {
    expect(tokens).toContain(`--size-medium-from: ${SIZE_FROM.medium}px;`)
    expect(tokens).toContain(`--size-expanded-from: ${SIZE_FROM.expanded}px;`)
  })

  it('every wide media query in the CSS uses one of the two boundaries (no 1000 px, no stray ones)', () => {
    const allowed = new Set<number>(Object.values(SIZE_FROM))
    for (const file of cssFiles(src)) {
      const css = fs.readFileSync(file, 'utf8')
      for (const match of css.matchAll(/min-width:\s*(\d+)px/g)) {
        const px = Number(match[1])
        // Narrow phone adjustments (344, 390) are compact-only tweaks; the size classes start at 600.
        if (px < SIZE_FROM.medium) continue
        expect(allowed.has(px), `${path.relative(src, file)} uses min-width: ${px}px`).toBe(true)
      }
    }
  })

  it('the TS and CSS boundaries classify the window the same way', () => {
    expect(sizeClassOf(599)).toBe('compact')
    expect(sizeClassOf(600)).toBe('medium')
    expect(sizeClassOf(1023)).toBe('medium')
    expect(sizeClassOf(1024)).toBe('expanded')
  })

  it('the old duplicates are gone', () => {
    const all = cssFiles(src)
      .map((f) => fs.readFileSync(f, 'utf8'))
      .join('\n')
    expect(all).not.toMatch(/min-width:\s*1000px/)
    expect(fs.existsSync(path.join(src, 'shell/wide.ts'))).toBe(false)
  })
})

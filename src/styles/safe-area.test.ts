import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Screen edges on iOS (docs/research/ios-edges.md). Every edge reads --safe-top / --safe-bottom from tokens.css, so one
 * place answers for the device (an iPad window's controls, a future WebKit fix). And the installed app keeps the rule
 * that makes iOS 26 give it the full screen height, without which the tab bar floats a status bar too high.
 */
const src = fileURLToPath(new URL('..', import.meta.url))
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
const strip = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

describe('safe area', () => {
  it('reads env(safe-area-inset-*) only in the tokens and the root rule', () => {
    const allowed = ['styles/tokens.css', 'styles/app.css']
    const offenders = walk(src)
      .filter((f) => /\.(css|tsx?)$/.test(f) && !f.endsWith('.test.ts'))
      .filter((f) => !allowed.some((a) => f.endsWith(a)))
      .filter((f) => /env\(\s*safe-area-inset/.test(strip(readFileSync(f, 'utf8'))))
      .map((f) => f.slice(src.length))
    expect(offenders).toEqual([])
  })

  it('makes the installed app at least screen tall (iOS 26 short viewport)', () => {
    const app = strip(readFileSync(join(src, 'styles/app.css'), 'utf8')).replace(/\s+/g, ' ')
    expect(app).toContain(
      '@media (display-mode: standalone) { html { min-height: min(100lvh, calc(100% + env(safe-area-inset-top, 0px))); } }',
    )
  })

  it('keeps a solid band under the status bar so iOS 26 does not blur the top edge', () => {
    const html = readFileSync(join(src, '../index.html'), 'utf8')
    expect(html).toContain('<div class="dz-status-band" aria-hidden="true"></div>')
    const app = strip(readFileSync(join(src, 'styles/app.css'), 'utf8')).replace(/\s+/g, ' ')
    const rule = app.match(/\.dz-status-band \{([^}]*)\}/)?.[1] ?? ''
    expect(rule).toContain('position: fixed;')
    expect(rule).toContain('inset: 0 0 auto 0;')
    expect(rule).toContain('height: var(--safe-top);')
    expect(rule).not.toContain('pointer-events')
    expect(rule).not.toContain('backdrop-filter')
  })

  it('defines both edges in the tokens', () => {
    const tokens = strip(readFileSync(join(src, 'styles/tokens.css'), 'utf8'))
    expect(tokens).toMatch(/--safe-top:\s*env\(safe-area-inset-top, 0px\);/)
    expect(tokens).toMatch(/--safe-bottom:\s*env\(safe-area-inset-bottom, 0px\);/)
  })
})

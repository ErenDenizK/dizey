import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Text/background pairs the shell uses (src/shell/shell.css aliases), checked in both themes
// against WCAG AA for body text.
const css = readFileSync(new URL('../legacy/v21.css', import.meta.url), 'utf8')

function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`)
  if (start < 0) throw new Error(`No ${selector} block`)
  const body = css.slice(start, css.indexOf('}', start))
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]))
}

function luminance(hex: string): number {
  const channel = (offset: number) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

const pairs: [text: string, background: string][] = [
  ['neutral-12', 'neutral-2'], // ink on page
  ['neutral-12', 'neutral-1'], // ink on card
  ['neutral-11', 'neutral-2'], // muted on page
  ['neutral-11', 'neutral-1'], // muted on card
  ['neutral-11', 'neutral-3'], // muted on soft
  ['neutral-12', 'neutral-3'], // ink on soft (row icons)
  ['on-brand', 'brand-9'], // primary button
]

describe.each([
  ['light', ':root'],
  ['dark', ':root[data-theme="dark"]'],
])('%s theme', (_, selector) => {
  const palette = tokens(selector)
  it.each(pairs)('%s on %s reaches 4.5:1', (text, background) => {
    const fg = palette[text]
    const bg = palette[background]
    expect(fg, text).toBeDefined()
    expect(bg, background).toBeDefined()
    expect(contrast(fg as string, bg as string)).toBeGreaterThanOrEqual(4.5)
  })
})

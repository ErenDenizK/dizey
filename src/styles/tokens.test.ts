import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { baseColourTokens, PALETTES, paletteCss, withPalettes } from './palettes'

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')

function block(selector: string): string {
  const start = css.indexOf(selector)
  if (start < 0) throw new Error(`missing ${selector}`)
  // The selector may end with its own brace (':root {'); searching after it would skip to the next block.
  const open = css.indexOf('{', start + selector.length - 1)
  let depth = 0
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++
    if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i)
  }
  throw new Error(`unclosed ${selector}`)
}

function vars(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of text.matchAll(/(--[\w-]+):\s*([^;]+);/g)) out[m[1] as string] = (m[2] as string).trim()
  return out
}

const dark = vars(block(':root {'))

/** OKLCH to linear sRGB (Björn Ottosson's matrices), then WCAG relative luminance. */
function luminance(value: string): number {
  const m = value.match(/^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/)
  if (!m) throw new Error(`not an opaque oklch colour: ${value}`)
  const [L, C, H] = [Number(m[1]), Number(m[2]), (Number(m[3]) * Math.PI) / 180]
  const a = C * Math.cos(H)
  const b = C * Math.sin(H)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const clamp = (x: number) => Math.min(1, Math.max(0, x))
  const r = clamp(4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s)
  const g = clamp(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s)
  const bl = clamp(-0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s)
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl
}

/** A token's colour, following var(--other) aliases. */
function resolve(theme: Record<string, string>, name: string): string {
  const value = theme[name] as string
  const alias = value.match(/^var\((--[\w-]+)\)$/)
  return alias ? resolve(theme, alias[1] as string) : value
}

function contrast(theme: Record<string, string>, fg: string, bg: string): number {
  const a = luminance(resolve(theme, fg))
  const b = luminance(resolve(theme, bg))
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

const grounds = ['--bg', '--surface', '--surface-raised', '--surface-sunk']
const text = ['--ink-1', '--ink-2', '--ok-ink', '--bad-ink', '--row-ink', '--col-ink']

// Every colour palette is the base with its own block laid over it (src/styles/palettes.ts).
const palettes: [string, Record<string, string>][] = Object.keys(PALETTES).map((id) => [
  id,
  { ...dark, ...vars(block(`:root[data-palette="${id}"]`)) },
])

it('the palette blocks in tokens.css are current (run node scripts/write-palettes.mjs)', () => {
  expect(withPalettes(css, paletteCss(baseColourTokens(css)))).toBe(css)
})

describe.each<[string, Record<string, string>]>([['kehribar', dark], ...palettes])(
  '%s palette',
  (_name, theme) => {
    it.each(text.flatMap((fg) => grounds.map((bg) => [fg, bg])))('%s on %s reads at 4.5:1', (fg, bg) => {
      expect(contrast(theme, fg, bg)).toBeGreaterThanOrEqual(4.5)
    })

    it.each(['ok', 'bad', 'row', 'col'])('%s ink reads on its own tint', (role) => {
      expect(contrast(theme, `--${role}-ink`, `--${role}-tint`)).toBeGreaterThanOrEqual(4.5)
    })

    it('a switch knob (the ground colour) stands out on its neutral on track at 3:1', () => {
      expect(contrast(theme, '--bg', '--switch-on')).toBeGreaterThanOrEqual(3)
    })

    it('an off switch track still shows on a card', () => {
      expect(contrast(theme, '--switch-off', '--surface')).toBeGreaterThanOrEqual(1.4)
    })

    it('a soft button label reads at 4.5:1', () => {
      expect(contrast(theme, '--ink-1', '--control-soft')).toBeGreaterThanOrEqual(4.5)
    })

    it.each(grounds)('tertiary ink stays a 3:1 UI colour on %s', (bg) => {
      expect(contrast(theme, '--ink-3', bg)).toBeGreaterThanOrEqual(3)
    })

    it('row and column inks are told apart at a glance (OKLab distance >= 0.1)', () => {
      const lab = (value: string) => {
        const m = value.match(/^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/)
        if (!m) throw new Error(`not an opaque oklch colour: ${value}`)
        const [L, C, H] = [Number(m[1]), Number(m[2]), (Number(m[3]) * Math.PI) / 180]
        return [L, C * Math.cos(H), C * Math.sin(H)]
      }
      const [r, c] = [lab(theme['--row-ink'] as string), lab(theme['--col-ink'] as string)]
      const distance = Math.hypot(...r.map((v, i) => v - (c[i] as number)))
      expect(distance, `${theme['--row-ink']} vs ${theme['--col-ink']}`).toBeGreaterThanOrEqual(0.1)
    })

    it('primary action label reads at 7:1', () => {
      expect(contrast(theme, '--on-action', '--action')).toBeGreaterThanOrEqual(7)
    })

    it.each([
      ['--on-bad', '--bad-fill'],
      ['--on-ok', '--ok-fill'],
      ['--on-row', '--row-fill'],
    ])('%s on %s marks read at 3:1 (icons and key letters)', (ink, fill) => {
      expect(contrast(theme, ink, fill)).toBeGreaterThanOrEqual(3)
    })

    it.each(['--ok-fill', '--bad-fill', '--row-fill'])(
      '%s is visible as a UI part (3:1 on surface)',
      (fill) => {
        expect(contrast(theme, fill, '--surface')).toBeGreaterThanOrEqual(3)
      },
    )
  },
)

it('the app is dark only: no light theme and no theme switch', () => {
  expect(css).toContain('color-scheme: dark;')
  expect(css).not.toContain('data-theme')
  expect(css).not.toContain('prefers-color-scheme')
})

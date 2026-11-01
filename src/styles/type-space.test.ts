import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Type and space come only from the scale in tokens.css (docs/design/type-and-space.md). A raw size,
 * weight, tracking, line height or gap in component CSS is how a screen drifts off the system one
 * "just 14px here" at a time; this guard keeps every one of them on a token.
 *
 * Math is the one exception for sizes: it is typeset relative to the stage that fits it (em, cqw,
 * --cell), so relative font sizes, unitless line heights and its own spacing are allowed inside math selectors.
 */
const root = new URL('../', import.meta.url).pathname

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
}

/** Files owed a move onto the scale by another workstream. Remove an entry once its file is clean. */
const PENDING = new Set<string>()

const sheets = files(root)
  .filter((path) => path.endsWith('.css') && !path.endsWith('tokens.css'))
  .map((path) => path.slice(root.length))

type Rule = { selector: string; decls: [string, string][] }

function rules(path: string): Rule[] {
  const css = readFileSync(join(root, path), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  const out: Rule[] = []
  // Innermost blocks only: a selector followed by declarations with no nested braces.
  for (const match of css.matchAll(/([^{};]+)\{([^{}]*)\}/g)) {
    const selector = (match[1] as string).trim()
    // The root size is the scale's anchor (Dynamic Type replaces it on iOS), not a use of the scale.
    if (selector.startsWith('@font-face') || selector.startsWith('@theme') || selector === 'html') continue
    const decls = (match[2] as string)
      .split(';')
      .map((d) => d.trim())
      .filter((d) => d.includes(':'))
      .map((d) => {
        const i = d.indexOf(':')
        return [d.slice(0, i).trim(), d.slice(i + 1).trim()] as [string, string]
      })
    out.push({ selector, decls })
  }
  return out
}

/** Math is typeset relative to its stage. */
const MATH =
  /\.(ex-mat|ex-cell|ex-frac|ex-signed|dz-m|ls-scene|ls-stage|ls-work|ls-chip|ls-op|ls-result|ls-seal__cell)/
const SPACING =
  /^(margin|padding)(-(top|right|bottom|left|inline|block)(-(start|end))?)?$|^(row-|column-)?gap$/

function violations(path: string): string[] {
  const found: string[] = []
  for (const { selector, decls } of rules(path)) {
    const math = MATH.test(selector)
    const get = (prop: string) => decls.find(([p]) => p === prop)?.[1]
    const size = get('font-size')
    for (const [prop, value] of decls) {
      const at = `${selector} { ${prop}: ${value} }`
      if (prop === 'font-size') {
        const token = /^var\(--type-[\w-]+\)$/.test(value)
        const relative =
          /\d(em|cqw|%)\b/.test(value) && !/\drem\b/.test(value) && !/^\d/.test(value.replace(/em$/, ''))
        const scaled = /var\(--(cell|seal-cell)\)/.test(value)
        if (!(token || (math && (relative || scaled || /^[\d.]+em$/.test(value))) || value === 'inherit'))
          found.push(`raw font size: ${at}`)
      }
      if (prop === 'font-weight' && !/^var\(--weight-\w+\)$/.test(value) && value !== 'inherit')
        found.push(`raw weight: ${at}`)
      if (prop === 'letter-spacing' && !/^var\(--tracking-[\w-]+\)$/.test(value))
        found.push(`raw tracking: ${at}`)
      if (prop === 'line-height') {
        const token = /^var\(--leading-[\w-]+\)$/.test(value)
        if (!(token || (math && /^[\d.]+$/.test(value)))) found.push(`raw line height: ${at}`)
      }
      if (SPACING.test(prop) && !math) {
        // A px literal may only appear as the floor of a safe-area expression (max(12px, env(...))).
        const bare = value
          .replace(/(max|min)\([^()]*env\([^()]*\)[^()]*\)/g, '')
          .replace(/env\([^()]*\)/g, '')
        if (/(^|[\s(,-])\d*\.?\d+px\b/.test(bare) && !/^0(px)?$/.test(bare)) found.push(`raw space: ${at}`)
      }
    }
    // A role size always travels with its role's line height (rem line heights do not follow em sizes).
    if (size?.startsWith('var(--type-') && !get('line-height'))
      found.push(`role size without its line height: ${selector} { font-size: ${size} }`)
  }
  return found
}

describe('type and space come from the scale', () => {
  it.each(sheets.filter((path) => !PENDING.has(path)).map((path) => [path]))(
    '%s uses tokens only',
    (path) => {
      if (process.env.TYPE_SPACE_REPORT) for (const v of violations(path)) console.log(`${path}: ${v}`)
      expect(violations(path)).toEqual([])
    },
  )

  it.each([...PENDING].map((path) => [path]))('%s still needs its exemption', (path) => {
    expect(violations(path).length).toBeGreaterThan(0)
  })
})

describe('the scale itself', () => {
  const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')
  const px = (name: string) => {
    const value = css.match(new RegExp(`${name}:\\s*([\\d.]+)(rem|px)`))
    if (!value) throw new Error(`missing ${name}`)
    return value[2] === 'rem' ? Number(value[1]) * 17 : Number(value[1])
  }
  const roles = ['large', 'title1', 'title2', 'title3', 'body', 'callout', 'subhead', 'footnote', 'caption']

  it.each(roles)('%s has a whole even-pixel line height at the default text size', (role) => {
    const line = px(`--leading-${role}`)
    expect(Math.abs(line - Math.round(line))).toBeLessThan(0.05)
    expect(Math.round(line) % 2).toBe(0)
  })

  it.each(roles)('%s leading is tighter the larger the type (1.15 to 1.6)', (role) => {
    const ratio = px(`--leading-${role}`) / px(`--type-${role}`)
    expect(ratio).toBeGreaterThanOrEqual(1.15)
    expect(ratio).toBeLessThanOrEqual(1.6)
  })

  it('every weight sits above its nominal value (light text on the dark ground reads thinner)', () => {
    const nominal = { regular: 400, medium: 500, semibold: 600, bold: 700 }
    for (const [name, base] of Object.entries(nominal)) {
      const value = Number(css.match(new RegExp(`--weight-${name}:\\s*(\\d+)`))?.[1])
      expect(value).toBeGreaterThan(base)
      expect(value).toBeLessThan(base + 100)
    }
  })

  it('reading text is more open than UI text', () => {
    expect(px('--leading-read')).toBeGreaterThan(px('--leading-body'))
  })

  it('no text is smaller than 14 px (Eren: nothing small)', () => {
    for (const role of roles) expect(Math.round(px(`--type-${role}`))).toBeGreaterThanOrEqual(14)
  })

  it('each proximity step is larger than the one inside it, and a group at least twice a block', () => {
    const steps = ['bound', 'related', 'item', 'block', 'group'].map((name) => {
      const alias = css.match(new RegExp(`--gap-${name}:\\s*var\\((--space-[\\d-]+)\\)`))
      if (!alias) throw new Error(`missing --gap-${name}`)
      return px(alias[1] as string)
    })
    for (let i = 1; i < steps.length; i++) expect(steps[i] as number).toBeGreaterThan(steps[i - 1] as number)
    expect(steps[4] as number).toBeGreaterThanOrEqual((steps[3] as number) * 2)
  })
})

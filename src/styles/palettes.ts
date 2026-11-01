/**
 * Colour palettes: each one is the base dark palette in tokens.css (Kehribar) turned by a few numbers, so every
 * token of every palette keeps the base's lightness ladder (and so its contrast) and only hue and chroma move.
 * scripts/write-palettes.mjs writes the result into tokens.css between the palette markers; tokens.test.ts
 * fails if the written block is stale and checks every palette's contrast pairs.
 *
 * Families: neutrals take the palette's ground hue and chroma (inks take the ink hue), and each role family
 * (row, col, ok, bad, action, spark) is rotated so its main token lands on the palette's hue, keeping the
 * small hue offsets inside the family (a badge's lit top and deep bottom).
 */

export const PALETTE_IDS = ['kehribar', 'tahta', 'murekkep', 'patlican'] as const
export type PaletteId = (typeof PALETTE_IDS)[number]

type Role = { hue: number; chroma?: number }

type Palette = {
  /** Ground hue and the chroma a card surface gets (the base's surfaces carry 0.008). */
  ground: { hue: number; chroma: number }
  /** Lightness added to every ground step (negative is deeper). */
  groundLift?: number
  /** Hue and chroma of the reading inks (the base's primary ink carries 0.007). */
  ink: { hue: number; chroma: number }
  /** Role hues; chroma multiplies the base family's chroma. */
  row: Role
  col: Role
  ok: Role
  bad: Role
  action: Role
  spark: Role
}

/** The base family's main hue and token: a family is rotated so this token lands on the palette's hue. */
const BASE: Record<keyof Omit<Palette, 'ground' | 'groundLift' | 'ink'>, number> = {
  row: 248,
  col: 322,
  ok: 165,
  bad: 25,
  action: 76,
  spark: 95,
}

export const PALETTES: Record<Exclude<PaletteId, 'kehribar'>, Palette> = {
  // Kara tahta: a chalkboard. Slate-green ground, chalk-white ink, chalk-yellow action, chalk blue and pink roles.
  tahta: {
    ground: { hue: 172, chroma: 0.02 },
    ink: { hue: 105, chroma: 0.012 },
    row: { hue: 238, chroma: 1.1 },
    col: { hue: 338, chroma: 1.25 },
    ok: { hue: 142, chroma: 1.15 },
    bad: { hue: 22 },
    action: { hue: 100, chroma: 1.45 },
    spark: { hue: 100, chroma: 0.8 },
  },
  // Gece mürekkebi: midnight ink. Deep indigo ground, cool ink, an electric aqua action; amber rows, orchid columns.
  murekkep: {
    ground: { hue: 272, chroma: 0.032 },
    groundLift: -0.012,
    ink: { hue: 255, chroma: 0.014 },
    row: { hue: 72, chroma: 1.2 },
    col: { hue: 318, chroma: 1.35 },
    ok: { hue: 150, chroma: 1.1 },
    bad: { hue: 18, chroma: 1.05 },
    action: { hue: 196, chroma: 1.3 },
    spark: { hue: 92, chroma: 1.1 },
  },
  // Patlıcan: aubergine and lime. A plum-black ground, an acid lime action; cyan rows, amber columns.
  patlican: {
    ground: { hue: 336, chroma: 0.03 },
    groundLift: -0.006,
    ink: { hue: 340, chroma: 0.012 },
    row: { hue: 212, chroma: 1.2 },
    col: { hue: 62, chroma: 1.3 },
    ok: { hue: 162, chroma: 1.1 },
    bad: { hue: 14, chroma: 1.05 },
    action: { hue: 124, chroma: 1.7 },
    spark: { hue: 118, chroma: 1.5 },
  },
}

/** Which family a token belongs to; null keeps the base value (pure black or white, the duo's cheeks). */
function family(name: string): keyof typeof BASE | 'ground' | 'ink' | null {
  if (/^--(badge-)?row-|^--glow-row/.test(name)) return 'row'
  if (/^--(badge-)?col-/.test(name)) return 'col'
  if (/^--(badge-)?ok-|^--glow-ok/.test(name)) return 'ok'
  if (/^--(badge-)?bad-/.test(name)) return 'bad'
  if (/^--(badge-)?action/.test(name)) return 'action'
  if (/^--(badge-)?spark|^--glow-spark/.test(name)) return 'spark'
  if (/^--ink-|^--hairline|^--press-overlay|^--glass-edge|^--switch-(on|knob)/.test(name)) return 'ink'
  if (/^--duo-blush|^--on-row|^--on-bad|^--scrim|^--backdrop/.test(name)) return null
  return 'ground'
}

const OKLCH = /oklch\(([\d.]+) ([\d.]+) ([\d.]+)( \/ [\d.]+)?\)/g
const round = (x: number, digits = 3) => Number(x.toFixed(digits))
const wrap = (h: number) => round(((h % 360) + 360) % 360, 1)

function turn(value: string, name: string, palette: Palette): string {
  const fam = family(name)
  if (!fam) return value
  return value.replace(OKLCH, (whole, l: string, c: string, h: string, alpha = '') => {
    const [L, C, H] = [Number(l), Number(c), Number(h)]
    if (C === 0) return whole // pure black or white: shadows, gloss, sheen
    let next: [number, number, number]
    if (fam === 'ground') {
      const ground = /^--on-/.test(name) // dark labels on fills sit deep, no lift
      next = [
        ground ? L : L + (palette.groundLift ?? 0),
        (C / 0.008) * palette.ground.chroma,
        palette.ground.hue,
      ]
    } else if (fam === 'ink') {
      next = [L, (C / 0.007) * palette.ink.chroma, palette.ink.hue]
    } else {
      const role = palette[fam]
      next = [L, C * (role.chroma ?? 1), H + role.hue - BASE[fam]]
    }
    return `oklch(${round(next[0])} ${round(Math.min(next[1], 0.37))} ${wrap(next[2])}${alpha})`
  })
}

/**
 * The palette blocks for tokens.css, from the base :root colour tokens. Each palette applies to the whole app
 * from <html data-palette>, and to any element with data-palette-preview (the Profil picker draws every
 * palette's tile in its own colours). Kehribar is the base; it gets a preview block only.
 */
export function paletteCss(baseTokens: Record<string, string>): string {
  const colours = Object.entries(baseTokens).filter(([, value]) => value.includes('oklch('))
  const base = colours.map(([name, value]) => `  ${name}: ${value};`)
  const blocks = [`[data-palette-preview="kehribar"] {\n${base.join('\n')}\n}`]
  for (const [id, palette] of Object.entries(PALETTES)) {
    const lines = colours.map(([name, value]) => `  ${name}: ${turn(value, name, palette)};`)
    blocks.push(`:root[data-palette="${id}"],\n[data-palette-preview="${id}"] {\n${lines.join('\n')}\n}`)
  }
  return blocks.join('\n\n')
}

export const PALETTE_START =
  '/* ---- Palettes: generated by scripts/write-palettes.mjs from src/styles/palettes.ts; do not edit ---- */'
export const PALETTE_END = '/* ---- Palettes end ---- */'

/** The base theme's tokens: the first `:root {` block of tokens.css. */
export function baseColourTokens(css: string): Record<string, string> {
  const open = css.indexOf('{', css.indexOf(':root {'))
  let depth = 0
  let end = open
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++
    if (css[i] === '}' && --depth === 0) {
      end = i
      break
    }
  }
  const out: Record<string, string> = {}
  for (const m of css.slice(open + 1, end).matchAll(/(--[\w-]+):\s*([^;]+);/g))
    out[m[1] as string] = (m[2] as string).trim()
  return out
}

/** tokens.css with the palette section replaced (or appended when the markers are missing). */
export function withPalettes(css: string, blocks: string): string {
  const section = `${PALETTE_START}\n${blocks}\n${PALETTE_END}\n`
  const start = css.indexOf(PALETTE_START)
  if (start < 0) return `${css.trimEnd()}\n\n${section}`
  const end = css.indexOf(PALETTE_END) + PALETTE_END.length + 1
  return css.slice(0, start) + section + css.slice(end)
}

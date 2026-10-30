import katex from 'katex'

export type TextPart = { tex: boolean; value: string }

/** Splits "olduğuna göre $A^T$ ..." into plain and TeX parts. An unpaired `$` stays text. */
export function splitTex(text: string): TextPart[] {
  const parts: TextPart[] = []
  const pattern = /\$([^$]+)\$/g
  let last = 0
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0
    if (index > last) parts.push({ tex: false, value: text.slice(last, index) })
    parts.push({ tex: true, value: match[1] ?? '' })
    last = index + match[0].length
  }
  if (last < text.length) parts.push({ tex: false, value: text.slice(last) })
  return parts
}

const cache = new Map<string, string>()

/** Inline TeX to HTML (KaTeX, decision 0001). Content is ours and checked by tests; errors render red, never throw. */
export function texToHtml(tex: string): string {
  let html = cache.get(tex)
  if (html === undefined) {
    html = katex.renderToString(tex, { throwOnError: false, output: 'html', strict: 'ignore' })
    cache.set(tex, html)
  }
  return html
}

/** Matrix entries are plain strings ("-1", "4/3"); typeset the minus as a real minus sign. */
export function entryText(entry: string): string {
  return entry.replace(/-/g, '−')
}

export type Tone = 'row' | 'col' | 'ok'
export type ToneSegment = { tone: Tone | null; value: string }

/** Splits lesson highlight markup: `{row}…{/row}`, `{col}…{/col}`, `{ok}…{/ok}`. Unknown braces stay text. */
export function splitTones(text: string): ToneSegment[] {
  const segments: ToneSegment[] = []
  const pattern = /\{(row|col|ok)\}([\s\S]*?)\{\/\1\}/g
  let last = 0
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0
    if (index > last) segments.push({ tone: null, value: text.slice(last, index) })
    segments.push({ tone: match[1] as Tone, value: match[2] ?? '' })
    last = index + match[0].length
  }
  if (last < text.length) segments.push({ tone: null, value: text.slice(last) })
  return segments
}

/**
 * Dizey's own math typesetter (decision 0008). It reads the small TeX subset our content uses and writes
 * HTML set in the app's math face: stacked fractions, raised exponents, bars and roots drawn with CSS, and
 * matrices drawn by the same bracket grid as the lesson stage. Anything it does not know renders in the error
 * tone (class `dz-m-error`), and the content tests fail on it, so unsupported TeX never ships silently.
 */

type Node =
  | { kind: 'atom'; text: string; role: 'ord' | 'bin' | 'rel' | 'open' | 'close' | 'punct' | 'word' }
  | { kind: 'text'; text: string }
  | { kind: 'space'; size: 'thin' | 'med' | 'thick' | 'quad' | 'neg' }
  | { kind: 'group'; body: Node[] }
  | { kind: 'scripts'; base: Node; sup?: Node[]; sub?: Node[] }
  | { kind: 'frac'; num: Node[]; den: Node[] }
  | { kind: 'sqrt'; body: Node[] }
  | { kind: 'bar'; body: Node[] }
  | { kind: 'matrix'; rows: Node[][][]; bars: boolean }
  | { kind: 'error'; text: string }

const SYMBOLS: Record<string, { text: string; role: 'ord' | 'bin' | 'rel' | 'word' | 'open' | 'close' }> = {
  cdot: { text: '·', role: 'bin' },
  times: { text: '×', role: 'bin' },
  pm: { text: '±', role: 'bin' },
  mp: { text: '∓', role: 'bin' },
  neq: { text: '≠', role: 'rel' },
  ne: { text: '≠', role: 'rel' },
  le: { text: '≤', role: 'rel' },
  leq: { text: '≤', role: 'rel' },
  ge: { text: '≥', role: 'rel' },
  geq: { text: '≥', role: 'rel' },
  to: { text: '→', role: 'rel' },
  rightarrow: { text: '→', role: 'rel' },
  leftrightarrow: { text: '↔', role: 'rel' },
  Rightarrow: { text: '⇒', role: 'rel' },
  iff: { text: '⟺', role: 'rel' },
  in: { text: '∈', role: 'rel' },
  notin: { text: '∉', role: 'rel' },
  sim: { text: '∼', role: 'rel' },
  approx: { text: '≈', role: 'rel' },
  mid: { text: '|', role: 'rel' },
  cdots: { text: '⋯', role: 'ord' },
  dots: { text: '…', role: 'ord' },
  ldots: { text: '…', role: 'ord' },
  infty: { text: '∞', role: 'ord' },
  Delta: { text: 'Δ', role: 'ord' },
  lambda: { text: 'λ', role: 'ord' },
  alpha: { text: 'α', role: 'ord' },
  beta: { text: 'β', role: 'ord' },
  theta: { text: 'θ', role: 'ord' },
  sum: { text: '∑', role: 'ord' },
  det: { text: 'det', role: 'word' },
  min: { text: 'min', role: 'word' },
  max: { text: 'max', role: 'word' },
  rank: { text: 'rank', role: 'word' },
  '{': { text: '{', role: 'open' },
  '}': { text: '}', role: 'close' },
  '|': { text: '‖', role: 'ord' },
}

const SPACES: Record<string, Extract<Node, { kind: 'space' }>['size']> = {
  ',': 'thin',
  ':': 'med',
  '>': 'med',
  ';': 'thick',
  ' ': 'thick',
  quad: 'quad',
  qquad: 'quad',
  '!': 'neg',
}

const BLACKBOARD: Record<string, string> = { R: 'ℝ', C: 'ℂ', N: 'ℕ', Z: 'ℤ', Q: 'ℚ' }

class Parser {
  private at = 0
  constructor(private readonly src: string) {}

  parse(): Node[] {
    const nodes: Node[] = []
    while (this.at < this.src.length) {
      nodes.push(...this.list(() => false))
      if (this.at < this.src.length) {
        // a stray "&", "\\" or "\end" outside a matrix
        nodes.push({ kind: 'error', text: this.src[this.at] ?? '' })
        this.at++
      }
    }
    return nodes
  }

  private peek(): string {
    return this.src[this.at] ?? ''
  }

  private command(): string {
    // after a backslash: a run of letters, or one symbol character
    const start = this.at
    while (/[a-zA-Z]/.test(this.peek())) this.at++
    if (this.at === start) this.at++
    return this.src.slice(start, this.at)
  }

  private skipSpaces(): void {
    while (this.peek() === ' ') this.at++
  }

  /** A braced group or a single token, as the argument of \frac, ^, \bar ... */
  private argument(): Node[] {
    this.skipSpaces()
    if (this.peek() === '{') {
      this.at++
      const body = this.list((c) => c === '}')
      this.at++
      return body
    }
    const one = this.atom()
    return one ? [one] : []
  }

  private rawGroup(): string {
    this.skipSpaces()
    if (this.peek() !== '{') return this.src[this.at++] ?? ''
    let depth = 0
    const start = this.at + 1
    for (; this.at < this.src.length; this.at++) {
      const c = this.src[this.at]
      if (c === '{') depth++
      else if (c === '}') {
        depth--
        if (depth === 0) break
      }
    }
    const raw = this.src.slice(start, this.at)
    this.at++
    return raw
  }

  private list(stop: (c: string) => boolean): Node[] {
    const nodes: Node[] = []
    while (this.at < this.src.length && !stop(this.peek())) {
      if (this.src.startsWith('\\end', this.at)) break
      if (this.src.startsWith('\\\\', this.at) || this.peek() === '&') break
      const c = this.peek()
      if (c === '^' || c === '_') {
        this.at++
        const script = this.argument()
        const last = nodes.pop() ?? { kind: 'group', body: [] }
        const base: Extract<Node, { kind: 'scripts' }> =
          last.kind === 'scripts' ? last : { kind: 'scripts', base: last }
        if (c === '^') base.sup = script
        else base.sub = script
        nodes.push(base)
        continue
      }
      const node = this.atom()
      if (node) nodes.push(node)
    }
    return nodes
  }

  private atom(): Node | undefined {
    const c = this.peek()
    if (c === '') return undefined
    if (c === ' ') {
      this.at++
      return undefined
    }
    if (c === '{') {
      this.at++
      const body = this.list((x) => x === '}')
      this.at++
      return { kind: 'group', body }
    }
    if (c === '}') {
      this.at++
      return { kind: 'error', text: '}' }
    }
    if (c === '\\') {
      this.at++
      return this.control(this.command())
    }
    this.at++
    if (/[0-9.]/.test(c)) {
      let text = c
      while (
        /[0-9]/.test(this.peek()) ||
        (this.peek() === '.' && /[0-9]/.test(this.src[this.at + 1] ?? ''))
      ) {
        text += this.src[this.at++]
      }
      return { kind: 'atom', text, role: 'ord' }
    }
    if (c === '+' || c === '-') return { kind: 'atom', text: c === '-' ? '−' : '+', role: 'bin' }
    if (c === '=' || c === '<' || c === '>') return { kind: 'atom', text: c, role: 'rel' }
    if (c === '(' || c === '[') return { kind: 'atom', text: c, role: 'open' }
    if (c === ')' || c === ']') return { kind: 'atom', text: c, role: 'close' }
    if (c === ',' || c === ';') return { kind: 'atom', text: c, role: 'punct' }
    if (c === "'") return { kind: 'atom', text: '′', role: 'ord' }
    return { kind: 'atom', text: c, role: 'ord' }
  }

  private control(name: string): Node {
    if (name in SPACES)
      return { kind: 'space', size: SPACES[name] as Extract<Node, { kind: 'space' }>['size'] }
    const symbol = SYMBOLS[name]
    if (symbol) return { kind: 'atom', text: symbol.text, role: symbol.role }
    switch (name) {
      case 'frac':
      case 'tfrac':
      case 'dfrac': {
        const num = this.argument()
        const den = this.argument()
        return { kind: 'frac', num, den }
      }
      case 'sqrt':
        return { kind: 'sqrt', body: this.argument() }
      case 'bar':
      case 'overline':
        return { kind: 'bar', body: this.argument() }
      case 'text':
      case 'textrm':
      case 'mathrm':
        return { kind: 'text', text: this.rawGroup() }
      case 'mathbb': {
        const letter = this.rawGroup()
        return { kind: 'atom', text: BLACKBOARD[letter] ?? letter, role: 'ord' }
      }
      case 'mathrel':
        return { kind: 'group', body: this.argument() }
      case 'left':
      case 'right': {
        this.skipSpaces()
        let d = this.src[this.at++] ?? ''
        if (d === '\\') d = this.command()
        if (d === '.') return { kind: 'group', body: [] }
        const text = d
        return { kind: 'atom', text, role: name === 'left' ? 'open' : 'close' }
      }
      case 'begin': {
        const env = this.rawGroup()
        if (env !== 'bmatrix' && env !== 'pmatrix' && env !== 'matrix' && env !== 'vmatrix')
          return { kind: 'error', text: env }
        return this.matrix(env === 'vmatrix')
      }
      default:
        return { kind: 'error', text: `\\${name}` }
    }
  }

  private matrix(bars: boolean): Node {
    const rows: Node[][][] = [[]]
    for (;;) {
      const cell = this.list(() => false)
      rows[rows.length - 1]?.push(cell)
      if (this.peek() === '&') {
        this.at++
      } else if (this.src.startsWith('\\\\', this.at)) {
        this.at += 2
        rows.push([])
      } else if (this.src.startsWith('\\end', this.at)) {
        this.at += 4
        this.rawGroup()
        break
      } else break
    }
    return { kind: 'matrix', rows: rows.filter((row) => row.length > 0), bars }
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Binary operators take spaces between operands; a sign at the start or after an operator is unary. */
function render(nodes: readonly Node[]): string {
  let html = ''
  let previous: Node | undefined
  for (const node of nodes) {
    if (node.kind === 'atom' && node.role === 'bin') {
      const unary =
        !previous ||
        (previous.kind === 'atom' &&
          previous.role !== 'ord' &&
          previous.role !== 'close' &&
          previous.role !== 'word') ||
        previous.kind === 'space'
      html += unary
        ? `<span class="dz-m-sign">${escapeHtml(node.text)}</span>`
        : `<span class="dz-m-bin">${escapeHtml(node.text)}</span>`
    } else {
      html += one(node)
    }
    previous = node
  }
  return html
}

function one(node: Node): string {
  switch (node.kind) {
    case 'atom':
      if (node.role === 'rel') return `<span class="dz-m-rel">${escapeHtml(node.text)}</span>`
      if (node.role === 'punct') return `<span class="dz-m-punct">${escapeHtml(node.text)}</span>`
      if (node.role === 'word') return `<span class="dz-m-word">${escapeHtml(node.text)}</span>`
      return escapeHtml(node.text)
    case 'text':
      return `<span class="dz-m-text">${escapeHtml(node.text)}</span>`
    case 'space':
      return `<span class="dz-m-space" data-size="${node.size}"></span>`
    case 'group':
      return render(node.body)
    case 'scripts': {
      const base = one(node.base)
      const sup = node.sup ? `<sup class="dz-m-sup">${render(node.sup)}</sup>` : ''
      const sub = node.sub ? `<sub class="dz-m-sub">${render(node.sub)}</sub>` : ''
      if (sup && sub) return `${base}<span class="dz-m-scripts">${sup}${sub}</span>`
      return `${base}${sup}${sub}`
    }
    case 'frac':
      return `<span class="dz-m-frac"><span>${render(node.num)}</span><span>${render(node.den)}</span></span>`
    case 'sqrt':
      return `<span class="dz-m-sqrt"><span class="dz-m-radical">√</span><span class="dz-m-radicand">${render(node.body)}</span></span>`
    case 'bar':
      return `<span class="dz-m-bar">${render(node.body)}</span>`
    case 'matrix': {
      const columns = Math.max(...node.rows.map((row) => row.length))
      const cells = node.rows
        .flatMap((row) => row.map((cell) => `<span class="ex-cell">${render(cell)}</span>`))
        .join('')
      return `<span class="ex-mat dz-m-mat" data-delimiter="${node.bars ? 'bars' : 'brackets'}" style="grid-template-columns: repeat(${columns}, auto)">${cells}</span>`
    }
    case 'error':
      return `<span class="dz-m-error">${escapeHtml(node.text)}</span>`
  }
}

const cache = new Map<string, string>()

/** Inline math to HTML. Our content only; unknown commands render in the error tone and fail the tests. */
export function mathToHtml(tex: string): string {
  let html = cache.get(tex)
  if (html === undefined) {
    html = `<span class="dz-m">${render(new Parser(tex).parse())}</span>`
    cache.set(tex, html)
  }
  return html
}

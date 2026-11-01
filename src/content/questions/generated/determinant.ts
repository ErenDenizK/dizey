import * as M from '../../../lib/math/matrix'
import type { Rational } from '../../../lib/math/rational'
import * as Q from '../../../lib/math/rational'
import { det, matrix, text } from '../blocks'
import { buildQuestion } from '../engine/assemble'
import { num, rootSet, texNumber } from '../engine/format'
import type { Rng } from '../engine/prng'
import type { Draft, DraftDistractor, Family } from '../engine/types'
import type { Question } from '../types'

/**
 * Generated determinant questions in the style of Vize 1 (D1 to D4). The Turkish text lives here; the
 * engine in `../engine` lays out options, and `../engine/verify.ts` re-checks every item independently.
 * Every distractor is produced by a named student mistake (errorType) and every mistake value is computed
 * here from the displayed data with the same rule the verifier recomputes.
 */

const R = (n: number, d = 1): Rational => Q.rational(n, d)
const pow = (base: Rational, e: number): Rational => {
  let out = Q.ONE
  for (let i = 0; i < Math.abs(e); i++) out = Q.mul(out, base)
  return e < 0 ? Q.div(Q.ONE, out) : out
}
const paren = (n: number): string => (n < 0 ? `(${n})` : `${n}`)
const mistake = (errorType: string, value: Rational, feedback: string): DraftDistractor => ({
  value: num(value.num, value.den),
  errorType,
  feedback,
})
/** `-3` -> `(k + 3)`, `2` -> `(k - 2)`: the factor that vanishes at k = r. */
const factorTex = (r: number): string => (r > 0 ? `(k - ${r})` : `(k + ${-r})`)

// ------------------------------------------------------------------ d3-scalar

type Form = 'plain' | 'T' | 'inv' | 'sq'
interface Factor {
  base: 'A' | 'B'
  form: Form
}

const formTex = (f: Factor): string =>
  f.base + (f.form === 'T' ? '^T' : f.form === 'inv' ? '^{-1}' : f.form === 'sq' ? '^2' : '')

export const d3Scalar: Family = {
  id: 'd3-scalar',
  node: 'D3',
  generate(rng: Rng): Draft | null {
    const n = rng.pick([2, 2, 3, 3, 4])
    const k = rng.pick(n === 2 ? [2, 3, 4, 5, -2, -3] : n === 3 ? [2, 3, -2, -3] : [2, 3, -2])
    const useB = rng.chance(0.6)
    const relation = useB && rng.chance(0.3)
    const alpha = relation ? 4 : rng.pick([2, 3, 4, 5, -2, -3, -4])
    const beta = relation ? rng.pick([8, -8]) : rng.pick([2, 3, 4, -2, -3])
    const forms: Form[] = ['plain', 'T', 'inv', 'sq']
    const factors: Factor[] = []
    for (let tries = 0; tries < 30; tries++) {
      const count = rng.int(3, 4)
      const draw = Array.from(
        { length: count },
        (): Factor => ({
          base: useB && rng.chance(0.5) ? 'B' : 'A',
          form: rng.pick(forms),
        }),
      )
      const hasA = draw.some((f) => f.base === 'A')
      const hasB = draw.some((f) => f.base === 'B')
      if (hasA && (!useB || hasB) && draw.some((f) => f.form !== 'plain')) {
        factors.push(...draw)
        break
      }
    }
    if (factors.length === 0) return null

    const value = (base: 'A' | 'B') => R(base === 'A' ? alpha : beta)
    const honest = (f: Factor): Rational => {
      const v = value(f.base)
      return f.form === 'inv' ? Q.div(Q.ONE, v) : f.form === 'sq' ? Q.mul(v, v) : v
    }
    const product = (each: (f: Factor) => Rational) => factors.reduce((p, f) => Q.mul(p, each(f)), Q.ONE)
    const kn = pow(R(k), n)
    const truth = Q.mul(kn, product(honest))
    if (truth.num > 200n || truth.num < -200n || truth.den > 64n) return null

    const expression = `${k}${factors.map(formTex).join('')}`
    const given = useB
      ? `$A$ ve $B$ $${n} \\times ${n}$ tipinden matrisler ve ${relation ? `$|B| = ${beta}$, $A^3 = B^2$` : `$|A| = ${alpha}$, $|B| = ${beta}$`}`
      : `$A$, $${n} \\times ${n}$ tipinden bir matris ve $|A| = ${alpha}$`
    const stem = [
      text(`${given} olduğuna göre $|${expression}|$ determinantının değeri aşağıdakilerden hangisidir?`),
    ]

    const knText = `${paren(k)}^{${n}} = ${kn.num}`
    const exps = (base: 'A' | 'B') =>
      factors
        .filter((f) => f.base === base)
        .reduce((s, f) => s + (f.form === 'inv' ? -1 : f.form === 'sq' ? 2 : 1), 0)
    const powerTex = (base: 'A' | 'B', v: number) =>
      exps(base) === 0 ? '' : ` \\cdot ${paren(v)}^{${exps(base)}}`
    const explanation = [
      relation ? `$A^3 = B^2$ ise $|A|^3 = |B|^2 = ${beta * beta}$, yani $|A| = ${alpha}$.` : '',
      `$|kM| = k^n|M|$ ($n = ${n}$). Çarpanları ayrı ayrı al: $|A^T| = |A|$, $|A^{-1}| = \\frac{1}{|A|}$, $|A^2| = |A|^2$.`,
      `Sonuç: $${paren(k)}^{${n}}${powerTex('A', alpha)}${useB ? powerTex('B', beta) : ''} = ${texNumber(truth)}$.`,
    ]
      .filter(Boolean)
      .join(' ')

    const mk = (scalar: Rational, each: (f: Factor) => Rational = honest) => Q.mul(scalar, product(each))
    const has = (form: Form) => factors.some((f) => f.form === form)
    const out: DraftDistractor[] = [
      mistake(
        'k-instead-of-k-power-n',
        mk(R(k)),
        `$|kM| = k|M|$ değil: $${n} \\times ${n}$ matriste $|kM| = k^n|M|$, burada $${knText}$.`,
      ),
      mistake(
        'dropped-scalar',
        mk(Q.ONE),
        `Başa yazılan $${k}$ çarpanını unuttun: $${n} \\times ${n}$ matriste $|kM| = k^n|M|$, burada $${knText}$.`,
      ),
      mistake(
        'k-squared-always',
        mk(pow(R(k), 2)),
        `$|kM| = k^2|M|$ yalnız $2 \\times 2$ matris için geçerli; burada matris $${n} \\times ${n}$, çarpan $k^n = ${kn.num}$.`,
      ),
    ]
    if (has('inv')) {
      out.push(
        mistake(
          'inverse-taken-as-same',
          mk(kn, (f) => (f.form === 'inv' ? value(f.base) : honest(f))),
          'Tersin determinantı determinantın tersidir: $|M^{-1}| = \\frac{1}{|M|}$, $|M|$ değil.',
        ),
      )
    }
    if (has('T')) {
      out.push(
        mistake(
          'transpose-as-inverse',
          mk(kn, (f) => (f.form === 'T' ? Q.div(Q.ONE, value(f.base)) : honest(f))),
          'Transpoz determinantı değiştirmez: $|M^T| = |M|$, tersini almak gerekmez.',
        ),
      )
    }
    if (has('sq')) {
      out.push(
        mistake(
          'square-as-doubled',
          mk(kn, (f) => (f.form === 'sq' ? Q.mul(R(2), value(f.base)) : honest(f))),
          '$|M^2| = |M|^2$: determinant iki kez çarpılır, $2|M|$ olmaz.',
        ),
      )
    }
    if (k < 0 && n % 2 === 1) {
      out.push(
        mistake(
          'sign-of-k-lost',
          mk(Q.neg(kn)),
          `$k$ negatif ve $n$ tek olduğu için $k^n$ negatiftir: $${knText}$. İşareti kaçırdın.`,
        ),
      )
    }
    return { stem, correct: num(truth.num, truth.den), distractors: out, explanation }
  },
}

// ------------------------------------------------------------------ d4-adjugate

type AdjToken = 'A' | 'Ai' | 'E' | 'Ei'
const adjTex: Record<AdjToken, string> = {
  A: 'A',
  Ai: 'A^{-1}',
  E: '\\text{Ek}(A)',
  Ei: '\\text{Ek}(A)^{-1}',
}

export const d4Adjugate: Family = {
  id: 'd4-adjugate',
  node: 'D4',
  generate(rng: Rng): Draft | null {
    const n = rng.pick([2, 3, 3, 4])
    const alpha = rng.pick([2, 3, 4, 5, -2, -3, -4])
    const tokens = rng.pick<AdjToken[]>([['E'], ['Ei'], ['Ai', 'E'], ['A', 'E'], ['E', 'Ai']])
    const k = rng.chance(0.4) ? rng.pick([2, 3, -2]) : 1
    const kn = pow(R(k), n)
    const exponent = (adjExp: number) =>
      tokens.reduce((s, t) => s + (t === 'A' ? 1 : t === 'Ai' ? -1 : t === 'E' ? adjExp : -adjExp), 0)
    const a = R(alpha)
    const truthExp = exponent(n - 1)
    const truth = Q.mul(kn, pow(a, truthExp))
    if (truth.num > 200n || truth.num < -200n) return null

    const body = tokens.map((t) => adjTex[t]).join('\\,')
    const lead = k === 1 ? '' : `${k}\\,`
    const stem = [
      text(
        `$A$, $${n} \\times ${n}$ tipinden bir matris ve $|A| = ${alpha}$ olduğuna göre $|${lead}${body}|$ determinantının değeri aşağıdakilerden hangisidir?`,
      ),
    ]
    const explanation = [
      `$\\text{Ek}(A) = |A|\\,A^{-1}$ olduğundan $|\\text{Ek}(A)| = |A|^{n}\\cdot\\frac{1}{|A|} = |A|^{n-1}$; burada $|A|^{${n - 1}}$.`,
      `Çarpanların determinantlarını çarp${k === 1 ? '' : ` ve $|kM| = k^n|M|$ ile $${paren(k)}^{${n}} = ${kn.num}$ çarpanını ekle`}: sonuç $${k === 1 ? '' : `${kn.num} \\cdot `}${paren(alpha)}^{${truthExp}} = ${texNumber(truth)}$.`,
    ].join(' ')

    const withExp = (adjExp: number, scalar = kn) => Q.mul(scalar, pow(a, exponent(adjExp)))
    const out: DraftDistractor[] = [
      mistake(
        'adjugate-det-is-det-power-n',
        withExp(n),
        `$|\\text{Ek}(A)| = |A|^{n}$ değil: $\\text{Ek}(A) = |A|A^{-1}$ olduğundan $|\\text{Ek}(A)| = |A|^{n-1}$.`,
      ),
      mistake(
        'adjugate-det-is-det',
        withExp(1),
        `$|\\text{Ek}(A)| = |A|$ değil: $n = ${n}$ için $|\\text{Ek}(A)| = |A|^{${n - 1}}$.`,
      ),
      mistake(
        'adjugate-det-power-n-minus-2',
        withExp(n - 2),
        `$|\\text{Ek}(A)|$ için üs $n - 1 = ${n - 1}$; $n - 2$ almışsın.`,
      ),
      mistake(
        'adjugate-as-inverse',
        withExp(-1),
        `$\\text{Ek}(A)$, $A^{-1}$ değildir: $\\text{Ek}(A) = |A|A^{-1}$ ve determinantı $|A|^{n-1}$.`,
      ),
      mistake(
        'reciprocal-slip',
        Q.mul(kn, pow(a, -truthExp)),
        'Üslerin işaretini ters aldın, sonuç tersine döndü: tersi alınan çarpanın determinantı $\\frac{1}{\\cdot}$ olur, ama diğerleri olduğu gibi kalır.',
      ),
    ]
    if (k !== 1) {
      out.push(
        mistake(
          'k-instead-of-k-power-n',
          Q.mul(R(k), pow(a, truthExp)),
          `$|kM| = k|M|$ değil: $${n} \\times ${n}$ matriste $|kM| = k^n|M|$, burada $${paren(k)}^{${n}} = ${kn.num}$.`,
        ),
        mistake(
          'dropped-scalar',
          pow(a, truthExp),
          `Başa yazılan $${k}$ çarpanını unuttun: $|kM| = k^n|M|$, burada $${paren(k)}^{${n}} = ${kn.num}$.`,
        ),
      )
    }
    return { stem, correct: num(truth.num, truth.den), distractors: out, explanation }
  },
}

// ------------------------------------------------------------------ d2-numeric

type Grid = Rational[][]
const gridOf = (rows: number[][]): Grid => rows.map((r) => r.map((v) => R(v)))
const minorOf = (g: Grid, i: number, j: number): Grid =>
  g.filter((_, r) => r !== i).map((row) => row.filter((_, c) => c !== j))

/** Line with the most zeros; ties go to rows before columns, then the lower index. */
function sparsestLine(g: Grid): { row: boolean; index: number } {
  let best = { row: true, index: 0 }
  let most = -1
  for (const row of [true, false]) {
    for (let index = 0; index < g.length; index++) {
      const count = g.reduce(
        (z, _, t) => z + (Q.isZero((row ? g[index]?.[t] : g[t]?.[index]) ?? Q.ZERO) ? 1 : 0),
        0,
      )
      if (count > most) {
        most = count
        best = { row, index }
      }
    }
  }
  return best
}

/** All-plus recursive expansion along the first row: the sum a student gets by adding every term. */
function allPlus(g: Grid): Rational {
  if (g.length === 1) return g[0]?.[0] ?? Q.ZERO
  return (g[0] ?? []).reduce((s, v, j) => Q.add(s, Q.mul(v, allPlus(minorOf(g, 0, j)))), Q.ZERO)
}

/** Expansion along the line; `signs` false drops the checkerboard, `minor` replaces how minors are valued. */
function along(
  g: Grid,
  line: { row: boolean; index: number },
  signs: boolean,
  minor: (m: Grid) => Rational,
): Rational {
  let total = Q.ZERO
  for (let t = 0; t < g.length; t++) {
    const i = line.row ? line.index : t
    const j = line.row ? t : line.index
    const v = g[i]?.[j] ?? Q.ZERO
    if (Q.isZero(v)) continue
    const term = Q.mul(v, minor(minorOf(g, i, j)))
    total = Q.add(total, signs && (i + j) % 2 === 1 ? Q.neg(term) : term)
  }
  return total
}

export const d2Numeric: Family = {
  id: 'd2-numeric',
  node: 'D2',
  alsoNodes: ['D1'],
  generate(rng: Rng): Draft | null {
    const roll = rng.next()
    const size = roll < 0.3 ? 4 : 3
    const dense = size === 3 && roll > 0.85
    const rows: number[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () =>
        size === 4 ? rng.int(-3, 3) : dense ? rng.int(-4, 4) : rng.int(-5, 6),
      ),
    )
    if (!dense) {
      const asRow = rng.chance(0.5)
      const at = rng.int(0, size - 1)
      const keep = rng.pick(size === 4 ? [1, 2, 2] : [1, 1, 2])
      const nonzero = rng.shuffle(Array.from({ length: size }, (_, t) => t)).slice(0, keep)
      for (let t = 0; t < size; t++) {
        if (nonzero.includes(t)) {
          const v = asRow ? rows[at]?.[t] : rows[t]?.[at]
          if (v === 0) {
            if (asRow) (rows[at] as number[])[t] = rng.pick([1, 2, -1, 3, -2])
            else (rows[t] as number[])[at] = rng.pick([1, 2, -1, 3, -2])
          }
        } else if (asRow) (rows[at] as number[])[t] = 0
        else (rows[t] as number[])[at] = 0
      }
    }
    const g = gridOf(rows)
    const truth = M.determinant(g)
    const limit = size === 4 ? 150n : dense ? 60n : 120n
    if (Q.isZero(truth) || truth.num > limit || truth.num < -limit) return null
    const diagonal = g.reduce((p, row, i) => Q.mul(p, row[i] ?? Q.ZERO), Q.ONE)
    const line = sparsestLine(g)
    const exact = (m: Grid) => M.determinant(m)

    const stem = rng.chance(0.5)
      ? [det(rows.map((r) => r.map(String))), text('determinantının değeri aşağıdakilerden hangisidir?')]
      : [
          matrix(
            rows.map((r) => r.map(String)),
            'A =',
          ),
          text('matrisi için $|A|$ değeri aşağıdakilerden hangisidir?'),
        ]

    const parts: string[] = []
    for (let t = 0; t < size; t++) {
      const i = line.row ? line.index : t
      const j = line.row ? t : line.index
      const v = g[i]?.[j] ?? Q.ZERO
      if (Q.isZero(v)) continue
      const minorValue = exact(minorOf(g, i, j))
      parts.push(
        `${(i + j) % 2 === 1 ? '-' : '+'} ${paren(Number(v.num))} \\cdot ${paren(Number(minorValue.num))}`,
      )
    }
    const where = `${line.index + 1}. ${line.row ? 'satırdan' : 'sütundan'}`
    const explanation = `En çok sıfır içeren ${where} aç; kofaktör işaretleri dama tahtası gibi $+\\ -\\ +\\ \\cdots$. $|A| = ${parts.join(' ').replace(/^\+ /, '')} = ${truth.num}$.`

    const out: DraftDistractor[] = [
      mistake(
        'checkerboard-ignored',
        along(g, line, false, exact),
        'Kofaktör işaretlerini ($(-1)^{i+j}$, dama tahtası) uygulamadın: açılımdaki her terimin işareti $+$ olmaz.',
      ),
      mistake(
        'minor-terms-added',
        along(g, line, true, allPlus),
        size === 3
          ? '$2 \\times 2$ determinant $ad - bc$; çıkarmayı toplama yapmışsın ($ad + bc$).'
          : 'Küçük ($3 \\times 3$) determinantlarda çıkarılması gereken terimleri de toplamışsın.',
      ),
      mistake(
        'diagonal-product',
        diagonal,
        'Köşegen çarpımı yalnız üçgen matriste determinantı verir; bu matris üçgen değil.',
      ),
      mistake(
        'sign-flipped',
        Q.neg(truth),
        'Sonucun işareti ters: kofaktör işaretlerini ($(-1)^{i+j}$) tek tek kontrol et.',
      ),
    ]
    if (size === 3)
      out.push(
        mistake(
          'all-terms-added',
          allPlus(g),
          'Sarrus’ta ters köşegen çarpımları çıkarılır; sen altı terimin hepsini toplamışsın.',
        ),
      )
    return { stem, correct: num(truth.num, truth.den), distractors: out, explanation }
  },
}

// ------------------------------------------------------------------ d3-row-ops

type Term = readonly [string, number]
type Entry = readonly Term[]
const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']

function entryText(entry: Entry): string {
  return entry
    .map(([letter, coef], t) => {
      const body = Math.abs(coef) === 1 ? letter : `${Math.abs(coef)}${letter}`
      return coef < 0 ? `-${body}` : t === 0 ? body : `+${body}`
    })
    .join('')
}

export const d3RowOps: Family = {
  id: 'd3-row-ops',
  node: 'D3',
  generate(rng: Rng): Draft | null {
    let grid: Entry[][] = [0, 1, 2].map((r) =>
      [0, 1, 2].map((c): Entry => [[LETTERS[r * 3 + c] as string, 1]]),
    )
    const d = rng.pick([-7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7])
    const steps: string[] = []
    let c1 = 1
    let m = 0
    let s = 1
    let swapSign = 1
    let transposed = false
    let combined = false
    let scaled = false
    let swapped = false

    if (rng.chance(0.7)) {
      const i = rng.int(0, 2)
      const j = rng.pick([0, 1, 2].filter((x) => x !== i))
      c1 = rng.pick([1, -1])
      m = rng.pick([1, -1, 2, -2])
      combined = true
      const own = grid[i] as Entry[]
      const src = grid[j] as Entry[]
      grid = grid.map((row, r) =>
        r === i
          ? row.map(
              (_, col): Entry => [
                ...(own[col] as Entry).map(([l, k]): Term => [l, k * c1]),
                ...(src[col] as Entry).map(([l, k]): Term => [l, k * m]),
              ],
            )
          : row,
      )
      steps.push(
        c1 === 1
          ? `${i + 1}. satıra ${j + 1}. satırın $${m}$ katı eklenmiş: değer değişmez (çarpan $1$).`
          : `${i + 1}. satır $-1$ ile çarpılıp ${j + 1}. satırın $${m}$ katı eklenmiş: çarpan $-1$.`,
      )
    }
    if (rng.chance(0.6)) {
      const r = rng.int(0, 2)
      s = rng.pick([2, 3, -2, -3])
      scaled = true
      grid = grid.map((row, i) =>
        i === r ? row.map((e): Entry => e.map(([l, k]): Term => [l, k * s])) : row,
      )
      steps.push(`${r + 1}. satırdan $${s}$ ortak çarpan çıkıyor: çarpan $${s}$.`)
    }
    if (rng.chance(0.5)) {
      const [x, y] = rng.pick([
        [0, 1],
        [0, 2],
        [1, 2],
      ] as const)
      const byRows = rng.chance(0.5)
      swapped = true
      swapSign = -1
      grid = byRows
        ? grid.map((_, i) => grid[i === x ? y : i === y ? x : i] as Entry[])
        : grid.map((row) => row.map((_, col) => row[col === x ? y : col === y ? x : col] as Entry))
      steps.push(`${x + 1}. ve ${y + 1}. ${byRows ? 'satır' : 'sütun'} yer değiştirmiş: çarpan $-1$.`)
    }
    if (rng.chance(0.3)) {
      transposed = true
      grid = [0, 1, 2].map((r) => [0, 1, 2].map((c) => (grid[c] as Entry[])[r] as Entry))
      steps.push('Transpoz alınmış: değer değişmez (çarpan $1$).')
    }
    if ([combined, scaled, swapped, transposed].filter(Boolean).length < 2) return null
    const rows = grid.map((row) => row.map(entryText))
    if (rows.flat().some((e) => e.length > 6)) return null
    const f = c1 * s * swapSign
    const truth = d * f
    if (Math.abs(truth) > 60) return null

    const stem = [
      det(
        [
          ['a', 'b', 'c'],
          ['d', 'e', 'f'],
          ['g', 'h', 'i'],
        ],
        '|A| =',
      ),
      text(`$= ${d}$ olduğuna göre`),
      det(rows),
      text('determinantının değeri aşağıdakilerden hangisidir?'),
    ]
    const explanation = `${steps.join(' ')} Toplam çarpan $${f}$, yani $${f} \\cdot |A| = ${f} \\cdot ${paren(d)} = ${truth}$.`

    const out: DraftDistractor[] = [
      mistake('factor-only', R(f), `Çarpanları buldun ama $|A| = ${d}$ ile çarpmayı unuttun.`),
    ]
    if (swapped)
      out.push(
        mistake(
          'forgot-swap-sign',
          R(d * c1 * s),
          'Satır (ya da sütun) yer değiştirince determinantın işareti değişir; bu işareti hesaba katmadın.',
        ),
      )
    if (combined && Math.abs(m) >= 2)
      out.push(
        mistake(
          'applied-addition-factor',
          R(truth * m),
          `Bir satıra başka satırın katını eklemek determinantı değiştirmez; eklenen $${m}$ katsayısı çarpan olarak gelmez.`,
        ),
      )
    if (Math.abs(s) >= 2) {
      out.push(
        mistake(
          'forgot-scale-factor',
          R(d * c1 * swapSign),
          `Bir satırdan $${s}$ ortak çarpan çıkıyorsa determinant $${s}$ ile çarpılır; bu çarpanı hesaba katmadın.`,
        ),
      )
      out.push(
        mistake(
          'divided-by-scale',
          R(d * c1 * swapSign, s),
          `Çarpanı ters uyguladın: satırdaki $${s}$ katı determinantı $${s}$ ile çarpar, bölmez.`,
        ),
      )
    }
    if (c1 === -1)
      out.push(
        mistake(
          'lost-negated-row-sign',
          R(d * s * swapSign),
          'Bir satırın tamamı $-1$ ile çarpılınca determinantın işareti değişir; bu $-1$ çarpanını atladın.',
        ),
      )
    if (transposed)
      out.push(
        mistake(
          'transpose-flips-sign',
          R(-truth),
          'Transpoz determinantın işaretini değiştirmez: $|A^T| = |A|$.',
        ),
      )
    return { stem, correct: num(truth), distractors: out, explanation }
  },
}

// ------------------------------------------------------------------ d3-singular-param

function entryInK(rng: Rng): string {
  if (rng.chance(0.45)) return String(rng.int(-3, 4))
  const a = rng.pick([1, 1, -1, 2])
  const b = rng.pick([0, 0, 1, -1, 2, -2, 3])
  const lead = a === 1 ? 'k' : a === -1 ? '-k' : `${a}k`
  return b === 0 ? lead : `${lead}${b > 0 ? '+' : ''}${b}`
}
const atK = (entry: string, k: number): number => {
  const m = /^(-?)(\d*)k(?:([+-]\d+))?$/.exec(entry)
  if (!m) return Number(entry)
  return (m[1] === '-' ? -1 : 1) * (m[2] === '' ? 1 : Number(m[2])) * k + Number(m[3] ?? 0)
}

/** Integer roots of c2 k^2 + c1 k + c0 when they are two distinct integers, else null. */
function quadraticRoots(f0: bigint, f1: bigint, f2: bigint): [number, number] | null {
  const c2x2 = f2 - 2n * f1 + f0
  if (c2x2 === 0n || c2x2 % 2n !== 0n) return null
  const c2 = c2x2 / 2n
  const c1 = f1 - f0 - c2
  const disc = c1 * c1 - 4n * c2 * f0
  if (disc <= 0n) return null
  let root = BigInt(Math.floor(Math.sqrt(Number(disc))))
  while (root * root > disc) root--
  while ((root + 1n) * (root + 1n) <= disc) root++
  if (root * root !== disc) return null
  const lo = -c1 - root
  const hi = -c1 + root
  if (lo % (2n * c2) !== 0n || hi % (2n * c2) !== 0n) return null
  const [r1, r2] = [Number(lo / (2n * c2)), Number(hi / (2n * c2))].sort((x, y) => x - y)
  return [r1 as number, r2 as number]
}

export const d3SingularParam: Family = {
  id: 'd3-singular-param',
  node: 'D3',
  alsoNodes: ['M11'],
  generate(rng: Rng): Draft | null {
    for (let tries = 0; tries < 400; tries++) {
      const top = [0, 1].map(() => [0, 1, 2].map(() => entryInK(rng)))
      const bottom = [0, 1, 2].map(() => String(rng.int(-3, 4)))
      if (rng.chance(0.5)) bottom[rng.int(0, 2)] = '0'
      const rows = [...top, bottom]
      const detAt = (k: number) => M.determinant(rows.map((r) => r.map((e) => R(atK(e, k)))))
      const [f0, f1, f2] = [0, 1, 2].map((k) => detAt(k).num) as [bigint, bigint, bigint]
      if (rows.flat().filter((e) => e.includes('k')).length < 2) continue
      const roots = quadraticRoots(f0, f1, f2)
      if (!roots || roots.some((r) => r === 0 || Math.abs(r) > 9) || roots[0] + roots[1] === 0) continue
      const [p, q] = roots
      const c2 = (f2 - 2n * f1 + f0) / 2n
      const c1 = f1 - f0 - c2

      const plusAt = (k: number) => {
        const grid = rows.map((r) => r.map((e) => R(atK(e, k))))
        return (grid[0] ?? []).reduce(
          (s, v, j) => Q.add(s, Q.mul(v, M.determinant(minorOf(grid, 0, j)))),
          Q.ZERO,
        )
      }
      const plusRoots = quadraticRoots(plusAt(0).num, plusAt(1).num, plusAt(2).num)
      const word = rng.chance(0.5) ? 'singülerdir' : 'terslenemez'
      const stem = [text('$k$’nın hangi değerleri için'), matrix(rows, 'A ='), text(`matrisi ${word}?`)]
      const explanation = `$|A|$’yı kofaktör açılımıyla yaz: $|A| = ${c2} k^2 ${c1 < 0n ? '-' : '+'} ${c1 < 0n ? -c1 : c1} k ${f0 < 0n ? '-' : '+'} ${f0 < 0n ? -f0 : f0} = ${c2}${factorTex(p)}${factorTex(q)}$. Matris $|A| = 0$ iken ${word === 'terslenemez' ? 'terslenemez' : 'singüler'}: $k = ${p}$ ya da $k = ${q}$.`
      const out: DraftDistractor[] = [
        {
          value: rootSet([R(-p), R(-q)]),
          errorType: 'negated-roots',
          feedback: `İşaretleri ters aldın: $${factorTex(p)}$ çarpanı $k = ${p}$, $${factorTex(q)}$ çarpanı $k = ${q}$ verir.`,
        },
        {
          value: rootSet([R(p)]),
          errorType: 'only-smaller-root',
          feedback: `Bir kökü atlamışsın: $${factorTex(q)}$ çarpanı da sıfır olabilir, $k = ${q}$ değeri de matrisi ${word === 'terslenemez' ? 'terslenemez' : 'singüler'} yapar.`,
        },
        {
          value: rootSet([R(q)]),
          errorType: 'only-larger-root',
          feedback: `Bir kökü atlamışsın: $${factorTex(p)}$ çarpanı da sıfır olabilir, $k = ${p}$ değeri de matrisi ${word === 'terslenemez' ? 'terslenemez' : 'singüler'} yapar.`,
        },
        {
          value: rootSet([R(-p), R(q)]),
          errorType: 'sign-slip-on-smaller-root',
          feedback: `Köklerden birinin işaretini ters aldın: $${factorTex(p)}$ çarpanı $k = ${p}$ verir, $k = ${-p}$ değil.`,
        },
      ]
      if (plusRoots?.every((r) => Math.abs(r) <= 9)) {
        out.push({
          value: rootSet(plusRoots.map((r) => R(r))),
          errorType: 'checkerboard-ignored',
          feedback:
            'Birinci satırdan açarken kofaktör işaretlerini uygulamadın ($+\\ -\\ +$ yerine $+\\ +\\ +$); determinant yanlış çıkınca kökler de yanlış olur.',
        })
      }
      return { stem, correct: rootSet([R(p), R(q)]), distractors: out, explanation }
    }
    return null
  },
}

// ------------------------------------------------------------------ the bank

export const determinantFamilies: readonly Family[] = [
  d3Scalar,
  d3RowOps,
  d2Numeric,
  d4Adjugate,
  d3SingularParam,
]

/** One seed per committed item; ids and seeds never change once merged (see lock.json). */
export const determinantSeeds: Readonly<Record<string, readonly number[]>> = {
  'd3-scalar': [1, 2, 3, 25],
  'd3-row-ops': [1, 2, 3, 4],
  'd2-numeric': [1, 2, 3, 4],
  'd4-adjugate': [1, 2, 3, 4],
  'd3-singular-param': [1, 2, 3, 4],
}

export const determinantQuestions: readonly Question[] = determinantFamilies.flatMap((family) =>
  (determinantSeeds[family.id] ?? []).map((seed, i) =>
    buildQuestion(family, seed, { id: `v1-gen-${family.id}-${String(i + 1).padStart(2, '0')}`, item: i + 1 }),
  ),
)

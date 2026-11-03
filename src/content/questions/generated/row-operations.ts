import * as Q from '../../../lib/math/rational'
import { matrix, text } from '../blocks'
import { buildQuestion } from '../engine/assemble'
import { num, texNumber, valueKey } from '../engine/format'
import type { Rng } from '../engine/prng'
import type { Draft, DraftDistractor, Family } from '../engine/types'
import type { Question } from '../types'
import {
  cell,
  combination,
  type Ints,
  linearKMistakes,
  paren,
  randomGrid,
  rankOf,
  singularInK,
  toStrings,
  wrong,
} from './shared'

/**
 * Generated questions for row operations (R1) and rank (R3). Row operations use the lecturer's notation,
 * `R_2 \to R_2 - 2R_1`. The verifier is `../engine/verify-rows.ts`.
 */

// ------------------------------------------------------------------ r1-ops-entry

type RowOp =
  | { readonly kind: 'swap'; readonly a: number; readonly b: number }
  | { readonly kind: 'add'; readonly a: number; readonly b: number; readonly c: number }
  | { readonly kind: 'scale'; readonly a: number; readonly c: number }

const opTex = (op: RowOp): string => {
  if (op.kind === 'swap') return `R_${op.a + 1} \\leftrightarrow R_${op.b + 1}`
  if (op.kind === 'scale') return `R_${op.a + 1} \\to ${op.c === -1 ? '-' : op.c}R_${op.a + 1}`
  const k = Math.abs(op.c) === 1 ? '' : Math.abs(op.c)
  return `R_${op.a + 1} \\to R_${op.a + 1} ${op.c < 0 ? '-' : '+'} ${k}R_${op.b + 1}`
}

/** Applies operations in order; `source` lets a mistaken model read the row it adds from another matrix. */
function applyOps(start: Ints, ops: readonly RowOp[], source?: Ints): Ints {
  let cur = start.map((r) => [...r])
  for (const op of ops) {
    if (op.kind === 'swap') {
      const tmp = cur[op.a] as number[]
      cur[op.a] = cur[op.b] as number[]
      cur[op.b] = tmp
    } else if (op.kind === 'scale') {
      cur[op.a] = (cur[op.a] as number[]).map((v) => v * op.c)
    } else {
      const from = (source ?? cur)[op.b] as number[]
      cur[op.a] = (cur[op.a] as number[]).map((v, j) => v + op.c * (from[j] ?? 0))
    }
    cur = cur.map((r) => [...r])
  }
  return cur
}

function randomOp(rng: Rng): RowOp {
  const a = rng.int(0, 2)
  let b = rng.int(0, 2)
  while (b === a) b = rng.int(0, 2)
  const roll = rng.next()
  if (roll < 0.6) return { kind: 'add', a, b, c: rng.pick([-3, -2, -1, 1, 2, 3]) }
  if (roll < 0.8) return { kind: 'swap', a: Math.min(a, b), b: Math.max(a, b) }
  return { kind: 'scale', a, c: rng.pick([2, 3, -1, -2]) }
}

export const r1OpsEntry: Family = {
  id: 'r1-ops-entry',
  node: 'R1',
  generate(rng: Rng): Draft | null {
    const start = randomGrid(rng, 3, 3, -3, 5)
    const count = rng.pick([2, 2, 3])
    const ops = Array.from({ length: count }, () => randomOp(rng))
    const adds = ops.filter((o) => o.kind === 'add')
    if (adds.length === 0) return null
    const i = rng.int(1, 3)
    const j = rng.int(1, 3)
    if (i === j) return null

    const final = applyOps(start, ops)
    const at = (m: Ints, r: number, c: number) => cell(m, r - 1, c - 1)
    const truth = at(final, i, j)
    if (Math.abs(truth) > 30) return null
    const firstAdd = ops.findIndex((o) => o.kind === 'add')
    const flippedSign = applyOps(
      start,
      ops.map((o, t) => (t === firstAdd && o.kind === 'add' ? { ...o, c: -o.c } : o)),
    )
    const hasSwap = ops.some((o) => o.kind === 'swap')
    const values = {
      'reversed-order': at(applyOps(start, [...ops].reverse()), i, j),
      'sign-flipped-multiplier': at(flippedSign, i, j),
      'stale-row-used': at(applyOps(start, ops, start), i, j),
      'entry-transposed': at(final, j, i),
      'swap-skipped': hasSwap
        ? at(
            applyOps(
              start,
              ops.filter((o) => o.kind !== 'swap'),
            ),
            i,
            j,
          )
        : truth,
    }
    const distinctWrong = new Set(Object.values(values).filter((v) => v !== truth))
    if (distinctWrong.size < 4) return null

    const listed = ops.map((o) => `$${opTex(o)}$`)
    const sentence =
      listed.length === 2
        ? `${listed[0]} ve ${listed[1]}`
        : `${listed.slice(0, -1).join(', ')} ve ${listed[listed.length - 1]}`
    const stem = [
      matrix(toStrings(start), 'A ='),
      text(
        `$A$ matrisine sırasıyla ${sentence} işlemleri uygulanıyor. Elde edilen matrisin ${i}. satır ${j}. sütunundaki eleman kaçtır?`,
      ),
    ]

    let cur = start
    const steps = ops.map((o, t) => {
      cur = applyOps(cur, [o])
      const rowsChanged = o.kind === 'swap' ? [o.a, o.b] : [o.a]
      const shown = rowsChanged.map((r) => `$R_${r + 1} = (${(cur[r] as number[]).join(', ')})$`).join(', ')
      return `${t + 1}. işlem: ${shown}`
    })
    const explanation = `İşlemleri soldan sağa, her seferinde güncel matris üzerinde uygula. ${steps.join('; ')}. Sonuçta ${i}. satır ${j}. sütun: $${truth}$.`

    const distractors: DraftDistractor[] = [
      wrong(
        'reversed-order',
        values['reversed-order'],
        'İşlemlerin sırasını değiştirmişsin. İşlemler yazıldığı sırayla uygulanır; sıra değişince sonuç da değişir.',
      ),
      wrong(
        'sign-flipped-multiplier',
        values['sign-flipped-multiplier'],
        '$R_a \\to R_a - kR_b$ ile $R_a \\to R_a + kR_b$ farklı işlemlerdir; ilk toplama işleminin işaretini ters uygulamışsın.',
      ),
      wrong(
        'stale-row-used',
        values['stale-row-used'],
        'Bir satırı eklerken önceki işlemlerle değişmiş halini değil, başlangıçtaki halini kullanmışsın. Her işlem güncel matrise uygulanır.',
      ),
      wrong(
        'entry-transposed',
        values['entry-transposed'],
        `Satır ve sütunu karıştırmışsın: istenen ${i}. satır ${j}. sütun, ${j}. satır ${i}. sütun değil.`,
      ),
    ]
    if (hasSwap) {
      distractors.push(
        wrong(
          'swap-skipped',
          values['swap-skipped'],
          '$R_a \\leftrightarrow R_b$ satırları yer değiştirir; bu işlemi atlamışsın, sonraki işlemler yanlış satırlara uygulanmış.',
        ),
      )
    }
    return { stem, correct: num(truth), distractors, explanation }
  },
}

// ------------------------------------------------------------------ r3-rank-prop

export const r3RankProportional: Family = {
  id: 'r3-rank-prop',
  node: 'R3',
  generate(rng: Rng): Draft | null {
    const height = rng.pick([2, 3, 3])
    const base = Array.from({ length: 3 }, () => rng.int(-3, 4))
    const ratios = Array.from({ length: height }, (_, r) => (r === 0 ? 1 : rng.pick([2, 3, -1, -2, 2, -3])))
    const full: Ints = ratios.map((rho) => base.map((v) => rho * v))
    if (full.some((row) => row.some((v) => Math.abs(v) > 9)) || base.filter((v) => v !== 0).length < 2)
      return null
    const t = rng.int(0, height - 1)
    const c = rng.int(0, 2)
    const k = cell(full, t, c)
    if (k === 0) return null
    const rows = toStrings(full)
    ;(rows[t] as string[])[c] = 'k'

    // Reference: the first other row u and column c0 where both rows are nonzero outside column c.
    let u = -1
    let c0 = -1
    for (let r = 0; r < height && u < 0; r++) {
      if (r === t) continue
      for (let col = 0; col < 3; col++) {
        if (col !== c && cell(full, r, col) !== 0 && cell(full, t, col) !== 0) {
          u = r
          c0 = col
          break
        }
      }
    }
    if (u < 0) return null
    // Exactly one k makes the rank 1.
    const works = Array.from({ length: 81 }, (_, i) => i - 40).filter((guess) => {
      const grid = full.map((row, r) => (r === t ? row.map((v, col) => (col === c ? guess : v)) : row))
      return rankOf(grid) === 1
    })
    if (works.length !== 1 || works[0] !== k) return null

    const lambda = Q.rational(cell(full, t, c0), cell(full, u, c0))
    const above = cell(full, u, c)
    const ratioTex = lambda.num < 0n ? `(${texNumber(lambda)})` : texNumber(lambda)
    const wrongs: (DraftDistractor | null)[] = [
      wrong(
        'copied-from-row',
        above,
        `${t + 1}. satır ${u + 1}. satırın katı olmalı, kopyası değil: ${c0 + 1}. sütunda oran $${Q.format(lambda)}$ ise ${c + 1}. sütunda da aynı oran geçerli.`,
      ),
      wrong(
        'additive-pattern',
        above + (cell(full, t, c0) - cell(full, u, c0)),
        `Satırlar arasındaki fark sabit değil, oran sabit: rank $1$ ise satırlar birbirinin katıdır ($${Q.format(lambda)}$ katı), toplamsal bir kalıp aranmaz.`,
      ),
      Q.isZero(lambda)
        ? null
        : {
            value: num(Q.div(Q.rational(above), lambda).num, Q.div(Q.rational(above), lambda).den),
            errorType: 'ratio-inverted',
            feedback: `Oranı ters uygulamışsın: ${t + 1}. satır, ${u + 1}. satırın $${Q.format(lambda)}$ katı; ${u + 1}. satırdaki $${above}$ bu oranla çarpılır, bölünmez.`,
          },
      {
        value: num(Q.add(Q.rational(above), lambda).num, Q.add(Q.rational(above), lambda).den),
        errorType: 'ratio-added',
        feedback: `Oran çarpılır, eklenmez: ${t + 1}. satır ${u + 1}. satırın $${Q.format(lambda)}$ katıdır, yani ${c + 1}. sütunda $${paren(above)} \\cdot ${ratioTex}$ gibi bir çarpım alınır.`,
      },
      lambda.num < 0n
        ? wrong(
            'negated',
            -k,
            `Oran negatif ($${Q.format(lambda)}$): ${c0 + 1}. sütunda iki eleman ters işaretli. İşareti kaçırmışsın.`,
          )
        : null,
    ]
    const distractors = wrongs.filter((d): d is DraftDistractor => d !== null)
    const values = new Set(distractors.map((d) => valueKey(d.value)))
    if (distractors.length < 4 || values.size < 4 || values.has(valueKey(num(k)))) return null

    const stem = [matrix(rows, 'A ='), text('$\\text{rank}(A) = 1$ olduğuna göre $k$ kaçtır?')]
    const explanation = `Rank $1$ ise bütün satırlar birbirinin katıdır. ${c0 + 1}. sütunda ${t + 1}. satır $${cell(full, t, c0)}$, ${u + 1}. satır $${cell(full, u, c0)}$: oran $${texNumber(lambda)}$. Aynı oran ${c + 1}. sütunda da geçerli: $k = ${ratioTex} \\cdot ${paren(above)} = ${k}$.`
    return { stem, correct: num(k), distractors, explanation }
  },
}

// ------------------------------------------------------------------ r3-rank-k

export const r3RankK: Family = {
  id: 'r3-rank-k',
  node: 'R3',
  alsoNodes: ['D3'],
  generate(rng: Rng): Draft | null {
    const sing = singularInK(rng)
    if (!sing) return null
    const stem = [matrix(sing.rows, 'A ='), text('$\\text{rank}(A) = 2$ olduğuna göre $k$ kaçtır?')]
    const distractors = linearKMistakes(sing.rows, sing.k0, sing.offset)
    const explanation = `$\\text{rank}(A) = 2 < 3$ olması için $|A| = 0$ olmalı (ve iki satır bağımsız kalmalı). $k$’yı içeren elemanın kofaktörüyle aç: $|A|$, $k$’da birinci dereceden ve $k = ${sing.k0}$ iken $0$ olur. Bu değerde $R_3 = ${combination(sing.alpha, 1, sing.beta, 2)}$ sağlandığı için rank tam olarak $2$ olur.`
    return { stem, correct: num(sing.k0), distractors, explanation }
  },
}

// ------------------------------------------------------------------ the bank

export const rowOperationFamilies: readonly Family[] = [r1OpsEntry, r3RankProportional, r3RankK]

/** One seed per committed item; ids and seeds never change once merged (see lock.json). */
export const rowOperationSeeds: Readonly<Record<string, readonly number[]>> = {
  'r1-ops-entry': [1, 2, 3, 4],
  'r3-rank-prop': [1, 2, 3, 4],
  'r3-rank-k': [1, 2, 3, 4],
}

export const rowOperationQuestions: readonly Question[] = rowOperationFamilies.flatMap((family) =>
  (rowOperationSeeds[family.id] ?? []).map((seed, i) =>
    buildQuestion(family, seed, { id: `v1-gen-${family.id}-${String(i + 1).padStart(2, '0')}`, item: i + 1 }),
  ),
)

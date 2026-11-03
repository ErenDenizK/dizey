import { matrix, text } from '../blocks'
import { buildQuestion } from '../engine/assemble'
import { num } from '../engine/format'
import type { Rng } from '../engine/prng'
import type { Draft, DraftDistractor, Family } from '../engine/types'
import type { Question } from '../types'
import {
  combination,
  type Ints,
  linearKMistakes,
  rankOf,
  singularInK,
  times,
  toStrings,
  wrong,
} from './shared'

/**
 * Generated questions for parametric systems (S2): for which k does `Ax = b` have infinitely many solutions
 * or none. The coefficient matrix and the right-hand side are shown as two matrices (the augmented form
 * would be 3x4, which does not fit the phone rules). The verifier is `../engine/verify-systems.ts`.
 */

const column = (values: readonly (number | string)[]): string[][] => values.map((v) => [String(v)])
const numericColumn = (values: readonly number[]): number[][] => values.map((v) => [v])

// ------------------------------------------------------------------ s2-k-system

export const s2KSystem: Family = {
  id: 's2-k-system',
  node: 'S2',
  alsoNodes: ['S1', 'R3'],
  generate(rng: Rng): Draft | null {
    const sing = singularInK(rng)
    if (!sing) return null
    const infinite = rng.chance(0.5)
    const { base, alpha, beta, k0 } = sing
    let b: number[]
    if (infinite) {
      const x0 = Array.from({ length: 3 }, () => rng.int(-1, 2))
      b = times(base, numericColumn(x0)).map((r) => r[0] as number)
      if (b.every((v) => v === 0)) return null
    } else {
      b = Array.from({ length: 3 }, () => rng.int(-4, 5))
      if (rankOf(base.map((row, i) => [...row, b[i] as number])) !== 3) return null
    }
    if (b.some((v) => Math.abs(v) > 9)) return null
    const combined = alpha * (b[0] as number) + beta * (b[1] as number)
    if (infinite !== (combined === b[2])) return null

    const stem = [
      matrix(sing.rows, 'A ='),
      matrix(column(b), 'b ='),
      text(
        `$Ax = b$ sisteminin ${infinite ? 'sonsuz çözümü olması' : 'çözümü olmaması'} için $k$ kaç olmalıdır?`,
      ),
    ]
    const relation = combination(alpha, 1, beta, 2)
    const explanation = `Tek çözüm için $|A| \\neq 0$ gerekir; çözüm yok ya da sonsuz olabilmesi için $|A| = 0$ olmalı. $k$’yı içeren elemanın kofaktörüyle aç: $|A|$ birinci dereceden ve $k = ${k0}$ iken $0$ olur. Bu $k$ için $R_3 = ${relation}$ ve $r_A = 2$. Sağ tarafta $b_3 = ${b[2]}$, $${relation.replaceAll('R_', 'b_')} = ${combined}$: ${infinite ? 'eşit, yani $r_B = 2 = r_A < 3$ ve sistemin sonsuz çözümü var' : 'eşit değil, yani $r_B = 3 > r_A$ ve sistemin çözümü yok'}.`
    return {
      stem,
      correct: num(k0),
      distractors: linearKMistakes(sing.rows, k0, sing.offset),
      explanation,
    }
  },
}

// ------------------------------------------------------------------ s2-b-param

const COMBINATIONS: readonly (readonly [number, number])[] = [
  [2, 1],
  [1, 2],
  [1, -1],
  [2, -1],
  [-1, 2],
  [1, -2],
  [-1, 1],
]

export const s2BParam: Family = {
  id: 's2-b-param',
  node: 'S2',
  alsoNodes: ['S1', 'R3'],
  generate(rng: Rng): Draft | null {
    const [alpha, beta] = rng.pick(COMBINATIONS)
    const t = rng.int(0, 2)
    const [u, v] = [0, 1, 2].filter((r) => r !== t) as [number, number]
    const ru = Array.from({ length: 3 }, () => rng.int(-3, 3))
    const rv = Array.from({ length: 3 }, () => rng.int(-3, 3))
    const rt = ru.map((x, j) => alpha * x + beta * (rv[j] ?? 0))
    if (rt.some((x) => Math.abs(x) > 9) || rankOf([ru, rv]) !== 2) return null
    const rows: Ints = [[], [], []]
    rows[u] = ru
    rows[v] = rv
    rows[t] = rt
    const bu = rng.int(-4, 5)
    const bv = rng.int(-4, 5)
    const k0 = alpha * bu + beta * bv
    if (k0 === 0 || Math.abs(k0) > 12 || bu === 0 || bv === 0) return null
    const values = [alpha * bu - beta * bv, bu + bv, beta * bu + alpha * bv, -k0, alpha * bu]
    if (new Set(values.filter((x) => x !== k0)).size < 4) return null
    const b: (number | string)[] = [0, 0, 0]
    b[u] = bu
    b[v] = bv
    b[t] = 'k'

    const stem = [
      matrix(toStrings(rows), 'A ='),
      matrix(column(b), 'b ='),
      text('$Ax = b$ sisteminin sonsuz çözümü olması için $k$ kaç olmalıdır?'),
    ]
    const relation = combination(alpha, u + 1, beta, v + 1)
    const sums = `${alpha} \\cdot ${bu < 0 ? `(${bu})` : bu} ${beta < 0 ? '-' : '+'} ${Math.abs(beta)} \\cdot ${bv < 0 ? `(${bv})` : bv}`
    const explanation = `$A$’nın satırları bağımlı: $R_${t + 1} = ${relation}$, yani $r_A = 2$. Sonsuz çözüm için $r_B = r_A = 2$ olmalı; bunun için sağ taraf da aynı bağıntıyı sağlamalı: $b_${t + 1} = ${relation.replaceAll('R_', 'b_')}$. Buradan $k = ${sums} = ${k0}$. Başka bir $k$ için $r_B = 3$ olur ve sistemin çözümü yoktur.`
    const distractors: DraftDistractor[] = [
      wrong(
        'coefficients-ignored',
        bu + bv,
        `Satır bağıntısının katsayılarını ($${alpha}$ ve $${beta}$) uygulamamışsın: $b_${t + 1}$ de $R_${t + 1} = ${relation}$ ile aynı katsayılarla bulunur.`,
      ),
      wrong(
        'coefficients-swapped',
        beta * bu + alpha * bv,
        `Katsayıları satırlarla karıştırmışsın: $${alpha}$ çarpanı ${u + 1}. satırın, $${beta}$ çarpanı ${v + 1}. satırın katsayısıdır.`,
      ),
      wrong(
        'second-sign-slip',
        alpha * bu - beta * bv,
        `Bağıntıdaki ikinci terimin işaretini ters almışsın: $R_${t + 1} = ${relation}$ ise $b_${t + 1}$ de aynı işaretlerle birleşir.`,
      ),
      wrong(
        'negated',
        -k0,
        `İşareti kaçırmışsın: $k = ${alpha} b_${u + 1} ${beta < 0 ? '-' : '+'} ${Math.abs(beta)} b_${v + 1} = ${k0}$.`,
      ),
      wrong(
        'second-term-dropped',
        alpha * bu,
        `Bağıntının ikinci terimini unutmuşsun: $b_${t + 1} = ${relation.replaceAll('R_', 'b_')}$ olarak iki terim de hesaplanır.`,
      ),
    ]
    return { stem, correct: num(k0), distractors, explanation }
  },
}

// ------------------------------------------------------------------ the bank

export const systemFamilies: readonly Family[] = [s2KSystem, s2BParam]

/** One seed per committed item; ids and seeds never change once merged (see lock.json). */
export const systemSeeds: Readonly<Record<string, readonly number[]>> = {
  's2-k-system': [1, 2, 3, 4],
  's2-b-param': [1, 2, 3, 4],
}

export const systemQuestions: readonly Question[] = systemFamilies.flatMap((family) =>
  (systemSeeds[family.id] ?? []).map((seed, i) =>
    buildQuestion(family, seed, { id: `v1-gen-${family.id}-${String(i + 1).padStart(2, '0')}`, item: i + 1 }),
  ),
)

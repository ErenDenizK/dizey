import * as Q from '../../../lib/math/rational'
import { det, text } from '../blocks'
import { buildQuestion } from '../engine/assemble'
import { num, rootSet } from '../engine/format'
import type { Rng } from '../engine/prng'
import type { Draft, DraftDistractor, Family } from '../engine/types'
import type { Question } from '../types'
import { cell, detOf, paren, randomGrid, toStrings, wrong } from './shared'

/**
 * Generated questions for the first determinant node (D1): the 2x2 formula and Sarrus. The Turkish text
 * lives here; `../engine/verify-dets.ts` re-checks every item independently.
 */

const R = (n: number) => Q.rational(n)

// ------------------------------------------------------------------ d1-sarrus

export const d1Sarrus: Family = {
  id: 'd1-sarrus',
  node: 'D1',
  generate(rng: Rng): Draft | null {
    const grid = randomGrid(rng, 3, 3, -3, 5)
    const a = (i: number, j: number) => cell(grid, i - 1, j - 1)
    const down = [a(1, 1) * a(2, 2) * a(3, 3), a(1, 2) * a(2, 3) * a(3, 1), a(1, 3) * a(2, 1) * a(3, 2)]
    const up = [a(1, 3) * a(2, 2) * a(3, 1), a(1, 1) * a(2, 3) * a(3, 2), a(1, 2) * a(2, 1) * a(3, 3)]
    const sum = (xs: readonly number[]) => xs.reduce((s, v) => s + v, 0)
    const [m, n] = [sum(down), sum(up)]
    const truth = m - n
    if (truth !== detOf(grid) || truth === 0 || Math.abs(truth) > 100) return null
    const candidates = [m, n - m, m + n, a(1, 1) * a(2, 2) * a(3, 3), -n]
    if (new Set(candidates.filter((v) => v !== truth)).size < 4) return null

    const stem = rng.chance(0.6)
      ? [text('Sarrus kuralıyla'), det(toStrings(grid)), text('determinantının değeri kaçtır?')]
      : [det(toStrings(grid)), text('determinantının Sarrus kuralıyla değeri kaçtır?')]
    const term = (xs: readonly number[], names: string[]) =>
      xs.map((v, t) => `$${names[t]} = ${v}$`).join(', ')
    const explanation = `Sarrus: sağa inen çaprazların çarpımlarını topla, sola inenlerinkini çıkar. Sağa inenler: ${term(down, ['a_{11}a_{22}a_{33}', 'a_{12}a_{23}a_{31}', 'a_{13}a_{21}a_{32}'])} (toplam $${m}$). Sola inenler: ${term(up, ['a_{13}a_{22}a_{31}', 'a_{11}a_{23}a_{32}', 'a_{12}a_{21}a_{33}'])} (toplam $${n}$). $|A| = ${m} - ${paren(n)} = ${truth}$.`
    const distractors: DraftDistractor[] = [
      wrong(
        'anti-diagonals-ignored',
        m,
        'Yalnız sağa inen üç çarpımı toplamışsın; sola inen üç çarpım da hesaplanıp toplamdan çıkarılmalı.',
      ),
      wrong(
        'sign-flipped',
        n - m,
        'Çıkarmayı ters yapmışsın: determinant (sağa inenler) $-$ (sola inenler) olur.',
      ),
      wrong(
        'diagonals-added',
        m + n,
        'Sola inen çarpımları çıkarmak yerine toplamışsın; Sarrus’ta bu üç çarpımın önünde eksi vardır.',
      ),
      wrong(
        'main-diagonal-only',
        a(1, 1) * a(2, 2) * a(3, 3),
        'Yalnız ana köşegenin çarpımını almışsın; Sarrus’ta altı çarpım vardır (üçü $+$, üçü $-$).',
      ),
      wrong(
        'main-diagonals-ignored',
        -n,
        'Sağa inen üç çarpımı hiç hesaplamamışsın; onlar toplamda $+$ işaretiyle yer alır.',
      ),
    ]
    return { stem, correct: num(truth), distractors, explanation }
  },
}

// ------------------------------------------------------------------ d1-two-param

const formIn = (coef: number, offset: number): string => {
  const lead = coef === 1 ? 'k' : coef === -1 ? '-k' : `${coef}k`
  return offset === 0 ? lead : `${lead}${offset > 0 ? '+' : '-'}${Math.abs(offset)}`
}

export const d1TwoParam: Family = {
  id: 'd1-two-param',
  node: 'D1',
  alsoNodes: ['M11'],
  generate(rng: Rng): Draft | null {
    for (let tries = 0; tries < 200; tries++) {
      const a = rng.pick([1, 1, 2, -1])
      const d = rng.pick([1, 1, -1, 2])
      const p = rng.int(-4, 4)
      const s = rng.int(-4, 4)
      const b = rng.int(-4, 4)
      const c = rng.int(-4, 4)
      if (b === 0 || c === 0) continue
      const grid = (k: number) => [
        [a * k + p, b],
        [c, d * k + s],
      ]
      const roots = Array.from({ length: 19 }, (_, i) => i - 9).filter((k) => detOf(grid(k)) === 0)
      if (roots.length !== 2) continue
      const [r1, r2] = roots as [number, number]
      if (r1 + r2 === 0 || r1 === 0 || r2 === 0) continue
      const rows = [
        [formIn(a, p), String(b)],
        [String(c), formIn(d, s)],
      ]
      if (rows.flat().some((e) => e.length > 6)) continue
      // Adding instead of subtracting the cross term: a student reads ad + bc.
      const plus = (k: number) => {
        const g = grid(k)
        return cell(g, 0, 0) * cell(g, 1, 1) + cell(g, 0, 1) * cell(g, 1, 0)
      }
      const plusRoots = Array.from({ length: 19 }, (_, i) => i - 9).filter((k) => plus(k) === 0)

      const stem = [text('$k$’nın hangi değerleri için'), det(rows), text('determinantı $0$ olur?')]
      const full = `(${formIn(a, p)})(${formIn(d, s)}) - ${paren(b)}\\cdot ${paren(c)}`
      const lead = a * d === 1 ? '' : a * d === -1 ? '-' : String(a * d)
      const middle = a * s + d * p
      const last = p * s - b * c
      const quadratic = `${lead}k^2${middle === 0 ? '' : ` ${middle < 0 ? '-' : '+'} ${Math.abs(middle) === 1 ? '' : Math.abs(middle)}k`} ${last < 0 ? '-' : '+'} ${Math.abs(last)}`
      const factor = (r: number) => (r > 0 ? `(k - ${r})` : `(k + ${-r})`)
      const explanation = `$2 \\times 2$ determinant $ad - bc$: $|A| = ${full} = ${quadratic} = ${lead}${factor(r1)}${factor(r2)}$. Bu $0$ olunca $k = ${r1}$ ya da $k = ${r2}$.`
      const out: DraftDistractor[] = [
        {
          value: rootSet([R(-r1), R(-r2)]),
          errorType: 'negated-roots',
          feedback: `İşaretleri ters almışsın: $k = ${r1}$ ve $k = ${r2}$ determinantı sıfır yapar, bunların negatifleri değil.`,
        },
        {
          value: rootSet([R(r1)]),
          errorType: 'only-smaller-root',
          feedback: `İkinci dereceden denklemin iki kökü olabilir: $k = ${r2}$ değeri de determinantı $0$ yapar.`,
        },
        {
          value: rootSet([R(r2)]),
          errorType: 'only-larger-root',
          feedback: `İkinci dereceden denklemin iki kökü olabilir: $k = ${r1}$ değeri de determinantı $0$ yapar.`,
        },
        {
          value: rootSet([R(-r1), R(r2)]),
          errorType: 'sign-slip-on-smaller-root',
          feedback: `Köklerden birinin işaretini ters almışsın: $k = ${r1}$ doğru, $k = ${-r1}$ değil.`,
        },
      ]
      if (plusRoots.length === 2) {
        out.push({
          value: rootSet(plusRoots.map(R)),
          errorType: 'cross-terms-added',
          feedback:
            '$ad - bc$ yerine $ad + bc$ hesaplamışsın: $2 \\times 2$ determinantta çapraz çarpım çıkarılır.',
        })
      }
      return { stem, correct: rootSet([R(r1), R(r2)]), distractors: out, explanation }
    }
    return null
  },
}

// ------------------------------------------------------------------ the bank

export const determinantBasicFamilies: readonly Family[] = [d1Sarrus, d1TwoParam]

/** One seed per committed item; ids and seeds never change once merged (see lock.json). */
export const determinantBasicSeeds: Readonly<Record<string, readonly number[]>> = {
  'd1-sarrus': [1, 2, 3, 4],
  'd1-two-param': [1, 2, 3, 4],
}

export const determinantBasicQuestions: readonly Question[] = determinantBasicFamilies.flatMap((family) =>
  (determinantBasicSeeds[family.id] ?? []).map((seed, i) =>
    buildQuestion(family, seed, { id: `v1-gen-${family.id}-${String(i + 1).padStart(2, '0')}`, item: i + 1 }),
  ),
)

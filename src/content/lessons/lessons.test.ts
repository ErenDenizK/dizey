import { describe, expect, it } from 'vitest'
import type { Matrix } from '../../lib/math/matrix'
import * as M from '../../lib/math/matrix'
import type { Rational } from '../../lib/math/rational'
import * as Q from '../../lib/math/rational'
import { lessons } from './index'
import type { Beat, Claim, Lesson, MatrixBlock, Step } from './types'

// Every lesson: structure is sound, and every claimed number is recomputed with the math core.

function parse(text: string): Rational {
  const value = Q.parse(text)
  if (!value) throw new Error(`Not a number: ${text}`)
  return value
}

/** Evaluates an entry such as "3", "-4/3", "k", "-k", "2k", "k+1" with the given parameters. */
function entry(text: string, params: Readonly<Record<string, Rational>>): Rational {
  const direct = Q.parse(text)
  if (direct) return direct
  let total = Q.ZERO
  const terms = text.replaceAll(' ', '').match(/[+-]?[^+-]+/g) ?? []
  for (const term of terms) {
    const match = /^([+-]?)(\d*(?:\/\d+)?)([a-z]?)$/.exec(term)
    if (!match) throw new Error(`Cannot evaluate "${text}"`)
    const [, sign, coefficient, symbol] = match
    let value = coefficient ? parse(coefficient) : Q.ONE
    if (symbol) {
      const p = params[symbol]
      if (!p) throw new Error(`No value for ${symbol} in "${text}"`)
      value = Q.mul(value, p)
    }
    total = Q.add(total, sign === '-' ? Q.neg(value) : value)
  }
  return total
}

function numeric(block: MatrixBlock, params: Readonly<Record<string, Rational>> = {}): Matrix {
  return M.fromNumbers(block.rows.map((row) => row.map((v) => entry(v, params))))
}

function matrixOf(lesson: Lesson, name: string): MatrixBlock {
  const found = lesson.matrices[name]
  if (!found) throw new Error(`${lesson.id}: no matrix ${name}`)
  return found
}

function sarrusSums(a: Matrix): [Rational, Rational] {
  const e = (i: number, j: number) => M.at(a, i, j % 3)
  let plus = Q.ZERO
  let minus = Q.ZERO
  for (let s = 0; s < 3; s++) {
    plus = Q.add(plus, Q.mul(Q.mul(e(0, s), e(1, s + 1)), e(2, s + 2)))
    minus = Q.add(minus, Q.mul(Q.mul(e(0, s + 2), e(1, s + 1)), e(2, s)))
  }
  return [plus, minus]
}

function checkClaim(lesson: Lesson, claim: Claim): void {
  if (claim.kind === 'detProduct') {
    let product: Matrix | null = null
    for (const factor of claim.factors) {
      let f = numeric(matrixOf(lesson, factor.matrix))
      if (factor.transpose) f = M.transpose(f)
      const power = factor.power ?? 1
      let base = f
      if (power < 0) {
        const inverse = M.inverse(f)
        if (!inverse) throw new Error(`${lesson.id}: ${factor.matrix} is singular`)
        base = inverse
      }
      let raised = M.identity(M.rowCount(f))
      for (let i = 0; i < Math.abs(power); i++) raised = M.multiply(raised, base)
      product = product ? M.multiply(product, raised) : raised
    }
    if (!product) throw new Error('Empty product')
    const scaled = M.scale(parse(claim.scalar ?? '1'), product)
    expect(Q.format(M.determinant(scaled))).toBe(Q.format(parse(claim.equals)))
    return
  }
  const block = matrixOf(lesson, claim.matrix)
  switch (claim.kind) {
    case 'det': {
      const params = Object.fromEntries(Object.entries(claim.at ?? {}).map(([k, v]) => [k, parse(v)]))
      expect(Q.format(M.determinant(numeric(block, params)))).toBe(Q.format(parse(claim.equals)))
      return
    }
    case 'minor':
    case 'cofactor': {
      const a = numeric(block)
      const sub = M.fromNumbers(
        a.filter((_, i) => i !== claim.row - 1).map((row) => row.filter((_, j) => j !== claim.col - 1)),
      )
      const minor = M.determinant(sub)
      const value = claim.kind === 'minor' || (claim.row + claim.col) % 2 === 0 ? minor : Q.neg(minor)
      expect(Q.format(value)).toBe(Q.format(parse(claim.equals)))
      return
    }
    case 'sarrus': {
      const [plus, minus] = sarrusSums(numeric(block))
      expect([Q.format(plus), Q.format(minus)]).toEqual([claim.plus, claim.minus])
      return
    }
    case 'detRoots': {
      const zeros = new Set<string>()
      let nonZero = false
      for (let den = 1; den <= 6; den++) {
        for (let num = -60; num <= 60; num++) {
          const value = Q.rational(num, den)
          const det = M.determinant(numeric(block, { [claim.variable]: value }))
          if (Q.isZero(det)) zeros.add(Q.format(value))
          else nonZero = true
        }
      }
      expect(nonZero).toBe(true)
      expect([...zeros].sort()).toEqual(claim.roots.map((r) => Q.format(parse(r))).sort())
      return
    }
  }
}

function beatMatrices(beat: Beat): string[] {
  switch (beat.kind) {
    case 'sequence':
      return beat.beats.flatMap(beatMatrices)
    case 'frames':
      return beat.frames.flatMap((f) => (f.marks ?? []).map((mark) => mark.cell[0]))
    case 'equation':
      return []
    default:
      return [beat.matrix]
  }
}

function texts(step: Step): string[] {
  const out = [step.title, step.body ?? '']
  if (step.kind === 'choice') {
    out.push(
      step.solution,
      ...step.options.flatMap((o) => [
        o.feedback ?? '',
        ...o.content.flatMap((b) => (b.kind === 'text' ? [b.text] : [])),
      ]),
    )
  }
  if (step.kind === 'keypad') out.push(step.solution, step.feedbackWrong)
  if (step.kind === 'summary') out.push(...step.points)
  return out
}

describe('lessons', () => {
  it('have unique ids', () => {
    const ids = lessons.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  for (const lesson of lessons) {
    describe(lesson.id, () => {
      it('has unique, well-formed step ids', () => {
        const ids = lesson.steps.map((s) => s.id)
        expect(new Set(ids).size).toBe(ids.length)
        for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      })

      it('refers only to its own matrices, with cells in range', () => {
        for (const step of lesson.steps) {
          for (const item of step.scene?.items ?? []) {
            if (item !== '=' && item !== 'result') matrixOf(lesson, item)
          }
          const beats = [
            step.kind === 'explain' ? step.beat : undefined,
            'reveal' in step ? step.reveal : undefined,
          ]
          for (const beat of beats) {
            if (!beat) continue
            for (const name of beatMatrices(beat)) matrixOf(lesson, name)
          }
        }
        for (const block of Object.values(lesson.matrices)) {
          const width = block.rows[0]?.length ?? 0
          for (const row of block.rows) expect(row.length).toBe(width)
        }
      })

      it('has balanced math and highlight markup', () => {
        for (const step of lesson.steps) {
          for (const t of texts(step)) {
            expect((t.match(/\$/g) ?? []).length % 2, `${step.id}: ${t}`).toBe(0)
            for (const tag of ['row', 'col', 'ok']) {
              expect(t.split(`{${tag}}`).length, `${step.id}: ${t}`).toBe(t.split(`{/${tag}}`).length)
            }
          }
        }
      })

      it('gives choice steps 2 to 5 distinct options with feedback on every distractor', () => {
        for (const step of lesson.steps) {
          if (step.kind !== 'choice') continue
          expect(step.options.length).toBeGreaterThanOrEqual(2)
          expect(step.options.length).toBeLessThanOrEqual(5)
          expect(step.options.map((o) => o.key)).toEqual(
            ['a', 'b', 'c', 'd', 'e'].slice(0, step.options.length),
          )
          expect(new Set(step.options.map((o) => JSON.stringify(o.content))).size).toBe(step.options.length)
          for (const o of step.options) {
            if (o.key === step.answer) expect(o.feedback).toBeUndefined()
            else expect(o.feedback?.length ?? 0).toBeGreaterThan(0)
          }
        }
      })

      it('recomputes every claim', () => {
        for (const step of lesson.steps) for (const claim of step.claims ?? []) checkClaim(lesson, claim)
      })

      it('keys every exercise to its claim', () => {
        for (const step of lesson.steps) {
          const numericClaims = (step.claims ?? []).filter(
            (c) =>
              (c.kind === 'det' && !c.at) ||
              c.kind === 'minor' ||
              c.kind === 'cofactor' ||
              c.kind === 'detProduct',
          )
          const det =
            numericClaims.find((c) => 'answer' in c && c.answer) ??
            (numericClaims.length === 1 ? numericClaims[0] : undefined)
          if (step.kind === 'keypad') {
            expect(det, step.id).toBeDefined()
            if (det && 'equals' in det) expect(Q.format(parse(step.answer))).toBe(Q.format(parse(det.equals)))
          }
          if (step.kind === 'choice' && det && 'equals' in det) {
            const value = (key: string) => {
              const option = step.options.find((o) => o.key === key)
              const first = option?.content[0]
              return first?.kind === 'text'
                ? Q.parse(first.text.replaceAll('$', '').replace(/(-?)\\frac\{(\d+)\}\{(\d+)\}/, '$1$2/$3'))
                : null
            }
            const matching = step.options.filter((o) => {
              const v = value(o.key)
              return v !== null && Q.equals(v, parse(det.equals))
            })
            expect(
              matching.map((o) => o.key),
              step.id,
            ).toEqual([step.answer])
          }
          if (step.kind === 'choice' && step.claims?.some((c) => c.kind === 'detRoots')) {
            expect(step.answer).toBeDefined()
          }
        }
      })
    })
  }
})

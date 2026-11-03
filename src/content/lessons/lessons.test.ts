import { describe, expect, it } from 'vitest'
import * as M from '../../lib/math/matrix'
import * as Q from '../../lib/math/rational'
import {
  checkBeat,
  checkClaim,
  complexOf,
  formatComplex,
  formatMatrix,
  formatRows,
  hasComplexProperty,
  hasProperty,
  matrixOf,
  numeric,
  parse,
  sarrusSums,
  scope,
  solutionLabels,
  system,
  valueMatrix,
} from './claim-check'
import { lessons } from './index'
import type { Beat, Lesson, Step } from './types'

// Every lesson: structure is sound, and every claimed number is recomputed with the math core.
function beatMatrices(beat: Beat): string[] {
  switch (beat.kind) {
    case 'rowOps':
      return [beat.matrix, beat.result]
    case 'sequence':
      return beat.beats.flatMap(beatMatrices)
    case 'frames':
      return beat.frames.flatMap((f) => (f.marks ?? []).map((mark) => mark.cell[0]))
    case 'equation':
      return []
    case 'product':
      return [beat.left, beat.right, ...(beat.into ? [beat.into] : [])]
    case 'combine':
      return [...beat.terms.map((t) => t.matrix), ...(beat.into ? [beat.into] : [])]
    case 'transpose':
      return [beat.matrix, beat.into]
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

/** The steps plus the gizli an, which is held to the same rules as a choice step. */
const stepsOf = (lesson: Lesson): readonly Step[] =>
  lesson.moment ? [...lesson.steps, lesson.moment] : lesson.steps

describe('lessons', () => {
  it('have unique ids', () => {
    const ids = lessons.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  for (const lesson of lessons) {
    describe(lesson.id, () => {
      it('has unique, well-formed step ids', () => {
        const ids = stepsOf(lesson).map((s) => s.id)
        expect(new Set(ids).size).toBe(ids.length)
        for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      })

      it('refers only to its own matrices, with cells in range', () => {
        for (const step of stepsOf(lesson)) {
          for (const item of step.scene?.items ?? []) {
            if (!['=', '·', '+', '~', 'result'].includes(item)) matrixOf(lesson, item)
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

      it('wraps TeX in matrix labels in $...$', () => {
        for (const [name, block] of Object.entries(lesson.matrices)) {
          const label = block.label ?? ''
          const outside = label
            .split('$')
            .filter((_, i) => i % 2 === 0)
            .join('')
          expect(outside, `${name}: ${label}`).not.toMatch(/[\\_^{}]/)
          expect((label.match(/\$/g) ?? []).length % 2, `${name}: ${label}`).toBe(0)
        }
      })

      it('has balanced math and highlight markup', () => {
        for (const step of stepsOf(lesson)) {
          for (const t of texts(step)) {
            expect((t.match(/\$/g) ?? []).length % 2, `${step.id}: ${t}`).toBe(0)
            for (const tag of ['row', 'col', 'ok']) {
              expect(t.split(`{${tag}}`).length, `${step.id}: ${t}`).toBe(t.split(`{/${tag}}`).length)
            }
          }
        }
      })

      it('gives choice steps 2 to 5 distinct options with feedback on every distractor', () => {
        for (const step of stepsOf(lesson)) {
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
        for (const step of stepsOf(lesson)) for (const claim of step.claims ?? []) checkClaim(lesson, claim)
      })

      it('replays every row operation to its stated result', () => {
        for (const step of stepsOf(lesson)) {
          if (step.kind === 'explain' && step.beat) checkBeat(lesson, step.beat)
          if ('reveal' in step && step.reveal) checkBeat(lesson, step.reveal)
        }
      })

      it('keys every exercise to its claim', () => {
        for (const step of stepsOf(lesson)) {
          const numericClaims = (step.claims ?? []).filter(
            (c) =>
              (c.kind === 'det' && !c.at) ||
              c.kind === 'minor' ||
              c.kind === 'cofactor' ||
              c.kind === 'detProduct' ||
              c.kind === 'derivedEntry' ||
              c.kind === 'derivedDet' ||
              c.kind === 'exprEntry' ||
              c.kind === 'rank' ||
              c.kind === 'trace' ||
              (c.kind === 'detRoots' && c.answer === true) ||
              c.kind === 'solve' ||
              c.kind === 'complexDet',
          )
          const matrixAnswer = step.claims?.find(
            (c) => (c.kind === 'derived' || c.kind === 'expr' || c.kind === 'complexDerived') && c.answer,
          )
          const det = matrixAnswer
            ? undefined
            : (numericClaims.find((c) => 'answer' in c && c.answer) ??
              (numericClaims.length === 1 ? numericClaims[0] : undefined))
          const expected =
            det?.kind === 'detRoots'
              ? det.roots.length === 1
                ? det.roots[0]
                : undefined
              : det && 'equals' in det && typeof det.equals === 'string'
                ? det.equals
                : undefined
          if (step.kind === 'keypad') {
            expect(expected, step.id).toBeDefined()
            if (expected) expect(Q.format(parse(step.answer))).toBe(Q.format(parse(expected)))
          }
          if (step.kind === 'choice' && expected) {
            const value = (key: string) => {
              const option = step.options.find((o) => o.key === key)
              const first = option?.content[0]
              return first?.kind === 'text'
                ? Q.parse(first.text.replaceAll('$', '').replace(/(-?)\\frac\{(\d+)\}\{(\d+)\}/, '$1$2/$3'))
                : null
            }
            // Statement items ("I ve II") carry numeric claims as evidence, not as the answer.
            const numericOptions = step.options.some((o) => value(o.key) !== null)
            const matching = step.options.filter((o) => {
              const v = value(o.key)
              return v !== null && Q.equals(v, parse(expected))
            })
            if (numericOptions) {
              expect(
                matching.map((o) => o.key),
                step.id,
              ).toEqual([step.answer])
            }
          }
          if (step.kind === 'choice' && (matrixAnswer?.kind === 'derived' || matrixAnswer?.kind === 'expr')) {
            const expected = JSON.stringify(formatRows(matrixAnswer.equals))
            const matching = step.options.filter((o) => {
              const shown = o.content.find((b) => b.kind === 'matrix')
              return shown?.kind === 'matrix' && JSON.stringify(formatRows(shown.rows)) === expected
            })
            expect(
              matching.map((o) => o.key),
              step.id,
            ).toEqual([step.answer])
          }
          const optionClaim = step.claims?.find((c) => c.kind === 'optionProperty')
          if (step.kind === 'choice' && optionClaim?.kind === 'optionProperty') {
            const matrices = scope(lesson, optionClaim.where)
            const matching = step.options.filter((o) => {
              const shown = o.content.find((b) => b.kind === 'matrix')
              const first = o.content[0]
              const a =
                shown?.kind === 'matrix'
                  ? numeric(shown)
                  : valueMatrix(first?.kind === 'text' ? first.text : '', matrices)
              return hasProperty(a, optionClaim.is, optionClaim.index) === (optionClaim.holds ?? true)
            })
            expect(
              matching.map((o) => o.key),
              step.id,
            ).toEqual([step.answer])
          }
          const complexAnswer = step.claims?.find((c) => c.kind === 'complexDerived' && c.answer)
          if (step.kind === 'choice' && complexAnswer?.kind === 'complexDerived') {
            const expected = JSON.stringify(formatComplex(complexAnswer.equals))
            const matching = step.options.filter((o) => {
              const shown = o.content.find((b) => b.kind === 'matrix')
              return shown?.kind === 'matrix' && JSON.stringify(formatComplex(shown.rows)) === expected
            })
            expect(
              matching.map((o) => o.key),
              step.id,
            ).toEqual([step.answer])
          }
          const complexOption = step.claims?.find((c) => c.kind === 'optionComplexProperty')
          if (step.kind === 'choice' && complexOption?.kind === 'optionComplexProperty') {
            const matching = step.options.filter((o) => {
              const shown = o.content.find((b) => b.kind === 'matrix')
              if (shown?.kind !== 'matrix') throw new Error(`${step.id}: option ${o.key} has no matrix`)
              return hasComplexProperty(complexOf(shown), complexOption.is) === (complexOption.holds ?? true)
            })
            expect(
              matching.map((o) => o.key),
              step.id,
            ).toEqual([step.answer])
          }
          const exprClaim = step.claims?.find((c) => c.kind === 'optionExpr')
          if (step.kind === 'choice' && exprClaim?.kind === 'optionExpr') {
            const matrices = scope(lesson, exprClaim.where)
            const target = JSON.stringify(formatMatrix(valueMatrix(exprClaim.expr, matrices)))
            const matching = step.options.filter((o) => {
              const first = o.content[0]
              const shown = valueMatrix(first?.kind === 'text' ? first.text : '', matrices)
              return JSON.stringify(formatMatrix(shown)) === target
            })
            expect(
              matching.map((o) => o.key),
              step.id,
            ).toEqual([step.answer])
          }
          const systemAnswer = step.claims?.find((c) => c.kind === 'system' && c.answer)
          if (step.kind === 'choice' && systemAnswer?.kind === 'system') {
            const label = solutionLabels[systemAnswer.is]
            const matching = step.options.filter((o) =>
              o.content.some((b) => b.kind === 'text' && b.text === label),
            )
            expect(
              matching.map((o) => o.key),
              step.id,
            ).toEqual([step.answer])
          }
          const optionSystem = step.claims?.find((c) => c.kind === 'optionSystem')
          if (step.kind === 'choice' && optionSystem?.kind === 'optionSystem') {
            const block = matrixOf(lesson, optionSystem.matrix)
            const matching = step.options.filter((o) => {
              const first = o.content[0]
              const v = first?.kind === 'text' ? Q.parse(first.text.replaceAll('$', '')) : null
              if (!v) throw new Error(`${step.id}: option ${o.key} is not a number`)
              const [a, b] = system(block, { [optionSystem.variable]: v })
              return M.classifySystem(a, b) === optionSystem.is
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

describe('gizli an', () => {
  const holders = lessons.filter((lesson) => lesson.moment)

  it('exists in the lessons that have one', () => {
    expect(holders.map((lesson) => lesson.id)).toEqual(
      expect.arrayContaining([
        'd1-determinant',
        'd2-cofactor-expansion',
        'd3-determinant-properties',
        'r3-rank',
        'r4-inverse',
        's3-homogeneous-systems',
      ]),
    )
  })

  for (const lesson of holders) {
    const moment = lesson.moment as NonNullable<Lesson['moment']>
    if (lesson.id === 'd1-determinant')
      it(`${lesson.id}: its options are the true value and the two named slips`, () => {
        const a = numeric(matrixOf(lesson, 'Z'))
        const det = M.determinant(a)
        const [plus, minus] = sarrusSums(a)
        const value = (key: string) => {
          const first = moment.options.find((o) => o.key === key)?.content[0]
          return first?.kind === 'text' ? first.text.replaceAll('$', '') : ''
        }
        // 3rd column = 1st + 2nd.
        for (let r = 0; r < 3; r++) {
          expect(Q.format(M.at(a, r, 2))).toBe(Q.format(Q.add(M.at(a, r, 0), M.at(a, r, 1))))
        }
        expect(value(moment.answer)).toBe(Q.format(det))
        expect(Q.format(det)).toBe('0')
        expect(value('a')).toBe(Q.format(plus)) // only the down diagonals
        expect(value('c')).toBe(Q.format(Q.add(plus, minus))) // both sums added
      })

    it(`${lesson.id}: its id does not clash with a step and its claims hold`, () => {
      expect(lesson.steps.map((s) => s.id)).not.toContain(moment.id)
      expect(moment.claims?.length ?? 0).toBeGreaterThan(0)
      for (const claim of moment.claims ?? []) checkClaim(lesson, claim)
    })
  }
})

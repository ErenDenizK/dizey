import { describe, expect, it } from 'vitest'
import { mathToHtml } from '../../exam/math'
import { splitTex } from '../../exam/tex'
import { lessons } from '../lessons'
import { checkClaim, matrixOf } from '../lessons/claim-check'
import type { Lesson } from '../lessons/types'
import { formulaGroups } from './formulas'
import { summaries, summaryOf } from './lessons'
import type { Summary } from './types'

// Every summary: it belongs to a lesson, its example is recomputed with the math core, its TeX typesets, and
// it fits a one-minute read on a phone.

/** Every text a summary shows. */
function texts(summary: Summary): string[] {
  return [summary.gist, ...summary.points, summary.trap, summary.example?.line ?? '']
}

function typesets(text: string): string[] {
  return splitTex(text)
    .filter((part) => part.tex)
    .map((part) => part.value)
}

const words = (summary: Summary) =>
  texts(summary)
    .join(' ')
    .replace(/\$[^$]*\$/g, 'x')
    .split(/\s+/)
    .filter(Boolean).length

/** A stand-in lesson that carries a summary's example, so the lesson claim checker can run on it. */
function standIn(id: string, summary: Summary): Lesson {
  return { id, node: 'M1', title: id, matrices: summary.example?.matrices ?? {}, steps: [] }
}

describe('summaries', () => {
  it('belong to lessons', () => {
    const ids = new Set(lessons.map((lesson) => lesson.id))
    for (const id of Object.keys(summaries)) expect(ids.has(id), id).toBe(true)
  })

  it('cover every Vize 1 lesson (a lesson of another node may still wait for its summary)', () => {
    const missing = lessons
      .filter((lesson) => /^[MRDS]\d/.test(lesson.node) && !summaryOf(lesson.id))
      .map((lesson) => lesson.id)
    expect(missing).toEqual([])
  })

  it('tolerate a lesson without a summary', () => {
    expect(summaryOf('no-such-lesson')).toBeUndefined()
  })

  for (const [id, summary] of Object.entries(summaries)) {
    describe(id, () => {
      it('reads in about a minute', () => {
        expect(summary.points.length).toBeGreaterThanOrEqual(1)
        expect(summary.points.length).toBeLessThanOrEqual(5)
        expect(words(summary)).toBeLessThanOrEqual(120)
        for (const line of [summary.gist, summary.trap, ...summary.points])
          expect(line.length).toBeLessThanOrEqual(200)
      })

      it('typesets', () => {
        for (const text of texts(summary)) {
          for (const tex of typesets(text)) expect(mathToHtml(tex), tex).not.toContain('dz-m-error')
        }
      })

      it('has an example whose every claim is recomputed', () => {
        const { example } = summary
        if (!example) return
        expect(example.claims.length).toBeGreaterThan(0)
        const lesson = standIn(id, summary)
        for (const name of example.show) matrixOf(lesson, name)
        for (const claim of example.claims) checkClaim(lesson, claim)
      })
    })
  }
})

describe('formula sheet', () => {
  it('typesets', () => {
    for (const group of formulaGroups) {
      for (const formula of group.formulas) {
        for (const text of [formula.tex, formula.note ?? '']) {
          for (const tex of typesets(text)) expect(mathToHtml(tex), tex).not.toContain('dz-m-error')
        }
      }
    }
  })

  it('has unique group ids and no empty group', () => {
    expect(new Set(formulaGroups.map((group) => group.id)).size).toBe(formulaGroups.length)
    for (const group of formulaGroups) expect(group.formulas.length).toBeGreaterThan(0)
  })
})

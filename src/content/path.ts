import { lessons } from './lessons'
import type { Lesson } from './lessons/types'

/**
 * The lesson path: the study order cut into chapters. Each chapter is drawn as one matrix whose entries
 * are its lessons. Chapters follow `lessons` exactly (tested), so the path never jumps backwards: M11
 * needs determinants, so it sits with R4 in the inverse chapter instead of with the other matrix lessons.
 * `examItems` counts past Midterm 1 items for the chapter's main topic (docs/research/past-exam-analysis.md);
 * the inverse chapter shares its topic with others, so it has no count of its own.
 */
export type Chapter = {
  id: string
  label: string
  lessons: readonly Lesson[]
  examItems: number | null
}

const spec = [
  {
    id: 'matrices',
    label: 'Matrisler',
    examItems: 12,
    ids: [
      'm1-reading-a-matrix',
      'm2-matrix-types',
      'm4-matrix-arithmetic',
      'm5-matrix-product',
      'm3-trace',
      'm6-transpose',
      'm7-symmetric-antisymmetric',
      'm8-power-classes',
      'm9-orthogonal',
      'm10-conjugate-hermitian',
    ],
  },
  {
    id: 'row-operations',
    label: 'Satır işlemleri',
    examItems: 4,
    ids: ['r1-row-operations', 'r2-echelon-forms', 'r3-rank'],
  },
  {
    id: 'determinants',
    label: 'Determinant',
    examItems: 13,
    ids: ['d1-determinant', 'd2-cofactor-expansion', 'd3-determinant-properties', 'd4-adjugate-inverse'],
  },
  { id: 'inverse', label: 'Tersinirlik', examItems: null, ids: ['m11-regular-singular', 'r4-inverse'] },
  {
    id: 'systems',
    label: 'Denklem sistemleri',
    examItems: 5,
    ids: ['s1-linear-systems', 's2-parametric-systems', 's3-homogeneous-systems', 's4-cramer'],
  },
] as const

export const examItemTotal = 34

export function buildChapters(all: readonly Lesson[]): Chapter[] {
  const byId = new Map(all.map((lesson) => [lesson.id, lesson]))
  return spec.map(({ ids, ...chapter }) => ({
    ...chapter,
    lessons: ids.map((id) => byId.get(id)).filter((lesson): lesson is Lesson => Boolean(lesson)),
  }))
}

export const chapters: readonly Chapter[] = buildChapters(lessons)

export function chapterOf(lesson: Lesson, list: readonly Chapter[] = chapters): Chapter | undefined {
  return list.find((chapter) => chapter.lessons.includes(lesson))
}

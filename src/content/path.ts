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

/**
 * A lesson's place on the path, world-style: chapter, then position ("1.4"). Shown instead of the content
 * node codes, which follow topic order and would read out of order along the path (M1 M2 M4 M5 M3).
 */
export function pathCode(lesson: Lesson, list: readonly Chapter[] = chapters): string {
  const number = list.findIndex((chapter) => chapter.lessons.includes(lesson))
  if (number < 0) return lesson.node
  return `${number + 1}.${(list[number]?.lessons.indexOf(lesson) ?? 0) + 1}`
}

/** The path code of the lesson that teaches a node (exam questions carry nodes, not lessons). */
export function codeOfNode(node: string, list: readonly Chapter[] = chapters): string {
  const lesson = list.flatMap((chapter) => chapter.lessons).find((candidate) => candidate.node === node)
  return lesson ? pathCode(lesson, list) : node
}

/**
 * Tile labels: a tile holds about three short lines, so long lesson titles get a short name here (the full
 * title stays on the lesson card and in the lesson).
 */
const tileTitles: Readonly<Record<string, string>> = {
  'm4-matrix-arithmetic': 'Matris işlemleri',
  'm8-power-classes': 'Kuvvet sınıfları',
  'r2-echelon-forms': 'Eşelon formlar',
  'r4-inverse': 'Gauss-Jordan ile ters',
  'd1-determinant': 'Determinant ve Sarrus',
  'd2-cofactor-expansion': 'Laplace açılımı',
  'd3-determinant-properties': 'Determinant özellikleri',
}

export function tileTitle(lesson: Lesson): string {
  return tileTitles[lesson.id] ?? lesson.title
}

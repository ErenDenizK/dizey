import type { Lesson } from './lessons/types'

/**
 * Map units in study order. `examItems` counts the 34 real Midterm 1 items by main topic
 * (docs/research/past-exam-analysis.md): determinants carry the most weight.
 */
export const units = [
  { prefix: 'M', label: 'Matrisler', examItems: 12 },
  { prefix: 'R', label: 'Satır işlemleri ve ters matris', examItems: 4 },
  { prefix: 'D', label: 'Determinant', examItems: 13 },
  { prefix: 'S', label: 'Lineer denklem sistemleri', examItems: 5 },
  { prefix: 'X', label: 'Büyük resim', examItems: 0 },
] as const

export const examItemTotal = 34

export function unitOf(lesson: Lesson): (typeof units)[number] | undefined {
  return units.find((unit) => lesson.node.startsWith(unit.prefix))
}

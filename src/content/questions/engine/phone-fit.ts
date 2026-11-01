import type { Block, Question } from '../types'

/**
 * Phone-fit rules (Eren): every generated question must be solvable mentally or with minimal scratch work and
 * fit a 375 px screen. This is the family-independent part; family-specific limits (factor counts, powers,
 * determinant sizes) live in the verifier's analysis of each family.
 */
export const LIMITS = {
  maxStemChars: 220,
  maxEntryChars: 6,
  maxNumericEntry: 9,
  maxOptionChars: 40,
  maxSize: 3,
} as const

const INTEGER = /^-?\d+$/

function matrixProblems(rows: readonly (readonly string[])[]): string[] {
  const problems: string[] = []
  const n = rows.length
  const width = rows[0]?.length ?? 0
  for (const row of rows) {
    for (const entry of row) {
      if (entry.length > LIMITS.maxEntryChars)
        problems.push(`entry "${entry}" is longer than ${LIMITS.maxEntryChars} characters`)
      if (INTEGER.test(entry) && Math.abs(Number(entry)) > LIMITS.maxNumericEntry) {
        problems.push(`numeric entry ${entry} is not a single digit`)
      }
    }
  }
  if (n <= LIMITS.maxSize && width <= LIMITS.maxSize) return problems
  if (n !== 4 || width !== 4) return [...problems, `${n}x${width} matrix is too big`]
  const nonzero = (entry: string) => !(INTEGER.test(entry) && Number(entry) === 0)
  if (!rows.every((row) => row.every((entry) => INTEGER.test(entry)))) {
    return [...problems, '4x4 matrix with symbolic entries']
  }
  const cell = (i: number, j: number) => rows[i]?.[j] ?? '0'
  const lines = [0, 1, 2, 3].flatMap((i) => [
    [0, 1, 2, 3].filter((j) => nonzero(cell(i, j))).length,
    [0, 1, 2, 3].filter((j) => nonzero(cell(j, i))).length,
  ])
  const triangular =
    rows.every((row, i) => row.every((entry, j) => j >= i || !nonzero(entry))) ||
    rows.every((row, i) => row.every((entry, j) => j <= i || !nonzero(entry)))
  if (!triangular && Math.min(...lines) > 2)
    problems.push('4x4 matrix is neither triangular nor sparse in a row or column')
  return problems
}

export const textOfBlocks = (blocks: readonly Block[]): string =>
  blocks.flatMap((b) => (b.kind === 'text' ? [b.text] : [])).join(' ')

/** Problems found by the generic phone-fit rules; empty when the question fits. */
export function genericFit(question: Question): string[] {
  const problems: string[] = []
  for (const block of question.stem) {
    if (block.kind === 'matrix') problems.push(...matrixProblems(block.rows))
    if (block.kind === 'system') problems.push('system block in a generated stem')
  }
  const stemLength = textOfBlocks(question.stem).length
  if (stemLength > LIMITS.maxStemChars) problems.push(`stem text is ${stemLength} characters`)
  for (const option of question.options) {
    const only = option.content[0]
    if (option.content.length !== 1 || only?.kind !== 'text')
      problems.push(`option ${option.key} is not one short text`)
    else if (only.text.length > LIMITS.maxOptionChars)
      problems.push(`option ${option.key} is ${only.text.length} characters`)
  }
  return problems
}

import { text } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

const bars = (label: string, rows: readonly (readonly string[])[]): MatrixBlock => ({
  kind: 'matrix',
  delimiter: 'bars',
  rows,
  label,
})

const m = (label: string, rows: readonly (readonly string[])[]): MatrixBlock => ({
  kind: 'matrix',
  delimiter: 'brackets',
  rows,
  label,
})

/** S4: Cramer's rule x_i = |A_i| / |A| for square systems with |A| ≠ 0, and X = A⁻¹B. */
export const s4Cramer: Lesson = {
  id: 's4-cramer',
  node: 'S4',
  title: 'Cramer kuralı',
  matrices: {
    A: bars('$|A|$ =', [
      ['2', '1'],
      ['1', '-3'],
    ]),
    Ax: bars('$|A_x|$ =', [
      ['5', '1'],
      ['-1', '-3'],
    ]),
    Ay: bars('$|A_y|$ =', [
      ['2', '5'],
      ['1', '-1'],
    ]),
    tA: m('A =', [
      ['1', '1', '1'],
      ['2', '-1', '1'],
      ['1', '2', '-1'],
    ]),
    tB: m('b =', [['6'], ['3'], ['2']]),
    tAy: bars('$|A_y|$ =', [
      ['1', '6', '1'],
      ['2', '3', '1'],
      ['1', '2', '-1'],
    ]),
  },
  steps: [
    {
      id: 'rule',
      kind: 'explain',
      eyebrow: 'Kural',
      title: '$x_i = \\frac{|A_i|}{|A|}$',
      body: 'Kare bir sistemde $|A| \\neq 0$ ise tek çözüm vardır ve her bilinmeyen ayrı ayrı bulunabilir. $A_i$: $A$’nın {col}$i.$ sütunu yerine $b$ yazılmış hali{/col}. Bu formül $A^{-1} = \\frac{1}{|A|}\\text{Ek}(A)$’dan gelir.',
      scene: { items: ['A', 'Ax'] },
      beat: {
        kind: 'frames',
        frames: [
          { clear: true, marks: [{ cell: ['A', '*', 0], tone: 'col' }], note: '1. sütun' },
          { clear: true, marks: [{ cell: ['Ax', '*', 0], tone: 'col' }], note: 'yerine b = (5, −1)' },
        ],
      },
    },
    {
      id: 'worked',
      kind: 'explain',
      eyebrow: 'Örnek',
      title: '$2x + y = 5$, $x - 3y = -1$',
      body: '$|A| = -6 - 1 = -7$. $|A_x| = -15 + 1 = -14$, $|A_y| = -2 - 5 = -7$. Bölünce {ok}$x = 2$, $y = 1$ olur{/ok}. Kontrol: $2 \\cdot 2 + 1 = 5$, $2 - 3 = -1$.',
      scene: { items: ['A', 'Ax', 'Ay'] },
      claims: [
        { kind: 'det', matrix: 'A', equals: '-7' },
        { kind: 'det', matrix: 'Ax', equals: '-14' },
        { kind: 'det', matrix: 'Ay', equals: '-7' },
      ],
    },
    {
      id: 'try-z',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: '$Ax = b$ sisteminde $z$ kaç?',
      body: '$|A| = 7$. $|A_z|$’yi hesapla: 3. sütunun yerine $b$.',
      skill: 'cramer-unknown',
      scene: { items: ['tA', 'tB'] },
      answer: '3',
      feedbackWrong:
        '$|A_z|$’nin satırları $(1, 1, 6)$, $(2, -1, 3)$, $(1, 2, 2)$; determinantı $21$. Sonra $|A|$’ya böl.',
      solution: '$z = \\frac{21}{7} = 3$.',
      claims: [
        { kind: 'det', matrix: 'tA', equals: '7' },
        { kind: 'exprEntry', expr: 'tA^{-1}tB', row: 3, col: 1, equals: '3', answer: true },
      ],
    },
    {
      id: 'limits',
      kind: 'explain',
      eyebrow: 'Sınır',
      title: '$|A| = 0$ ise Cramer çalışmaz',
      body: 'Formül $|A|$’ya böler. $|A| = 0$ iken sistem ya çözümsüz ya sonsuz çözümlüdür; hangisi olduğuna {ok}ranklarla bakılır{/ok}, Cramer ile değil. Aynı şekilde $X = A^{-1}b$ yolu da yalnız $|A| \\neq 0$ iken kullanılır.',
    },
    {
      id: 'exam-y',
      kind: 'choice',
      eyebrow: 'Sınav tipi',
      title: 'Aynı sistemde Cramer kuralıyla $y$ kaçtır?',
      skill: 'cramer-unknown',
      scene: { items: ['tA', 'tB'] },
      options: [
        {
          key: 'a',
          content: [text('$\\frac{1}{2}$')],
          errorType: 'inverted-ratio',
          feedback: 'Oran ters: $y = \\frac{|A_y|}{|A|}$, $\\frac{|A|}{|A_y|}$ değil.',
        },
        { key: 'b', content: [text('$2$')] },
        {
          key: 'c',
          content: [text('$14$')],
          errorType: 'forgot-divide',
          feedback: 'Bu $|A_y|$. $|A| = 7$’ye böl.',
        },
        {
          key: 'd',
          content: [text('$3$')],
          errorType: 'wrong-column',
          feedback: 'Bu $z$. $y$ için 2. sütunun yerine $b$ yazılır.',
        },
        {
          key: 'e',
          content: [text('$1$')],
          errorType: 'wrong-column',
          feedback: 'Bu $x$. $y$ için 2. sütunun yerine $b$ yazılır.',
        },
      ],
      answer: 'b',
      solution: '$|A_y| = 14$, $y = \\frac{14}{7} = 2$.',
      claims: [
        { kind: 'det', matrix: 'tAy', equals: '14' },
        { kind: 'exprEntry', expr: 'tA^{-1}tB', row: 2, col: 1, equals: '2', answer: true },
        { kind: 'exprEntry', expr: 'tA^{-1}tB', row: 1, col: 1, equals: '1' },
      ],
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'Cramer kuralı',
      points: [
        'Kare sistem, $|A| \\neq 0$: $x_i = \\frac{|A_i|}{|A|}$.',
        '$A_i$: $i.$ sütun yerine $b$.',
        'Tek bir bilinmeyen sorulduysa yalnız o determinantı hesapla.',
        '$|A| = 0$ ise Cramer yok: ranklara bak.',
      ],
    },
  ],
}

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
    cA: m('', [
      ['2', '1'],
      ['1', '-3'],
    ]),
    cB: m('', [['5'], ['-1']]),
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
      id: 'hook',
      kind: 'explain',
      eyebrow: 'Soru',
      title: 'Yalnız $x$’i bulmak için bütün sistemi çözmek şart mı?',
      body: '$2x + y = 5$, $x - 3y = -1$. İki determinant yeter.',
      scene: { items: ['A'] },
    },
    {
      id: 'rule',
      kind: 'explain',
      eyebrow: 'Kural',
      title: '$x_i = \\frac{|A_i|}{|A|}$',
      body: '$A_i$: $A$’nın {col}i. sütunu yerine b yazılmış hali{/col}. Koşul: $|A| \\neq 0$.',
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
      title: '$x = \\frac{|A_x|}{|A|}$',
      body: 'İki determinant, bir bölme: {ok}x = 2{/ok}.',
      scene: { items: ['A', 'Ax'] },
      beat: {
        kind: 'sequence',
        beats: [
          { kind: 'det2', matrix: 'A' },
          { kind: 'det2', matrix: 'Ax' },
        ],
      },
      claims: [
        { kind: 'det', matrix: 'A', equals: '-7' },
        { kind: 'det', matrix: 'Ax', equals: '-14' },
        { kind: 'exprEntry', expr: 'cA^{-1}cB', row: 1, col: 1, equals: '2' },
      ],
    },
    {
      id: 'try-y',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: '$y$ kaç?',
      body: '$|A| = -7$. 2. sütunun yerine $b$ yaz.',
      skill: 'cramer-unknown',
      scene: { items: ['Ay'] },
      answer: '1',
      feedbackWrong: '$|A_y| = 2 \\cdot (-1) - 5 \\cdot 1 = -7$, sonra $-7$’ye böl.',
      reveal: { kind: 'det2', matrix: 'Ay' },
      solution: '$y = \\frac{-7}{-7} = 1$. Kontrol: $2 \\cdot 2 + 1 = 5$.',
      claims: [
        { kind: 'det', matrix: 'Ay', equals: '-7' },
        { kind: 'exprEntry', expr: 'cA^{-1}cB', row: 2, col: 1, equals: '1', answer: true },
      ],
    },
    {
      id: 'try-z',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: '$Ax = b$ sisteminde $z$ kaç?',
      body: '$|A| = 7$. 3. sütunun yerine $b$ yaz.',
      skill: 'cramer-unknown',
      scene: { items: ['tA', 'tB'] },
      answer: '3',
      feedbackWrong:
        '$|A_z|$’nin satırları $(1, 1, 6)$, $(2, -1, 3)$, $(1, 2, 2)$; determinantı $21$. Sonra $|A|$’ya böl.',
      reveal: {
        kind: 'equation',
        lines: [
          '|A_z| = \\begin{vmatrix} 1 & 1 & 6 \\\\ 2 & -1 & 3 \\\\ 1 & 2 & 2 \\end{vmatrix} = 21',
          'z = \\tfrac{21}{7} = 3',
        ],
      },
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
      body: 'Formül $|A|$’ya böler. $|A| = 0$ ise {ok}ranklara bak{/ok}: çözüm yok ya da sonsuz.',
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
      reveal: { kind: 'equation', lines: ['|A_y| = 14', 'y = \\tfrac{14}{7} = 2'] },
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

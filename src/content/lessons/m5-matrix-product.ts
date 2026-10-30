import { text } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

const m = (label: string, rows: readonly (readonly string[])[]): MatrixBlock => ({
  kind: 'matrix',
  delimiter: 'brackets',
  rows,
  label,
})

/** M5: the product row by column, sizes, non-commutativity, zero divisors, powers. */
export const m5MatrixProduct: Lesson = {
  id: 'm5-matrix-product',
  node: 'M5',
  title: 'Matris çarpımı ve kuvvetler',
  matrices: {
    A: m('A =', [
      ['1', '2', '0'],
      ['3', '-1', '4'],
    ]),
    B: m('B =', [
      ['2', '1'],
      ['0', '3'],
      ['1', '-2'],
    ]),
    AB: m('AB =', [
      ['2', '7'],
      ['10', '-8'],
    ]),
    X: m('X =', [
      ['1', '2'],
      ['0', '1'],
    ]),
    Y: m('Y =', [
      ['1', '0'],
      ['1', '1'],
    ]),
    Z: m('Z =', [
      ['1', '1'],
      ['1', '1'],
    ]),
    W: m('W =', [
      ['1', '-1'],
      ['-1', '1'],
    ]),
    J: m('J =', [
      ['1', '1'],
      ['0', '1'],
    ]),
    U: m('A =', [
      ['2', '-1', '3'],
      ['0', '4', '1'],
      ['5', '2', '-2'],
    ]),
    V: m('B =', [
      ['1', '0', '2'],
      ['-3', '1', '1'],
      ['2', '4', '0'],
    ]),
  },
  steps: [
    {
      id: 'row-by-column',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Satır çarpı sütun',
      body: '$(AB)_{ij}$: $A$’nın $i.$ satırı ile $B$’nin $j.$ sütununu eleman eleman çarp, topla. Sol üst: $1 \\cdot 2 + 2 \\cdot 0 + 0 \\cdot 1 = 2$. Boyut kuralı: {ok}(2×3)(3×2) = 2×2{/ok}; içteki sayılar eşit olmalı, dıştakiler sonucu verir.',
      scene: { items: ['A', 'B', '=', 'AB'] },
      beat: {
        kind: 'frames',
        frames: [
          {
            clear: true,
            marks: [
              { cell: ['A', 0, '*'], tone: 'row' },
              { cell: ['B', '*', 0], tone: 'col' },
              { cell: ['AB', 0, 0], tone: 'ok' },
            ],
            note: '2 + 0 + 0 = 2',
          },
          {
            clear: true,
            marks: [
              { cell: ['A', 0, '*'], tone: 'row' },
              { cell: ['B', '*', 1], tone: 'col' },
              { cell: ['AB', 0, 1], tone: 'ok' },
            ],
            note: '1 + 6 + 0 = 7',
          },
          {
            clear: true,
            marks: [
              { cell: ['A', 1, '*'], tone: 'row' },
              { cell: ['B', '*', 0], tone: 'col' },
              { cell: ['AB', 1, 0], tone: 'ok' },
            ],
            note: '6 + 0 + 4 = 10',
          },
        ],
      },
      claims: [
        {
          kind: 'expr',
          expr: 'AB',
          equals: [
            ['2', '7'],
            ['10', '-8'],
          ],
        },
      ],
    },
    {
      id: 'try-entry',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: '$(AB)_{22}$ kaç?',
      body: '$A$’nın 2. satırı, $B$’nin 2. sütunu.',
      skill: 'product-entry',
      scene: { items: ['A', 'B'] },
      answer: '-8',
      feedbackWrong: '$(3, -1, 4) \\cdot (1, 3, -2)$: üç çarpımı topla.',
      solution: '$3 \\cdot 1 + (-1) \\cdot 3 + 4 \\cdot (-2) = 3 - 3 - 8 = -8$.',
      claims: [{ kind: 'exprEntry', expr: 'AB', row: 2, col: 2, equals: '-8' }],
    },
    {
      id: 'not-commutative',
      kind: 'explain',
      eyebrow: 'Tuzak',
      title: '$AB \\neq BA$',
      body: 'Burada $BA$ 3×3 çıkar, $AB$ ise 2×2: aynı matris olamazlar. Kare matrislerde bile genelde farklıdır: $XY$’nin sol üstü $3$, $YX$’inki $1$. Bu yüzden açılımda {ok}$XY$ ile $YX$ ayrı kalır{/ok}: $(X + Y)^2 = X^2 + XY + YX + Y^2$, $2XY$ yazılamaz.',
      scene: { items: ['X', 'Y'] },
      claims: [
        {
          kind: 'expr',
          expr: 'XY',
          equals: [
            ['3', '2'],
            ['1', '1'],
          ],
        },
        {
          kind: 'expr',
          expr: 'YX',
          equals: [
            ['1', '2'],
            ['1', '3'],
          ],
        },
        {
          kind: 'expr',
          expr: '(X + Y)^2 - (X^2 + 2XY + Y^2)',
          equals: [
            ['-2', '0'],
            ['0', '2'],
          ],
        },
      ],
    },
    {
      id: 'zero-product',
      kind: 'explain',
      eyebrow: 'Tuzak',
      title: '$AB = 0$ ama $A \\neq 0$, $B \\neq 0$',
      body: 'Sayılarda $ab = 0$ ise biri sıfırdır. Matrislerde değil: $ZW = 0$, oysa ikisi de sıfır değil. Aynı sebeple $AB = AC$’den $B = C$ çıkmaz; sadeleştirme ancak $A$ tersinirse yapılır.',
      scene: { items: ['Z', 'W'] },
      claims: [
        {
          kind: 'expr',
          expr: 'ZW',
          equals: [
            ['0', '0'],
            ['0', '0'],
          ],
        },
      ],
    },
    {
      id: 'powers',
      kind: 'explain',
      eyebrow: 'Yöntem',
      title: 'Kuvvetlerde kalıp ara',
      body: '$A^n$ yalnız kare matriste tanımlı. Büyük $n$ için birkaç kuvvet hesapla, kalıbı gör: $J^2$’nin sağ üstü $2$, $J^3$’ünki $3$. Kalıp: {ok}$J^n$’in sağ üstü $n$, köşegeni hep $1$ olur{/ok}.',
      scene: { items: ['J'] },
      beat: {
        kind: 'equation',
        lines: [
          'J^2 = \\begin{bmatrix} 1 & 2 \\\\ 0 & 1 \\end{bmatrix}',
          'J^3 = \\begin{bmatrix} 1 & 3 \\\\ 0 & 1 \\end{bmatrix}',
        ],
      },
      claims: [
        {
          kind: 'expr',
          expr: 'J^2',
          equals: [
            ['1', '2'],
            ['0', '1'],
          ],
        },
        {
          kind: 'expr',
          expr: 'J^3',
          equals: [
            ['1', '3'],
            ['0', '1'],
          ],
        },
      ],
    },
    {
      id: 'try-power',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '$J^{10}$’un 1. satır 2. sütun elemanı kaçtır?',
      skill: 'power-pattern',
      scene: { items: ['J'] },
      options: [
        {
          key: 'a',
          content: [text('$1$')],
          errorType: 'entrywise-power',
          feedback:
            'Matrisin kuvveti elemanların kuvveti değildir: $1^{10} = 1$ ama $J^{10}$ öyle hesaplanmaz.',
        },
        { key: 'b', content: [text('$10$')] },
        {
          key: 'c',
          content: [text('$1024$')],
          errorType: 'doubling-guess',
          feedback: 'Her çarpımda sağ üst $1$ artar, ikiye katlanmaz.',
        },
        {
          key: 'd',
          content: [text('$9$')],
          errorType: 'off-by-one',
          feedback: '$J^2$’de $2$, $J^3$’te $3$: üs ile aynı sayı.',
        },
        {
          key: 'e',
          content: [text('$11$')],
          errorType: 'off-by-one',
          feedback: '$J^1$’in sağ üstü $1$, $J^2$’ninki $2$: üs ile aynı sayı.',
        },
      ],
      answer: 'b',
      solution: '$J^n = \\begin{bmatrix} 1 & n \\\\ 0 & 1 \\end{bmatrix}$, $n = 10$.',
      claims: [{ kind: 'exprEntry', expr: 'J^{10}', row: 1, col: 2, equals: '10' }],
    },
    {
      id: 'exam-entry',
      kind: 'choice',
      eyebrow: 'Sınav tipi',
      title: '$AB$ çarpımının 2. satır 3. sütun elemanı kaçtır?',
      body: 'Bütün çarpımı hesaplama: tek satır, tek sütun yeter.',
      skill: 'product-entry',
      scene: { items: ['U', 'V'] },
      options: [
        {
          key: 'a',
          content: [text('$8$')],
          errorType: 'wrong-column',
          feedback: 'Bu $B$’nin 2. sütunuyla çarpım. 3. sütun $(2, 1, 0)$.',
        },
        {
          key: 'b',
          content: [text('$-6$')],
          errorType: 'swapped-indices',
          feedback: 'Bu $(AB)_{32}$: önce satır ($A$’dan), sonra sütun ($B$’den).',
        },
        { key: 'c', content: [text('$4$')] },
        {
          key: 'd',
          content: [text('$1$')],
          errorType: 'entrywise-product',
          feedback:
            'Çarpım eleman eleman değildir: $a_{23} \\cdot b_{23}$ değil, satır ile sütunun iç çarpımı.',
        },
        {
          key: 'e',
          content: [text('$12$')],
          errorType: 'wrong-row',
          feedback: 'Bu $(AB)_{33}$. $A$’nın 2. satırı $(0, 4, 1)$.',
        },
      ],
      answer: 'c',
      solution: '$(0, 4, 1) \\cdot (2, 1, 0) = 0 + 4 + 0 = 4$.',
      claims: [
        { kind: 'exprEntry', expr: 'UV', row: 2, col: 3, equals: '4', answer: true },
        { kind: 'exprEntry', expr: 'UV', row: 2, col: 2, equals: '8' },
        { kind: 'exprEntry', expr: 'UV', row: 3, col: 2, equals: '-6' },
        { kind: 'exprEntry', expr: 'UV', row: 3, col: 3, equals: '12' },
      ],
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'Matris çarpımı',
      points: [
        '$(AB)_{ij}$ = $A$’nın $i.$ satırı · $B$’nin $j.$ sütunu.',
        '(m×n)(n×p) = m×p; içteki boyutlar eşit değilse çarpım tanımsız.',
        '$AB \\neq BA$ genelde; $(A + B)^2 = A^2 + AB + BA + B^2$.',
        '$AB = 0$ iken $A$ ve $B$ sıfır olmayabilir; $AB = AC$’den $B = C$ çıkmaz.',
        'Büyük kuvvetlerde ilk birkaç kuvveti hesapla, kalıbı bul.',
      ],
    },
  ],
}

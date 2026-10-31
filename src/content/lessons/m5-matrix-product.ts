import { text } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

const m = (label: string, rows: readonly (readonly string[])[]): MatrixBlock => ({
  kind: 'matrix',
  delimiter: 'brackets',
  rows,
  label,
})

const unknown2 = [
  ['?', '?'],
  ['?', '?'],
] as const

/**
 * M5: the product row by column, sizes, non-commutativity, zero divisors, powers.
 *
 * Written in the old app's rhythm (docs/research/original-lessons-vs-ours.md): one idea per step, a
 * question before the rule, the learner watches one entry being made and then makes the next ones, the
 * product matrix fills cell by cell and stays on the stage, and every answer replays its working.
 */
export const m5MatrixProduct: Lesson = {
  id: 'm5-matrix-product',
  node: 'M5',
  title: 'Matris çarpımı ve kuvvetler',
  matrices: {
    A: m('A =', [
      ['2', '1'],
      ['3', '-1'],
    ]),
    B: m('B =', [
      ['1', '4'],
      ['2', '0'],
    ]),
    // AB = [4 8; 1 12], filled one entry per step.
    P0: m('AB =', unknown2),
    P1: m('AB =', [
      ['4', '?'],
      ['?', '?'],
    ]),
    P2: m('AB =', [
      ['4', '8'],
      ['?', '?'],
    ]),
    P3: m('AB =', [
      ['4', '8'],
      ['1', '?'],
    ]),
    // BA = [14 −3; 4 2].
    Q0: m('BA =', unknown2),
    Q1: m('BA =', [
      ['14', '?'],
      ['?', '?'],
    ]),
    // Sizes: (2×3)(3×2) = 2×2.
    C: m('C =', [
      ['1', '2', '0'],
      ['3', '-1', '4'],
    ]),
    D: m('D =', [
      ['2', '1'],
      ['0', '3'],
      ['1', '-2'],
    ]),
    R0: m('CD =', unknown2),
    R1: m('CD =', [
      ['2', '7'],
      ['10', '?'],
    ]),
    // Zero divisors.
    Z: m('Z =', [
      ['1', '1'],
      ['1', '1'],
    ]),
    W: m('W =', [
      ['1', '-1'],
      ['-1', '1'],
    ]),
    ZW: m('ZW =', unknown2),
    // Powers.
    J: m('J =', [
      ['1', '1'],
      ['0', '1'],
    ]),
    J2: m('J² =', [
      ['1', '?'],
      ['0', '1'],
    ]),
    // Exam type: one entry of a 3×3 product.
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
      id: 'hook',
      kind: 'explain',
      eyebrow: 'Soru',
      title: 'İki matris nasıl çarpılır?',
      body: 'Sonuçtaki her kutu tek bir sayı. O sayı $A$ ile $B$’nin hangi sayılarından geliyor?',
      scene: { items: ['A', '·', 'B', '=', 'P0'], marks: [{ cell: ['P0', 0, 0], tone: 'ok' }] },
    },
    {
      id: 'row-by-column',
      kind: 'explain',
      eyebrow: 'Sezgi',
      title: 'Satır, sütunla buluşur',
      body: '$A$’nın {row}1. satırı{/row} ile $B$’nin {col}1. sütunu{/col}: eş sayıları çarp, sonra topla.',
      scene: { items: ['A', '·', 'B', '=', 'P0'], marks: [{ cell: ['P0', 0, 0], tone: 'ok' }] },
      beat: { kind: 'product', left: 'A', right: 'B', into: 'P0', cells: [[0, 0]] },
      claims: [{ kind: 'exprEntry', expr: 'AB', row: 1, col: 1, equals: '4' }],
    },
    {
      id: 'try-top-right',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: 'Sağ üst kutu kaç?',
      skill: 'product-entry',
      scene: { items: ['A', '·', 'B', '=', 'P1'], marks: [{ cell: ['P1', 0, 1], tone: 'ok' }] },
      options: [
        {
          key: 'a',
          content: [text('$4$')],
          errorType: 'wrong-column',
          feedback: 'Bu yine 1. sütun. Sağ üst için $B$’nin 2. sütunu: $(4, 0)$.',
        },
        { key: 'b', content: [text('$8$')] },
        {
          key: 'c',
          content: [text('$12$')],
          errorType: 'wrong-row',
          feedback: 'Bu $A$’nın 2. satırıyla. Üst satır için 1. satır: $(2, 1)$.',
        },
      ],
      answer: 'b',
      reveal: { kind: 'product', left: 'A', right: 'B', into: 'P1', cells: [[0, 1]] },
      solution: '1. satır $(2, 1)$, 2. sütun $(4, 0)$: $2 \\cdot 4 + 1 \\cdot 0 = 8$.',
      claims: [
        { kind: 'exprEntry', expr: 'AB', row: 1, col: 2, equals: '8', answer: true },
        { kind: 'exprEntry', expr: 'AB', row: 1, col: 1, equals: '4' },
        { kind: 'exprEntry', expr: 'AB', row: 2, col: 2, equals: '12' },
      ],
    },
    {
      id: 'try-bottom-left',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: 'Sol alt kutu kaç?',
      skill: 'product-entry',
      scene: { items: ['A', '·', 'B', '=', 'P2'], marks: [{ cell: ['P2', 1, 0], tone: 'ok' }] },
      answer: '1',
      feedbackWrong: '$A$’nın 2. satırı $(3, -1)$, $B$’nin 1. sütunu $(1, 2)$. İşarete dikkat.',
      reveal: { kind: 'product', left: 'A', right: 'B', into: 'P2', cells: [[1, 0]] },
      solution: '$3 \\cdot 1 + (-1) \\cdot 2 = 3 - 2 = 1$.',
      claims: [{ kind: 'exprEntry', expr: 'AB', row: 2, col: 1, equals: '1' }],
    },
    {
      id: 'rule',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Satır numarası $A$’dan, sütun numarası $B$’den',
      body: '$AB$’nin $i.$ satır $j.$ sütunu: $A$’nın {row}$i.$ satırı{/row} ile $B$’nin {col}$j.$ sütunu{/col}. Son kutu da böyle.',
      scene: { items: ['A', '·', 'B', '=', 'P3'] },
      beat: { kind: 'product', left: 'A', right: 'B', into: 'P3', cells: [[1, 1]] },
      claims: [
        {
          kind: 'expr',
          expr: 'AB',
          equals: [
            ['4', '8'],
            ['1', '12'],
          ],
        },
      ],
    },
    {
      id: 'sizes',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'İçteki sayılar eşit olmalı',
      body: '{row}2×3{/row} çarpı {col}3×2{/col}: satırda 3, sütunda 3 sayı var, eşleşir. Sonuç {ok}2×2{/ok}: dıştaki sayılar.',
      scene: { items: ['C', '·', 'D', '=', 'R0'] },
      beat: { kind: 'product', left: 'C', right: 'D', into: 'R0', cells: [[0, 0]] },
      claims: [{ kind: 'exprEntry', expr: 'CD', row: 1, col: 1, equals: '2' }],
    },
    {
      id: 'try-entry',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: 'Son kutu kaç?',
      body: 'Üç çarpım, sonra topla.',
      skill: 'product-entry',
      scene: { items: ['C', '·', 'D', '=', 'R1'], marks: [{ cell: ['R1', 1, 1], tone: 'ok' }] },
      answer: '-8',
      feedbackWrong: '$(3, -1, 4)$ ile $(1, 3, -2)$: üç çarpımı topla.',
      reveal: { kind: 'product', left: 'C', right: 'D', into: 'R1', cells: [[1, 1]] },
      solution: '$3 \\cdot 1 + (-1) \\cdot 3 + 4 \\cdot (-2) = 3 - 3 - 8 = -8$.',
      claims: [
        { kind: 'exprEntry', expr: 'CD', row: 2, col: 2, equals: '-8', answer: true },
        { kind: 'exprEntry', expr: 'CD', row: 1, col: 2, equals: '7' },
        { kind: 'exprEntry', expr: 'CD', row: 2, col: 1, equals: '10' },
      ],
    },
    {
      id: 'try-size',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '$A$ 3×2, $B$ 2×4. $AB$ kaça kaç?',
      skill: 'product-size',
      options: [
        { key: 'a', content: [text('3×4')] },
        {
          key: 'b',
          content: [text('2×2')],
          errorType: 'kept-inner',
          feedback: 'İçteki sayılar yalnız eşleşmeyi kontrol eder. Sonuçta dıştakiler kalır: 3 ve 4.',
        },
        {
          key: 'c',
          content: [text('Tanımsız')],
          errorType: 'size-rule-reversed',
          feedback: 'İçteki 2 ile 2 eşit, çarpım tanımlı. Sonuç dıştaki sayılar: 3×4.',
        },
        {
          key: 'd',
          content: [text('4×3')],
          errorType: 'swapped-size',
          feedback: 'Satır sayısı $A$’dan (3), sütun sayısı $B$’den (4) gelir: 3×4.',
        },
      ],
      answer: 'a',
      reveal: { kind: 'equation', lines: ['(3 \\times 2)(2 \\times 4)', '= 3 \\times 4'] },
      solution: '(3×{row}2{/row})({col}2{/col}×4): içteki 2’ler eşit, sonuç 3×4.',
    },
    {
      id: 'not-commutative',
      kind: 'explain',
      eyebrow: 'Tuzak',
      title: 'Sırayı çevir: $BA$ başka çıkar',
      body: 'Şimdi satırlar $B$’den gelir. $BA$’nın sol üstü {ok}14{/ok}, $AB$’ninki 4. Sıra önemli.',
      scene: { items: ['B', '·', 'A', '=', 'Q0'] },
      beat: { kind: 'product', left: 'B', right: 'A', into: 'Q0', cells: [[0, 0]] },
      claims: [
        { kind: 'exprEntry', expr: 'BA', row: 1, col: 1, equals: '14' },
        { kind: 'exprEntry', expr: 'AB', row: 1, col: 1, equals: '4' },
      ],
    },
    {
      id: 'try-ba',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: '$BA$’nın sağ üst kutusu kaç?',
      skill: 'product-entry',
      scene: { items: ['B', '·', 'A', '=', 'Q1'], marks: [{ cell: ['Q1', 0, 1], tone: 'ok' }] },
      answer: '-3',
      feedbackWrong: '$B$’nin 1. satırı $(1, 4)$, $A$’nın 2. sütunu $(1, -1)$.',
      reveal: { kind: 'product', left: 'B', right: 'A', into: 'Q1', cells: [[0, 1]] },
      solution: '$1 \\cdot 1 + 4 \\cdot (-1) = 1 - 4 = -3$.',
      claims: [{ kind: 'exprEntry', expr: 'BA', row: 1, col: 2, equals: '-3' }],
    },
    {
      id: 'square-expansion',
      kind: 'explain',
      eyebrow: 'Tuzak',
      title: '$(A + B)^2$’de $2AB$ yok',
      body: 'Dağıtınca $AB$ ile $BA$ ayrı kalır. Eşit olmadıkları için birleşmezler.',
      beat: {
        kind: 'equation',
        lines: ['(A + B)^2 = (A + B)(A + B)', '= A^2 + AB + BA + B^2'],
      },
      claims: [
        {
          kind: 'expr',
          expr: '(A + B)^2 - (A^2 + AB + BA + B^2)',
          equals: [
            ['0', '0'],
            ['0', '0'],
          ],
        },
      ],
    },
    {
      id: 'try-square',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '$(A - B)^2$ neye eşit?',
      skill: 'product-expansion',
      options: [
        {
          key: 'a',
          content: [text('$A^2 - 2AB + B^2$')],
          errorType: 'assumed-commute',
          feedback: 'Bu $AB = BA$ varsayar. Genelde $AB$ ile $BA$ ayrı kalır.',
        },
        { key: 'b', content: [text('$A^2 - AB - BA + B^2$')] },
        {
          key: 'c',
          content: [text('$A^2 - B^2$')],
          errorType: 'difference-of-squares',
          feedback: 'Dağıtınca dört çarpım çıkar; ortadaki $-AB$ ve $-BA$ birbirini götürmez.',
        },
      ],
      answer: 'b',
      reveal: {
        kind: 'equation',
        lines: ['(A - B)(A - B)', '= A^2 - AB - BA + B^2'],
      },
      solution: 'Dört çarpım: $AA - AB - BA + BB$.',
      claims: [{ kind: 'optionExpr', expr: '(A - B)^2' }],
    },
    {
      id: 'zero-product',
      kind: 'explain',
      eyebrow: 'Tuzak',
      title: 'Sıfır olmayan iki matrisin çarpımı sıfır olabilir',
      body: 'Sayılarda $ab = 0$ ise biri sıfırdır. Matrislerde değil: izle.',
      scene: { items: ['Z', '·', 'W', '=', 'ZW'] },
      beat: {
        kind: 'product',
        left: 'Z',
        right: 'W',
        into: 'ZW',
        cells: [
          [0, 0],
          [0, 1],
          [1, 0],
          [1, 1],
        ],
      },
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
      id: 'cancel',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '$AB = AC$ ise $B = C$ mi?',
      skill: 'product-cancel',
      options: [
        {
          key: 'a',
          content: [text('Her zaman')],
          errorType: 'cancelled-like-numbers',
          feedback: 'Sayılardaki gibi sadeleştirdin. $ZW = Z \\cdot 0$ ama $W \\neq 0$.',
        },
        { key: 'b', content: [text('Yalnız $A$’nın tersi varsa')] },
        {
          key: 'c',
          content: [text('Hiçbir zaman')],
          errorType: 'never-cancel',
          feedback: '$A$’nın tersi varsa iki yanı soldan $A^{-1}$ ile çarparsın: $B = C$.',
        },
      ],
      answer: 'b',
      reveal: { kind: 'equation', lines: ['ZW = 0 = Z \\cdot 0', '\\text{ama } W \\neq 0'] },
      solution:
        'Sadeleştirmek, soldan $A^{-1}$ ile çarpmaktır; ters yoksa yapılamaz. $ZW = Z \\cdot 0$, oysa $W \\neq 0$.',
    },
    {
      id: 'powers',
      kind: 'explain',
      eyebrow: 'Yöntem',
      title: 'Kuvvetlerde kalıp ara',
      body: '$J^2$’nin sağ üstü {ok}2{/ok}. Bir kez daha çarpınca $J^3$’ünki 3 olur: her çarpım 1 ekler.',
      scene: { items: ['J', '·', 'J', '=', 'J2'] },
      beat: { kind: 'product', left: 'J', right: 'J', into: 'J2', cells: [[0, 1]] },
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
      title: '$J^{10}$’un sağ üstü kaç?',
      skill: 'power-pattern',
      scene: { items: ['J'] },
      options: [
        {
          key: 'a',
          content: [text('$1$')],
          errorType: 'entrywise-power',
          feedback: 'Matrisin kuvveti, elemanların kuvveti değildir: $1^{10}$ diye hesaplanmaz.',
        },
        { key: 'b', content: [text('$10$')] },
        {
          key: 'c',
          content: [text('$1024$')],
          errorType: 'doubling-guess',
          feedback: 'Her çarpımda sağ üst 1 artar, ikiye katlanmaz.',
        },
        {
          key: 'd',
          content: [text('$9$')],
          errorType: 'off-by-one',
          feedback: '$J^2$’de 2, $J^3$’te 3: üs ile aynı sayı.',
        },
      ],
      answer: 'b',
      reveal: { kind: 'equation', lines: ['J^2 \\to 2,\\; J^3 \\to 3,\\; \\dots', 'J^{10} \\to 10'] },
      solution: '$J^n$’in sağ üstü $n$: $J^{10}$’unki 10.',
      claims: [{ kind: 'exprEntry', expr: 'J^{10}', row: 1, col: 2, equals: '10' }],
    },
    {
      id: 'exam-entry',
      kind: 'choice',
      eyebrow: 'Sınav tipi',
      title: '$AB$’nin 2. satır 3. sütunu kaç?',
      body: 'Bütün çarpımı hesaplama: tek satır, tek sütun yeter.',
      skill: 'product-entry',
      scene: {
        items: ['U', 'V'],
        marks: [
          { cell: ['U', 1, '*'], tone: 'row' },
          { cell: ['V', '*', 2], tone: 'col' },
        ],
      },
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
          feedback: 'Aynı yerdeki iki sayıyı çarptın. Satırın tamamı, sütunun tamamıyla eşleşir.',
        },
        {
          key: 'e',
          content: [text('$12$')],
          errorType: 'wrong-row',
          feedback: 'Bu $(AB)_{33}$. $A$’nın 2. satırı $(0, 4, 1)$.',
        },
      ],
      answer: 'c',
      reveal: { kind: 'product', left: 'U', right: 'V', cells: [[1, 2]] },
      solution: '$(0, 4, 1)$ ile $(2, 1, 0)$: $0 + 4 + 0 = 4$.',
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
      title: 'Sınavda tek kutu sorulur',
      points: [
        '$AB$’nin $i, j$ kutusu: $A$’nın $i.$ satırı ile $B$’nin $j.$ sütunu, çarp ve topla.',
        '(m×n)(n×p) = m×p. İçteki sayılar eşit değilse çarpım yok.',
        'Genelde $AB \\neq BA$; $(A + B)^2$’de $2AB$ yok.',
        '$AB = 0$ olabilir, $A$ ve $B$ sıfır değilken.',
      ],
    },
  ],
}

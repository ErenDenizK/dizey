import { text } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

const m = (label: string, rows: readonly (readonly string[])[], bars = false): MatrixBlock => ({
  kind: 'matrix',
  delimiter: bars ? 'bars' : 'brackets',
  rows,
  label,
})

/**
 * D3: how row operations change det, zero and proportional rows, |kA| = kⁿ|A|, |Aᵀ|, |AB|, |A⁻¹|,
 * det by reduction to triangular form, and the property-only exam items.
 * Matrices whose names start with "x" are worked instances behind letter-only steps; they are not shown.
 */
export const d3DeterminantProperties: Lesson = {
  id: 'd3-determinant-properties',
  node: 'D3',
  title: 'Determinant özellikleri: hesaplamadan bulmak',
  matrices: {
    A: m(
      'A =',
      [
        ['2', '1', '0'],
        ['1', '3', '1'],
        ['0', '1', '2'],
      ],
      true,
    ),
    Swap: m(
      '',
      [
        ['1', '3', '1'],
        ['2', '1', '0'],
        ['0', '1', '2'],
      ],
      true,
    ),
    Scale: m(
      '',
      [
        ['2', '1', '0'],
        ['3', '9', '3'],
        ['0', '1', '2'],
      ],
      true,
    ),
    Add: m(
      '',
      [
        ['2', '1', '0'],
        ['1', '3', '1'],
        ['8', '5', '2'],
      ],
      true,
    ),
    Prop: m(
      '',
      [
        ['1', '2', '3'],
        ['2', '4', '6'],
        ['0', '1', '5'],
      ],
      true,
    ),
    Practice: m(
      '',
      [
        ['0', '1', '2'],
        ['2', '6', '2'],
        ['2', '1', '0'],
      ],
      true,
    ),
    B: m(
      'B =',
      [
        ['1', '2'],
        ['3', '1'],
      ],
      true,
    ),
    R: m(
      'C =',
      [
        ['1', '2', '1'],
        ['2', '5', '3'],
        ['-1', '0', '4'],
      ],
      true,
    ),
    Letters: m(
      '|A| =',
      [
        ['a', 'b', 'c'],
        ['d', 'e', 'f'],
        ['g', 'h', 'i'],
      ],
      true,
    ),
    Derived: m(
      '',
      [
        ['2d', '2e', '2f'],
        ['a', 'b', 'c'],
        ['g-3a', 'h-3b', 'i-3c'],
      ],
      true,
    ),
    xLetters: m('', [
      ['1', '0', '2'],
      ['0', '1', '1'],
      ['3', '1', '2'],
    ]),
    xDerived: m('', [
      ['0', '2', '2'],
      ['1', '0', '2'],
      ['0', '1', '-4'],
    ]),
    xA: m('', [
      ['1', '1', '0'],
      ['0', '2', '0'],
      ['1', '0', '1'],
    ]),
    xB: m('', [
      ['1', '0', '0'],
      ['0', '-3', '0'],
      ['0', '0', '1'],
    ]),
  },
  steps: [
    {
      id: 'hook',
      kind: 'explain',
      eyebrow: 'Soru',
      title: 'Sınav sorularının çoğu hesap istemez',
      body: 'Geçmiş vizelerde en çok çıkan konu bu: $|A|$ verilir, satırları değiştirilmiş, çarpılmış ya da başka matrislerle çarpılmış bir matrisin determinantı sorulur. Hepsi birkaç kuralla, hesapsız çözülür.',
      scene: { items: ['A', '=', 'result'], result: '8' },
      claims: [{ kind: 'det', matrix: 'A', equals: '8' }],
    },
    {
      id: 'swap',
      kind: 'explain',
      eyebrow: 'Kural 1',
      title: 'İki satırın yeri değişirse işaret değişir',
      body: '{row}1. ve 2. satır{/row} yer değiştirdi: $|A| = 8$ iken yeni determinant $-8$. Sütunlar için de aynı.',
      scene: { items: ['Swap', '=', 'result'], result: '−8' },
      beat: {
        kind: 'frames',
        frames: [
          {
            clear: true,
            marks: [
              { cell: ['Swap', 0, '*'], tone: 'row' },
              { cell: ['Swap', 1, '*'], tone: 'row' },
            ],
            note: 'R₁ ↔ R₂',
          },
        ],
      },
      claims: [{ kind: 'det', matrix: 'Swap', equals: '-8' }],
    },
    {
      id: 'scale',
      kind: 'explain',
      eyebrow: 'Kural 2',
      title: 'Bir satır $k$ ile çarpılırsa determinant da $k$ ile çarpılır',
      body: '{row}2. satır{/row} $3$ ile çarpıldı: $3 \\cdot 8 = 24$. Tersinden okursak: bir satırın ortak çarpanı determinantın dışına çıkar.',
      scene: { items: ['Scale', '=', 'result'], result: '24' },
      beat: {
        kind: 'frames',
        frames: [{ clear: true, marks: [{ cell: ['Scale', 1, '*'], tone: 'row' }], note: '3 · R₂' }],
      },
      claims: [{ kind: 'det', matrix: 'Scale', equals: '24' }],
    },
    {
      id: 'add',
      kind: 'explain',
      eyebrow: 'Kural 3',
      title: 'Bir satıra başka satırın katını eklemek determinantı değiştirmez',
      body: '{row}3. satıra{/row} 1. satırın $4$ katı eklendi: determinant yine $8$. Gauss eliminasyonunun asıl adımı bu olduğu için en çok bu kural işe yarar.',
      scene: { items: ['Add', '=', 'result'], result: '8' },
      beat: {
        kind: 'frames',
        frames: [{ clear: true, marks: [{ cell: ['Add', 2, '*'], tone: 'row' }], note: 'R₃ + 4 · R₁' }],
      },
      claims: [{ kind: 'det', matrix: 'Add', equals: '8' }],
    },
    {
      id: 'zero',
      kind: 'explain',
      eyebrow: 'Kural 4',
      title: 'Sıfır satır ya da orantılı iki satır varsa determinant $0$',
      body: '{row}2. satır{/row}, 1. satırın $2$ katı. 2. satırdan 1. satırın 2 katını çıkar (Kural 3, determinant değişmez): sıfır satır kalır, determinant $0$.',
      scene: { items: ['Prop', '=', 'result'], result: '0' },
      beat: {
        kind: 'frames',
        frames: [
          { clear: true, marks: [{ cell: ['Prop', 0, '*'], tone: 'row' }] },
          { marks: [{ cell: ['Prop', 1, '*'], tone: 'row' }], note: 'R₂ = 2 · R₁' },
        ],
      },
      claims: [{ kind: 'det', matrix: 'Prop', equals: '0' }],
    },
    {
      id: 'try-ops',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '$|A| = 8$. Bu determinant kaç?',
      body: '$A$’nın 1. ve 3. satırları yer değiştirdi, ardından ortadaki satır $2$ ile çarpıldı.',
      skill: 'det-row-operations',
      scene: { items: ['Practice', '=', 'result'], result: '?' },
      options: [
        {
          key: 'a',
          content: [text('$16$')],
          errorType: 'lost-sign-on-swap',
          feedback: 'Yer değiştirme işareti çevirir: $(-1) \\cdot 2 \\cdot 8$.',
        },
        { key: 'b', content: [text('$-16$')] },
        {
          key: 'c',
          content: [text('$-8$')],
          errorType: 'missed-row-factor',
          feedback: 'Ortadaki satır $2$ ile çarpıldı; determinant da $2$ ile çarpılır.',
        },
        {
          key: 'd',
          content: [text('$-64$')],
          errorType: 'k-power-n-for-one-row',
          feedback:
            '$k^n$ bütün matris $k$ ile çarpılınca gelir. Burada yalnız bir satır çarpıldı: çarpan $2$.',
        },
      ],
      answer: 'b',
      reveal: { kind: 'equation', lines: ['(-1) \\cdot 2 \\cdot |A|', '= (-1) \\cdot 2 \\cdot 8 = -16'] },
      solution:
        'Yer değiştirme: $-1$. Bir satırı $2$ ile çarpmak: $2$. Sonuç $(-1) \\cdot 2 \\cdot 8 = -16$.',
      claims: [{ kind: 'det', matrix: 'Practice', equals: '-16' }],
    },
    {
      id: 'scalar-matrix',
      kind: 'explain',
      eyebrow: 'Kural 5',
      title: '$|kA| = k^n |A|$',
      body: '$kA$’da {row}her satır{/row} $k$ ile çarpılır; $n$ satır varsa $k$ çarpanı $n$ kez dışarı çıkar. 3×3 için $|2A| = 2^3 \\cdot 8 = 64$, $2 \\cdot 8$ değil.',
      scene: { items: ['A'] },
      claims: [{ kind: 'detProduct', scalar: '2', factors: [{ matrix: 'A' }], equals: '64' }],
    },
    {
      id: 'try-scalar',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: '$|3B|$ kaç?',
      body: '$|B| = 1 \\cdot 1 - 2 \\cdot 3 = -5$.',
      skill: 'det-scalar-power',
      scene: { items: ['B'] },
      answer: '-45',
      feedbackWrong: '$B$ 2×2: $|3B| = 3^2 |B| = 9 \\cdot (-5)$.',
      solution: '$|3B| = 3^2 \\cdot (-5) = -45$.',
      claims: [
        { kind: 'det', matrix: 'B', equals: '-5' },
        { kind: 'detProduct', scalar: '3', factors: [{ matrix: 'B' }], equals: '-45', answer: true },
      ],
    },
    {
      id: 'product-rules',
      kind: 'explain',
      eyebrow: 'Kural 6',
      title: '$|A^T| = |A|$, $|AB| = |A||B|$, $|A^{-1}| = \\frac{1}{|A|}$',
      body: 'Transpoz determinantı değiştirmez. Çarpımın determinantı determinantların çarpımıdır; sıra önemli değil. $AA^{-1} = I$ ve $|I| = 1$ olduğundan $|A^{-1}| = \\frac{1}{|A|}$. Örnek: $|A^{-1}| = \\frac{1}{8}$, $|A^TA| = 64$.',
      scene: { items: ['A'] },
      claims: [
        { kind: 'detProduct', factors: [{ matrix: 'A', transpose: true }], equals: '8' },
        { kind: 'detProduct', factors: [{ matrix: 'A', power: -1 }], equals: '1/8' },
        { kind: 'detProduct', factors: [{ matrix: 'A', transpose: true }, { matrix: 'A' }], equals: '64' },
      ],
    },
    {
      id: 'triangular',
      kind: 'explain',
      eyebrow: 'Yöntem',
      title: 'Satır işlemleriyle üçgen yap, köşegeni çarp',
      body: 'Yalnız Kural 3 kullanılırsa determinant hiç değişmez. $R_2 - 2R_1$, $R_3 + R_1$, $R_3 - 2R_2$: köşegen $1, 1, 3$ kalır. $|C| = 1 \\cdot 1 \\cdot 3 = 3$. Büyük matrislerde en hızlı yol bu.',
      scene: { items: ['R', '=', 'result'], result: '?' },
      beat: {
        kind: 'equation',
        lines: [
          'R_2 - 2R_1:\\ (0, 1, 1)',
          'R_3 + R_1:\\ (0, 2, 5)',
          'R_3 - 2R_2:\\ (0, 0, 3)',
          '|C| = 1 \\cdot 1 \\cdot 3 = 3',
        ],
      },
      claims: [{ kind: 'det', matrix: 'R', equals: '3' }],
    },
    {
      id: 'exam-letters',
      kind: 'choice',
      eyebrow: 'Sınav tipi',
      title: '$|A| = -5$ ise bu determinant kaçtır?',
      skill: 'det-row-operations',
      scene: { items: ['Letters', 'Derived'] },
      options: [
        {
          key: 'a',
          content: [text('$-10$')],
          errorType: 'lost-sign-on-swap',
          feedback: '1. ve 2. satır yer değiştirmiş: bir işaret daha. $2 \\cdot (-1) \\cdot (-5) = 10$.',
        },
        {
          key: 'b',
          content: [text('$-30$')],
          errorType: 'row-addition-changes-det',
          feedback: '$R_3 - 3R_1$ determinantı değiştirmez; $3$ çarpan olarak gelmez.',
        },
        { key: 'c', content: [text('$10$')] },
        {
          key: 'd',
          content: [text('$-40$')],
          errorType: 'k-power-n-for-one-row',
          feedback: 'Yalnız bir satır $2$ ile çarpıldı, çarpan $2$; $2^3$ değil.',
        },
        {
          key: 'e',
          content: [text('$5$')],
          errorType: 'missed-row-factor',
          feedback: '1. satırdaki ortak $2$ dışarı çıkar: sonuç $2 \\cdot 5$.',
        },
      ],
      answer: 'c',
      reveal: {
        kind: 'equation',
        lines: [
          '\\text{1. satırdan } 2 \\text{ çıkar}',
          'R_1 \\leftrightarrow R_2: \\ -1',
          'R_3 - 3R_1: \\ \\text{değişmez}',
          '2 \\cdot (-1) \\cdot (-5) = 10',
        ],
      },
      solution:
        '1. satırdan $2$ çıkar. Kalan matriste 1. ve 2. satır yer değiştirmiş: $-1$. 3. satır $R_3 - 3R_1$: değişmez. Sonuç $2 \\cdot (-1) \\cdot (-5) = 10$.',
      claims: [
        { kind: 'det', matrix: 'xLetters', equals: '-5' },
        { kind: 'det', matrix: 'xDerived', equals: '10', answer: true },
      ],
    },
    {
      id: 'exam-product',
      kind: 'choice',
      eyebrow: 'Sınav tipi',
      title: '$A$, $B$ 3×3, $|A| = 2$, $|B| = -3$. $|2A^TB^{-1}A^2|$ kaçtır?',
      skill: 'det-product-rules',
      options: [
        { key: 'a', content: [text('$-\\frac{64}{3}$')] },
        {
          key: 'b',
          content: [text('$-\\frac{16}{3}$')],
          errorType: 'k-instead-of-k-power-n',
          feedback: '$|2M| = 2^3|M|$, $2|M|$ değil.',
        },
        {
          key: 'c',
          content: [text('$\\frac{64}{3}$')],
          errorType: 'lost-sign',
          feedback: '$|B^{-1}| = \\frac{1}{-3}$, negatif.',
        },
        {
          key: 'd',
          content: [text('$-192$')],
          errorType: 'inverse-as-same',
          feedback: '$|B^{-1}| = \\frac{1}{|B|}$; $|B|$ ile çarpılmaz, bölünür.',
        },
        {
          key: 'e',
          content: [text('$-\\frac{32}{3}$')],
          errorType: 'power-as-once',
          feedback: '$|A^2| = |A|^2 = 4$; $A$ iki kez sayılır.',
        },
      ],
      answer: 'a',
      reveal: {
        kind: 'equation',
        lines: [
          '2^3 \\cdot |A| \\cdot \\frac{1}{|B|} \\cdot |A|^2',
          '= 8 \\cdot 2 \\cdot \\left(-\\frac{1}{3}\\right) \\cdot 4 = -\\frac{64}{3}',
        ],
      },
      solution:
        '$|2M| = 2^3|M|$, $|A^T| = |A| = 2$, $|B^{-1}| = -\\frac{1}{3}$, $|A^2| = 4$. Çarpım: $8 \\cdot 2 \\cdot (-\\frac{1}{3}) \\cdot 4 = -\\frac{64}{3}$.',
      claims: [
        { kind: 'det', matrix: 'xA', equals: '2' },
        { kind: 'det', matrix: 'xB', equals: '-3' },
        {
          kind: 'detProduct',
          scalar: '2',
          factors: [
            { matrix: 'xA', transpose: true },
            { matrix: 'xB', power: -1 },
            { matrix: 'xA', power: 2 },
          ],
          equals: '-64/3',
          answer: true,
        },
      ],
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'Altı kural, sıfır hesap',
      points: [
        'İki satır yer değiştirir: işaret değişir.',
        'Bir satır $k$ ile çarpılır: determinant $k$ ile çarpılır; ortak çarpan dışarı çıkar.',
        'Bir satıra başka satırın katı eklenir: değişmez.',
        'Sıfır satır ya da orantılı iki satır: $0$.',
        '$|kA| = k^n|A|$; $n$ matrisin boyutu.',
        '$|A^T| = |A|$, $|AB| = |A||B|$, $|A^{-1}| = 1/|A|$. Satır kuralları sütunlar için de geçerli.',
      ],
    },
  ],
}

import { matrix, text } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

const m = (label: string, rows: readonly (readonly string[])[]): MatrixBlock => ({
  kind: 'matrix',
  delimiter: 'brackets',
  rows,
  label,
})

/** M10: the conjugate Ā, the conjugate transpose A*, Hermitian and skew-Hermitian matrices, (AB)* = B*A*. */
export const m10ConjugateHermitian: Lesson = {
  id: 'm10-conjugate-hermitian',
  node: 'M10',
  title: 'Eşlenik ve Hermitian matrisler',
  matrices: {
    A: m('A =', [
      ['1+2i', '3'],
      ['-i', '2-i'],
    ]),
    aC: m('$\\bar{A}$ =', [
      ['1-2i', '3'],
      ['i', '2+i'],
    ]),
    aS: m('$A^*$ =', [
      ['1-2i', 'i'],
      ['3', '2+i'],
    ]),
    B: m('B =', [
      ['2', '1+i'],
      ['3i', '4-i'],
    ]),
    H: m('H =', [
      ['2', '1+i'],
      ['1-i', '-3'],
    ]),
    S: m('S =', [
      ['i', '2+i'],
      ['-2+i', '0'],
    ]),
  },
  steps: [
    {
      id: 'hook',
      kind: 'explain',
      eyebrow: 'Soru',
      title: 'Karmaşık sayılarda transpoz yeter mi?',
      body: 'Elemanlarda $i$ varsa transpozun bir adımı eksik kalır. O adım: eşlenik.',
      scene: { items: ['A'] },
      beat: {
        kind: 'frames',
        frames: [
          {
            clear: true,
            marks: [
              { cell: ['A', 0, 0], tone: 'ok' },
              { cell: ['A', 1, 0], tone: 'ok' },
              { cell: ['A', 1, 1], tone: 'ok' },
            ],
            note: 'i içeren elemanlar',
          },
        ],
      },
    },
    {
      id: 'conjugate',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'Eşlenik: $i$’nin işaretini çevir',
      body: '$a + bi$ olur $a - bi$. {ok}Gerçek elemanlar değişmez{/ok}: $3$ yine $3$.',
      scene: { items: ['A', 'aC'] },
      beat: {
        kind: 'frames',
        frames: [
          {
            clear: true,
            marks: [
              { cell: ['A', 0, 0], tone: 'row' },
              { cell: ['aC', 0, 0], tone: 'ok' },
            ],
            note: '1 + 2i → 1 − 2i',
          },
          {
            clear: true,
            marks: [
              { cell: ['A', 1, 0], tone: 'row' },
              { cell: ['aC', 1, 0], tone: 'ok' },
            ],
            note: '−i → i',
          },
          {
            clear: true,
            marks: [
              { cell: ['A', 0, 1], tone: 'col' },
              { cell: ['aC', 0, 1], tone: 'col' },
            ],
            note: '3 aynen kalır',
          },
        ],
      },
      claims: [
        {
          kind: 'complexDerived',
          of: 'conjugate',
          matrix: 'A',
          equals: [
            ['1-2i', '3'],
            ['i', '2+i'],
          ],
        },
      ],
    },
    {
      id: 'conjugate-transpose',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'Eşlenik transpoz: $A^*$',
      body: 'Önce eşlenik, sonra transpoz: satırlar sütun olur. Gerçek matriste $A^* = A^T$.',
      scene: { items: ['aC', 'aS'] },
      beat: {
        kind: 'frames',
        frames: [
          {
            clear: true,
            marks: [
              { cell: ['aC', 0, '*'], tone: 'row' },
              { cell: ['aS', '*', 0], tone: 'row' },
            ],
            note: '1. satır → 1. sütun',
          },
          {
            clear: true,
            marks: [
              { cell: ['aC', 1, '*'], tone: 'col' },
              { cell: ['aS', '*', 1], tone: 'col' },
            ],
            note: '2. satır → 2. sütun',
          },
        ],
      },
      claims: [
        {
          kind: 'complexDerived',
          of: 'conjugateTranspose',
          matrix: 'A',
          equals: [
            ['1-2i', 'i'],
            ['3', '2+i'],
          ],
        },
      ],
    },
    {
      id: 'try-conjugate',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '$\\overline{4 - 3i}$ hangisi?',
      skill: 'conjugate-transpose',
      options: [
        {
          key: 'a',
          content: [text('$-4 + 3i$')],
          errorType: 'negated-whole',
          feedback: 'Gerçek kısım aynen kalır; yalnız $i$’nin işareti döner.',
        },
        { key: 'b', content: [text('$4 + 3i$')] },
        {
          key: 'c',
          content: [text('$4 - 3i$')],
          errorType: 'no-change',
          feedback: 'İşaret değişmeli: $-3i$ olur $+3i$.',
        },
      ],
      answer: 'b',
      reveal: { kind: 'equation', lines: ['\\overline{4 - 3i} = 4 + 3i'] },
      solution: 'Gerçek kısım $4$ kalır, $-3i$ olur $+3i$.',
    },
    {
      id: 'try-conjugate-transpose',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '$B^*$ hangisidir?',
      skill: 'conjugate-transpose',
      scene: { items: ['B'] },
      options: [
        {
          key: 'a',
          content: [
            matrix([
              ['2', '3i'],
              ['1+i', '4-i'],
            ]),
          ],
          errorType: 'forgot-conjugate',
          feedback: 'Bu yalnız $B^T$. Elemanların eşleniğini de al: $3i \\to -3i$.',
        },
        {
          key: 'b',
          content: [
            matrix([
              ['2', '1-i'],
              ['-3i', '4+i'],
            ]),
          ],
          errorType: 'forgot-transpose',
          feedback: 'Bu yalnız $\\bar{B}$. Bir de transpozunu al: satırlar sütun olur.',
        },
        {
          key: 'c',
          content: [
            matrix([
              ['2', '-3i'],
              ['1-i', '4+i'],
            ]),
          ],
        },
        {
          key: 'd',
          content: [
            matrix([
              ['2', '-3i'],
              ['1+i', '4+i'],
            ]),
          ],
          errorType: 'partial-conjugate',
          feedback: '$1 + i$’nin de eşleniği alınır: $1 - i$.',
        },
      ],
      answer: 'c',
      reveal: {
        kind: 'equation',
        lines: [
          '\\bar{B} = \\begin{bmatrix} 2 & 1-i \\\\ -3i & 4+i \\end{bmatrix}',
          'B^* = \\begin{bmatrix} 2 & -3i \\\\ 1-i & 4+i \\end{bmatrix}',
        ],
      },
      solution: '$\\bar{B}$’nin satırları $(2, 1 - i)$ ve $(-3i, 4 + i)$; transpozu alınınca $B^*$ bulunur.',
      claims: [
        {
          kind: 'complexDerived',
          of: 'conjugateTranspose',
          matrix: 'B',
          equals: [
            ['2', '-3i'],
            ['1-i', '4+i'],
          ],
          answer: true,
        },
      ],
    },
    {
      id: 'hermitian',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'Hermitian: $A^* = A$',
      body: 'Karşılıklı elemanlar birbirinin eşleniği. {ok}Köşegen gerçek{/ok}. $S^* = -S$ ise ters Hermitian.',
      scene: { items: ['H', 'S'] },
      beat: {
        kind: 'frames',
        frames: [
          {
            clear: true,
            marks: [
              { cell: ['H', 0, 1], tone: 'row' },
              { cell: ['H', 1, 0], tone: 'col' },
            ],
            note: '1 + i ve 1 − i',
          },
          {
            clear: true,
            marks: [
              { cell: ['H', 0, 0], tone: 'ok' },
              { cell: ['H', 1, 1], tone: 'ok' },
            ],
            note: 'köşegen gerçek',
          },
        ],
      },
      claims: [
        { kind: 'complexProperty', matrix: 'H', is: 'hermitian' },
        { kind: 'complexProperty', matrix: 'S', is: 'skewHermitian' },
        { kind: 'complexProperty', matrix: 'S', is: 'hermitian', holds: false },
      ],
    },
    {
      id: 'try-hermitian',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: 'Hangisi Hermitian’dır?',
      skill: 'recognize-hermitian',
      options: [
        {
          key: 'a',
          content: [
            matrix([
              ['1', 'i'],
              ['i', '2'],
            ]),
          ],
          errorType: 'symmetric-not-hermitian',
          feedback: 'Simetrik ama Hermitian değil: $a_{21}$, $\\overline{a_{12}} = -i$ olmalıydı.',
        },
        {
          key: 'b',
          content: [
            matrix([
              ['3', '2-i'],
              ['2+i', '0'],
            ]),
          ],
        },
        {
          key: 'c',
          content: [
            matrix([
              ['i', '1'],
              ['1', 'i'],
            ]),
          ],
          errorType: 'imaginary-diagonal',
          feedback: 'Hermitian’ın köşegeni gerçek olmalı; burada köşegende $i$ var.',
        },
        {
          key: 'd',
          content: [
            matrix([
              ['1', '1+i'],
              ['1+i', '1'],
            ]),
          ],
          errorType: 'forgot-conjugate',
          feedback: 'Karşılıklı elemanlar eşit değil, eşlenik olmalı: $1 + i$’nin karşısında $1 - i$.',
        },
      ],
      answer: 'b',
      reveal: {
        kind: 'equation',
        lines: ['\\overline{2 - i} = 2 + i', '\\text{köşegen: } 3, 0 \\text{ gerçek}'],
      },
      solution: 'Köşegen gerçek ($3$ ve $0$), $2 - i$ ile $2 + i$ birbirinin eşleniği: $A^* = A$.',
      claims: [{ kind: 'optionComplexProperty', is: 'hermitian' }],
    },
    {
      id: 'rules',
      kind: 'explain',
      eyebrow: 'Kural',
      title: '$(AB)^* = B^*A^*$',
      body: 'Transpozun kuralları aynen geçerli, {ok}sıra ters döner{/ok}. Tek fark: skalerin de eşleniği alınır.',
      beat: { kind: 'equation', lines: ['(AB)^* = B^*A^*', '(kA)^* = \\bar{k}A^*', '(iA)^* = -iA^*'] },
    },
    {
      id: 'try-det',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: '$|H|$ kaç?',
      body: 'Hermitian ise cevap gerçek sayı çıkar.',
      skill: 'det-2x2',
      scene: { items: ['H'] },
      answer: '-8',
      feedbackWrong: '$(1 + i)(1 - i) = 1 - i^2 = 2$. Sonra $2 \\cdot (-3) - 2$.',
      reveal: {
        kind: 'equation',
        lines: ['|H| = 2 \\cdot (-3) - (1+i)(1-i)', '= -6 - 2 = -8'],
      },
      solution: '$|H| = 2 \\cdot (-3) - (1 + i)(1 - i) = -6 - 2 = -8$.',
      claims: [{ kind: 'complexDet', matrix: 'H', equals: '-8' }],
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'Eşlenik ve Hermitian',
      points: [
        '$\\bar{A}$: her elemanın eşleniği. $A^* = (\\bar{A})^T$.',
        'Hermitian: $A^* = A$, köşegen gerçek. Ters Hermitian: $A^* = -A$, köşegen saf sanal ya da $0$.',
        '$(AB)^* = B^*A^*$, $(kA)^* = \\bar{k}A^*$.',
        'Gerçek matriste $A^* = A^T$: Hermitian, simetrik demektir.',
      ],
    },
  ],
}

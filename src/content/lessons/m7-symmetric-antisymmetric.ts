import { matrix, text } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

const m = (label: string, rows: readonly (readonly string[])[]): MatrixBlock => ({
  kind: 'matrix',
  delimiter: 'brackets',
  rows,
  label,
})

/** M7: symmetric and antisymmetric matrices, A = S + K, and which products keep the class. */
export const m7SymmetricAntisymmetric: Lesson = {
  id: 'm7-symmetric-antisymmetric',
  node: 'M7',
  title: 'Simetrik ve antisimetrik matrisler',
  matrices: {
    S: m('S =', [
      ['1', '2', '3'],
      ['2', '4', '5'],
      ['3', '5', '6'],
    ]),
    K: m('K =', [
      ['0', '2', '-1'],
      ['-2', '0', '3'],
      ['1', '-3', '0'],
    ]),
    P: m('P =', [
      ['2', '5', '1'],
      ['1', '0', '4'],
      ['3', '-2', '7'],
    ]),
    N: m('A =', [
      ['1', '4'],
      ['2', '3'],
    ]),
    sN: m('S =', [
      ['1', '3'],
      ['3', '3'],
    ]),
    kN: m('K =', [
      ['0', '1'],
      ['-1', '0'],
    ]),
    X: m('X =', [
      ['1', '2'],
      ['2', '1'],
    ]),
    Y: m('Y =', [
      ['1', '0'],
      ['0', '2'],
    ]),
    XY0: m('XY =', [
      ['1', '?'],
      ['?', '2'],
    ]),
    xA: m('', [
      ['0', '1', '0'],
      ['-1', '0', '0'],
      ['0', '0', '0'],
    ]),
    xB: m('', [
      ['1', '0', '0'],
      ['0', '1', '0'],
      ['0', '0', '2'],
    ]),
  },
  steps: [
    {
      id: 'hook',
      kind: 'explain',
      eyebrow: 'Soru',
      title: 'Köşegene ayna tutarsan ne görürsün?',
      body: 'Üstteki her sayı, köşegenin altında aynen tekrar ediyor. Bu matrisin adı simetrik.',
      scene: { items: ['S'] },
      beat: {
        kind: 'frames',
        frames: [
          {
            clear: true,
            marks: [
              { cell: ['S', 0, 1], tone: 'row' },
              { cell: ['S', 1, 0], tone: 'col' },
            ],
          },
          {
            marks: [
              { cell: ['S', 0, 2], tone: 'row' },
              { cell: ['S', 2, 0], tone: 'col' },
            ],
          },
          {
            marks: [
              { cell: ['S', 1, 2], tone: 'row' },
              { cell: ['S', 2, 1], tone: 'col' },
            ],
          },
        ],
      },
      claims: [{ kind: 'property', expr: 'S', is: 'symmetric' }],
    },
    {
      id: 'symmetric',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'Simetrik: $A^T = A$',
      body: 'Kare $A$ için {ok}Aᵀ = A{/ok}: her çiftte $a_{ij} = a_{ji}$. Köşegen serbest.',
      scene: { items: ['S'] },
      claims: [
        {
          kind: 'expr',
          expr: 'S^T - S',
          equals: [
            ['0', '0', '0'],
            ['0', '0', '0'],
            ['0', '0', '0'],
          ],
        },
      ],
    },
    {
      id: 'try-pair',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: 'Simetrik bir matriste $a_{12} = 7$. $a_{21}$ kaç?',
      skill: 'recognize-symmetric',
      options: [
        { key: 'a', content: [text('$7$')] },
        {
          key: 'b',
          content: [text('$-7$')],
          errorType: 'sign-slip',
          feedback: 'Zıt işaret antisimetrikte olur. Simetrikte çift eşit.',
        },
        {
          key: 'c',
          content: [text('$0$')],
          errorType: 'diagonal-confused',
          feedback: '$a_{21}$ köşegende değil; çifti $a_{12}$ ile eşit.',
        },
      ],
      answer: 'a',
      reveal: {
        kind: 'frames',
        frames: [
          {
            clear: true,
            marks: [
              { cell: ['S', 0, 1], tone: 'row' },
              { cell: ['S', 1, 0], tone: 'col' },
            ],
            note: 'a₁₂ = a₂₁',
          },
        ],
      },
      scene: { items: ['S'] },
      solution: 'Simetrikte çiftler eşit: $a_{21} = a_{12} = 7$.',
    },
    {
      id: 'antisymmetric',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'Antisimetrik: $A^T = -A$',
      body: '{ok}Aᵀ = −A{/ok}: çiftler zıt işaretli. Köşegen kendi zıttına eşit, yani hep 0.',
      scene: { items: ['K'] },
      beat: {
        kind: 'frames',
        frames: [
          {
            clear: true,
            marks: [
              { cell: ['K', 0, 1], tone: 'row' },
              { cell: ['K', 1, 0], tone: 'col' },
            ],
          },
          {
            clear: true,
            marks: [
              { cell: ['K', 0, 0], tone: 'ok' },
              { cell: ['K', 1, 1], tone: 'ok' },
              { cell: ['K', 2, 2], tone: 'ok' },
            ],
            note: 'köşegen = 0',
          },
        ],
      },
      claims: [{ kind: 'property', expr: 'K', is: 'antisymmetric' }],
    },
    {
      id: 'try-recognize',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: 'Hangisi antisimetriktir?',
      skill: 'recognize-antisymmetric',
      options: [
        {
          key: 'a',
          content: [
            matrix([
              ['0', '3'],
              ['3', '0'],
            ]),
          ],
          errorType: 'sign-slip',
          feedback:
            'Karşılıklı çift $3$ ve $3$: eşit oldukları için bu simetrik. Antisimetrikte zıt işaretli olmalı.',
        },
        {
          key: 'b',
          content: [
            matrix([
              ['1', '-3'],
              ['3', '1'],
            ]),
          ],
          errorType: 'nonzero-diagonal',
          feedback: 'Çift doğru ama köşegende $1$ var. Antisimetrik matrisin köşegeni $0$ olmak zorunda.',
        },
        {
          key: 'c',
          content: [
            matrix([
              ['0', '-3'],
              ['3', '0'],
            ]),
          ],
        },
        {
          key: 'd',
          content: [
            matrix([
              ['0', '-3'],
              ['-3', '0'],
            ]),
          ],
          errorType: 'sign-slip',
          feedback: 'İki eleman da $-3$: eşitler, bu yine simetrik.',
        },
      ],
      answer: 'c',
      reveal: {
        kind: 'equation',
        lines: [
          '\\begin{bmatrix} 0 & -3 \\\\ 3 & 0 \\end{bmatrix}',
          '\\text{köşegen } 0,\\; -3 \\leftrightarrow 3',
        ],
      },
      solution: 'Köşegen $0$, karşılıklı çift $-3$ ve $3$: $A^T = -A$.',
      claims: [{ kind: 'optionProperty', is: 'antisymmetric' }],
    },
    {
      id: 'build',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Her kare matristen ikisi de üretilir',
      body: 'Her kare $A$ için {ok}$A + A^T$ simetrik{/ok}, {ok}$A - A^T$ antisimetrik{/ok}. $AA^T$ ve $A^TA$ da simetrik.',
      scene: { items: ['P'] },
      claims: [
        { kind: 'property', expr: 'P + P^T', is: 'symmetric' },
        { kind: 'property', expr: 'P - P^T', is: 'antisymmetric' },
        { kind: 'property', expr: 'PP^T', is: 'symmetric' },
        { kind: 'property', expr: 'P^TP', is: 'symmetric' },
      ],
    },
    {
      id: 'decompose',
      kind: 'explain',
      eyebrow: 'Kural',
      title: '$A = S + K$: simetrik artı antisimetrik',
      body: 'Çiftin ortalaması $S$’ye, farkının yarısı $K$’ya gider. Örnekte 4 ve 2: ortalama 3, farkın yarısı 1.',
      scene: { items: ['N', '=', 'sN', 'kN'] },
      beat: {
        kind: 'equation',
        lines: ['S = \\tfrac{1}{2}(A + A^T)', 'K = \\tfrac{1}{2}(A - A^T)', 'S + K = A'],
      },
      claims: [
        {
          kind: 'expr',
          expr: '1/2(N + N^T)',
          equals: [
            ['1', '3'],
            ['3', '3'],
          ],
        },
        {
          kind: 'expr',
          expr: '1/2(N - N^T)',
          equals: [
            ['0', '1'],
            ['-1', '0'],
          ],
        },
        {
          kind: 'expr',
          expr: 'sN + kN - N',
          equals: [
            ['0', '0'],
            ['0', '0'],
          ],
        },
        { kind: 'property', expr: 'kN', is: 'antisymmetric' },
      ],
    },
    {
      id: 'try-entry',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: '$P = S + K$ ise $k_{23}$ kaç?',
      skill: 'decompose-entry',
      scene: { items: ['P'] },
      answer: '3',
      feedbackWrong: '$k_{23} = \\frac{p_{23} - p_{32}}{2}$. $p_{23} = 4$, $p_{32} = -2$.',
      reveal: {
        kind: 'frames',
        frames: [
          {
            clear: true,
            marks: [
              { cell: ['P', 1, 2], tone: 'row' },
              { cell: ['P', 2, 1], tone: 'col' },
            ],
            note: '(4 − (−2)) / 2 = 3',
          },
        ],
      },
      solution: '$k_{23} = \\frac{4 - (-2)}{2} = 3$.',
      claims: [{ kind: 'exprEntry', expr: '1/2(P - P^T)', row: 2, col: 3, equals: '3' }],
    },
    {
      id: 'trap-product',
      kind: 'explain',
      eyebrow: 'Tuzak',
      title: 'İki simetriğin çarpımı simetrik olmayabilir',
      body: '$(XY)^T = YX$. Bu ancak {ok}$XY = YX$ ise{/ok} $XY$’ye eşit. İzle: çift 4 ve 2 çıkıyor.',
      scene: { items: ['X', '·', 'Y', '=', 'XY0'] },
      beat: {
        kind: 'product',
        left: 'X',
        right: 'Y',
        into: 'XY0',
        cells: [
          [0, 1],
          [1, 0],
        ],
      },
      claims: [
        { kind: 'property', expr: 'X', is: 'symmetric' },
        { kind: 'property', expr: 'Y', is: 'symmetric' },
        {
          kind: 'expr',
          expr: 'XY',
          equals: [
            ['1', '4'],
            ['2', '2'],
          ],
        },
        { kind: 'property', expr: 'XY', is: 'symmetric', holds: false },
      ],
    },
    {
      id: 'exam-which',
      kind: 'choice',
      eyebrow: 'Sınav tipi',
      title: '$A$ antisimetrik, $B$ simetrik ve $AB = BA$. Hangisi kesinlikle antisimetriktir?',
      body: 'Her şıkta transpozu al ve $A^T = -A$, $B^T = B$ yaz.',
      skill: 'class-of-expression',
      options: [
        { key: 'a', content: [text('$AB$')] },
        {
          key: 'b',
          content: [text('$A + B$')],
          errorType: 'mixed-classes',
          feedback: '$(A + B)^T = -A + B$: ne $A + B$’ye ne de $-(A + B)$’ye eşit.',
        },
        {
          key: 'c',
          content: [text('$A^2$')],
          errorType: 'sign-count',
          feedback: '$(A^2)^T = (A^T)^2 = (-A)^2 = A^2$: iki eksi birbirini götürür, bu simetrik.',
        },
        {
          key: 'd',
          content: [text('$A^2B$')],
          errorType: 'sign-count',
          feedback: '$(A^2B)^T = BA^2 = A^2B$ (değişmeli). Simetrik çıkar.',
        },
        {
          key: 'e',
          content: [text('$A - B$')],
          errorType: 'mixed-classes',
          feedback: '$(A - B)^T = -A - B$: bu $-(A - B) = -A + B$ değil.',
        },
      ],
      answer: 'a',
      reveal: { kind: 'equation', lines: ['(AB)^T = B^TA^T = B(-A)', '= -BA = -AB'] },
      solution: '$(AB)^T = B^TA^T = -BA = -AB$, çünkü $AB = BA$.',
      claims: [
        { kind: 'property', expr: 'A', is: 'antisymmetric', where: { A: 'xA' } },
        { kind: 'property', expr: 'B', is: 'symmetric', where: { B: 'xB' } },
        {
          kind: 'expr',
          expr: 'AB - BA',
          equals: [
            ['0', '0', '0'],
            ['0', '0', '0'],
            ['0', '0', '0'],
          ],
          where: { A: 'xA', B: 'xB' },
        },
        { kind: 'optionProperty', is: 'antisymmetric', where: { A: 'xA', B: 'xB' } },
      ],
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'Simetrik ve antisimetrik',
      points: [
        'Simetrik: $A^T = A$, $a_{ij} = a_{ji}$.',
        'Antisimetrik: $A^T = -A$, köşegen $0$.',
        '$A + A^T$, $AA^T$ simetrik; $A - A^T$ antisimetrik.',
        '$A = \\frac{1}{2}(A + A^T) + \\frac{1}{2}(A - A^T)$, tek yolla.',
        'Bir ifadenin sınıfını bulmak için transpozunu al: $(AB)^T = B^TA^T$, sıra değişir.',
      ],
    },
  ],
}

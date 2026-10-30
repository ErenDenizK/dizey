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
      eyebrow: 'Gözlem',
      title: 'Köşegene ayna tut',
      body: '$S$’nin köşegenine bir ayna koy: üst üçgendeki her sayı alt üçgende aynen görünür. Transpoz almak tam olarak bu aynadır, bu yüzden $S^T = S$.',
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
      body: 'Kare bir $A$ için {ok}$A^T = A$ ise{/ok} $A$ simetriktir. Eleman eleman: her $i, j$ için $a_{ij} = a_{ji}$. Köşegen serbesttir; kısıt yalnızca karşılıklı çiftlerdedir.',
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
      id: 'antisymmetric',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'Antisimetrik: $A^T = -A$',
      body: '{ok}$A^T = -A$ olunca{/ok} karşılıklı çiftler zıt işaretlidir, $a_{ij} = -a_{ji}$. Köşegende $a_{ii} = -a_{ii}$ olur, yani köşegen hep $0$’dır.',
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
      solution: 'Köşegen $0$, karşılıklı çift $-3$ ve $3$: $A^T = -A$.',
      claims: [{ kind: 'optionProperty', is: 'antisymmetric' }],
    },
    {
      id: 'build',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Her kare matristen ikisi de üretilir',
      body: 'Herhangi bir kare $A$ için: {ok}$A + A^T$ simetrik{/ok}, {ok}$A - A^T$ antisimetrik{/ok}, $AA^T$ ve $A^TA$ simetrik. Kanıt tek satır: $(A + A^T)^T = A^T + A$, $(AA^T)^T = (A^T)^TA^T = AA^T$.',
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
      body: '$S = \\frac{1}{2}(A + A^T)$ ve $K = \\frac{1}{2}(A - A^T)$ alınırsa $S + K = A$ olur. Bu ayrışım tektir. Örnekte $S$’nin karşılıklı elemanı $\\frac{4 + 2}{2} = 3$, $K$’nınki $\\frac{4 - 2}{2} = 1$.',
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
      title: '$P = S + K$ ayrışımında $K$’nın 2. satır 3. sütun elemanı kaç?',
      skill: 'decompose-entry',
      scene: { items: ['P'] },
      answer: '3',
      feedbackWrong: '$k_{23} = \\frac{p_{23} - p_{32}}{2}$. $p_{23} = 4$, $p_{32} = -2$.',
      solution: '$k_{23} = \\frac{4 - (-2)}{2} = 3$.',
      claims: [{ kind: 'exprEntry', expr: '1/2(P - P^T)', row: 2, col: 3, equals: '3' }],
    },
    {
      id: 'trap-product',
      kind: 'explain',
      eyebrow: 'Tuzak',
      title: 'İki simetriğin çarpımı simetrik olmayabilir',
      body: '$(XY)^T = Y^TX^T = YX$. Bu, $XY$’ye ancak {ok}$XY = YX$ ise{/ok} eşittir. Örnekte $X$ ve $Y$ simetrik, ama $XY$’nin karşılıklı elemanları $4$ ve $2$.',
      scene: { items: ['X', 'Y'] },
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

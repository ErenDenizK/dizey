import { matrix } from '../questions/blocks'
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
      id: 'conjugate',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'Eşlenik: her elemanda $i$’nin işaretini çevir',
      body: '$z = a + bi$ sayısının eşleniği $\\bar{z} = a - bi$. Bir matrisin eşleniği $\\bar{A}$, her elemanın eşleniği alınarak bulunur. {ok}Gerçek elemanlar değişmez{/ok}: $3$ yine $3$.',
      scene: { items: ['A', 'aC'] },
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
      title: 'Eşlenik transpoz: $A^* = (\\bar{A})^T$',
      body: 'Önce eşleniğini al, sonra transpozunu: satırlar sütun olur. Sıra fark etmez, $(\\bar{A})^T = \\overline{A^T}$. Gerçek bir matriste $A^* = A^T$; yani $A^*$, transpozun karmaşık sayılardaki karşılığıdır.',
      scene: { items: ['A', 'aS'] },
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
      title: '$A^* = A$ ise Hermitian, $A^* = -A$ ise ters Hermitian',
      body: 'Hermitian, simetrik matrisin karmaşık karşılığıdır: $a_{ji} = \\overline{a_{ij}}$. Köşegende $a_{ii} = \\overline{a_{ii}}$ olmalı, yani {ok}Hermitian matrisin köşegeni gerçektir{/ok}. Ters Hermitian’da ($S^* = -S$) köşegen saf sanaldır ya da $0$.',
      scene: { items: ['H', 'S'] },
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
      solution: 'Köşegen gerçek ($3$ ve $0$), $2 - i$ ile $2 + i$ birbirinin eşleniği: $A^* = A$.',
      claims: [{ kind: 'optionComplexProperty', is: 'hermitian' }],
    },
    {
      id: 'rules',
      kind: 'explain',
      eyebrow: 'Kural',
      title: '$(AB)^* = B^*A^*$',
      body: 'Transpozun kuralları eşlenik transpozda da geçerli: $(A^*)^* = A$, $(A + B)^* = A^* + B^*$, $(AB)^* = B^*A^*$, {ok}sıra ters döner{/ok}. Tek fark skalerde: $(kA)^* = \\bar{k}A^*$, yani $(iA)^* = -iA^*$.',
    },
    {
      id: 'try-det',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: '$|H|$ kaç?',
      body: 'Hermitian bir matrisin determinantı her zaman gerçek sayıdır.',
      skill: 'det-2x2',
      scene: { items: ['H'] },
      answer: '-8',
      feedbackWrong: '$(1 + i)(1 - i) = 1 - i^2 = 2$. Sonra $2 \\cdot (-3) - 2$.',
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

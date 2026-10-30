import { text } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

const m = (label: string, rows: readonly (readonly string[])[]): MatrixBlock => ({
  kind: 'matrix',
  delimiter: 'brackets',
  rows,
  label,
})

/** M1: size m×n and the entry a_ij: row first, column second. */
export const m1ReadingAMatrix: Lesson = {
  id: 'm1-reading-a-matrix',
  node: 'M1',
  title: 'Matrisi okumak',
  matrices: {
    A: m('A =', [
      ['4', '-1', '0', '2'],
      ['3', '5', '-2', '1'],
      ['0', '7', '6', '-3'],
    ]),
  },
  steps: [
    {
      id: 'size',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'Boyut: önce satır, sonra sütun',
      body: 'Matris, sayıların satır ve sütunlara dizilmiş tablosudur. $A$’da 3 satır ve 4 sütun var: {ok}3×4 matris{/ok}. Sıra hep aynı: önce satır sayısı $m$, sonra sütun sayısı $n$.',
      scene: { items: ['A'] },
      beat: {
        kind: 'frames',
        frames: [
          { clear: true, marks: [{ cell: ['A', 0, '*'], tone: 'row' }], note: '1. satır' },
          { clear: true, marks: [{ cell: ['A', '*', 0], tone: 'col' }], note: '1. sütun' },
        ],
      },
    },
    {
      id: 'entry',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: '$a_{ij}$: $i.$ satır, $j.$ sütun',
      body: '$a_{23}$, 2. satır ile 3. sütunun kesiştiği elemandır: {ok}$a_{23} = -2$ bulunur{/ok}. İndislerin sırası boyuttaki sırayla aynı: önce satır.',
      scene: { items: ['A'] },
      beat: {
        kind: 'frames',
        frames: [
          { clear: true, marks: [{ cell: ['A', 1, '*'], tone: 'row' }] },
          { marks: [{ cell: ['A', '*', 2], tone: 'col' }] },
          { clear: true, marks: [{ cell: ['A', 1, 2], tone: 'ok' }], note: 'a₂₃ = −2' },
        ],
      },
      claims: [{ kind: 'exprEntry', expr: 'A', row: 2, col: 3, equals: '-2' }],
    },
    {
      id: 'try-entry',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: '$a_{32}$ kaç?',
      skill: 'read-entry',
      scene: { items: ['A'] },
      answer: '7',
      feedbackWrong: 'Önce 3. satıra in, sonra o satırda 2. sütuna git.',
      solution: '3. satır $(0, 7, 6, -3)$, 2. eleman $7$.',
      claims: [{ kind: 'exprEntry', expr: 'A', row: 3, col: 2, equals: '7' }],
    },
    {
      id: 'try-trap',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '$a_{14}$ hangisidir?',
      skill: 'read-entry',
      scene: { items: ['A'] },
      options: [
        {
          key: 'a',
          content: [text('Tanımsız')],
          errorType: 'swapped-indices',
          feedback: '4. satır yok ama burada istenen 1. satır, 4. sütun: o eleman var.',
        },
        { key: 'b', content: [text('$2$')] },
        {
          key: 'c',
          content: [text('$4$')],
          errorType: 'wrong-entry',
          feedback: 'Bu $a_{11}$. 1. satırda 4. sütuna kadar ilerle.',
        },
        {
          key: 'd',
          content: [text('$0$')],
          errorType: 'wrong-entry',
          feedback: 'Bu $a_{13}$: bir sütun eksik saydın.',
        },
        {
          key: 'e',
          content: [text('$-3$')],
          errorType: 'wrong-row',
          feedback: 'Bu $a_{34}$: 4. sütun doğru ama satır 1 olmalı.',
        },
      ],
      answer: 'b',
      solution: '1. satır $(4, -1, 0, 2)$, 4. eleman $2$.',
      claims: [{ kind: 'exprEntry', expr: 'A', row: 1, col: 4, equals: '2' }],
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'Matrisi okumak',
      points: [
        'm×n: $m$ satır, $n$ sütun.',
        '$a_{ij}$: $i.$ satır, $j.$ sütun. Önce satır, sonra sütun.',
        '$a_{ij}$ ile $a_{ji}$ genelde farklı elemanlardır.',
      ],
    },
  ],
}

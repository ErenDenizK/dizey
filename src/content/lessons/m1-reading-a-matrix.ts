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
    B: m('B =', [
      ['1', '0', '3', '-2', '6'],
      ['5', '2', '-1', '0', '4'],
    ]),
  },
  steps: [
    {
      id: 'hook',
      kind: 'explain',
      eyebrow: 'Soru',
      title: 'Bu tabloda kaç satır, kaç sütun var?',
      body: 'Matris, sayıların satır ve sütunlara dizildiği bir tablodur.',
      scene: { items: ['A'] },
    },
    {
      id: 'size',
      kind: 'explain',
      eyebrow: 'Sezgi',
      title: 'Boyut: önce satır, sonra sütun',
      body: '{row}Satırlar{/row} yatay: 3 tane. {col}Sütunlar{/col} dikey: 4 tane. Boyut {ok}3×4{/ok}.',
      scene: { items: ['A'] },
      beat: {
        kind: 'frames',
        frames: [
          ...[0, 1, 2].map((r) => ({
            clear: true,
            marks: [{ cell: ['A', r, '*'] as const, tone: 'row' as const }],
            ...(r === 2 ? { note: '3 satır' } : {}),
          })),
          ...[0, 1, 2, 3].map((c) => ({
            clear: true,
            marks: [{ cell: ['A', '*', c] as const, tone: 'col' as const }],
            ...(c === 3 ? { note: '4 sütun' } : {}),
          })),
        ],
      },
    },
    {
      id: 'try-size',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '$B$’nin boyutu ne?',
      skill: 'matrix-size',
      scene: { items: ['B'] },
      options: [
        {
          key: 'a',
          content: [text('5×2')],
          errorType: 'swapped-size',
          feedback: 'Önce satır sayısı yazılır: 2 satır, 5 sütun.',
        },
        { key: 'b', content: [text('2×5')] },
        {
          key: 'c',
          content: [text('10')],
          errorType: 'counted-entries',
          feedback: '10, eleman sayısı. Boyut iki sayıdır: satır × sütun.',
        },
      ],
      answer: 'b',
      reveal: {
        kind: 'frames',
        frames: [
          ...[0, 1].map((r) => ({
            clear: true,
            marks: [{ cell: ['B', r, '*'] as const, tone: 'row' as const }],
            ...(r === 1 ? { note: '2 satır' } : {}),
          })),
          ...[0, 1, 2, 3, 4].map((c) => ({
            clear: true,
            marks: [{ cell: ['B', '*', c] as const, tone: 'col' as const }],
            ...(c === 4 ? { note: '5 sütun' } : {}),
          })),
        ],
      },
      solution: '2 satır, 5 sütun: 2×5.',
    },
    {
      id: 'entry',
      kind: 'explain',
      eyebrow: 'Sezgi',
      title: 'Bir eleman iki numarayla bulunur',
      body: '$a_{23}$: {row}2. satır{/row} ile {col}3. sütunun{/col} kesiştiği yer. Burada {ok}−2{/ok}.',
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
      reveal: {
        kind: 'frames',
        frames: [
          { clear: true, marks: [{ cell: ['A', 2, '*'], tone: 'row' }] },
          { marks: [{ cell: ['A', '*', 1], tone: 'col' }] },
          { clear: true, marks: [{ cell: ['A', 2, 1], tone: 'ok' }], note: 'a₃₂ = 7' },
        ],
      },
      solution: '3. satır $(0, 7, 6, -3)$, 2. eleman $7$.',
      claims: [{ kind: 'exprEntry', expr: 'A', row: 3, col: 2, equals: '7' }],
    },
    {
      id: 'swap-trap',
      kind: 'explain',
      eyebrow: 'Tuzak',
      title: 'İndisler yer değiştirirse eleman da değişir',
      body: '$a_{23} = -2$ ama $a_{32} = 7$. İlk indis hep satırdır.',
      scene: { items: ['A'] },
      beat: {
        kind: 'frames',
        frames: [
          { clear: true, marks: [{ cell: ['A', 1, 2], tone: 'row' }], note: 'a₂₃ = −2' },
          { marks: [{ cell: ['A', 2, 1], tone: 'col' }], note: 'a₃₂ = 7' },
        ],
      },
      claims: [
        { kind: 'exprEntry', expr: 'A', row: 2, col: 3, equals: '-2' },
        { kind: 'exprEntry', expr: 'A', row: 3, col: 2, equals: '7' },
      ],
    },
    {
      id: 'try-trap',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '$a_{14}$ hangisi?',
      skill: 'read-entry',
      scene: { items: ['A'] },
      options: [
        {
          key: 'a',
          content: [text('Tanımsız')],
          errorType: 'swapped-indices',
          feedback: '4. satır yok ama istenen 1. satır, 4. sütun: o eleman var.',
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
          content: [text('$-3$')],
          errorType: 'wrong-row',
          feedback: 'Bu $a_{34}$: sütun doğru ama satır 1 olmalı.',
        },
      ],
      answer: 'b',
      reveal: {
        kind: 'frames',
        frames: [
          { clear: true, marks: [{ cell: ['A', 0, '*'], tone: 'row' }] },
          { marks: [{ cell: ['A', '*', 3], tone: 'col' }] },
          { clear: true, marks: [{ cell: ['A', 0, 3], tone: 'ok' }], note: 'a₁₄ = 2' },
        ],
      },
      solution: '1. satır $(4, -1, 0, 2)$, 4. eleman $2$.',
      claims: [{ kind: 'exprEntry', expr: 'A', row: 1, col: 4, equals: '2' }],
    },
    {
      id: 'try-row',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '$A$’nın 2. satırı hangisi?',
      skill: 'read-entry',
      scene: { items: ['A'] },
      options: [
        {
          key: 'a',
          content: [text('$(-1, 5, 7)$')],
          errorType: 'row-column-confused',
          feedback: 'Bu 2. sütun: dikey okudun. Satır yatay okunur.',
        },
        { key: 'b', content: [text('$(3, 5, -2, 1)$')] },
        {
          key: 'c',
          content: [text('$(4, 3, 0)$')],
          errorType: 'row-column-confused',
          feedback: 'Bu 1. sütun. 2. satır, yukarıdan ikinci yatay sıra.',
        },
      ],
      answer: 'b',
      reveal: {
        kind: 'frames',
        frames: [{ clear: true, marks: [{ cell: ['A', 1, '*'], tone: 'row' }], note: '(3, 5, −2, 1)' }],
      },
      solution: 'Yukarıdan ikinci yatay sıra: $(3, 5, -2, 1)$.',
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'Önce satır, sonra sütun',
      points: [
        'm×n: $m$ satır, $n$ sütun.',
        '$a_{ij}$: $i.$ satır, $j.$ sütun.',
        '$a_{ij}$ ile $a_{ji}$ genelde farklıdır.',
      ],
    },
  ],
}

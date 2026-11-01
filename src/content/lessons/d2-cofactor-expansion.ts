import { text } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

const m = (label: string, rows: readonly (readonly string[])[], bars = false): MatrixBlock => ({
  kind: 'matrix',
  delimiter: bars ? 'bars' : 'brackets',
  rows,
  label,
})

/** D2: minor M_ij, cofactor C_ij = (−1)^(i+j) M_ij, Laplace expansion, choosing the row or column with most zeros. */
export const d2CofactorExpansion: Lesson = {
  id: 'd2-cofactor-expansion',
  node: 'D2',
  title: 'Minör, kofaktör ve Laplace açılımı',
  matrices: {
    V: m(
      '$|V|$ =',
      [
        ['2', '0', '0', '0'],
        ['5', '3', '0', '0'],
        ['1', '4', '-1', '0'],
        ['7', '2', '6', '2'],
      ],
      true,
    ),
    P: m(
      '$|A|$ =',
      [
        ['1', '2', '0'],
        ['3', '-1', '4'],
        ['2', '1', '5'],
      ],
      true,
    ),
    Signs: m('', [
      ['+', '−', '+'],
      ['−', '+', '−'],
      ['+', '−', '+'],
    ]),
    Z: m(
      '$|B|$ =',
      [
        ['3', '0', '2'],
        ['1', '5', '-1'],
        ['4', '0', '1'],
      ],
      true,
    ),
    W: m(
      '$|D|$ =',
      [
        ['2', '0', '1', '0'],
        ['1', '3', '0', '0'],
        ['0', '0', '4', '0'],
        ['5', '1', '2', '1'],
      ],
      true,
    ),
    U: m(
      '$|A|$ =',
      [
        ['2', '5', '-1', '7'],
        ['0', '3', '4', '2'],
        ['0', '0', '-1', '6'],
        ['0', '0', '0', '2'],
      ],
      true,
    ),
  },
  steps: [
    {
      id: 'hook',
      kind: 'explain',
      eyebrow: 'Soru',
      title: '4×4 bir determinantı nasıl hesaplarız?',
      body: 'Sarrus yalnız 3×3’te çalışır. Her boyutta çalışan yol: büyük determinantı küçük determinantlara bölmek. Bu derste o parçaları tanıyacağız: {row}minör{/row} ve {col}kofaktör{/col}.',
      scene: { items: ['W', '=', 'result'], result: '?' },
    },
    {
      id: 'minor',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'Minör: satırı ve sütunu sil, kalanın determinantı',
      body: '$a_{ij}$ elemanının minörü $M_{ij}$: $i$. satırı ve $j$. sütunu sil, kalan matrisin determinantını al. $a_{12} = 2$ için 1. satır ve 2. sütun silinir: $M_{12} = 3 \\cdot 5 - 4 \\cdot 2 = 7$.',
      scene: { items: ['P'] },
      beat: { kind: 'minor', matrix: 'P', row: 0, col: 1 },
      claims: [{ kind: 'minor', matrix: 'P', row: 1, col: 2, equals: '7' }],
    },
    {
      id: 'cofactor',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'Kofaktör: minöre işaret ekle',
      body: '$C_{ij} = (-1)^{i+j} M_{ij}$. $i + j$ çiftse işaret {row}artı{/row}, tekse {col}eksi{/col}: satranç tahtası gibi, sol üst köşe artı. $C_{12} = (-1)^{3} \\cdot 7 = -7$.',
      scene: { items: ['Signs'] },
      claims: [{ kind: 'cofactor', matrix: 'P', row: 1, col: 2, equals: '-7' }],
    },
    {
      id: 'try-minor',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: '$M_{23}$ kaç?',
      body: '2. satırı ve 3. sütunu sil.',
      skill: 'minor',
      scene: { items: ['P'] },
      answer: '-3',
      feedbackWrong: 'Kalan matrisin satırları $(1, 2)$ ve $(2, 1)$: $1 \\cdot 1 - 2 \\cdot 2 = -3$.',
      reveal: { kind: 'minor', matrix: 'P', row: 1, col: 2 },
      solution: '$M_{23} = 1 \\cdot 1 - 2 \\cdot 2 = -3$.',
      claims: [{ kind: 'minor', matrix: 'P', row: 2, col: 3, equals: '-3' }],
    },
    {
      id: 'try-cofactor',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '$C_{23}$ kaç?',
      skill: 'cofactor-sign',
      scene: { items: ['P', 'Signs'] },
      options: [
        {
          key: 'a',
          content: [text('$-3$')],
          errorType: 'forgot-cofactor-sign',
          feedback: 'Bu $M_{23}$. $2 + 3 = 5$ tek, işaret eksi: $C_{23} = -(-3)$.',
        },
        { key: 'b', content: [text('$3$')] },
        {
          key: 'c',
          content: [text('$-7$')],
          errorType: 'wrong-minor',
          feedback: 'Bu $C_{12}$. $C_{23}$ için 2. satırı ve 3. sütunu sil.',
        },
      ],
      answer: 'b',
      reveal: { kind: 'equation', lines: ['C_{23} = (-1)^{2+3} M_{23}', '= (-1) \\cdot (-3) = 3'] },
      solution: '$C_{23} = (-1)^{5} \\cdot (-3) = 3$.',
      claims: [
        { kind: 'minor', matrix: 'P', row: 2, col: 3, equals: '-3' },
        { kind: 'cofactor', matrix: 'P', row: 2, col: 3, equals: '3', answer: true },
      ],
    },
    {
      id: 'laplace',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Laplace açılımı: eleman çarpı kofaktör, topla',
      body: 'Bir satır seç; her elemanı kendi kofaktörüyle çarp ve topla. 1. satırdan: $|A| = 1 \\cdot C_{11} + 2 \\cdot C_{12} + 0 \\cdot C_{13} = 1 \\cdot (-9) + 2 \\cdot (-7) + 0 = -23$.',
      scene: { items: ['P', '=', 'result'], result: '?' },
      beat: { kind: 'expand', matrix: 'P', along: 'row', index: 0 },
      claims: [
        { kind: 'cofactor', matrix: 'P', row: 1, col: 1, equals: '-9' },
        { kind: 'cofactor', matrix: 'P', row: 1, col: 2, equals: '-7' },
        { kind: 'det', matrix: 'P', equals: '-23' },
      ],
    },
    {
      id: 'any-row',
      kind: 'explain',
      eyebrow: 'Sezgi',
      title: 'Hangi satırı seçersen seç, sonuç aynı',
      body: '2. satırdan açalım: $3 \\cdot C_{21} + (-1) \\cdot C_{22} + 4 \\cdot C_{23} = -30 - 5 + 12 = -23$. Aynı sonuç. Sütunlar için de geçerli; o zaman {ok}işi en kısa yapan{/ok} satırı ya da sütunu seçeriz.',
      scene: { items: ['P', '=', 'result'], result: '?' },
      beat: { kind: 'expand', matrix: 'P', along: 'row', index: 1 },
      claims: [
        { kind: 'cofactor', matrix: 'P', row: 2, col: 1, equals: '-10' },
        { kind: 'cofactor', matrix: 'P', row: 2, col: 2, equals: '5' },
        { kind: 'cofactor', matrix: 'P', row: 2, col: 3, equals: '3' },
        { kind: 'det', matrix: 'P', equals: '-23' },
      ],
    },
    {
      id: 'zeros',
      kind: 'explain',
      eyebrow: 'Strateji',
      title: 'En çok sıfır olan satırı ya da sütunu seç',
      body: 'Sıfırın kofaktörünü hesaplamaya gerek yok: çarpım zaten sıfır. $B$’nin {col}2. sütununda{/col} iki sıfır var: $|B| = 5 \\cdot C_{22} = 5 \\cdot (3 \\cdot 1 - 2 \\cdot 4) = 5 \\cdot (-5) = -25$.',
      scene: { items: ['Z', '=', 'result'], result: '?' },
      beat: { kind: 'expand', matrix: 'Z', along: 'col', index: 1 },
      claims: [
        { kind: 'cofactor', matrix: 'Z', row: 2, col: 2, equals: '-5' },
        { kind: 'det', matrix: 'Z', equals: '-25' },
      ],
    },
    {
      id: 'try-4x4',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: '$|D|$ kaç?',
      body: 'Önce tek sıfırdan farklı elemanı olan sütunu bul, sonra kalan 3×3’te aynı fikri tekrar kullan.',
      skill: 'laplace-zeros',
      scene: { items: ['W', '=', 'result'], result: '?' },
      answer: '24',
      feedbackWrong:
        '4. sütunda yalnız $d_{44} = 1$ var: $|D| = 1 \\cdot C_{44}$. Kalan 3×3’ün 3. satırında yalnız $4$ var: $4 \\cdot (2 \\cdot 3 - 0 \\cdot 1) = 24$.',
      reveal: {
        kind: 'sequence',
        beats: [
          { kind: 'expand', matrix: 'W', along: 'col', index: 3 },
          {
            kind: 'equation',
            lines: ['|D| = 1 \\cdot C_{44}', '= 4 \\cdot (2 \\cdot 3 - 0 \\cdot 1)', '= 24'],
          },
        ],
      },
      solution: '$|D| = C_{44} = 4 \\cdot 6 = 24$. İki adımda 4×4 bitti.',
      claims: [
        { kind: 'cofactor', matrix: 'W', row: 4, col: 4, equals: '24' },
        { kind: 'det', matrix: 'W', equals: '24', answer: true },
      ],
    },
    {
      id: 'trap-sign',
      kind: 'explain',
      eyebrow: 'Tuzak',
      title: 'İşareti minörden önce koy',
      body: 'En sık hata: $M_{ij}$’yi bulup işareti unutmak. Açılıma başlamadan seçtiğin satırın işaret düzenini yaz: 2. satır için $-, +, -$.',
      scene: { items: ['Signs'] },
      beat: {
        kind: 'frames',
        frames: [
          { clear: true, marks: [{ cell: ['Signs', 1, '*'], tone: 'row' }], note: '2. satır: −, +, −' },
        ],
      },
    },
    {
      id: 'exam-triangular',
      kind: 'choice',
      eyebrow: 'Sınav tipi',
      title: '$|A|$ aşağıdakilerden hangisidir?',
      body: '1. sütunda tek sıfırdan farklı eleman var. Açınca ne kalıyor?',
      skill: 'laplace-zeros',
      scene: { items: ['U', '=', 'result'], result: '?' },
      options: [
        { key: 'a', content: [text('$-12$')] },
        {
          key: 'b',
          content: [text('$12$')],
          errorType: 'lost-sign',
          feedback: 'Köşegende $-1$ var: $2 \\cdot 3 \\cdot (-1) \\cdot 2 = -12$.',
        },
        {
          key: 'c',
          content: [text('$6$')],
          errorType: 'dropped-factor',
          feedback:
            'Her açılım bir köşegen elemanını dışarı çıkarır; dördü de çarpılır: $2 \\cdot 3 \\cdot (-1) \\cdot 2$.',
        },
        {
          key: 'd',
          content: [text('$0$')],
          errorType: 'zeros-mean-zero',
          feedback:
            'Sıfırlar determinantı sıfır yapmaz; sıfır satır ya da sıfır sütun yapar. Burada köşegende sıfır yok.',
        },
        {
          key: 'e',
          content: [text('$-24$')],
          errorType: 'other',
          feedback:
            'Köşegen elemanlarının çarpımı $2 \\cdot 3 \\cdot (-1) \\cdot 2 = -12$; üstteki elemanlar sonuca girmez.',
        },
      ],
      answer: 'a',
      reveal: {
        kind: 'sequence',
        beats: [
          { kind: 'expand', matrix: 'U', along: 'col', index: 0 },
          { kind: 'equation', lines: ['|A| = 2 \\cdot 3 \\cdot (-1) \\cdot 2', '= -12'] },
        ],
      },
      solution:
        '1. sütundan aç: $2 \\cdot C_{11}$. Kalan 3×3’ün de 1. sütununda tek eleman var; her adımda bir köşegen elemanı çıkar. Üst üçgen matrisin determinantı köşegenin çarpımı: $-12$.',
      claims: [{ kind: 'det', matrix: 'U', equals: '-12' }],
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'Büyük determinantı küçüklere böl',
      points: [
        '$M_{ij}$: $i$. satırı ve $j$. sütunu sil, kalanın determinantı.',
        '$C_{ij} = (-1)^{i+j} M_{ij}$; işaret düzeni sol üstten artıyla başlayan satranç tahtası.',
        'Laplace: herhangi bir satır ya da sütun boyunca $\\sum a_{ij} C_{ij}$; her seçim aynı sonucu verir.',
        'En çok sıfır olan satırı ya da sütunu seç; sıfırların kofaktörü hesaplanmaz.',
        'Üçgensel matriste determinant köşegenin çarpımı.',
      ],
    },
  ],
  moment: {
    id: 'moment-triangle',
    kind: 'choice',
    eyebrow: 'Gizli an',
    title: 'Hesaplamadan söyle: $|V|$ kaç?',
    body: 'İlk satıra bak, sonra bir daha bak.',
    skill: 'det-triangular',
    scene: { items: ['V', '=', 'result'], result: '?' },
    options: [
      {
        key: 'a',
        content: [text('$6$')],
        errorType: 'summed-diagonal',
        feedback: 'Köşegeni topladın. Laplace her adımda bir elemanı kofaktörüyle çarpar.',
      },
      { key: 'b', content: [text('$-12$')] },
      {
        key: 'c',
        content: [text('$12$')],
        errorType: 'dropped-sign',
        feedback: 'Köşegende $-1$ var; işaret çarpıma girer.',
      },
    ],
    answer: 'b',
    reveal: {
      kind: 'frames',
      frames: [
        {
          clear: true,
          marks: [
            { cell: ['V', 0, 1], tone: 'col' },
            { cell: ['V', 0, 2], tone: 'col' },
            { cell: ['V', 0, 3], tone: 'col' },
          ],
          note: 'İlk satırda tek eleman: 2',
        },
        {
          marks: [
            { cell: ['V', 0, 0], tone: 'ok' },
            { cell: ['V', 1, 1], tone: 'ok' },
            { cell: ['V', 2, 2], tone: 'ok' },
            { cell: ['V', 3, 3], tone: 'ok' },
          ],
          note: '2 · 3 · (−1) · 2 = −12',
        },
      ],
    },
    solution:
      'İlk satırdan açınca tek terim kalır: $2 \\cdot M_{11}$. Kalan 3×3 da aynı biçimde; her adımda köşegenden bir eleman gelir: $2 \\cdot 3 \\cdot (-1) \\cdot 2 = -12$.',
    claims: [{ kind: 'det', matrix: 'V', equals: '-12', answer: true }],
  },
}

import { text } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

const m = (label: string, rows: readonly (readonly string[])[]): MatrixBlock => ({
  kind: 'matrix',
  delimiter: 'brackets',
  rows,
  label,
})

const augmented = (label: string, rows: readonly (readonly string[])[]): MatrixBlock => ({
  kind: 'matrix',
  delimiter: 'brackets',
  rows,
  label,
  augmentedAt: (rows[0]?.length ?? 1) - 1,
})

/** S1: Ax = b as [A | b], elimination, and the three outcomes read from r_A and r_B. */
export const s1LinearSystems: Lesson = {
  id: 's1-linear-systems',
  node: 'S1',
  title: 'Doğrusal sistemler ve rank',
  matrices: {
    U: augmented('$[A \\mid b]$ =', [
      ['1', '2', '-1', '3'],
      ['2', '5', '1', '7'],
      ['1', '3', '3', '4'],
    ]),
    UEnd: augmented('', [
      ['1', '2', '-1', '3'],
      ['0', '1', '3', '1'],
      ['0', '0', '1', '0'],
    ]),
    I: augmented('$[A \\mid b]$ =', [
      ['1', '2', '-1', '3'],
      ['2', '5', '1', '7'],
      ['1', '3', '2', '4'],
    ]),
    IEnd: augmented('', [
      ['1', '2', '-1', '3'],
      ['0', '1', '3', '1'],
      ['0', '0', '0', '0'],
    ]),
    NEnd: augmented('', [
      ['1', '2', '-1', '3'],
      ['0', '1', '3', '1'],
      ['0', '0', '0', '1'],
    ]),
    Q: augmented('', [
      ['1', '-1', '2', '4'],
      ['0', '2', '1', '3'],
      ['0', '0', '0', '5'],
    ]),
    cI: m('', [
      ['1', '2', '-1'],
      ['2', '5', '1'],
      ['1', '3', '2'],
    ]),
    sV: m('', [['8'], ['-2'], ['1']]),
    sB: m('', [['3'], ['7'], ['4']]),
  },
  steps: [
    {
      id: 'augmented',
      kind: 'explain',
      eyebrow: 'Kurulum',
      title: 'Sistemi bir matrise yaz',
      body: '$x + 2y - z = 3$, $2x + 5y + z = 7$, $x + 3y + 3z = 4$. Katsayılar $A$’yı, sağ taraf $b$’yi oluşturur; ikisi yan yana {ok}genişletilmiş matris{/ok} $[A \\mid b]$. Satır işlemleri denklemleri değiştirir ama çözüm kümesini değiştirmez.',
      scene: { items: ['U'] },
    },
    {
      id: 'eliminate',
      kind: 'explain',
      eyebrow: 'Yöntem',
      title: 'Eşelon forma getir, sondan geri çöz',
      body: 'Köşegenin altını sıfırla. Son satır $z = 0$ der; 2. satır $y + 3z = 1$, yani $y = 1$; 1. satır $x + 2y - z = 3$, yani $x = 1$. {ok}Tek çözüm: $(1, 1, 0)$.{/ok}',
      scene: { items: ['U'] },
      beat: {
        kind: 'rowOps',
        matrix: 'U',
        ops: [
          { kind: 'addMultiple', target: 1, source: 0, factor: '-2' },
          { kind: 'addMultiple', target: 2, source: 0, factor: '-1' },
          { kind: 'addMultiple', target: 2, source: 1, factor: '-1' },
        ],
        result: 'UEnd',
      },
      claims: [{ kind: 'system', matrix: 'U', is: 'unique' }],
    },
    {
      id: 'ranks',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Üç sonuç, iki rank',
      body: 'Eşelon formda $r_A$: $A$ kısmındaki sıfır olmayan satır sayısı, $r_B$: $[A \\mid b]$’deki sıfır olmayan satır sayısı. {ok}$r_A < r_B$ ise çözüm yok{/ok} (solda sıfır, sağda sayı: $0 = 1$). $r_A = r_B = n$ ise tek çözüm, $r_A = r_B < n$ ise sonsuz çözüm. Burada $n$ bilinmeyen sayısı.',
      scene: { items: ['IEnd', 'NEnd'] },
      claims: [
        { kind: 'rank', matrix: 'IEnd', columns: 3, equals: '2' },
        { kind: 'rank', matrix: 'IEnd', equals: '2' },
        { kind: 'rank', matrix: 'NEnd', columns: 3, equals: '2' },
        { kind: 'rank', matrix: 'NEnd', equals: '3' },
        { kind: 'system', matrix: 'IEnd', is: 'infinite' },
        { kind: 'system', matrix: 'NEnd', is: 'none' },
      ],
    },
    {
      id: 'infinite',
      kind: 'explain',
      eyebrow: 'Durum',
      title: 'Sonsuz çözüm: serbest değişken',
      body: 'Üçüncü denklem $x + 3y + 2z = 4$ olunca son satır tamamen sıfırlanır. $n - r = 3 - 2 = 1$ serbest değişken kalır: $z = t$ de, gerisini $t$ cinsinden yaz: $y = 1 - 3t$, $x = 1 + 7t$. Örneğin $t = 1$ için $(8, -2, 1)$ bir çözüm.',
      scene: { items: ['I'] },
      beat: {
        kind: 'rowOps',
        matrix: 'I',
        ops: [
          { kind: 'addMultiple', target: 1, source: 0, factor: '-2' },
          { kind: 'addMultiple', target: 2, source: 0, factor: '-1' },
          { kind: 'addMultiple', target: 2, source: 1, factor: '-1' },
        ],
        result: 'IEnd',
      },
      claims: [
        { kind: 'system', matrix: 'I', is: 'infinite' },
        { kind: 'expr', expr: 'cIsV - sB', equals: [['0'], ['0'], ['0']] },
      ],
    },
    {
      id: 'try-rank',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: 'Bu eşelon formda $r_A$ kaç?',
      body: 'Yalnız çizginin solundaki kısma bak.',
      skill: 'rank-from-echelon',
      scene: { items: ['IEnd'] },
      answer: '2',
      feedbackWrong: 'Sol kısımda en az bir elemanı sıfırdan farklı olan satırları say.',
      solution: 'İlk iki satırda pivot var, üçüncü satır sıfır: $r_A = 2$.',
      claims: [{ kind: 'rank', matrix: 'IEnd', columns: 3, equals: '2' }],
    },
    {
      id: 'try-classify',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: 'Eşelon formu verilen sistemin kaç çözümü var?',
      skill: 'classify-system',
      scene: { items: ['Q'] },
      options: [
        {
          key: 'a',
          content: [text('Tek çözüm')],
          errorType: 'ignored-last-row',
          feedback: 'Son satır $0x + 0y + 0z = 5$ diyor: hiçbir $(x, y, z)$ bunu sağlamaz.',
        },
        {
          key: 'b',
          content: [text('Sonsuz çözüm')],
          errorType: 'zero-row-means-infinite',
          feedback: 'Solda sıfır satır var ama sağda $5$: bu çelişki, serbest değişken değil.',
        },
        { key: 'c', content: [text('Çözüm yok')] },
      ],
      answer: 'c',
      solution: '$r_A = 2$, $r_B = 3$: $r_A < r_B$, çözüm yok.',
      claims: [
        { kind: 'rank', matrix: 'Q', columns: 3, equals: '2' },
        { kind: 'rank', matrix: 'Q', equals: '3' },
        { kind: 'system', matrix: 'Q', is: 'none', answer: true },
      ],
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'Sistemi rankla oku',
      points: [
        '$Ax = b$ → $[A \\mid b]$ → eşelon form → sondan geri çöz.',
        '$r_A < r_B$: çözüm yok.',
        '$r_A = r_B = n$: tek çözüm.',
        '$r_A = r_B < n$: sonsuz çözüm, $n - r_A$ serbest değişken.',
      ],
    },
  ],
}

import { text } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

const m = (label: string, rows: readonly (readonly string[])[]): MatrixBlock => ({
  kind: 'matrix',
  delimiter: 'brackets',
  rows,
  label,
})

/** S3: Ax = 0 always has x = 0; non-trivial solutions exist exactly when r_A < n (|A| = 0 if square). */
export const s3HomogeneousSystems: Lesson = {
  id: 's3-homogeneous-systems',
  node: 'S3',
  title: 'Homojen sistemler',
  matrices: {
    HZ: {
      kind: 'matrix',
      delimiter: 'brackets',
      rows: [
        ['1', '2', '-1', '0'],
        ['2', '-1', '3', '0'],
        ['1', '2', '-1', '0'],
      ],
      label: '$[A \\mid 0]$ =',
      augmentedAt: 3,
    },
    H: m('A =', [
      ['1', '2', '-1'],
      ['2', '5', '1'],
      ['1', '3', '2'],
    ]),
    hV: m('', [['7'], ['-3'], ['1']]),
    W: m('A =', [
      ['1', '2', '-1', '3'],
      ['2', '1', '0', '1'],
    ]),
    K: m('A =', [
      ['1', '2', '1'],
      ['2', 'k', '3'],
      ['1', '1', '2'],
    ]),
    KZ: {
      kind: 'matrix',
      delimiter: 'brackets',
      rows: [
        ['1', '2', '1', '0'],
        ['2', 'k', '3', '0'],
        ['1', '1', '2', '0'],
      ],
      label: '$[A \\mid 0]$ =',
      augmentedAt: 3,
    },
  },
  steps: [
    {
      id: 'hook',
      kind: 'explain',
      eyebrow: 'Soru',
      title: 'Sağ taraf 0 ise çözüm her zaman var mı?',
      body: '$Ax = 0$ sistemine $x = 0$ koy. Ne olur?',
      scene: { items: ['H'] },
    },
    {
      id: 'trivial',
      kind: 'explain',
      eyebrow: 'Gözlem',
      title: '$x = 0$ her zaman çözüm',
      body: 'Buna {ok}aşikâr çözüm{/ok} denir. Homojen sistem asla çözümsüz olmaz. Soru: başka çözüm var mı?',
      scene: { items: ['H'] },
      beat: { kind: 'equation', lines: ['A \\cdot 0 = 0'] },
    },
    {
      id: 'nontrivial',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Aşikâr olmayan çözüm ⇔ $r_A < n$',
      body: 'Kare $A$ için bu, $|A| = 0$ demek. Burada $r_A = 2 < 3$: çözümler $t(7, -3, 1)$.',
      scene: { items: ['H', 'hV'] },
      beat: { kind: 'product', left: 'H', right: 'hV', cells: [[0, 0]] },
      claims: [
        { kind: 'det', matrix: 'H', equals: '0' },
        { kind: 'rank', matrix: 'H', equals: '2' },
        { kind: 'expr', expr: 'HhV', equals: [['0'], ['0'], ['0']] },
      ],
    },
    {
      id: 'wide',
      kind: 'explain',
      eyebrow: 'Kural',
      title: 'Bilinmeyen sayısı denklem sayısından fazlaysa',
      body: '2 denklem, 4 bilinmeyen: hesapsız {ok}sonsuz çözüm{/ok}.',
      beat: { kind: 'equation', lines: ['r_A \\leq 2 < 4 = n'] },
      scene: { items: ['W'] },
      claims: [{ kind: 'rank', matrix: 'W', equals: '2' }],
    },
    {
      id: 'try-wide',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '3 denklem, 5 bilinmeyenli homojen sistem. Kaç çözüm?',
      skill: 'classify-homogeneous',
      options: [
        {
          key: 'a',
          content: [text('Yalnız $x = 0$')],
          errorType: 'det-zero-ignored',
          feedback: '$r_A \\leq 3 < 5$: serbest değişken kesin var.',
        },
        { key: 'b', content: [text('Sonsuz çözüm')] },
        {
          key: 'c',
          content: [text('Çözüm yok')],
          errorType: 'homogeneous-no-solution',
          feedback: 'Homojen sistemde $x = 0$ her zaman çözüm.',
        },
      ],
      answer: 'b',
      reveal: { kind: 'equation', lines: ['r_A \\leq 3 < 5', '5 - 3 = 2 \\text{ serbest değişken (en az)}'] },
      solution: '$r_A \\leq 3 < 5$: sonsuz çözüm.',
    },
    {
      id: 'try-k',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: 'Sistemin aşikâr olmayan çözümü olması için $k$ kaç olmalı?',
      body: 'Kare sistem: $|A| = 0$ yaz.',
      skill: 'homogeneous-parameter',
      scene: { items: ['K'] },
      answer: '3',
      feedbackWrong: '1. satırdan aç: $1(2k - 3) - 2(4 - 3) + 1(2 - k)$.',
      reveal: {
        kind: 'equation',
        lines: ['|A| = 1(2k - 3) - 2(4 - 3) + 1(2 - k)', '= k - 3 = 0 \\Rightarrow k = 3'],
      },
      solution: '$|A| = k - 3 = 0$, $k = 3$.',
      claims: [{ kind: 'detRoots', matrix: 'K', variable: 'k', roots: ['3'], answer: true }],
    },
    {
      id: 'exam-homogeneous',
      kind: 'choice',
      eyebrow: 'Sınav tipi',
      title: '$k = 3$ için $Ax = 0$ sistemi hakkında hangisi doğrudur?',
      skill: 'classify-homogeneous',
      scene: { items: ['K'] },
      options: [
        {
          key: 'a',
          content: [text('Tek çözüm')],
          errorType: 'det-zero-ignored',
          feedback: '$k = 3$’te $|A| = 0$: sıfırdan başka çözümler de var.',
        },
        { key: 'b', content: [text('Sonsuz çözüm')] },
        {
          key: 'c',
          content: [text('Çözüm yok')],
          errorType: 'homogeneous-no-solution',
          feedback: 'Homojen sistem her zaman $x = 0$’ı çözüm olarak kabul eder; "çözüm yok" olamaz.',
        },
      ],
      answer: 'b',
      reveal: {
        kind: 'equation',
        lines: ['k = 3: |A| = 0', 'r_A = 2 < 3 \\Rightarrow \\text{sonsuz çözüm}'],
      },
      solution: '$|A| = 0$, $r_A = 2 < 3$: bir serbest değişken, sonsuz çözüm.',
      claims: [
        { kind: 'rank', matrix: 'K', at: { k: '3' }, equals: '2' },
        { kind: 'system', matrix: 'KZ', at: { k: '3' }, is: 'infinite', answer: true },
        { kind: 'system', matrix: 'KZ', at: { k: '0' }, is: 'unique' },
      ],
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'Homojen sistemler',
      points: [
        '$Ax = 0$ her zaman $x = 0$ çözümüne sahiptir; "çözüm yok" şıkkı yanlıştır.',
        'Aşikâr olmayan çözüm ⇔ $r_A < n$ ⇔ (kare ise) $|A| = 0$.',
        'Bilinmeyen sayısı denklem sayısından fazlaysa her zaman sonsuz çözüm.',
        'Serbest değişken sayısı $n - r_A$.',
      ],
    },
  ],
  moment: {
    id: 'moment-twin-equations',
    kind: 'choice',
    eyebrow: 'Gizli an',
    title: 'Hesaplamadan söyle: bu sistemin kaç çözümü var?',
    body: 'Denklemlere tek tek bak.',
    skill: 'homogeneous-repeated-equation',
    scene: { items: ['HZ'] },
    options: [
      {
        key: 'a',
        content: [text('Tek çözüm')],
        errorType: 'square-means-unique',
        feedback: 'Kare olması yetmez. 1. ve 3. denklem aynı; geriye 3 bilinmeyene 2 denklem kalır.',
      },
      { key: 'b', content: [text('Sonsuz çözüm')] },
      {
        key: 'c',
        content: [text('Çözüm yok')],
        errorType: 'homogeneous-no-solution',
        feedback: 'Homojen sistemde $x = 0$ her zaman çözüm; "çözüm yok" olamaz.',
      },
    ],
    answer: 'b',
    reveal: {
      kind: 'frames',
      frames: [
        {
          clear: true,
          marks: [
            { cell: ['HZ', 0, '*'], tone: 'row' },
            { cell: ['HZ', 2, '*'], tone: 'row' },
          ],
          note: '1. ve 3. denklem aynı',
        },
        { marks: [{ cell: ['HZ', 1, '*'], tone: 'ok' }], note: '$r_A = 2 < 3$ ⇒ sonsuz çözüm' },
      ],
    },
    solution:
      '1. ve 3. denklem aynı, 1. ve 2. orantılı değil: $r_A = 2 < 3$ bilinmeyen. Bir serbest değişken kalır, sonsuz çözüm.',
    claims: [
      { kind: 'rank', matrix: 'HZ', columns: 3, equals: '2' },
      { kind: 'system', matrix: 'HZ', is: 'infinite', answer: true },
    ],
  },
}

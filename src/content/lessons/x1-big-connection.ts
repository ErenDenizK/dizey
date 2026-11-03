import { text } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

const m = (label: string, rows: readonly (readonly string[])[], augmentedAt?: number): MatrixBlock => ({
  kind: 'matrix',
  delimiter: 'brackets',
  rows,
  label,
  ...(augmentedAt === undefined ? {} : { augmentedAt }),
})

/**
 * X1: the Büyük Bağlantı Teoremi, the invertible matrix theorem at Midterm 1 scope. For a square matrix:
 * regular, |A| ≠ 0, rank n, reduces to I, Ax = 0 only trivial, Ax = b unique for every b and
 * A⁻¹ = Ek(A)/|A| are one statement; singular negates all of them. Only links taught earlier
 * (M11, R3, R4, D4, S1, S3).
 */
export const x1BigConnection: Lesson = {
  id: 'x1-big-connection',
  node: 'X1',
  title: 'Büyük Bağlantı Teoremi',
  matrices: {
    T: m('$A$ =', [
      ['1', '2'],
      ['3', '4'],
    ]),
    U: m('$B$ =', [
      ['2', '4'],
      ['1', '2'],
    ]),
    R: m('$R$ =', [
      ['1', '2', '1'],
      ['0', '1', '3'],
      ['2', '5', '6'],
    ]),
    RI: m('$I$ =', [
      ['1', '0', '0'],
      ['0', '1', '0'],
      ['0', '0', '1'],
    ]),
    S: m('$S$ =', [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
    ]),
    SEnd: m('', [
      ['1', '2', '3'],
      ['0', '-3', '-6'],
      ['0', '0', '0'],
    ]),
    V: m('$x$ =', [['1'], ['-2'], ['1']]),
    TB: m(
      '$[A \\mid b]$ =',
      [
        ['1', '2', '5'],
        ['3', '4', '6'],
      ],
      2,
    ),
    UB1: m(
      '$[B \\mid b]$ =',
      [
        ['2', '4', '1'],
        ['1', '2', '1'],
      ],
      2,
    ),
    UB2: m(
      '$[B \\mid b]$ =',
      [
        ['2', '4', '2'],
        ['1', '2', '1'],
      ],
      2,
    ),
  },
  steps: [
    {
      id: 'hook',
      kind: 'explain',
      eyebrow: 'Soru',
      title: 'Tek bir bilgi kaç şıkkı eler?',
      body: '$|S| = 0$ olduğunu biliyorsun. Bu tek bilgi $S$ hakkında başka neleri söylüyor? Halkaları tek tek bağlayalım.',
      scene: { items: ['S'] },
      claims: [{ kind: 'det', matrix: 'S', equals: '0' }],
    },
    {
      id: 'link-det',
      kind: 'explain',
      eyebrow: 'Halka 1',
      title: 'Determinant ve ters',
      body: '$|A| \\neq 0$ ise ters var, $|B| = 0$ ise yok. {ok}Regüler{/ok} dediğimiz tam olarak bu.',
      scene: { items: ['T', 'U'] },
      beat: {
        kind: 'equation',
        lines: ['|A| = 4 - 6 = -2 \\neq 0', '|B| = 4 - 4 = 0'],
      },
      claims: [
        { kind: 'det', matrix: 'T', equals: '-2' },
        { kind: 'det', matrix: 'U', equals: '0' },
      ],
    },
    {
      id: 'link-rref-regular',
      kind: 'explain',
      eyebrow: 'Halka 2',
      title: 'Regüler matris $I$’ya iner',
      body: 'Satır işlemleriyle $R$’yi indirgersen sonunda birim matris çıkar. {ok}$|R| = 1 \\neq 0${/ok}, rank 3.',
      scene: { items: ['R'] },
      beat: {
        kind: 'rowOps',
        matrix: 'R',
        ops: [
          { kind: 'addMultiple', target: 2, source: 0, factor: '-2' },
          { kind: 'addMultiple', target: 2, source: 1, factor: '-1' },
          { kind: 'addMultiple', target: 1, source: 2, factor: '-3' },
          { kind: 'addMultiple', target: 0, source: 2, factor: '-1' },
          { kind: 'addMultiple', target: 0, source: 1, factor: '-2' },
        ],
        result: 'RI',
      },
      claims: [
        { kind: 'det', matrix: 'R', equals: '1' },
        { kind: 'rank', matrix: 'R', equals: '3' },
      ],
    },
    {
      id: 'link-rref-singular',
      kind: 'explain',
      eyebrow: 'Halka 3',
      title: 'Singüler matriste sıfır satır çıkar',
      body: '$S$’yi indirge: son satır sıfırlandı. {ok}Rank 2 < 3{/ok}, sonuç asla $I$ olamaz.',
      scene: { items: ['S'] },
      beat: {
        kind: 'rowOps',
        matrix: 'S',
        ops: [
          { kind: 'addMultiple', target: 1, source: 0, factor: '-4' },
          { kind: 'addMultiple', target: 2, source: 0, factor: '-7' },
          { kind: 'addMultiple', target: 2, source: 1, factor: '-2' },
        ],
        result: 'SEnd',
      },
      claims: [{ kind: 'rank', matrix: 'S', equals: '2' }],
    },
    {
      id: 'try-rank',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '$S$’nin eşelon formunda sıfır satır çıktı. Hangisi doğru?',
      skill: 'big-connection',
      scene: { items: ['SEnd'] },
      options: [
        {
          key: 'a',
          content: [text('rank $S = 3$, $S$ regüler')],
          errorType: 'rank-counts-rows',
          feedback: 'Rank, sıfırdan farklı satır sayısı: burada 2. Sıfır satır rankı düşürür.',
        },
        { key: 'b', content: [text('rank $S = 2$, $|S| = 0$, $S$ singüler')] },
        {
          key: 'c',
          content: [text('rank $S = 2$ ama $|S| \\neq 0$')],
          errorType: 'rank-det-split',
          feedback: 'Rank $n$’den küçükse determinant mutlaka $0$. İkisi birlikte gider.',
        },
      ],
      answer: 'b',
      reveal: { kind: 'equation', lines: ['\\text{rank} = 2 < 3', '\\iff |S| = 0'] },
      solution: 'Sıfır satır: rank $2 < 3$. Rank $n$’den küçükse $|S| = 0$, yani $S$ singüler.',
      claims: [{ kind: 'rank', matrix: 'SEnd', equals: '2' }],
    },
    {
      id: 'link-homogeneous',
      kind: 'explain',
      eyebrow: 'Halka 4',
      title: '$Sx = 0$’ın aşikâr olmayan çözümü var',
      body: '$x = (1, -2, 1)$ için $Sx = 0$. {ok}Singülerde{/ok} sıfırdan başka çözüm var; regülerde yalnız aşikâr çözüm kalır.',
      scene: { items: ['S', 'V'] },
      beat: {
        kind: 'product',
        left: 'S',
        right: 'V',
        cells: [
          [0, 0],
          [1, 0],
          [2, 0],
        ],
      },
      claims: [{ kind: 'expr', expr: 'SV', equals: [['0'], ['0'], ['0']] }],
    },
    {
      id: 'link-unique',
      kind: 'explain',
      eyebrow: 'Halka 5',
      title: 'Regüler: her $b$ için tek çözüm',
      body: '$r_A = r_B = n$ hep sağlanır, sağ taraf ne olursa olsun. $A$ regüler olduğu için $x = A^{-1}b$.',
      scene: { items: ['TB'] },
      claims: [
        { kind: 'rank', matrix: 'TB', columns: 2, equals: '2' },
        { kind: 'system', matrix: 'TB', is: 'unique' },
      ],
    },
    {
      id: 'link-unique-singular',
      kind: 'explain',
      eyebrow: 'Halka 5',
      title: 'Singüler: $b$’ye göre ya çözüm yok ya sonsuz',
      body: 'Aynı $B$, iki farklı $b$. Soldaki: $r_A = 1 < r_B = 2$, çözüm yok. Sağdaki: $r_A = r_B = 1 < 2$, sonsuz çözüm. {ok}Hiçbir $b$ için tek çözüm yok{/ok}.',
      scene: { items: ['UB1', 'UB2'] },
      claims: [
        { kind: 'system', matrix: 'UB1', is: 'none' },
        { kind: 'system', matrix: 'UB2', is: 'infinite' },
      ],
    },
    {
      id: 'link-inverse',
      kind: 'explain',
      eyebrow: 'Halka 6',
      title: 'Ters formülü yalnız $|A| \\neq 0$ iken çalışır',
      body: '$A^{-1} = \\text{Ek}(A) / |A|$. Singülerde $|A| = 0$: sıfıra bölemezsin, ters yok.',
      scene: { items: ['T'] },
      beat: {
        kind: 'equation',
        lines: [
          '\\text{Ek}(A) = \\begin{bmatrix} 4 & -2 \\\\ -3 & 1 \\end{bmatrix}',
          'A^{-1} = \\frac{1}{-2} \\text{Ek}(A)',
        ],
      },
      claims: [
        {
          kind: 'derived',
          of: 'adjugate',
          matrix: 'T',
          equals: [
            ['4', '-2'],
            ['-3', '1'],
          ],
        },
        {
          kind: 'derived',
          of: 'inverse',
          matrix: 'T',
          equals: [
            ['-2', '1'],
            ['3/2', '-1/2'],
          ],
        },
      ],
    },
    {
      id: 'regular-side',
      kind: 'explain',
      eyebrow: 'Teorem',
      title: '$n \\times n$ $A$ için hepsi aynı cümle',
      body: 'Biri doğruysa {ok}hepsi doğru{/ok}, biri yanlışsa hepsi yanlış.',
      beat: {
        kind: 'equation',
        lines: [
          'A \\text{ regüler}',
          '\\iff |A| \\neq 0',
          '\\iff \\text{rank}(A) = n',
          '\\iff A \\text{ indirgenince } I',
          '\\iff Ax = 0 \\text{ yalnız } x = 0',
          '\\iff Ax = b \\text{ her } b \\text{ için tek çözüm}',
          '\\iff A^{-1} = \\text{Ek}(A) / |A|',
        ],
      },
    },
    {
      id: 'singular-side',
      kind: 'explain',
      eyebrow: 'Tersi',
      title: 'Singülerde hepsi birden tersine döner',
      body: 'Tek bir sıfır, bütün listeyi çevirir.',
      beat: {
        kind: 'equation',
        lines: [
          'A \\text{ singüler}',
          '\\iff |A| = 0',
          '\\iff \\text{rank}(A) < n',
          '\\iff \\text{sıfır satır çıkar}',
          '\\iff Ax = 0 \\text{ sonsuz çözüm}',
          '\\iff Ax = b \\text{ çözümsüz ya da sonsuz}',
          '\\iff A^{-1} \\text{ yok}',
        ],
      },
    },
    {
      id: 'exam-rank',
      kind: 'choice',
      eyebrow: 'Sınav tipi',
      title: '$3 \\times 3$ bir $A$ matrisinin ranki $2$. Hangisi kesinlikle doğrudur?',
      skill: 'big-connection',
      options: [
        {
          key: 'a',
          content: [text('$A^{-1}$ vardır')],
          errorType: 'rank-below-n-invertible',
          feedback: 'Rank $2 < 3$: singüler, ters yok.',
        },
        {
          key: 'b',
          content: [text('$|A| \\neq 0$')],
          errorType: 'rank-below-n-invertible',
          feedback: 'Rank $n$’den küçükse $|A| = 0$.',
        },
        {
          key: 'c',
          content: [text('$Ax = 0$ yalnız $x = 0$ verir')],
          errorType: 'rank-below-n-invertible',
          feedback: 'Rank $2 < 3$: serbest değişken var, sonsuz çözüm.',
        },
        {
          key: 'd',
          content: [text('$Ax = b$ her $b$ için tek çözümlü')],
          errorType: 'rank-below-n-invertible',
          feedback: 'Tek çözüm için rank $n$ gerekir.',
        },
        { key: 'e', content: [text('$|A| = 0$')] },
      ],
      answer: 'e',
      reveal: {
        kind: 'equation',
        lines: ['\\text{rank} = 2 < 3', '\\Rightarrow |A| = 0'],
      },
      solution:
        'Rank $3$ olmadığı için $A$ singüler: $|A| = 0$. Diğer dört şık regüler matrisin özellikleri.',
    },
    {
      id: 'exam-trap',
      kind: 'choice',
      eyebrow: 'Sınav tipi',
      title: '$4 \\times 4$ bir $A$ için $|A| = 0$. Hangisi kesinlikle doğrudur?',
      skill: 'big-connection',
      options: [
        {
          key: 'a',
          content: [text('$Ax = b$ sistemi çözümsüzdür')],
          errorType: 'det-zero-means-none',
          feedback: '$|A| = 0$ yalnız "tek çözüm yok" der. $b$ uygunsa sonsuz çözüm de olur.',
        },
        {
          key: 'b',
          content: [text('rank $A = 4$')],
          errorType: 'rank-below-n-invertible',
          feedback: '$|A| = 0$ ise rank $4$’ten küçük.',
        },
        { key: 'c', content: [text('$Ax = 0$’ın aşikâr olmayan çözümü vardır')] },
        {
          key: 'd',
          content: [text('$A^{-1} = \\text{Ek}(A) / |A|$')],
          errorType: 'rank-below-n-invertible',
          feedback: '$|A| = 0$’a bölemezsin; ters yok.',
        },
        {
          key: 'e',
          content: [text('$Ax = b$ her $b$ için tek çözümlü')],
          errorType: 'rank-below-n-invertible',
          feedback: 'Singülerde hiçbir $b$ için tek çözüm yok.',
        },
      ],
      answer: 'c',
      reveal: {
        kind: 'equation',
        lines: ['|A| = 0 \\Rightarrow r_A < 4', 'Ax = 0 \\text{ için serbest değişken var}'],
      },
      solution:
        '$|A| = 0$ ise $r_A < 4$: $Ax = 0$ sonsuz çözümlüdür. $Ax = b$ ise $b$’ye göre çözümsüz ya da sonsuz olur; a şıkkı "kesin" değil.',
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'Büyük Bağlantı Teoremi',
      points: [
        '$n \\times n$ $A$ regüler ⇔ $|A| \\neq 0$ ⇔ rank $n$ ⇔ indirgenmiş hali $I$.',
        'Regüler ⇔ $Ax = 0$ yalnız aşikâr çözüm ⇔ $Ax = b$ her $b$ için tek çözüm ⇔ $A^{-1} = \\text{Ek}(A)/|A|$.',
        'Singüler: hepsi tersine döner. $|A| = 0$, rank $< n$, sıfır satır, $Ax = 0$ sonsuz çözüm, ters yok.',
        'Bir halkayı bilince bütün listeyi bilirsin: şıkları hesaplamadan ele.',
        '$|A| = 0$ "çözüm yok" demek değil, "tek çözüm yok" demek.',
      ],
    },
  ],
}

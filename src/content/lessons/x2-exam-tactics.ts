import { text } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

const m = (
  label: string,
  rows: readonly (readonly string[])[],
  options: { bars?: true; augmentedAt?: number } = {},
): MatrixBlock => ({
  kind: 'matrix',
  delimiter: options.bars ? 'bars' : 'brackets',
  rows,
  label,
  ...(options.augmentedAt === undefined ? {} : { augmentedAt: options.augmentedAt }),
})

/**
 * X2: exam tactics for the multiple-choice paper: work back from the options, check sizes first, fast
 * determinant routes, the |kA| = kⁿ|A| trap, k-system case tables and killing options with X1. Items are
 * modelled on past Midterm 1 items (2024 summer 11, 12, 8, 18).
 */
export const x2ExamTactics: Lesson = {
  id: 'x2-exam-tactics',
  node: 'X2',
  title: 'Sınav taktikleri',
  matrices: {
    P: m('$A$ =', [
      ['1', '2', '3'],
      ['1', '2', '1'],
    ]),
    W1: m('', [['-2'], ['1'], ['0']]),
    W2: m('', [['3'], ['2'], ['1']]),
    W3: m('', [['2'], ['3'], ['1']]),
    Prop: m(
      '',
      [
        ['2', '-1', '4'],
        ['1', '3', '5'],
        ['4', '-2', '8'],
      ],
      { bars: true },
    ),
    Tri: m(
      '',
      [
        ['2', '0', '0'],
        ['7', '3', '0'],
        ['1', '9', '-4'],
      ],
      { bars: true },
    ),
    Z: m(
      '$|A|$ =',
      [
        ['k', '0', '2'],
        ['8', '0', 'k'],
        ['4', '1', '3'],
      ],
      { bars: true },
    ),
    Q: m(
      '$|A|$ =',
      [
        ['2', '0', '0'],
        ['0', '2', '0'],
        ['0', '0', '1'],
      ],
      { bars: true },
    ),
    KA: m('$A$ =', [
      ['2', '-1', 'k+2'],
      ['k', '-1', '3'],
      ['-6', '3', '3'],
    ]),
    KS: m(
      '$[A \\mid b]$ =',
      [
        ['2', '-1', 'k+2', '1'],
        ['k', '-1', '3', '0'],
        ['-6', '3', '3', '-3'],
      ],
      { augmentedAt: 3 },
    ),
  },
  steps: [
    {
      id: 'hook',
      kind: 'explain',
      eyebrow: 'Soru',
      title: 'Aynı soru: 20 saniye mi, 3 dakika mı?',
      body: 'Çoktan seçmelide şıklar da bilgi. Altı alışkanlık, her biri gerçek bir vize sorusunda.',
      beat: {
        kind: 'equation',
        lines: [
          '\\text{1. Şıkları yerine koy}',
          '\\text{2. Önce tipe bak}',
          '\\text{3. Sıfır satır, orantılı satır}',
          '\\text{4. En çok sıfırlı satır ya da sütun}',
          '\\text{5. } |kA| = k^n |A|',
          '\\text{6. Büyük Bağlantı ile şık ele}',
        ],
      },
    },
    {
      id: 'plug-in',
      kind: 'explain',
      eyebrow: 'Taktik 1',
      title: 'Çözüm sorulursa çözme, dene',
      body: 'Şıktaki sayıları denkleme koymak, sistemi çözmekten çok daha kısa. Bir denklem bile tutmazsa şık gider.',
      scene: { items: ['P'] },
    },
    {
      id: 'exam-plug',
      kind: 'choice',
      eyebrow: 'Sınav tipi',
      title: '$x + 2y + 3z = 0$, $x + 2y + z = 0$ sisteminin çözümü hangisi?',
      body: 'Her şıkkı 2. denkleme koy: $x + 2y + z$.',
      skill: 'plug-in-options',
      scene: { items: ['P'] },
      options: [
        {
          key: 'a',
          content: [text('$(x, y, z) = (3k, 2k, k)$')],
          errorType: 'not-substituted',
          feedback: '1. denklemde $3k + 4k + 3k = 10k$, sıfır değil.',
        },
        {
          key: 'b',
          content: [text('$(x, y, z) = (2k, 3k, k)$')],
          errorType: 'not-substituted',
          feedback: '1. denklemde $2k + 6k + 3k = 11k$, sıfır değil.',
        },
        { key: 'c', content: [text('$(x, y, z) = (-2k, k, 0)$')] },
        {
          key: 'd',
          content: [text('Sistemin çözümü yoktur')],
          errorType: 'homogeneous-has-no-solution',
          feedback: 'Sağ taraf $0$: $x = y = z = 0$ her zaman çözüm.',
        },
      ],
      answer: 'c',
      reveal: { kind: 'equation', lines: ['(-2k) + 2k + 0 = 0', '(-2k) + 2k + 3 \\cdot 0 = 0'] },
      solution: '$(-2k, k, 0)$ iki denklemi de sağlar. Üç şıkkı elemek bir iki toplamdan fazla sürmez.',
      claims: [
        { kind: 'expr', expr: 'PW1', equals: [['0'], ['0']] },
        { kind: 'expr', expr: 'PW2', equals: [['10'], ['8']] },
        { kind: 'expr', expr: 'PW3', equals: [['11'], ['9']] },
      ],
    },
    {
      id: 'exam-size',
      kind: 'choice',
      eyebrow: 'Taktik 2',
      title: '$A$ matrisi $2 \\times 2$, $AB$ çarpımı $2 \\times 4$. $B$ hangi tiptendir?',
      body: 'Hesaba girmeden önce tipleri yaz: iç sayılar eşit, dış sayılar sonuç.',
      skill: 'size-first',
      options: [
        {
          key: 'a',
          content: [text('$2 \\times 2$')],
          errorType: 'size-ignored',
          feedback: '$2 \\times 2$ çarpı $2 \\times 2$ yine $2 \\times 2$ verir; sonuç $2 \\times 4$.',
        },
        {
          key: 'b',
          content: [text('$4 \\times 2$')],
          errorType: 'size-swapped',
          feedback: '$2 \\times 2$ çarpı $4 \\times 2$ tanımsız: iç sayılar $2$ ile $4$.',
        },
        { key: 'c', content: [text('$2 \\times 4$')] },
        {
          key: 'd',
          content: [text('$4 \\times 4$')],
          errorType: 'size-ignored',
          feedback: '$2 \\times 2$ çarpı $4 \\times 4$ tanımsız: iç sayılar $2$ ile $4$.',
        },
      ],
      answer: 'c',
      reveal: {
        kind: 'equation',
        lines: ['(2 \\times 2)(\\,? \\times ?\\,) = (2 \\times 4)', 'B: 2 \\times 4'],
      },
      solution: 'İç sayılar eşit olmalı: $B$’nin satırı $2$. Dış sayılar sonucu verir: $B$’nin sütunu $4$.',
    },
    {
      id: 'zero-line',
      kind: 'explain',
      eyebrow: 'Taktik 3',
      title: 'Sıfır satır ya da orantılı satır: determinant $0$',
      body: '3. satır 1. satırın 2 katı. Hesaplamadan {ok}$|A| = 0${/ok}: bir satır diğerinin katıysa sıfırlanır.',
      scene: { items: ['Prop'] },
      beat: {
        kind: 'frames',
        frames: [
          {
            clear: true,
            marks: [
              { cell: ['Prop', 0, '*'], tone: 'row' },
              { cell: ['Prop', 2, '*'], tone: 'row' },
            ],
            note: '$R_3 = 2R_1$',
          },
          { marks: [{ cell: ['Prop', 1, '*'], tone: 'ok' }], note: '$|A| = 0$' },
        ],
      },
      claims: [{ kind: 'det', matrix: 'Prop', equals: '0' }],
    },
    {
      id: 'try-triangle',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: 'Bu determinant kaç?',
      body: 'Köşegenin altı doluysa da üstü sıfır: üçgensel. Açma, köşegeni çarp.',
      skill: 'triangular-det',
      scene: { items: ['Tri'] },
      answer: '-24',
      feedbackWrong: 'Köşegen: $2$, $3$, $-4$. Üçünü çarp.',
      reveal: { kind: 'equation', lines: ['2 \\cdot 3 \\cdot (-4)', '= -24'] },
      solution: 'Üçgensel matriste determinant köşegen çarpımı: $2 \\cdot 3 \\cdot (-4) = -24$.',
      claims: [{ kind: 'det', matrix: 'Tri', equals: '-24', answer: true }],
    },
    {
      id: 'most-zeros',
      kind: 'explain',
      eyebrow: 'Taktik 4',
      title: 'Açarken en çok sıfırlı çizgiyi seç',
      body: '2. sütunda iki sıfır var. Orada yalnız bir terim kalır: $|A| = -(k^2 - 16)$. Terslenemez için $k = \\pm 4$.',
      scene: { items: ['Z'] },
      beat: {
        kind: 'frames',
        frames: [
          { clear: true, marks: [{ cell: ['Z', '*', 1], tone: 'col' }], note: '2. sütun: iki sıfır' },
          { marks: [{ cell: ['Z', 2, 1], tone: 'ok' }], note: 'tek terim: $1 \\cdot (-1)^{3+2}(k^2 - 16)$' },
        ],
      },
      claims: [
        { kind: 'detRoots', matrix: 'Z', variable: 'k', roots: ['4', '-4'] },
        { kind: 'det', matrix: 'Z', at: { k: '0' }, equals: '16' },
      ],
    },
    {
      id: 'exam-kn',
      kind: 'choice',
      eyebrow: 'Taktik 5',
      title: '$3 \\times 3$ matriste $|A| = 4$ ise $|2A|$ kaç?',
      skill: 'scalar-power-n',
      options: [
        {
          key: 'a',
          content: [text('$8$')],
          errorType: 'k-instead-of-k-power-n',
          feedback: '$|2A| = 2|A|$ değil. Üç satırın hepsi $2$ ile çarpıldı.',
        },
        {
          key: 'b',
          content: [text('$16$')],
          errorType: 'k-power-two',
          feedback: '$2^2$ değil: matris $3 \\times 3$, üs $n = 3$.',
        },
        { key: 'c', content: [text('$32$')] },
        {
          key: 'd',
          content: [text('$12$')],
          errorType: 'k-instead-of-k-power-n',
          feedback: '$3$ ile $4$’ü çarpmak yanlış: çarpan $2^n$ olur, $n \\cdot 4$ değil.',
        },
        {
          key: 'e',
          content: [text('$64$')],
          errorType: 'k-power-four',
          feedback: '$2^4$ değil: matris $3 \\times 3$, üs $n = 3$.',
        },
      ],
      answer: 'c',
      reveal: { kind: 'equation', lines: ['|2A| = 2^3 |A|', '= 8 \\cdot 4 = 32'] },
      solution: '$n \\times n$ matriste $|kA| = k^n|A|$. Burada $2^3 \\cdot 4 = 32$.',
      claims: [
        { kind: 'det', matrix: 'Q', equals: '4' },
        { kind: 'detProduct', scalar: '2', factors: [{ matrix: 'Q' }], equals: '32', answer: true },
      ],
    },
    {
      id: 'k-table',
      kind: 'explain',
      eyebrow: 'Taktik 6',
      title: 'Parametreli sistem: kökleri bul, şıklara bak',
      body: '$|A| = 3(k - 2)(k + 3)$, kökler $2$ ve $-3$. Şıklarda yalnız köklerden biri varsa, soru zaten bitti. Durum tablosu:',
      scene: { items: ['KS'] },
      beat: {
        kind: 'equation',
        lines: [
          'k \\neq 2,\\ k \\neq -3:\\ \\text{tek çözüm}',
          'k = 2:\\ \\text{çözüm yok } (r_A < r_B)',
          'k = -3:\\ \\text{sonsuz çözüm } (r_A = r_B < 3)',
        ],
      },
      claims: [
        { kind: 'detRoots', matrix: 'KA', variable: 'k', roots: ['2', '-3'] },
        { kind: 'rank', matrix: 'KA', at: { k: '2' }, equals: '2' },
        { kind: 'rank', matrix: 'KS', at: { k: '2' }, equals: '3' },
        { kind: 'rank', matrix: 'KS', at: { k: '-3' }, equals: '2' },
        { kind: 'system', matrix: 'KS', at: { k: '2' }, is: 'none' },
        { kind: 'system', matrix: 'KS', at: { k: '-3' }, is: 'infinite' },
        { kind: 'system', matrix: 'KS', at: { k: '0' }, is: 'unique' },
      ],
    },
    {
      id: 'exam-k',
      kind: 'choice',
      eyebrow: 'Sınav tipi',
      title: 'Sistemin sonsuz çözümünün olması için $k$ kaç olmalı?',
      skill: 'parametric-case',
      scene: { items: ['KS'] },
      options: [
        {
          key: 'a',
          content: [text('$3$')],
          errorType: 'nonzero-determinant',
          feedback: '$k = 3$ kök değil: $|A| \\neq 0$, tek çözüm.',
        },
        {
          key: 'b',
          content: [text('$9$')],
          errorType: 'nonzero-determinant',
          feedback: '$k = 9$ kök değil: $|A| \\neq 0$, tek çözüm.',
        },
        { key: 'c', content: [text('$-3$')] },
        {
          key: 'd',
          content: [text('$1/3$')],
          errorType: 'nonzero-determinant',
          feedback: '$k = 1/3$ kök değil: $|A| \\neq 0$, tek çözüm.',
        },
      ],
      answer: 'c',
      reveal: {
        kind: 'equation',
        lines: ['|A| = 0 \\iff k \\in \\{2, -3\\}', 'k = 2:\\ \\text{çözüm yok}', 'k = -3:\\ \\text{sonsuz}'],
      },
      solution:
        'Köklerden yalnız $-3$ şıklarda var. Emin olmak için: $k = -3$’te $r_A = r_B = 2 < 3$, sonsuz çözüm.',
      claims: [{ kind: 'optionSystem', matrix: 'KS', variable: 'k', is: 'infinite' }],
    },
    {
      id: 'exam-kill',
      kind: 'choice',
      eyebrow: 'Taktik 7',
      title: '$4 \\times 4$ $A$ için $Ax = 0$’ın aşikâr olmayan çözümü var. Hangisi kesinlikle yanlış?',
      body: 'Dört şık aynı cümleyi söylüyor. Aykırı olanı bul.',
      skill: 'big-connection',
      options: [
        {
          key: 'a',
          content: [text('$|A| = 0$')],
          errorType: 'misread-which-wrong',
          feedback: 'Aşikâr olmayan çözüm var: $A$ singüler, $|A| = 0$ doğru. Aradığın yanlış olan.',
        },
        {
          key: 'b',
          content: [text('rank $A < 4$')],
          errorType: 'misread-which-wrong',
          feedback: 'Singüler: rank $4$’ten küçük, doğru bir şık. Aradığın yanlış olan.',
        },
        {
          key: 'c',
          content: [text('$A^{-1}$ yoktur')],
          errorType: 'misread-which-wrong',
          feedback: 'Singüler matrisin tersi yok, doğru bir şık. Aradığın yanlış olan.',
        },
        { key: 'd', content: [text('$Ax = b$ her $b$ için tek çözümlü')] },
        {
          key: 'e',
          content: [text('$A$ indirgenince sıfır satır çıkar')],
          errorType: 'misread-which-wrong',
          feedback: 'Rank $4$’ten küçük: sıfır satır çıkar, doğru bir şık. Aradığın yanlış olan.',
        },
      ],
      answer: 'd',
      reveal: {
        kind: 'equation',
        lines: ['Ax = 0 \\text{ aşikâr olmayan çözüm}', '\\Rightarrow A \\text{ singüler}'],
      },
      solution:
        'Aşikâr olmayan çözüm: $A$ singüler. Dört şık singülerin özelliği, d regülerin özelliği: tek aykırı o.',
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'Sınav taktikleri',
      points: [
        'Çözüm istenirse şıkları denkleme koy; köklerle ilgiliyse önce kökleri bul, şıklara bak.',
        'Çarpımda önce tipleri yaz: iç sayılar eşit, dış sayılar sonuç.',
        'Determinant: sıfır ya da orantılı satır $\\Rightarrow 0$; üçgenselde köşegen çarpımı; açarken en çok sıfırlı çizgi.',
        '$n \\times n$ matriste $|kA| = k^n|A|$.',
        'Parametreli sistemde her kökü ayrı ayrı yerine koy: $r_A$ ile $r_B$.',
        'Büyük Bağlantı: bir şık singüler diyorsa, aynı cümledeki diğerleri de.',
      ],
    },
  ],
}

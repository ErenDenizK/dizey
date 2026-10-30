import { det, matrix, system, text } from './blocks'
import type { Option, Question } from './types'

/**
 * Practice bank B (keyed, two printed versions of most items), transcribed from the project files
 * and recomputed in vize1-practice-b.test.ts. Items 8 to 11 are vector spaces (Midterm 2) and are left out.
 */

const exam = 'practice-bank-b'

const statementOptions = (feedback: Partial<Record<'a' | 'b' | 'c' | 'd' | 'e', string>>, answer: string) =>
  (
    [
      ['a', 'Yalnız I'],
      ['b', 'Yalnız II'],
      ['c', 'Yalnız III'],
      ['d', 'Yalnız I ve III'],
      ['e', 'Yalnız II ve III'],
    ] as const
  ).map(
    ([key, label]): Option =>
      key === answer
        ? { key, content: [text(label)] }
        : { key, content: [text(label)], feedback: feedback[key] ?? '' },
  ) as unknown as Question['options']

const solutionKindOptions = (
  answer: string,
  feedback: Partial<Record<'a' | 'b' | 'c' | 'd' | 'e', string>>,
) =>
  (
    [
      ['a', 'Sistemin bir tek çözümü vardır.'],
      ['b', 'Sistemin bir parametreye bağlı sonsuz çözümü vardır.'],
      ['c', 'Sistemin iki parametreye bağlı sonsuz çözümü vardır.'],
      ['d', 'Sistemin üç parametreye bağlı sonsuz çözümü vardır.'],
      ['e', 'Sistemin çözümü yoktur.'],
    ] as const
  ).map(
    ([key, label]): Option =>
      key === answer
        ? { key, content: [text(label)] }
        : {
            key,
            content: [text(label)],
            errorType: 'skipped-consistency-check',
            feedback: feedback[key] ?? '',
          },
  ) as unknown as Question['options']

/** The five Cramer forms shared by both versions of item 6 (D and E corrected, see source notes). */
const cramerForms: readonly (readonly (readonly string[])[])[] = [
  [
    ['2', '1', '1'],
    ['3', '6', '2'],
    ['1', '-1', '3'],
  ],
  [
    ['2', '1', '-1'],
    ['3', '6', '1'],
    ['1', '-1', '0'],
  ],
  [
    ['2', '1', '1'],
    ['3', '2', '6'],
    ['1', '3', '-1'],
  ],
  [
    ['2', '1', '1'],
    ['3', '2', '6'],
    ['1', '3', '1'],
  ],
  [
    ['2', '1', '-1'],
    ['3', '6', '1'],
    ['1', '1', '0'],
  ],
]

const cramerOptions = (answer: 'b' | 'c', unknown: 'y' | 'z') => {
  const column = unknown === 'y' ? '2.' : '3.'
  const generic = `$\\Delta_${unknown}$: katsayılar matrisinin ${column} sütunu yerine sağ taraf $(1, 6, -1)$ yazılır, diğer sütunlar aynen kalır.`
  const notes: Record<'a' | 'b' | 'c' | 'd' | 'e', string> = {
    a: generic,
    b: unknown === 'z' ? 'Bu $\\Delta_y$: sağ taraf 2. sütuna yazılmış; $z$ için 3. sütun.' : '',
    c: unknown === 'y' ? 'Bu $\\Delta_z$: sağ taraf 3. sütuna yazılmış; $y$ için 2. sütun.' : '',
    d: unknown === 'z' ? 'Sağ tarafın son elemanı $-1$, işareti kaymış.' : generic,
    e: unknown === 'y' ? 'Sağ tarafın son elemanı $-1$, işareti kaymış.' : generic,
  }
  return (['a', 'b', 'c', 'd', 'e'] as const).map((key, i): Option => {
    const content = [text('$-\\frac{1}{12}$'), det(cramerForms[i] ?? [])]
    return key === answer ? { key, content } : { key, content, feedback: notes[key] }
  }) as unknown as Question['options']
}

export const vize1PracticeB: readonly Question[] = [
  {
    id: 'v1-pb-04',
    node: 'D3',
    alsoNodes: ['D2'],
    source: { exam, item: 4 },
    stem: [
      text('$a$ ve $b$ birbirinden farklı reel sayılar olmak üzere'),
      det([
        ['a+b', 'ab', '0'],
        ['1', 'a+b', 'ab'],
        ['0', '1', 'a+b'],
      ]),
      text('determinantının sonucu aşağıdakilerden hangisidir?'),
    ],
    options: [
      {
        key: 'a',
        content: [text('$\\frac{a^3 - b^3}{a - b}$')],
        errorType: 'other',
        feedback: 'Bu $a^2 + ab + b^2$; determinant $(a + b)(a^2 + b^2)$, yani $a^3 + a^2b + ab^2 + b^3$.',
      },
      { key: 'b', content: [text('$\\frac{a^4 - b^4}{a - b}$')] },
      {
        key: 'c',
        content: [text('$\\frac{a^5 - b^5}{a - b}$')],
        errorType: 'other',
        feedback:
          'Bir derece fazla: $3 \\times 3$ determinantın her terimi üç çarpandan oluşur, sonuç 3. derece.',
      },
      {
        key: 'd',
        content: [text('$\\frac{a^6 - b^6}{a - b}$')],
        errorType: 'other',
        feedback:
          'Derece çok yüksek: $3 \\times 3$ determinantın her terimi üç çarpandan oluşur, sonuç 3. derece.',
      },
      {
        key: 'e',
        content: [text('$\\frac{a^7 - b^7}{a - b}$')],
        errorType: 'other',
        feedback:
          'Derece çok yüksek: $3 \\times 3$ determinantın her terimi üç çarpandan oluşur, sonuç 3. derece.',
      },
    ],
    answer: 'b',
    explanation:
      '1. sütuna göre aç: $(a + b)[(a + b)^2 - ab] - ab(a + b) = (a + b)(a^2 + b^2)$. $(a + b)(a^2 + b^2)(a - b) = a^4 - b^4$, yani sonuç $\\frac{a^4 - b^4}{a - b}$. Sınavda hızlısı: $a = 1$, $b = 0$ koy; determinant $1$, bütün şıklar $1$ verir, işe yaramaz. $a = 2$, $b = 1$: determinant $15$, yalnız (b) $15$.',
  },
  {
    id: 'v1-pb-06',
    node: 'S4',
    alsoNodes: ['D2'],
    source: {
      exam,
      item: 6,
      correction:
        'Printed options B and E both evaluate to -1 (= y), and C and D both to 2 (= x = z), so each version had two numerically correct options. D and E are replaced by the correct form with a sign slip in the right-hand side; all five values now differ.',
    },
    stem: [
      system('2x + y - z = 1', '3x + 2y + z = 6', 'x + 3y = -1'),
      text(
        'Yukarıdaki lineer denklem sistemi veriliyor. Cramer yöntemini kullanılarak sistem çözülürse $y$ değeri aşağıdakilerden hangisine eşit olur?',
      ),
    ],
    options: cramerOptions('b', 'y'),
    answer: 'b',
    explanation:
      '$\\Delta = -12$. $y = \\Delta_y / \\Delta = -\\frac{1}{12}\\Delta_y$; $\\Delta_y$ katsayılar matrisinin 2. sütunu yerine $(1, 6, -1)$ yazılarak bulunur. Değeri $12$, yani $y = -1$.',
  },
  {
    id: 'v1-pb-06t',
    node: 'S4',
    alsoNodes: ['D2'],
    source: {
      exam,
      item: 6,
      variant: 2,
      correction: 'Same option set as version 1, corrected the same way.',
    },
    stem: [
      system('2x + y - z = 1', '3x + 2y + z = 6', 'x + 3y = -1'),
      text(
        'Yukarıdaki lineer denklem sistemi veriliyor. Cramer yöntemini kullanılarak sistem çözülürse $z$ değeri aşağıdakilerden hangisine eşit olur?',
      ),
    ],
    options: cramerOptions('c', 'z'),
    answer: 'c',
    explanation:
      '$\\Delta = -12$. $z = -\\frac{1}{12}\\Delta_z$; $\\Delta_z$ katsayılar matrisinin 3. sütunu yerine $(1, 6, -1)$ yazılarak bulunur. Değeri $-24$, yani $z = 2$.',
  },
  {
    id: 'v1-pb-01',
    node: 'M9',
    alsoNodes: ['M5'],
    source: { exam, item: 1 },
    stem: [
      matrix(
        [
          ['√3/2', '1/2'],
          ['-1/2', '√3/2'],
        ],
        'P =',
      ),
      text(','),
      matrix(
        [
          ['1', '1'],
          ['0', '1'],
        ],
        'A =',
      ),
      text('ve $Q = PAP^T$ olmak üzere $P^TQ^{2005}P$ matrisi aşağıdakilerden hangisidir?'),
    ],
    options: [
      {
        key: 'a',
        content: [
          matrix([
            ['1', '2004'],
            ['0', '1'],
          ]),
        ],
        errorType: 'off-by-one-power',
        feedback: '$A^n$’in sağ üst elemanı $n$: $A^2$’de $2$, $A^{2005}$’te $2005$.',
      },
      {
        key: 'b',
        content: [
          matrix([
            ['1', '2005'],
            ['0', '1'],
          ]),
        ],
      },
      {
        key: 'c',
        content: [
          matrix([
            ['2004', '2004'],
            ['0', '1'],
          ]),
        ],
        feedback: '$A^n$’in köşegeni hep $1$ kalır; $A^2$’yi hesaplayıp deseni gör.',
      },
      {
        key: 'd',
        content: [
          matrix([
            ['2005', '2005'],
            ['0', '1'],
          ]),
        ],
        feedback: '$A^n$’in köşegeni hep $1$ kalır; $A^2$’yi hesaplayıp deseni gör.',
      },
      {
        key: 'e',
        content: [
          matrix([
            ['2004', '2005'],
            ['0', '1'],
          ]),
        ],
        feedback: '$A^n$’in köşegeni hep $1$ kalır; $A^2$’yi hesaplayıp deseni gör.',
      },
    ],
    answer: 'b',
    explanation:
      '$P$ ortogonal: $P^TP = PP^T = I$. $Q^n = PA^nP^T$ (aradaki $P^TP$’ler sadeleşir), yani $P^TQ^{2005}P = A^{2005}$. $A^2$’nin sağ üst elemanı $2$, $A^3$’ün $3$: $A^{2005}$’in satırları $(1, 2005)$, $(0, 1)$.',
  },
  {
    id: 'v1-pb-01t',
    node: 'M9',
    alsoNodes: ['M5'],
    source: { exam, item: 1, variant: 2 },
    stem: [
      matrix(
        [
          ['1/√2', '1/√2'],
          ['-1/√2', '1/√2'],
        ],
        'P =',
      ),
      text(','),
      matrix(
        [
          ['1', '0'],
          ['1', '1'],
        ],
        'A =',
      ),
      text('ve $Q = PAP^T$ olmak üzere $P^TQ^{2005}P$ matrisi aşağıdakilerden hangisidir?'),
    ],
    options: [
      {
        key: 'a',
        content: [
          matrix([
            ['1', '2004'],
            ['0', '1'],
          ]),
        ],
        feedback: '$A$ alt üçgensel; kuvvetleri de alt üçgensel kalır.',
      },
      {
        key: 'b',
        content: [
          matrix([
            ['1', '2005'],
            ['0', '1'],
          ]),
        ],
        errorType: 'transposed',
        feedback: 'Bu $(A^T)^{2005}$; $A$ alt üçgensel, sol alt elemanı büyür.',
      },
      {
        key: 'c',
        content: [
          matrix([
            ['1', '0'],
            ['2005', '1'],
          ]),
        ],
      },
      {
        key: 'd',
        content: [
          matrix([
            ['2005', '2005'],
            ['0', '1'],
          ]),
        ],
        feedback: '$A$ alt üçgensel; kuvvetleri de alt üçgensel kalır ve köşegen $1$ olur.',
      },
      {
        key: 'e',
        content: [
          matrix([
            ['2004', '2005'],
            ['0', '1'],
          ]),
        ],
        feedback: '$A$ alt üçgensel; kuvvetleri de alt üçgensel kalır ve köşegen $1$ olur.',
      },
    ],
    answer: 'c',
    explanation:
      '$P$ ortogonal, bu yüzden $P^TQ^{2005}P = A^{2005}$. $A^n$’in satırları $(1, 0)$ ve $(n, 1)$; $n = 2005$.',
  },
  {
    id: 'v1-pb-02',
    node: 'M3',
    source: { exam, item: 2 },
    stem: [
      matrix(
        [
          ['x-1', '0', '2', '5'],
          ['3', 'x²-2', '4', '1'],
          ['-1', '-2', 'x-3', '1'],
          ['2', '0', '4', 'x²-6'],
        ],
        'A =',
      ),
      text('matrisi için $\\text{iz}(A) = 0$ ise $x$’in çözüm kümesi aşağıdakilerden hangisidir?'),
    ],
    options: [
      {
        key: 'a',
        content: [text('$\\{2\\}$')],
        errorType: 'missed-root',
        feedback: '$x^2 + x - 6 = (x + 3)(x - 2)$: iki kök var.',
      },
      {
        key: 'b',
        content: [text('$\\{-1, 2\\}$')],
        feedback: 'İz köşegenin toplamı: $2x^2 + 2x - 12 = 0$, yani $(x + 3)(x - 2) = 0$.',
      },
      {
        key: 'c',
        content: [text('$\\{-2, 3\\}$')],
        errorType: 'lost-sign',
        feedback: 'Köklerin işaretleri ters: $(x + 3)(x - 2) = 0$ ise $x = -3$ veya $x = 2$.',
      },
      {
        key: 'd',
        content: [text('$\\{-1\\}$')],
        feedback: 'İz köşegenin toplamı: $2x^2 + 2x - 12 = 0$, yani $(x + 3)(x - 2) = 0$.',
      },
      { key: 'e', content: [text('$\\{-3, 2\\}$')] },
    ],
    answer: 'e',
    explanation:
      'İz köşegenin toplamı: $(x - 1) + (x^2 - 2) + (x - 3) + (x^2 - 6) = 2x^2 + 2x - 12$. Sıfır: $x^2 + x - 6 = (x + 3)(x - 2) = 0$, $x \\in \\{-3, 2\\}$.',
  },
  {
    id: 'v1-pb-02t',
    node: 'M3',
    source: { exam, item: 2, variant: 2 },
    stem: [
      matrix(
        [
          ['-x-4', '0', '7', '8'],
          ['3', 'x²-5', '-14', '10'],
          ['5', '-3', '-x-13', '-8'],
          ['1', '0', '6', 'x²-18'],
        ],
        'A =',
      ),
      text('matrisi için $\\text{iz}(A) = 0$ ise $x$’in çözüm kümesi aşağıdakilerden hangisidir?'),
    ],
    options: [
      { key: 'a', content: [text('$\\{-4, 5\\}$')] },
      {
        key: 'b',
        content: [text('$\\{-3, 4\\}$')],
        feedback: 'İz köşegenin toplamı: $2x^2 - 2x - 40 = 0$, yani $(x - 5)(x + 4) = 0$.',
      },
      {
        key: 'c',
        content: [text('$\\{-5, 4\\}$')],
        errorType: 'lost-sign',
        feedback: 'Köklerin işaretleri ters: $(x - 5)(x + 4) = 0$ ise $x = 5$ veya $x = -4$.',
      },
      {
        key: 'd',
        content: [text('$\\{-3, 5\\}$')],
        feedback: 'İz köşegenin toplamı: $2x^2 - 2x - 40 = 0$, yani $(x - 5)(x + 4) = 0$.',
      },
      {
        key: 'e',
        content: [text('$\\{-5\\}$')],
        errorType: 'missed-root',
        feedback: '$x^2 - x - 20 = (x - 5)(x + 4)$: iki kök var ve işaretlere dikkat.',
      },
    ],
    answer: 'a',
    explanation:
      'İz: $(-x - 4) + (x^2 - 5) + (-x - 13) + (x^2 - 18) = 2x^2 - 2x - 40$. Sıfır: $x^2 - x - 20 = (x - 5)(x + 4) = 0$, $x \\in \\{-4, 5\\}$.',
  },
  {
    id: 'v1-pb-03',
    node: 'R2',
    alsoNodes: ['R3'],
    source: { exam, item: 3 },
    stem: [
      matrix(
        [
          ['1', '2', '3', '1', '8'],
          ['1', '3', '0', '1', '7'],
          ['1', '0', '2', '1', '3'],
        ],
        'A =',
      ),
      text('matrisi için aşağıdakilerden hangisi ya da hangileri doğrudur?'),
      text('I. $A$ matrisinin satırca indirgenmiş eşelon formu'),
      matrix([
        ['1', '0', '0', '1', '1'],
        ['0', '1', '0', '0', '2'],
        ['0', '0', '1', '0', '1'],
      ]),
      text('matrisidir.'),
      text('II. $\\text{rank}(A) = 2$’dir.'),
      text('III. $A$ matrisinin satırca eşelon formlarından biri de'),
      matrix([
        ['1', '1', '1', '1', '4'],
        ['0', '1', '0', '0', '2'],
        ['0', '0', '1', '0', '1'],
      ]),
      text('matrisidir.'),
    ],
    options: statementOptions(
      {
        a: 'III de doğru: bu matris eşelon formda ve indirgenince I’deki matrise gelir; eşelon form tek değildir.',
        b: 'II yanlış: indirgenmiş formda 3 pivot var, $\\text{rank}(A) = 3$.',
        c: 'I de doğru: Gauss-Jordan sonunda tam bu matris çıkar.',
        e: 'II yanlış: indirgenmiş formda 3 pivot var, $\\text{rank}(A) = 3$.',
      },
      'd',
    ),
    answer: 'd',
    explanation:
      'Gauss-Jordan ile indirgenmiş form I’deki matris (I doğru); 3 pivot, $\\text{rank}(A) = 3$ (II yanlış). III’teki matris eşelon formda ve indirgenince aynı forma gelir, yani $A$’ya satırca denk (III doğru). İndirgenmiş eşelon form tektir, eşelon form değildir.',
  },
  {
    id: 'v1-pb-03t',
    node: 'R2',
    alsoNodes: ['R3'],
    source: { exam, item: 3, variant: 2 },
    stem: [
      matrix(
        [
          ['1', '1', '1', '1', '2'],
          ['1', '0', '0', '1', '3'],
          ['1', '2', '1', '0', '4'],
        ],
        'A =',
      ),
      text('matrisi için aşağıdakilerden hangisi ya da hangileri doğrudur?'),
      text('I. $A$ matrisinin satırca indirgenmiş eşelon formu'),
      matrix([
        ['1', '0', '0', '0', '1'],
        ['0', '1', '0', '0', '0'],
        ['0', '0', '1', '1', '-3'],
      ]),
      text('matrisidir.'),
      text('II. $\\text{rank}(A) = 3$’tür.'),
      text('III. $A$ matrisinin satırca eşelon formlarından biri de'),
      matrix([
        ['1', '2', '3', '2', '-2'],
        ['0', '1', '2', '1', '-4'],
        ['0', '0', '1', '1', '-3'],
      ]),
      text('matrisidir.'),
    ],
    options: statementOptions(
      {
        a: 'I yanlış: gerçek indirgenmiş formun 1. ve 2. satırının 4. sütununda sıfırdan farklı eleman var.',
        b: 'III de doğru: bu matris eşelon formda ve indirgenince $A$’nın indirgenmiş formuna gelir.',
        c: 'II de doğru: 3 pivot var, $\\text{rank}(A) = 3$.',
        d: 'I yanlış: gerçek indirgenmiş formun 1. ve 2. satırının 4. sütununda sıfırdan farklı eleman var.',
      },
      'e',
    ),
    answer: 'e',
    explanation:
      'Gauss-Jordan ile indirgenmiş formun satırları $(1, 0, 0, 1, 3)$, $(0, 1, 0, -1, 2)$, $(0, 0, 1, 1, -3)$: I’deki matris değil (I yanlış). 3 pivot (II doğru). III’teki matris eşelon formda ve aynı indirgenmiş forma gelir (III doğru).',
  },
  {
    id: 'v1-pb-05',
    node: 'S1',
    alsoNodes: ['R3'],
    source: { exam, item: 5 },
    stem: [
      system(
        'x + y - 2z + 3t = -1',
        'y + 4z - t = 2',
        'x - y + 3z - 2t = 12',
        '2x + 2y - 4z + 6t = 3',
        '-x + y + z + t = -5',
      ),
      text('Yukarıda verilen lineer denklem sisteminin çözümü için, aşağıdakilerden hangisi doğrudur?'),
    ],
    options: solutionKindOptions('e', {
      a: '4. denklemin sol tarafı 1. denklemin 2 katı, sağ tarafı ise $3 \\neq -2$: $r_A < r_B$, çözüm yok.',
      b: '4. denklemin sol tarafı 1. denklemin 2 katı, sağ tarafı ise $3 \\neq -2$: $r_A < r_B$, çözüm yok.',
      c: '4. denklemin sol tarafı 1. denklemin 2 katı, sağ tarafı ise $3 \\neq -2$: $r_A < r_B$, çözüm yok.',
      d: '4. denklemin sol tarafı 1. denklemin 2 katı, sağ tarafı ise $3 \\neq -2$: $r_A < r_B$, çözüm yok.',
    }),
    answer: 'e',
    explanation:
      '4. denklemin sol tarafı 1. denklemin tam 2 katı ($2x + 2y - 4z + 6t$), sağ tarafı ise $2 \\cdot (-1) = -2$ değil $3$. Bu iki denklem çelişir: $r_A = 4 < r_B = 5$, çözüm yok. Önce orantılı satırlara bak.',
  },
  {
    id: 'v1-pb-05t',
    node: 'S1',
    alsoNodes: ['R3'],
    source: { exam, item: 5, variant: 2 },
    stem: [
      system(
        'x + y - 2z + 3t = -2',
        'y + 4z - t = 3',
        'x - y + 3z - 2t = 14',
        '2x + 2y - 4z + 6t = 3',
        '-x + y + z + t = -5',
      ),
      text('Yukarıda lineer denklem sisteminin çözümü için, aşağıdakilerden hangisi doğrudur?'),
    ],
    options: solutionKindOptions('e', {
      a: '4. denklemin sol tarafı 1. denklemin 2 katı, sağ tarafı ise $3 \\neq -4$: $r_A < r_B$, çözüm yok.',
      b: '4. denklemin sol tarafı 1. denklemin 2 katı, sağ tarafı ise $3 \\neq -4$: $r_A < r_B$, çözüm yok.',
      c: '4. denklemin sol tarafı 1. denklemin 2 katı, sağ tarafı ise $3 \\neq -4$: $r_A < r_B$, çözüm yok.',
      d: '4. denklemin sol tarafı 1. denklemin 2 katı, sağ tarafı ise $3 \\neq -4$: $r_A < r_B$, çözüm yok.',
    }),
    answer: 'e',
    explanation:
      '4. denklemin sol tarafı 1. denklemin 2 katı, sağ tarafı ise $2 \\cdot (-2) = -4$ değil $3$: çelişki, $r_A < r_B$, çözüm yok.',
  },
  {
    id: 'v1-pb-07',
    node: 'S1',
    source: { exam, item: 7 },
    stem: [
      system('x - y = 5', 'y - z = -3', '2x - z = 3', '2y - 2z = -6'),
      text('Yukarıda verilen lineer denklem sistemi için aşağıdakilerden hangisi doğrudur?'),
    ],
    options: [
      {
        key: 'a',
        content: [text('$(1, 4, 1)$ bir çözümdür.')],
        errorType: 'not-substituted',
        feedback: 'Yerine koy: 1. denklem $1 - 4 = -3 \\neq 5$.',
      },
      {
        key: 'b',
        content: [text('$(4, -1, 1)$ bir çözümdür.')],
        errorType: 'not-substituted',
        feedback: 'Yerine koy: 2. denklem $-1 - 1 = -2 \\neq -3$.',
      },
      { key: 'c', content: [text('$(1, -4, -1)$ bir çözümdür.')] },
      {
        key: 'd',
        content: [text('$(1, -1, -4)$ bir çözümdür.')],
        errorType: 'not-substituted',
        feedback: 'Yerine koy: 1. denklem $1 - (-1) = 2 \\neq 5$.',
      },
      {
        key: 'e',
        content: [text('Sistemin çözümü yoktur.')],
        errorType: 'more-equations-than-unknowns',
        feedback:
          '4 denklem 3 bilinmeyen çözümsüz demek değil: 4. denklem 2. denklemin 2 katı, $r_A = r_B = 3$.',
      },
    ],
    answer: 'c',
    explanation:
      '4. denklem 2. denklemin 2 katı, atılır. Kalan üç denklemden: $x = 5 + y$, $z = y + 3$, $2(5 + y) - (y + 3) = 3$, yani $y = -4$, $x = 1$, $z = -1$. Sınavda en hızlısı şıkları yerine koymak.',
  },
  {
    id: 'v1-pb-07t',
    node: 'S1',
    source: { exam, item: 7, variant: 2 },
    stem: [
      system('2x - z = 6', 'x - y = 2', 'y - z = 3', '2y - 2z = 6'),
      text('Yukarıda lineer denklem sistemi için aşağıdakilerden hangisi doğrudur?'),
    ],
    options: [
      {
        key: 'a',
        content: [text('$(1, -1, 4)$ bir çözümdür.')],
        errorType: 'not-substituted',
        feedback: 'Yerine koy: 1. denklem $2 - 4 = -2 \\neq 6$.',
      },
      {
        key: 'b',
        content: [text('$(4, -1, 1)$ bir çözümdür.')],
        errorType: 'not-substituted',
        feedback: 'Yerine koy: 2. denklem $4 - (-1) = 5 \\neq 2$.',
      },
      {
        key: 'c',
        content: [text('$(1, -4, -1)$ bir çözümdür.')],
        errorType: 'not-substituted',
        feedback: 'Yerine koy: 1. denklem $2 - (-1) = 3 \\neq 6$.',
      },
      { key: 'd', content: [text('$(1, -1, -4)$ bir çözümdür.')] },
      {
        key: 'e',
        content: [text('Sistemin çözümü yoktur.')],
        errorType: 'more-equations-than-unknowns',
        feedback:
          '4 denklem 3 bilinmeyen çözümsüz demek değil: 4. denklem 3. denklemin 2 katı, $r_A = r_B = 3$.',
      },
    ],
    answer: 'd',
    explanation:
      '4. denklem 3. denklemin 2 katı, atılır. $x = 2 + y$, $z = y - 3$, $2(2 + y) - (y - 3) = 6$, yani $y = -1$, $x = 1$, $z = -4$.',
  },
]

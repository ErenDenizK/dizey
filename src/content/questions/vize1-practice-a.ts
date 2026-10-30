import { augmented, matrix, system, text } from './blocks'
import type { Question } from './types'

/**
 * Practice bank A (keyed, two printed versions of most items), transcribed from the project files
 * and recomputed in vize1-practice-a.test.ts. Ordered determinant-first, as for exam preparation.
 * Version 1 of item 1 is left out: no orthogonal matrix fits its data.
 */

const exam = 'practice-bank-a'

const cramerNote = (v: string) => `Cramer: $${v} = \\Delta_${v} / \\Delta$.`

export const vize1PracticeA: readonly Question[] = [
  {
    id: 'v1-pa-09',
    node: 'S4',
    alsoNodes: ['D2'],
    source: { exam, item: 9 },
    stem: [
      system('2x + y + z = a', '3x - 2y - 2z = b', 'x + 3y + z = c'),
      text(
        'lineer denklem sistemi Cramer yöntemiyle çözülürse $y = 2$ olabilmesi için $a$, $b$ ve $c$ reel sayıları arasındaki bağıntı aşağıdakilerden hangisidir?',
      ),
    ],
    options: [
      {
        key: 'a',
        content: [text('$9a - 6b - 7c = 28$')],
        feedback: `${cramerNote('y')} $\\Delta_y$ için 2. sütunu $(a, b, c)$ ile değiştir, diğer sütunlar aynı kalır.`,
      },
      { key: 'b', content: [text('$-5a + b + 7c = 28$')] },
      {
        key: 'c',
        content: [text('$2a + b = 14$')],
        feedback: `${cramerNote('y')} $\\Delta_y$ bütün satırlardan gelir; $c$ terimi de olmalı.`,
      },
      {
        key: 'd',
        content: [text('$a + b - 5c = 14$')],
        feedback: `${cramerNote('y')} $\\Delta = 14$, yani $\\Delta_y = 2 \\cdot 14 = 28$ olmalı.`,
      },
      {
        key: 'e',
        content: [text('$2b - 4a = 28$')],
        feedback: `${cramerNote('y')} $\\Delta_y$’yi 2. sütun $(a, b, c)$ olacak şekilde yeniden aç.`,
      },
    ],
    answer: 'b',
    explanation:
      '$\\Delta = 14$. $\\Delta_y$: 2. sütun yerine $(a, b, c)$; açınca $\\Delta_y = -5a + b + 7c$. $y = \\Delta_y / \\Delta = 2$ ise $-5a + b + 7c = 28$.',
  },
  {
    id: 'v1-pa-09t',
    node: 'S4',
    alsoNodes: ['D2'],
    source: { exam, item: 9, variant: 2 },
    stem: [
      system('x + 2y - 3z = a', '3x - y + 2z = b', '2x + 3y - z = c'),
      text(
        'lineer denklem sistemi Cramer yöntemiyle çözülürse $x = 1$ olması halinde $a$, $b$ ve $c$ reel sayıları arasındaki bağıntı aşağıdakilerden hangisidir?',
      ),
    ],
    options: [
      { key: 'a', content: [text('$5a + 7b - c = 24$')] },
      {
        key: 'b',
        content: [text('$17a - b - 7c = 24$')],
        feedback: `${cramerNote('x')} $\\Delta_x$ için 1. sütunu $(a, b, c)$ ile değiştir.`,
      },
      {
        key: 'c',
        content: [text('$-11a - b + 7c = 24$')],
        feedback: `${cramerNote('x')} $\\Delta_x$ için 1. sütunu $(a, b, c)$ ile değiştir.`,
      },
      {
        key: 'd',
        content: [text('$21a - 5b + 3c = 24$')],
        feedback: `${cramerNote('x')} $\\Delta_x$ için 1. sütunu $(a, b, c)$ ile değiştir.`,
      },
      {
        key: 'e',
        content: [text('$a + 2b - 4c = 12$')],
        feedback: `${cramerNote('x')} $\\Delta = -24$; $\\Delta_x = \\Delta$ olmalı.`,
      },
    ],
    answer: 'a',
    explanation:
      '$\\Delta = -24$. $\\Delta_x$: 1. sütun yerine $(a, b, c)$; açınca $\\Delta_x = -5a - 7b + c$. $x = 1$ ise $\\Delta_x = \\Delta$: $-5a - 7b + c = -24$, yani $5a + 7b - c = 24$.',
  },
  {
    id: 'v1-pa-10',
    node: 'S4',
    alsoNodes: ['S2', 'D2'],
    source: { exam, item: 10 },
    stem: [
      system('x + y + (1 - m)z = 0', 'x - my + 2z = 1', '2x + y + z = -1'),
      text(
        'lineer denklem sistemi veriliyor. Buna göre aşağıdaki ifadelerden hangisi ya da hangileri doğrudur?',
      ),
      text('I. Denklem sistemi $m = \\pm 1$ için Cramer yöntemi ile çözülemez.'),
      text(
        'II. $m = 2$ değeri için sistemin katsayılar matrisinin determinantı $\\Delta = -6$ ve $x = \\frac{1}{3}$’tür.',
      ),
      text('III. $m = 3$ için $x = 16$’dır.'),
    ],
    options: [
      {
        key: 'a',
        content: [text('Yalnız I')],
        errorType: 'missed-true-statement',
        feedback: 'II de doğru: $m = 2$ için $\\Delta = -6$, $\\Delta_x = -2$, $x = \\frac{1}{3}$.',
      },
      {
        key: 'b',
        content: [text('Yalnız II')],
        errorType: 'missed-true-statement',
        feedback: 'I de doğru: $\\Delta = -2(m - 1)(m + 1)$, $m = \\pm 1$ için sıfır; Cramer kullanılamaz.',
      },
      {
        key: 'c',
        content: [text('Yalnız III')],
        errorType: 'inverted-ratio',
        feedback: '$m = 3$ için $\\Delta = -16$, $\\Delta_x = 1$, $x = -\\frac{1}{16}$; $16$ oranın tersi.',
      },
      {
        key: 'd',
        content: [text('Yalnız II ve III')],
        errorType: 'inverted-ratio',
        feedback:
          'III yanlış: $x = \\Delta_x / \\Delta = -\\frac{1}{16}$. I ise doğru ($m = \\pm 1$ için $\\Delta = 0$).',
      },
      { key: 'e', content: [text('Yalnız I ve II')] },
    ],
    answer: 'e',
    explanation:
      '$\\Delta = -2(m - 1)(m + 1)$: $m = \\pm 1$ için sıfır, Cramer uygulanamaz (I doğru). $m = 2$: $\\Delta = -6$, $\\Delta_x = -2$, $x = \\frac{1}{3}$ (II doğru). $m = 3$: $\\Delta = -16$, $\\Delta_x = 1$, $x = -\\frac{1}{16}$ (III yanlış).',
  },
  {
    id: 'v1-pa-10t',
    node: 'S4',
    alsoNodes: ['S2', 'D2'],
    source: { exam, item: 10, variant: 2 },
    stem: [
      system('kx + y + z = 4', 'x - 2y + z = -2', '(k+1)x - y + kz = -1'),
      text(
        'lineer denklem sistemi veriliyor. Buna göre aşağıdaki ifadelerden hangisi ya da hangileri doğrudur?',
      ),
      text('I. Denklem sistemi $k = 2$ ve $k = -\\frac{1}{2}$ için Cramer yöntemi ile çözülemez.'),
      text(
        'II. $k = 1$ değeri için sistemin katsayılar matrisinin determinantı $\\Delta = 3$ ve $y = 2$’dir.',
      ),
      text('III. $k = -2$ için $x = 5$’dir.'),
    ],
    options: [
      {
        key: 'a',
        content: [text('Yalnız I')],
        errorType: 'missed-true-statement',
        feedback: 'II de doğru: $k = 1$ için $\\Delta = 3$, $\\Delta_y = 6$, $y = 2$.',
      },
      {
        key: 'b',
        content: [text('Yalnız II')],
        errorType: 'missed-true-statement',
        feedback: 'I de doğru: $\\Delta = -(k - 2)(2k + 1)$, $k = 2$ ve $k = -\\frac{1}{2}$ için sıfır.',
      },
      {
        key: 'c',
        content: [text('Yalnız III')],
        errorType: 'other',
        feedback: '$k = -2$ için $\\Delta = -12$, $\\Delta_x = 15$, $x = -\\frac{5}{4}$; III yanlış.',
      },
      { key: 'd', content: [text('Yalnız I ve II')] },
      {
        key: 'e',
        content: [text('Yalnız II ve III')],
        errorType: 'other',
        feedback: 'III yanlış: $k = -2$ için $x = -\\frac{5}{4}$. I ise doğru.',
      },
    ],
    answer: 'd',
    explanation:
      '$\\Delta = -(k - 2)(2k + 1)$: $k = 2$ ve $k = -\\frac{1}{2}$ için sıfır (I doğru). $k = 1$: $\\Delta = 3$, $\\Delta_y = 6$, $y = 2$ (II doğru). $k = -2$: $\\Delta = -12$, $x = -\\frac{5}{4}$ (III yanlış).',
  },
  {
    id: 'v1-pa-03',
    node: 'S3',
    alsoNodes: ['D2', 'X1'],
    source: { exam, item: 3 },
    stem: [
      system('6x + 2y + (k+2)z = 0', '-3x + y + z = 0', '-6x + (k+5)y + 2z = 0'),
      text(
        'lineer denklem sisteminin sadece sıfır çözümünün olması için $k$’nın alacağı değerler ne olmalıdır?',
      ),
    ],
    options: [
      {
        key: 'a',
        content: [text('$k = -3$, $k = 4$')],
        errorType: 'answered-the-complement',
        feedback: 'Bunlar (işaret hatasıyla) $|A| = 0$ yapan değerler; o zaman sonsuz çözüm olur.',
      },
      {
        key: 'b',
        content: [text('$k = 3$, $k = -4$')],
        errorType: 'answered-the-complement',
        feedback:
          'Sadece sıfır çözüm için $|A| \\neq 0$ gerekir; $|A| = 0$ yapan değerleri değil, diğerlerini seç.',
      },
      {
        key: 'c',
        content: [text('$k = -3$, $k = -4$')],
        errorType: 'answered-the-complement',
        feedback: 'Bu değerlerde $|A| = 0$ ve sistemin sonsuz çözümü var; soru tersini istiyor.',
      },
      {
        key: 'd',
        content: [text('$k \\neq -3$, $k \\neq 4$')],
        errorType: 'lost-sign',
        feedback: '$|A| = -3(k + 3)(k + 4)$; kökler $-3$ ve $-4$.',
      },
      { key: 'e', content: [text('$k \\neq -3$, $k \\neq -4$')] },
    ],
    answer: 'e',
    explanation:
      'Homojen sistemde sadece aşikar çözüm $\\iff |A| \\neq 0$. 1. satıra 2. satırın 2 katını, 3. satıra 2. satırın $-2$ katını ekle: 1. sütunda yalnız $-3$ kalır. $|A| = -3(k + 3)(k + 4)$; cevap $k \\neq -3$ ve $k \\neq -4$.',
  },
  {
    id: 'v1-pa-05',
    node: 'S3',
    alsoNodes: ['D2'],
    source: { exam, item: 5 },
    stem: [
      text('Arttırılmış katsayılar matrisi'),
      augmented([
        ['1', '2', '1', '0'],
        ['-1', '1', 'k', '0'],
        ['2', '5', '3', '0'],
      ]),
      text('olan lineer denklem sisteminin sonsuz çözümünün olması için $k$ ne olmalıdır?'),
    ],
    options: [
      {
        key: 'a',
        content: [text('$k = -2$')],
        errorType: 'lost-sign',
        feedback: '$|A| = 2 - k$; sıfır olduğu yer $k = 2$.',
      },
      { key: 'b', content: [text('$k = 2$')] },
      {
        key: 'c',
        content: [text('$k \\neq -2$')],
        errorType: 'answered-the-complement',
        feedback: '$k \\neq$ … biçimi $|A| \\neq 0$ demek: o zaman sadece sıfır çözüm var.',
      },
      {
        key: 'd',
        content: [text('$k \\neq 2$')],
        errorType: 'answered-the-complement',
        feedback: '$k \\neq 2$ için $|A| \\neq 0$ ve sadece sıfır çözüm var; sonsuz çözüm $k = 2$’de.',
      },
      {
        key: 'e',
        content: [text('$k \\neq \\pm 2$')],
        errorType: 'answered-the-complement',
        feedback: '$k \\neq$ … biçimi $|A| \\neq 0$ demek: o zaman sadece sıfır çözüm var.',
      },
    ],
    answer: 'b',
    explanation: 'Homojen sistem: sonsuz çözüm $\\iff |A| = 0$. Sarrus ile $|A| = 2 - k$, yani $k = 2$.',
  },
  {
    id: 'v1-pa-05t',
    node: 'S3',
    alsoNodes: ['D2'],
    source: { exam, item: 5, variant: 2 },
    stem: [
      text('Arttırılmış katsayılar matrisi'),
      augmented([
        ['1', '2', '1', '0'],
        ['1', '1', 'k', '0'],
        ['2', '5', '-3', '0'],
      ]),
      text('olan lineer denklem sisteminin sonsuz çözümünün olması için $k$ ne olmalıdır?'),
    ],
    options: [
      { key: 'a', content: [text('$k = 6$')] },
      {
        key: 'b',
        content: [text('$k = -6$')],
        errorType: 'lost-sign',
        feedback: '$|A| = 6 - k$; sıfır olduğu yer $k = 6$.',
      },
      {
        key: 'c',
        content: [text('$k \\neq -6$')],
        errorType: 'answered-the-complement',
        feedback: '$k \\neq$ … biçimi $|A| \\neq 0$ demek: o zaman sadece sıfır çözüm var.',
      },
      {
        key: 'd',
        content: [text('$k \\neq 6$')],
        errorType: 'answered-the-complement',
        feedback: '$k \\neq 6$ için $|A| \\neq 0$ ve sadece sıfır çözüm var; sonsuz çözüm $k = 6$’da.',
      },
      {
        key: 'e',
        content: [text('$k \\neq \\pm 6$')],
        errorType: 'answered-the-complement',
        feedback: '$k \\neq$ … biçimi $|A| \\neq 0$ demek: o zaman sadece sıfır çözüm var.',
      },
    ],
    answer: 'a',
    explanation: 'Homojen sistem: sonsuz çözüm $\\iff |A| = 0$. Sarrus ile $|A| = 6 - k$, yani $k = 6$.',
  },
  {
    id: 'v1-pa-08',
    node: 'R4',
    alsoNodes: ['S4'],
    source: { exam, item: 8 },
    stem: [
      system('x - y + 2z = 1', '2x - 3y + 3z = -1', 'x - y + z = 0'),
      text(
        'lineer denklem sistemi katsayılar matrisinin inversi yöntemiyle çözülürse $A^{-1}B$ çözüm matrisi aşağıdakilerden hangisi olur?',
      ),
    ],
    options: [
      {
        key: 'a',
        content: [
          matrix([
            ['2', '1', '1'],
            ['1', '1', '2'],
            ['1', '0', '-1'],
          ]),
          matrix([['1'], ['-1'], ['0']]),
        ],
        feedback: 'Kontrol: $A$ ile bu matrisin çarpımı birim matris değil.',
      },
      {
        key: 'b',
        content: [
          matrix([
            ['1', '0', '-1'],
            ['-1', '1', '2'],
            ['1', '-1', '-1'],
          ]),
          matrix([['1'], ['-1'], ['0']]),
        ],
        feedback: 'Kontrol: $A$ ile bu matrisin çarpımı birim matris değil.',
      },
      {
        key: 'c',
        content: [
          matrix([
            ['0', '1', '3'],
            ['-1', '1', '1'],
            ['1', '0', '-1'],
          ]),
          matrix([['1'], ['-1'], ['0']]),
        ],
        errorType: 'lost-sign',
        feedback: 'İlk iki satırda işaret hatası var: $A^{-1}$’in ilk satırı $(0, -1, 3)$.',
      },
      {
        key: 'd',
        content: [
          matrix([
            ['0', '-1', '3'],
            ['1', '-1', '1'],
            ['1', '0', '-1'],
          ]),
          matrix([['1'], ['-1'], ['0']]),
        ],
      },
      {
        key: 'e',
        content: [
          matrix([
            ['1', '2', '1'],
            ['-1', '-3', '-1'],
            ['2', '3', '1'],
          ]),
          matrix([['1'], ['-1'], ['0']]),
        ],
        errorType: 'transposed-system',
        feedback: 'Bu $A$’nın transpozu, tersi değil.',
      },
    ],
    answer: 'd',
    explanation:
      '$[A \\mid I]$ üzerinde Gauss-Jordan: $A^{-1}$’in satırları $(0, -1, 3)$, $(1, -1, 1)$, $(1, 0, -1)$. Sağdaki sütun $B = (1, -1, 0)$. Çözüm $X = A^{-1}B = (1, 2, 1)$.',
  },
  {
    id: 'v1-pa-08t',
    node: 'R4',
    alsoNodes: ['S4'],
    source: { exam, item: 8, variant: 2 },
    stem: [
      system('x + y + z = 3', '-2x - y - z = -4', '-x + 2y + z = 4'),
      text(
        'lineer denklem sistemi katsayılar matrisinin inversi yöntemiyle çözülürse $A^{-1}B$ çözüm matrisi aşağıdakilerden hangisi olur?',
      ),
    ],
    options: [
      {
        key: 'a',
        content: [
          matrix([
            ['-1', '-1', '0'],
            ['-3', '-2', '1'],
            ['5', '3', '-1'],
          ]),
          matrix([['3'], ['-4'], ['4']]),
        ],
      },
      {
        key: 'b',
        content: [
          matrix([
            ['1', '1', '0'],
            ['3', '2', '1'],
            ['-5', '-3', '1'],
          ]),
          matrix([['3'], ['-4'], ['4']]),
        ],
        errorType: 'lost-sign',
        feedback: 'Bu doğru tersin işaretleri bozulmuş hali; $A \\cdot A^{-1} = I$ ile kontrol et.',
      },
      {
        key: 'c',
        content: [
          matrix([
            ['1', '-3', '-5'],
            ['1', '2', '1'],
            ['0', '1', '1'],
          ]),
          matrix([['3'], ['-4'], ['4']]),
        ],
        feedback: 'Kontrol: $A$ ile bu matrisin çarpımı birim matris değil.',
      },
      {
        key: 'd',
        content: [
          matrix([
            ['1', '3', '-5'],
            ['-1', '2', '-3'],
            ['0', '-1', '-1'],
          ]),
          matrix([['3'], ['-4'], ['4']]),
        ],
        feedback: 'Kontrol: $A$ ile bu matrisin çarpımı birim matris değil.',
      },
      {
        key: 'e',
        content: [
          matrix([
            ['1', '1', '0'],
            ['-3', '2', '1'],
            ['-5', '-3', '1'],
          ]),
          matrix([['3'], ['-4'], ['4']]),
        ],
        feedback: 'Kontrol: $A$ ile bu matrisin çarpımı birim matris değil.',
      },
    ],
    answer: 'a',
    explanation:
      '$[A \\mid I]$ üzerinde Gauss-Jordan: $A^{-1}$’in satırları $(-1, -1, 0)$, $(-3, -2, 1)$, $(5, 3, -1)$. $B = (3, -4, 4)$, çözüm $X = (1, 3, -1)$.',
  },
  {
    id: 'v1-pa-07',
    node: 'R4',
    alsoNodes: ['S1'],
    source: {
      exam,
      item: 7,
      correction:
        'Printed option B (x + 2z = -3, -2x + y - z = -2, x - y = 3) is option A multiplied by -1, so it is the same system and also correct. B now has a sign slip on the last right-hand side instead.',
    },
    stem: [
      matrix(
        [
          ['1', '2', '2'],
          ['1', '2', '3'],
          ['-1', '-1', '-1'],
        ],
        'A⁻¹ =',
      ),
      text('ve'),
      matrix([['1'], ['-2'], ['-2']], 'A⁻¹B ='),
      text('matrisleri veriliyor. Buna göre $AX = B$ denklem sistemi aşağıdakilerden hangisidir?'),
    ],
    options: [
      { key: 'a', content: [system('-x - 2z = 3', '2x - y + z = 2', '-x + y = -3')] },
      {
        key: 'b',
        content: [system('-x - 2z = 3', '2x - y + z = 2', '-x + y = 3')],
        errorType: 'lost-sign',
        feedback: '$B = A \\cdot (A^{-1}B)$; 3. bileşen $-1 - 2 + 0 = -3$.',
      },
      {
        key: 'c',
        content: [system('x - 2z = 1', '2x - y + z = -2', '-x + y = -2')],
        errorType: 'used-given-as-b',
        feedback:
          'Sağ taraf $A^{-1}B$ değil, $B = A \\cdot (A^{-1}B)$; ayrıca 1. denklemde işaret hatası var.',
      },
      {
        key: 'd',
        content: [system('-x - 2z = 1', '2x - y + z = -2', '-x + y = -2')],
        errorType: 'used-given-as-b',
        feedback:
          'Katsayılar doğru ama sağ taraf $A^{-1}B$ değil, $B = A \\cdot (A^{-1}B) = (3, 2, -3)$ olmalı.',
      },
      {
        key: 'e',
        content: [system('x + 2y + 2z = 1', 'x + 2y + 3z = -2', '-x - y - z = -2')],
        errorType: 'used-inverse-as-a',
        feedback:
          'Bu $A^{-1}X = A^{-1}B$; katsayılar $A$’nın kendisi olmalı. Önce $A = (A^{-1})^{-1}$’i bul.',
      },
    ],
    answer: 'a',
    explanation:
      '$A = (A^{-1})^{-1}$: satırları $(-1, 0, -2)$, $(2, -1, 1)$, $(-1, 1, 0)$. $B = A \\cdot (A^{-1}B) = (3, 2, -3)$. Sistem: $-x - 2z = 3$, $2x - y + z = 2$, $-x + y = -3$.',
  },
  {
    id: 'v1-pa-07t',
    node: 'R4',
    alsoNodes: ['S1'],
    source: { exam, item: 7, variant: 2 },
    stem: [
      matrix(
        [
          ['-1', '-4', '3'],
          ['1', '3', '-2'],
          ['0', '2', '-1'],
        ],
        'A⁻¹ =',
      ),
      text('ve'),
      matrix([['7'], ['-5'], ['1']], 'A⁻¹B ='),
      text('matrisleri veriliyor. Buna göre $AX = B$ denklem sistemi aşağıdakilerden hangisidir?'),
    ],
    options: [
      {
        key: 'a',
        content: [system('x + y + 2z = -4', '2x + y + 2z = 3', '-x + y + z = 5')],
        feedback: 'Önce $A = (A^{-1})^{-1}$’i bul; katsayılar onun satırları.',
      },
      {
        key: 'b',
        content: [system('x - 2y - z = -4', '-x + y + z = 3', '2x - 2y + z = 5')],
        feedback: 'Önce $A = (A^{-1})^{-1}$’i bul; katsayılar onun satırları.',
      },
      { key: 'c', content: [system('x + 2y - z = -4', 'x + y + z = 3', '2x + 2y + z = 5')] },
      {
        key: 'd',
        content: [system('x + 2y - z = 7', 'x + y + z = -5', '2x + 2y + z = 1')],
        errorType: 'used-given-as-b',
        feedback:
          'Katsayılar doğru ama sağ taraf $A^{-1}B$ değil, $B = A \\cdot (A^{-1}B) = (-4, 3, 5)$ olmalı.',
      },
      {
        key: 'e',
        content: [system('x + y + 2z = 7', '2x + y + 2z = -5', '-x + y + z = 1')],
        errorType: 'used-given-as-b',
        feedback:
          'Sağ taraf $A^{-1}B$ değil, $B = A \\cdot (A^{-1}B)$; katsayılar da $A$’nın satırları olmalı.',
      },
    ],
    answer: 'c',
    explanation:
      '$A = (A^{-1})^{-1}$: satırları $(1, 2, -1)$, $(1, 1, 1)$, $(2, 2, 1)$. $B = A \\cdot (A^{-1}B) = (-4, 3, 5)$.',
  },
  {
    id: 'v1-pa-02',
    node: 'S1',
    alsoNodes: ['R3'],
    source: { exam, item: 2 },
    stem: [
      system('x + 2z = 5', '-2x + ky = -3'),
      text(
        'lineer denklem sisteminin tek çözümünün olması için $k$’nın alacağı değer ya da değerler aşağıdakilerden hangisidir?',
      ),
    ],
    options: [
      {
        key: 'a',
        content: [text('$k = \\pm 2$')],
        errorType: 'unknown-count',
        feedback:
          '3 bilinmeyen ($x$, $y$, $z$), 2 denklem: $r_A \\le 2 < 3$, tek çözüm hiçbir $k$ için olamaz.',
      },
      {
        key: 'b',
        content: [text('$k = 2$')],
        errorType: 'unknown-count',
        feedback:
          '3 bilinmeyen ($x$, $y$, $z$), 2 denklem: $r_A \\le 2 < 3$, tek çözüm hiçbir $k$ için olamaz.',
      },
      {
        key: 'c',
        content: [text('$k \\neq \\pm 2$')],
        errorType: 'unknown-count',
        feedback:
          '3 bilinmeyen ($x$, $y$, $z$), 2 denklem: $r_A \\le 2 < 3$, tek çözüm hiçbir $k$ için olamaz.',
      },
      {
        key: 'd',
        content: [text('$k \\neq -4$')],
        errorType: 'unknown-count',
        feedback:
          '3 bilinmeyen ($x$, $y$, $z$), 2 denklem: $r_A \\le 2 < 3$, tek çözüm hiçbir $k$ için olamaz.',
      },
      { key: 'e', content: [text('Hiçbir zaman tek çözümü olamaz')] },
    ],
    answer: 'e',
    explanation:
      'Bilinmeyenler $x$, $y$, $z$ (üç tane), denklem iki tane. $r_A \\le 2 < 3$, en az bir serbest değişken kalır: tek çözüm hiçbir $k$ için yok. Önce bilinmeyen sayısını say.',
  },
  {
    id: 'v1-pa-04',
    node: 'S3',
    alsoNodes: ['R2'],
    source: { exam, item: 4 },
    stem: [
      system('x + 3y + z + t = 0', 'x + y + 3z + t = 0', '3x + y + z + t = 0'),
      text('Yukarıdaki lineer denklem sisteminin çözümü aşağıdakilerden hangisidir?'),
    ],
    options: [
      {
        key: 'a',
        content: [text('$\\{(\\frac{1}{6}k, \\frac{1}{6}k, \\frac{1}{6}k, k) : k \\in \\mathbb{R}\\}$')],
        feedback: 'Yerine koy: 1. denklem $\\frac{5}{6}k + k \\neq 0$.',
      },
      {
        key: 'b',
        content: [text('$\\{(2s, 3s, 4s, s) : s \\in \\mathbb{R}\\}$')],
        feedback: 'Yerine koy: 1. denklem $2s + 9s + 4s + s = 16s \\neq 0$.',
      },
      {
        key: 'c',
        content: [text('$\\{(-\\frac{1}{6}s, -\\frac{1}{6}s, -\\frac{1}{3}s, s) : s \\in \\mathbb{R}\\}$')],
        feedback: 'Yerine koy: 1. denklemde sonuç sıfır çıkmıyor.',
      },
      {
        key: 'd',
        content: [text('$\\{(-\\frac{1}{5}k, -\\frac{1}{5}k, -\\frac{1}{5}k, k) : k \\in \\mathbb{R}\\}$')],
      },
      {
        key: 'e',
        content: [text('$\\{(\\frac{1}{6}k, \\frac{1}{3}k, \\frac{1}{6}k, k) : k \\in \\mathbb{R}\\}$')],
        feedback: 'Yerine koy: 1. denklemde sonuç sıfır çıkmıyor.',
      },
    ],
    answer: 'd',
    explanation:
      'Simetri: denklemleri ikişer çıkar, $y = z$ ve $x = y$ çıkar. $x = y = z$ ile 1. denklem $5x + t = 0$, $t = k$ ise $x = -\\frac{k}{5}$. Sınavda en hızlısı şıkları yerine koymak.',
  },
  {
    id: 'v1-pa-04t',
    node: 'S3',
    alsoNodes: ['R2'],
    source: { exam, item: 4, variant: 2 },
    stem: [
      system('x + y + 3z + t = 0', 'x + 3y + z + t = 0', 'x + y + z + 3t = 0'),
      text('Yukarıdaki lineer denklem sisteminin çözümü aşağıdakilerden hangisidir?'),
    ],
    options: [
      {
        key: 'a',
        content: [text('$\\{(-5k, -5k, k, 7k) : k \\in \\mathbb{R}\\}$')],
        feedback:
          'Yerine koy: 1. denklem $-5k - 5k + 3k + 7k = 0$ tutuyor ama 2. denklem $-5k - 15k + k + 7k \\neq 0$.',
      },
      { key: 'b', content: [text('$\\{(-5k, k, k, k) : k \\in \\mathbb{R}\\}$')] },
      {
        key: 'c',
        content: [text('$\\{(k, -5k, 0, k) : k \\in \\mathbb{R}\\}$')],
        feedback: 'Yerine koy: 1. denklem $k - 5k + k = -3k \\neq 0$.',
      },
      {
        key: 'd',
        content: [text('$\\{(-\\frac{1}{5}s, -\\frac{1}{5}s, \\frac{1}{5}s, -s) : s \\in \\mathbb{R}\\}$')],
        feedback: 'Yerine koy: 1. denklemde sonuç sıfır çıkmıyor.',
      },
      {
        key: 'e',
        content: [text('$\\{(-3s, s, \\frac{1}{3}s, s) : s \\in \\mathbb{R}\\}$')],
        feedback: 'Yerine koy: 1. denklemde sonuç sıfır çıkmıyor.',
      },
    ],
    answer: 'b',
    explanation:
      '1. ve 2. denklemi çıkar: $y = z$. 1. ve 3. denklemi çıkar: $z = t$. $y = z = t = k$ ile $x + 5k = 0$, $x = -5k$.',
  },
  {
    id: 'v1-pa-06',
    node: 'S3',
    alsoNodes: ['R3'],
    source: { exam, item: 6 },
    stem: [
      system('x + 2y + tz = 0', '2x + 4y + (t+1)z = 0', '3x + 6y + kz = 0'),
      text(
        'Yukarıdaki lineer homojen denklem sisteminin çözümü ile ilgili olarak $k$ ve $t$ değerleri için aşağıdaki ifadelerden hangisi doğrudur?',
      ),
    ],
    options: [
      {
        key: 'a',
        content: [text('$t = 1$ ve $k = 3$ ise sistemin bir keyfi değişkene bağlı sonsuz çözümü vardır.')],
        errorType: 'free-variable-count',
        feedback:
          '$t = 1$, $k = 3$ için bütün satırlar $(1, 2, 1)$’in katı: $r_A = 1$, serbest değişken $3 - 1 = 2$.',
      },
      {
        key: 'b',
        content: [
          text('$t \\neq 1$ ve $k = 3$ ise sistemin iki keyfi değişkene bağlı sonsuz çözümü vardır.'),
        ],
        errorType: 'free-variable-count',
        feedback: '$t \\neq 1$ ise ilk iki satır orantılı değil: $r_A = 2$, tek serbest değişken.',
      },
      {
        key: 'c',
        content: [text('$t = 1$ ve $k = 3$ ise sistemin iki keyfi değişkene bağlı sonsuz çözümü vardır.')],
      },
      {
        key: 'd',
        content: [
          text('$t = 1$ ve $k \\neq 3$ ise sistemin iki keyfi değişkene bağlı sonsuz çözümü vardır.'),
        ],
        errorType: 'free-variable-count',
        feedback: '$k \\neq 3$ ise 3. satır 1. satırın katı değil: $r_A = 2$, tek serbest değişken.',
      },
      {
        key: 'e',
        content: [text('$t \\neq 1$ ve $k \\neq 3$ ise sistemin tek çözümü (sıfır çözümü) vardır.')],
        errorType: 'missed-dependent-columns',
        feedback:
          '2. sütun 1. sütunun 2 katı, yani $|A| = 0$ her zaman: sistemin hiçbir zaman yalnız sıfır çözümü olmaz.',
      },
    ],
    answer: 'c',
    explanation:
      '2. sütun 1. sütunun 2 katı, $|A| = 0$ her $t$, $k$ için; $r_A \\le 2$. $t = 1$, $k = 3$ olunca satırlar $(1, 2, 1)$, $(2, 4, 2)$, $(3, 6, 3)$: $r_A = 1$, iki serbest değişken.',
  },
  {
    id: 'v1-pa-06t',
    node: 'S3',
    alsoNodes: ['R3'],
    source: { exam, item: 6, variant: 2 },
    stem: [
      system('x + 2y + tz = 0', '2x + 4y + (t+2)z = 0', '3x + 6y + kz = 0'),
      text(
        'Yukarıdaki lineer homojen denklem sisteminin çözümü ile ilgili olarak $k$ ve $t$ değerleri için aşağıdaki ifadelerden hangisi doğrudur?',
      ),
    ],
    options: [
      {
        key: 'a',
        content: [text('$t = 2$ ve $k = 6$ ise sistemin iki keyfi değişkene bağlı sonsuz çözümü vardır.')],
      },
      {
        key: 'b',
        content: [
          text('$t \\neq 2$ ve $k = 6$ ise sistemin iki keyfi değişkene bağlı sonsuz çözümü vardır.'),
        ],
        errorType: 'free-variable-count',
        feedback: '$t \\neq 2$ ise ilk iki satır orantılı değil: $r_A = 2$, tek serbest değişken.',
      },
      {
        key: 'c',
        content: [text('$t = 2$ ve $k = 6$ ise sistemin bir keyfi değişkene bağlı sonsuz çözümü vardır.')],
        errorType: 'free-variable-count',
        feedback:
          '$t = 2$, $k = 6$ için bütün satırlar $(1, 2, 2)$’nin katı: $r_A = 1$, serbest değişken $3 - 1 = 2$.',
      },
      {
        key: 'd',
        content: [
          text('$t = 2$ ve $k \\neq 6$ ise sistemin iki keyfi değişkene bağlı sonsuz çözümü vardır.'),
        ],
        errorType: 'free-variable-count',
        feedback: '$k \\neq 6$ ise 3. satır 1. satırın katı değil: $r_A = 2$, tek serbest değişken.',
      },
      {
        key: 'e',
        content: [text('$t \\neq 2$ ve $k \\neq 6$ ise sistemin tek çözümü (sıfır çözümü) vardır.')],
        errorType: 'missed-dependent-columns',
        feedback:
          '2. sütun 1. sütunun 2 katı, yani $|A| = 0$ her zaman: sistemin hiçbir zaman yalnız sıfır çözümü olmaz.',
      },
    ],
    answer: 'a',
    explanation:
      '2. sütun 1. sütunun 2 katı, $|A| = 0$ her $t$, $k$ için. $t = 2$, $k = 6$ olunca satırlar $(1, 2, 2)$, $(2, 4, 4)$, $(3, 6, 6)$: $r_A = 1$, iki serbest değişken.',
  },
  {
    id: 'v1-pa-01t',
    node: 'M9',
    source: {
      exam,
      item: 1,
      variant: 2,
    },
    stem: [
      text('$A^T = A^{-1}$ koşulunu sağlayan $A$ matrisine ortogonal matris denir. Eğer'),
      matrix(
        [
          ['a', '2/3', 'b'],
          ['2/3', '1/3', 'x'],
          ['2/3', 'c', 'y'],
        ],
        'A =',
      ),
      text('matrisi ortogonal ise $x^2 + y^2 + b^2$ değeri aşağıdakilerden hangisine eşittir?'),
    ],
    options: [
      {
        key: 'a',
        content: [text('$\\frac{2}{3}$')],
        feedback: '$A^TA = I$: her sütunun elemanlarının kareleri toplamı $1$. $b$, $x$, $y$ 3. sütunda.',
      },
      {
        key: 'b',
        content: [text('$\\frac{1}{3}$')],
        feedback: '$A^TA = I$: her sütunun elemanlarının kareleri toplamı $1$. $b$, $x$, $y$ 3. sütunda.',
      },
      {
        key: 'c',
        content: [text('$\\frac{4}{9}$')],
        feedback: '$A^TA = I$: her sütunun elemanlarının kareleri toplamı $1$. $b$, $x$, $y$ 3. sütunda.',
      },
      {
        key: 'd',
        content: [text('$4$')],
        feedback: '$A^TA = I$: her sütunun elemanlarının kareleri toplamı $1$. $b$, $x$, $y$ 3. sütunda.',
      },
      { key: 'e', content: [text('$1$')] },
    ],
    answer: 'e',
    explanation:
      '$A^TA = I$ demek: sütunlar birim uzunlukta ve birbirine dik. $b$, $x$, $y$ 3. sütunun elemanları, kareleri toplamı $1$. Hesap gerekmez.',
  },
]

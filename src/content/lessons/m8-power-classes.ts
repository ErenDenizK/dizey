import { matrix, text } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

const m = (label: string, rows: readonly (readonly string[])[]): MatrixBlock => ({
  kind: 'matrix',
  delimiter: 'brackets',
  rows,
  label,
})

/** M8: periodic, idempotent, nilpotent and involutory matrices: classes defined by powers. */
export const m8PowerClasses: Lesson = {
  id: 'm8-power-classes',
  node: 'M8',
  title: 'Periyodik, idempotent, nilpotent, involutive',
  matrices: {
    R: m('R =', [
      ['0', '-1'],
      ['1', '0'],
    ]),
    P: m('P =', [
      ['1', '0'],
      ['0', '0'],
    ]),
    E: m('A =', [
      ['2', '-2', '-4'],
      ['-1', '3', '4'],
      ['1', '-2', '-3'],
    ]),
    U: m('U =', [
      ['0', '1', '2'],
      ['0', '0', '3'],
      ['0', '0', '0'],
    ]),
    N: m('N =', [
      ['1', '1', '3'],
      ['5', '2', '6'],
      ['-2', '-1', '-3'],
    ]),
    N2: m('N² =', [
      ['0', '0', '0'],
      ['3', '3', '?'],
      ['-1', '-1', '-3'],
    ]),
    V: m('B =', [
      ['4', '3', '3'],
      ['-1', '0', '-1'],
      ['-4', '-4', '-3'],
    ]),
  },
  steps: [
    {
      id: 'hook',
      kind: 'explain',
      eyebrow: 'Soru',
      title: 'Bir matrisin kuvvetleri başa dönebilir mi?',
      body: '$R$ düzlemi 90° döndürür. Dört kez döndür, izle.',
      scene: { items: ['R'] },
      beat: { kind: 'equation', lines: ['R^2 = -I', 'R^3 = -R', 'R^4 = I', 'R^5 = R'] },
      claims: [
        {
          kind: 'expr',
          expr: 'R^2',
          equals: [
            ['-1', '0'],
            ['0', '-1'],
          ],
        },
        {
          kind: 'expr',
          expr: 'R^4',
          equals: [
            ['1', '0'],
            ['0', '1'],
          ],
        },
        {
          kind: 'expr',
          expr: 'R^5 - R',
          equals: [
            ['0', '0'],
            ['0', '0'],
          ],
        },
      ],
    },
    {
      id: 'periodic',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'Periyodik: $A^{k+1} = A$',
      body: 'Bir kuvveti kendisine dönüyorsa periyodik. $R^5 = R$: {ok}periyot 4{/ok}.',
      scene: { items: ['R'] },
      claims: [{ kind: 'property', expr: 'R', is: 'periodic', index: 4 }],
    },
    {
      id: 'idempotent',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'İdempotent: $A^2 = A$',
      body: '{ok}A² = A{/ok}: karesi kendisi. İkinci kez uygulamak bir şey değiştirmez, yani her kuvvet $A$.',
      scene: { items: ['P', 'E'] },
      claims: [
        { kind: 'property', expr: 'P', is: 'idempotent' },
        { kind: 'property', expr: 'E', is: 'idempotent' },
        { kind: 'property', expr: 'E', is: 'periodic', index: 1 },
      ],
    },
    {
      id: 'try-idempotent',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: 'Hangisi idempotenttir?',
      body: 'Karesini al, kendisi mi?',
      skill: 'recognize-idempotent',
      options: [
        {
          key: 'a',
          content: [
            matrix([
              ['0', '1'],
              ['0', '0'],
            ]),
          ],
          errorType: 'class-mixup',
          feedback: 'Karesi sıfır matris: bu nilpotent, idempotent değil.',
        },
        {
          key: 'b',
          content: [
            matrix([
              ['1', '1'],
              ['0', '0'],
            ]),
          ],
        },
        {
          key: 'c',
          content: [
            matrix([
              ['0', '1'],
              ['1', '0'],
            ]),
          ],
          errorType: 'class-mixup',
          feedback: 'Karesi $I$: bu involutive. İdempotent için kare matrisin kendisine eşit olmalı.',
        },
        {
          key: 'd',
          content: [
            matrix([
              ['2', '0'],
              ['0', '0'],
            ]),
          ],
          errorType: 'diagonal-guess',
          feedback:
            'Köşegen matrisin karesi köşegenin karesidir: $2^2 = 4 \\neq 2$. İdempotent bir köşegen matriste köşegende yalnızca $0$ ve $1$ olabilir.',
        },
      ],
      answer: 'b',
      reveal: {
        kind: 'equation',
        lines: [
          '\\begin{bmatrix} 1 & 1 \\\\ 0 & 0 \\end{bmatrix}^2 = \\begin{bmatrix} 1 & 1 \\\\ 0 & 0 \\end{bmatrix}',
        ],
      },
      solution:
        '$\\begin{bmatrix} 1 & 1 \\\\ 0 & 0 \\end{bmatrix}^2$’nin 1. satırı $(1 \\cdot 1 + 1 \\cdot 0,\\ 1 \\cdot 1 + 1 \\cdot 0) = (1, 1)$, 2. satırı $(0, 0)$: matrisin kendisi.',
      claims: [{ kind: 'optionProperty', is: 'idempotent' }],
    },
    {
      id: 'trap-idempotent',
      kind: 'explain',
      eyebrow: 'Tuzak',
      title: '$A^2 = A$, $A = I$ ya da $A = 0$ demek değil',
      body: 'Bu $A$ ne $0$ ne $I$, yine de $A^2 = A$. Tersinirse ancak o zaman $A = I$. $I - A$ da idempotent.',
      scene: { items: ['E'] },
      claims: [
        { kind: 'det', matrix: 'E', equals: '0' },
        { kind: 'property', expr: 'I - E', is: 'idempotent' },
      ],
    },
    {
      id: 'nilpotent',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'Nilpotent: bir kuvveti sıfır',
      body: 'Bir kuvveti 0 ise nilpotent; {ok}ilk sıfır olan kuvvet indekstir{/ok}. $U^2$’de yalnız köşe kalır, $U^3 = 0$: indeks 3.',
      scene: { items: ['U'] },
      beat: {
        kind: 'equation',
        lines: ['U^2 = \\begin{bmatrix} 0 & 0 & 3 \\\\ 0 & 0 & 0 \\\\ 0 & 0 & 0 \\end{bmatrix}', 'U^3 = 0'],
      },
      claims: [
        {
          kind: 'expr',
          expr: 'U^2',
          equals: [
            ['0', '0', '3'],
            ['0', '0', '0'],
            ['0', '0', '0'],
          ],
        },
        { kind: 'property', expr: 'U', is: 'nilpotent', index: 3 },
        {
          kind: 'expr',
          expr: 'N^2',
          equals: [
            ['0', '0', '0'],
            ['3', '3', '9'],
            ['-1', '-1', '-3'],
          ],
        },
        { kind: 'property', expr: 'N', is: 'nilpotent', index: 3 },
      ],
    },
    {
      id: 'try-power',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: '$N^2$’nin 2. satır 3. sütunu kaç?',
      body: '$N$’nin 2. satırı ile 3. sütunu.',
      skill: 'matrix-power-entry',
      scene: { items: ['N', 'N2'], marks: [{ cell: ['N2', 1, 2], tone: 'ok' }] },
      reveal: { kind: 'product', left: 'N', right: 'N', into: 'N2', cells: [[1, 2]] },
      answer: '9',
      feedbackWrong:
        '2. satır $(5, 2, 6)$, 3. sütun $(3, 6, -3)$: $5 \\cdot 3 + 2 \\cdot 6 + 6 \\cdot (-3)$.',
      solution: '$15 + 12 - 18 = 9$.',
      claims: [{ kind: 'exprEntry', expr: 'N^2', row: 2, col: 3, equals: '9' }],
    },
    {
      id: 'involutory',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'Involutive: $A^2 = I$, yani $A^{-1} = A$',
      body: '{ok}A² = I{/ok}: kendisinin tersi. İki kez yansıtınca başa dönersin; $B^{-1}$ için hesap gerekmez.',
      scene: { items: ['V'] },
      claims: [
        { kind: 'property', expr: 'V', is: 'involutory' },
        {
          kind: 'expr',
          expr: 'V^{-1} - V',
          equals: [
            ['0', '0', '0'],
            ['0', '0', '0'],
            ['0', '0', '0'],
          ],
        },
      ],
    },
    {
      id: 'try-involutory',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: '$B^2 = I$ ise $B^{-1}$ nedir?',
      skill: 'recognize-involutory',
      scene: { items: ['V'] },
      options: [
        { key: 'a', content: [text('$B$')] },
        {
          key: 'b',
          content: [text('$-B$')],
          errorType: 'sign-slip',
          feedback: '$B \\cdot B = I$; tersi $B$’nin kendisi, işaret değişmez.',
        },
        {
          key: 'c',
          content: [text('$I$')],
          errorType: 'confused-with-identity',
          feedback: '$B \\cdot I = B$, $I$ değil. $B$’yi $I$’ye götüren $B$’nin kendisi.',
        },
      ],
      answer: 'a',
      reveal: { kind: 'equation', lines: ['B \\cdot B = I', '\\Rightarrow B^{-1} = B'] },
      solution: '$B \\cdot B = I$, yani $B^{-1} = B$.',
    },
    {
      id: 'exam-nilpotent',
      kind: 'choice',
      eyebrow: 'Sınav tipi',
      title: '$A$ nilpotent bir kare matris olsun. Hangileri her zaman doğrudur?',
      body: 'I. $|A| = 0$\nII. $I + A$ tersinirdir\nIII. $A^2 = 0$',
      skill: 'power-class-statements',
      options: [
        {
          key: 'a',
          content: [text('Yalnız I')],
          errorType: 'missed-statement',
          feedback: 'II de doğru: $(I + A)(I - A + A^2 - \\dots) = I \\pm A^p = I$.',
        },
        { key: 'b', content: [text('I ve II')] },
        {
          key: 'c',
          content: [text('I ve III')],
          errorType: 'index-assumed-2',
          feedback: 'İndeks $2$’den büyük olabilir: $N^2 \\neq 0$ ama $N^3 = 0$.',
        },
        {
          key: 'd',
          content: [text('II ve III')],
          errorType: 'index-assumed-2',
          feedback: 'III her zaman doğru değil; I ise doğru: $|A|^p = |A^p| = 0$.',
        },
        {
          key: 'e',
          content: [text('I, II ve III')],
          errorType: 'index-assumed-2',
          feedback: 'III yanlış: indeksi $3$ olan $N$ için $N^2 \\neq 0$.',
        },
      ],
      answer: 'b',
      reveal: {
        kind: 'equation',
        lines: ['|A|^p = |A^p| = 0 \\Rightarrow |A| = 0', '(I + N)(I - N + N^2) = I + N^3 = I'],
      },
      solution: 'I: $|A|^p = |0| = 0$. II: $p = 3$ için $(I + A)^{-1} = I - A + A^2$. III: $N$ karşı örnek.',
      claims: [
        { kind: 'det', matrix: 'N', equals: '0' },
        {
          kind: 'expr',
          expr: '(I + N)(I - N + N^2)',
          equals: [
            ['1', '0', '0'],
            ['0', '1', '0'],
            ['0', '0', '1'],
          ],
        },
        { kind: 'property', expr: 'N^2', is: 'nilpotent', index: 2 },
      ],
    },
    {
      id: 'exam-idempotent-power',
      kind: 'keypad',
      eyebrow: 'Sınav tipi',
      title: '$A$ idempotent ve $(A + I)^3 = I + kA$ ise $k$ kaçtır?',
      body: 'Açarken her $A^2$ yerine $A$ yaz.',
      skill: 'idempotent-power',
      answer: '7',
      feedbackWrong: 'Önce $(A + I)^2 = A^2 + 2A + I = I + 3A$. Sonra bunu bir kez daha $(A + I)$ ile çarp.',
      reveal: {
        kind: 'equation',
        lines: ['(A + I)^2 = A^2 + 2A + I = I + 3A', '(I + 3A)(A + I) = I + 4A + 3A^2 = I + 7A'],
      },
      solution: '$(A + I)^3 = I + 7A$, yani $k = 7$. Genel kural: $(A + I)^n = I + (2^n - 1)A$.',
      claims: [{ kind: 'solve', expr: '(E + I)^3 - I - {k}E', variable: 'k', equals: '7' }],
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'Kuvvetle tanımlanan sınıflar',
      points: [
        'Periyodik: $A^{k+1} = A$, en küçük $k$ periyot.',
        'İdempotent: $A^2 = A$ (periyot $1$); izdüşüm. Tersinirse $A = I$.',
        'Nilpotent: $A^p = 0$, en küçük $p$ indeks; $|A| = 0$ ve $I + A$ tersinir.',
        'Involutive: $A^2 = I$, yani $A^{-1} = A$; yansıma.',
        'Matrislerde $AB = 0$ iken $A = 0$ ya da $B = 0$ sonucu çıkmaz.',
      ],
    },
  ],
}

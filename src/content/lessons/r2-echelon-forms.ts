import { matrix } from '../questions/blocks'
import type { Lesson, MatrixBlock } from './types'

const m = (label: string, rows: readonly (readonly string[])[]): MatrixBlock => ({
  kind: 'matrix',
  delimiter: 'brackets',
  rows,
  label,
})

/** R2: row echelon form (Gauss) and reduced row echelon form (Gauss-Jordan). */
export const r2EchelonForms: Lesson = {
  id: 'r2-echelon-forms',
  node: 'R2',
  title: 'Eşelon form ve indirgenmiş eşelon form',
  matrices: {
    G: m('', [
      ['1', '2', '-1', '4'],
      ['0', '1', '3', '5'],
      ['0', '0', '1', '2'],
    ]),
    G1: m('', [
      ['1', '2', '-1', '4'],
      ['0', '1', '0', '-1'],
      ['0', '0', '1', '2'],
    ]),
    rG: m('', [
      ['1', '0', '0', '8'],
      ['0', '1', '0', '-1'],
      ['0', '0', '1', '2'],
    ]),
  },
  steps: [
    {
      id: 'hook',
      kind: 'explain',
      eyebrow: 'Soru',
      title: 'Çözümü hangi şekilde okuruz?',
      body: 'Satır işlemleri matrisi merdivene çevirir. Merdivenin iki basamağı var.',
      scene: { items: ['G'] },
    },
    {
      id: 'echelon',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'Eşelon form (Gauss)',
      body: 'Her pivot bir üsttekinin {ok}sağında{/ok}, pivotların altı 0. Sıfır satırlar en altta.',
      scene: { items: ['G'] },
      beat: {
        kind: 'frames',
        frames: [
          {
            clear: true,
            marks: [
              { cell: ['G', 0, 0], tone: 'ok' },
              { cell: ['G', 1, 1], tone: 'ok' },
              { cell: ['G', 2, 2], tone: 'ok' },
            ],
            note: 'pivotlar',
          },
          {
            clear: true,
            marks: [
              { cell: ['G', 1, 0], tone: 'col' },
              { cell: ['G', 2, 0], tone: 'col' },
              { cell: ['G', 2, 1], tone: 'col' },
            ],
            note: 'altları 0',
          },
        ],
      },
      claims: [
        { kind: 'property', expr: 'G', is: 'rowEchelon' },
        { kind: 'property', expr: 'G', is: 'reducedRowEchelon', holds: false },
      ],
    },
    {
      id: 'try-echelon',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: 'Hangisi eşelon formda değil?',
      skill: 'recognize-rref',
      options: [
        {
          key: 'a',
          content: [
            matrix([
              ['2', '5'],
              ['0', '3'],
            ]),
          ],
          errorType: 'pivot-not-one',
          feedback: 'Pivotun 1 olması gerekmez; altı 0, bu eşelon.',
        },
        {
          key: 'b',
          content: [
            matrix([
              ['0', '1'],
              ['1', '0'],
            ]),
          ],
        },
        {
          key: 'c',
          content: [
            matrix([
              ['1', '4', '2'],
              ['0', '0', '1'],
              ['0', '0', '0'],
            ]),
          ],
          errorType: 'echelon-misread',
          feedback: 'Pivotlar 1. ve 3. sütunda, sağa kayıyor; sıfır satır altta. Eşelon.',
        },
      ],
      answer: 'b',
      reveal: {
        kind: 'equation',
        lines: ['\\begin{bmatrix} 0 & 1 \\\\ 1 & 0 \\end{bmatrix}', '\\text{2. pivot 1. pivotun solunda}'],
      },
      solution: '2. satırın pivotu, 1. satırınkinin solunda: önce satırları değiştir.',
      claims: [{ kind: 'optionProperty', is: 'rowEchelon', holds: false }],
    },
    {
      id: 'reduced',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'İndirgenmiş eşelon form (Gauss-Jordan)',
      body: 'Pivotlar 1 ve {ok}pivotun üstü de 0{/ok}. Alttan yukarı temizle.',
      scene: { items: ['G'] },
      beat: {
        kind: 'frames',
        frames: [
          {
            clear: true,
            marks: [
              { cell: ['G', 0, 1], tone: 'col' },
              { cell: ['G', 0, 2], tone: 'col' },
              { cell: ['G', 1, 2], tone: 'col' },
            ],
            note: 'temizlenecekler',
          },
        ],
      },
    },
    {
      id: 'try-clear',
      kind: 'keypad',
      eyebrow: 'Senin sıran',
      title: '$R_2 \\to R_2 - 3R_3$ sonrası 2. satırın son elemanı kaç?',
      skill: 'row-operations',
      scene: { items: ['G'] },
      answer: '-1',
      feedbackWrong: '$5 - 3 \\cdot 2$.',
      reveal: {
        kind: 'rowOps',
        matrix: 'G',
        ops: [{ kind: 'addMultiple', target: 1, source: 2, factor: '-3' }],
        result: 'G1',
      },
      solution: '$5 - 3 \\cdot 2 = -1$.',
      claims: [{ kind: 'exprEntry', expr: 'G1', row: 2, col: 4, equals: '-1', answer: true }],
    },
    {
      id: 'finish',
      kind: 'explain',
      eyebrow: 'Örnek',
      title: 'Kalan iki temizlik',
      body: 'Önce 3. pivotun üstü, sonra 2. pivotun üstü.',
      scene: { items: ['G1'] },
      beat: {
        kind: 'rowOps',
        matrix: 'G1',
        ops: [
          { kind: 'addMultiple', target: 0, source: 2, factor: '1' },
          { kind: 'addMultiple', target: 0, source: 1, factor: '-2' },
        ],
        result: 'rG',
      },
      claims: [{ kind: 'property', expr: 'rG', is: 'reducedRowEchelon' }],
    },
    {
      id: 'read-solution',
      kind: 'explain',
      eyebrow: 'Kullanım',
      title: 'Çözüm doğrudan okunur',
      body: 'Son sütun sağ taraf: $x = 8$, $y = -1$, $z = 2$. Geri yerine koyma yok.',
      scene: { items: ['rG'] },
      beat: {
        kind: 'frames',
        frames: [
          { clear: true, marks: [{ cell: ['rG', 0, 3], tone: 'ok' }], note: 'x = 8' },
          { clear: true, marks: [{ cell: ['rG', 1, 3], tone: 'ok' }], note: 'y = −1' },
          { clear: true, marks: [{ cell: ['rG', 2, 3], tone: 'ok' }], note: 'z = 2' },
        ],
      },
    },
    {
      id: 'try-which',
      kind: 'choice',
      eyebrow: 'Senin sıran',
      title: 'Hangisi indirgenmiş eşelon formdadır?',
      skill: 'recognize-rref',
      options: [
        {
          key: 'a',
          content: [
            matrix([
              ['1', '3', '0'],
              ['0', '1', '2'],
              ['0', '0', '0'],
            ]),
          ],
          errorType: 'nonzero-above-pivot',
          feedback: 'Eşelon formda ama 2. pivotun üstünde $3$ var.',
        },
        {
          key: 'b',
          content: [
            matrix([
              ['1', '0', '2'],
              ['0', '1', '3'],
              ['0', '0', '0'],
            ]),
          ],
        },
        {
          key: 'c',
          content: [
            matrix([
              ['0', '0', '0'],
              ['1', '0', '1'],
              ['0', '1', '1'],
            ]),
          ],
          errorType: 'zero-row-on-top',
          feedback: 'Sıfır satır en altta olmalı.',
        },
        {
          key: 'd',
          content: [
            matrix([
              ['2', '0', '1'],
              ['0', '1', '1'],
              ['0', '0', '0'],
            ]),
          ],
          errorType: 'pivot-not-one',
          feedback: 'İlk pivot $2$: indirgenmiş formda her pivot $1$ olmalı.',
        },
        {
          key: 'e',
          content: [
            matrix([
              ['1', '2', '0'],
              ['0', '0', '1'],
              ['0', '1', '0'],
            ]),
          ],
          errorType: 'pivot-order',
          feedback: '3. satırın pivotu 2. satırınkinin solunda: önce satırları değiştir.',
        },
      ],
      answer: 'b',
      reveal: {
        kind: 'equation',
        lines: [
          '\\begin{bmatrix} 1 & 0 & 2 \\\\ 0 & 1 & 3 \\\\ 0 & 0 & 0 \\end{bmatrix}',
          '\\text{pivotlar 1, üstleri ve altları 0}',
        ],
      },
      solution:
        'Pivotlar $1$, pivot sütunlarında başka eleman $0$, sıfır satır en altta. 3. sütun pivot sütunu değil, oradaki $2$ ve $3$ serbest.',
      claims: [{ kind: 'optionProperty', is: 'reducedRowEchelon' }],
    },
    {
      id: 'summary',
      kind: 'summary',
      eyebrow: 'Özet',
      title: 'Eşelon formlar',
      points: [
        'Eşelon form: sıfır satırlar altta, pivotlar sağa kayar, pivotların altı $0$.',
        'İndirgenmiş: pivotlar $1$, pivot sütununun geri kalanı $0$.',
        'Eşelon form tek değil; indirgenmiş eşelon form tek.',
        'İndirgenmiş formdan çözüm doğrudan okunur.',
      ],
    },
  ],
}

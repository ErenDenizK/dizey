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
    rG: m('', [
      ['1', '0', '0', '8'],
      ['0', '1', '0', '-1'],
      ['0', '0', '1', '2'],
    ]),
  },
  steps: [
    {
      id: 'echelon',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'Eşelon form (Gauss)',
      body: 'Sıfır satırlar en altta; her satırın ilk sıfırdan farklı elemanı (pivot) bir üstteki satırın pivotunun {ok}sağında{/ok}. Pivotların altı sıfırdır, merdiven gibi. Bu matris eşelon formda.',
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
        ],
      },
      claims: [
        { kind: 'property', expr: 'G', is: 'rowEchelon' },
        { kind: 'property', expr: 'G', is: 'reducedRowEchelon', holds: false },
      ],
    },
    {
      id: 'reduced',
      kind: 'explain',
      eyebrow: 'Tanım',
      title: 'İndirgenmiş eşelon form (Gauss-Jordan)',
      body: 'Ek olarak: her pivot $1$ ve pivot sütununda başka her eleman $0$, {ok}pivotun üstü de{/ok}. Alttan yukarı temizle. Eşelon form tek değildir, indirgenmiş eşelon form tektir.',
      scene: { items: ['G'] },
      beat: {
        kind: 'rowOps',
        matrix: 'G',
        ops: [
          { kind: 'addMultiple', target: 1, source: 2, factor: '-3' },
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
      title: 'İndirgenmiş formdan çözüm okunur',
      body: 'Son sütunu sağ taraf $b$ olarak düşünürsen satırlar doğrudan $x = 8$, $y = -1$, $z = 2$ der. Gauss’ta geri yerine koyma gerekir, Gauss-Jordan’da gerekmez.',
      scene: { items: ['rG'] },
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

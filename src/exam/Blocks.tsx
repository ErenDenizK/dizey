import 'katex/dist/katex.min.css'
import type { Block } from '../content/questions'
import { entryText, splitTex, texToHtml } from './tex'

/** Turkish text with inline `$...$` TeX. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {splitTex(text).map((part, index) =>
        part.tex ? (
          // biome-ignore lint/security/noDangerouslySetInnerHtml: KaTeX output of our own reviewed content
          // biome-ignore lint/suspicious/noArrayIndexKey: parts never reorder
          <span key={index} className="ex-tex" dangerouslySetInnerHTML={{ __html: texToHtml(part.value) }} />
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: parts never reorder
          <span key={index}>{part.value}</span>
        ),
      )}
    </>
  )
}

function Matrix({ block }: { block: Extract<Block, { kind: 'matrix' }> }) {
  const columns = block.rows[0]?.length ?? 1
  const label = block.delimiter === 'bars' ? 'determinant' : 'matris'
  return (
    <span className="ex-mat-wrap">
      {block.label ? (
        <span className="ex-mat-label">
          <RichText text={block.label} />
        </span>
      ) : null}
      <span
        className="ex-mat"
        data-delimiter={block.delimiter}
        role="img"
        aria-label={`${label}: ${block.rows.map((row) => row.map(entryText).join(', ')).join('; ')}`}
        style={{ gridTemplateColumns: `repeat(${columns}, auto)` }}
      >
        {block.rows.flatMap((row, r) =>
          row.map((entry, c) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed grid
              key={`${r}-${c}`}
              className="ex-cell"
              data-bar={block.augmentedAt !== undefined && c === block.augmentedAt ? 'before' : undefined}
            >
              {entryText(entry)}
            </span>
          )),
        )}
      </span>
    </span>
  )
}

export function Blocks({ blocks }: { blocks: readonly Block[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.kind === 'text') {
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: blocks never reorder
            <p key={index} className="ex-text">
              <RichText text={block.text} />
            </p>
          )
        }
        if (block.kind === 'matrix') {
          // biome-ignore lint/suspicious/noArrayIndexKey: blocks never reorder
          return <Matrix key={index} block={block} />
        }
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: blocks never reorder
          <span key={index} className="ex-system">
            {block.equations.map((equation) => (
              // biome-ignore lint/security/noDangerouslySetInnerHtml: KaTeX output of our own reviewed content
              <span key={equation} dangerouslySetInnerHTML={{ __html: texToHtml(equation) }} />
            ))}
          </span>
        )
      })}
    </>
  )
}

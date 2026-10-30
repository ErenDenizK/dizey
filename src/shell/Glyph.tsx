import type { LessonState } from './progress'

/**
 * Mastery mark: a 2×2 that fills along the diagonal (design prototype). Only "learned" exists until
 * review scheduling lands, so a finished lesson fills one cell.
 */
export function Glyph({ state }: { state: LessonState }) {
  const filled = state === 'done' ? [true, false, false, false] : [false, false, false, false]
  return (
    <span className="sh-glyph" data-state={state} aria-hidden="true">
      {filled.map((on, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: four fixed cells
        <i key={index} className={on ? 'on' : undefined} />
      ))}
    </span>
  )
}

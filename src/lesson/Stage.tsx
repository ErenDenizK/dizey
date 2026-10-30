import type { Lesson, Scene } from '../content/lessons/types'
import { Matrix, RichText } from '../exam/Blocks'
import { parse } from '../lib/math/rational'
import { minorBlock, type StageState } from './timeline'

function toneFor(state: StageState, name: string) {
  return (row: number, column: number) => {
    let tone: string | undefined
    for (const mark of state.marks) {
      const [matrix, r, c] = mark.cell
      if (matrix !== name) continue
      if ((r === '*' || r === row) && (c === '*' || c === column)) tone = mark.tone
    }
    const minor = state.minor
    if (minor?.matrix === name && (minor.row === row || minor.col === column)) tone = 'strike'
    return tone
  }
}

/** Unit square and its image under a 2×2 matrix: |det| is the area ratio. */
function Area({ lesson, name }: { lesson: Lesson; name: string }) {
  const rows = lesson.matrices[name]?.rows
  const value = (r: number, c: number) => {
    const parsed = parse(rows?.[r]?.[c] ?? '')
    return parsed ? Number(parsed.num) / Number(parsed.den) : null
  }
  const [a, b, c, d] = [value(0, 0), value(0, 1), value(1, 0), value(1, 1)]
  if (a === null || b === null || c === null || d === null) return null
  const points = [
    [0, 0],
    [a, c],
    [a + b, c + d],
    [b, d],
  ]
  const xs = [0, 1, ...points.map((p) => p[0] as number)]
  const ys = [0, 1, ...points.map((p) => p[1] as number)]
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const pad = 0.6
  const view = `${minX - pad} ${-(maxY + pad)} ${maxX - minX + 2 * pad} ${maxY - minY + 2 * pad}`
  const poly = (list: number[][]) => list.map(([x, y]) => `${x},${-(y as number)}`).join(' ')
  return (
    <svg className="ls-area" viewBox={view} role="img" aria-label="Birim kare ve görüntüsü">
      <line x1={minX - pad} y1={0} x2={maxX + pad} y2={0} className="ls-area__axis" />
      <line x1={0} y1={-(minY - pad)} x2={0} y2={-(maxY + pad)} className="ls-area__axis" />
      <polygon
        points={poly([
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ])}
        className="ls-area__unit"
      />
      <polygon points={poly(points)} className="ls-area__image" />
    </svg>
  )
}

export function Stage({
  lesson,
  scene,
  state,
}: {
  lesson: Lesson
  scene: Scene | undefined
  state: StageState
}) {
  return (
    <div className="ls-stage">
      {scene ? (
        <div className="ls-scene">
          {scene.items.map((item, index) => {
            if (item === '=') {
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: scene items never reorder
                <span key={index} className="ls-op">
                  =
                </span>
              )
            }
            if (item === 'result') {
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: scene items never reorder
                <span key={index} className="ls-result" data-done={state.result !== null}>
                  {state.result ?? scene.result ?? '?'}
                </span>
              )
            }
            const own = lesson.matrices[item]
            if (!own) return null
            const block = state.working?.matrix === item ? { ...own, rows: state.working.rows } : own
            const minor = state.minor?.matrix === item && state.minor.lifted ? state.minor : null
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: scene items never reorder
              <span key={index} className="ls-item">
                <Matrix block={block} toneAt={toneFor(state, item)} />
                {minor ? (
                  <span className="ls-minor">
                    <RichText text={`$M_{${minor.row + 1}${minor.col + 1}} =$`} />
                    <Matrix block={minorBlock(block, minor.row, minor.col)} />
                  </span>
                ) : null}
              </span>
            )
          })}
        </div>
      ) : null}
      {state.area ? <Area lesson={lesson} name={state.area} /> : null}
      {state.notes.length ? (
        <div className="ls-notes" aria-live="polite">
          {state.notes.map((note, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: notes only append
            <p key={index}>
              <RichText text={note} />
            </p>
          ))}
        </div>
      ) : null}
    </div>
  )
}

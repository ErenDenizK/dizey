import { type ReactNode, type RefObject, useLayoutEffect, useRef } from 'react'
import type { Lesson, Scene } from '../content/lessons/types'
import { engine } from '../engine/driver'
import { CHOREO } from '../engine/tokens'
import { Matrix, RichText } from '../exam/Blocks'
import { parse } from '../lib/math/rational'
import { minorBlock, type StageState } from './timeline'

/** A new line of working rises into place on the lesson channel (finished at once by a tap). */
function Rise({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    engine.set(el, { opacity: 0, y: CHOREO.rise })
    engine.withChannel('lesson', () => engine.to(el, { opacity: 1, y: 0 }, 'teach'))
  }, [])
  return (
    <span ref={ref} className={className}>
      {children}
    </span>
  )
}

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
function Area({
  lesson,
  name,
  ref,
}: {
  lesson: Lesson
  name: string
  ref?: RefObject<SVGSVGElement | null>
}) {
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
    <svg ref={ref} className="ls-area" viewBox={view} role="img" aria-label="Birim kare ve görüntüsü">
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

/**
 * Scene fit: one size, `--cell`, drives every matrix entry, operator, label and result on the stage.
 * The scene is laid out once at a probe size, measured, and scaled so it fills the stage's free width
 * and height, between a floor that keeps 4×4 scenes readable and a cap that keeps a 2×2 from shouting.
 * Working lines keep their own size; the room they will need for the whole beat is reserved up front,
 * so cells never resize while a beat plays.
 */
export const CELL = { probe: 64, min: 30, max: 88 } as const
/** Height of one working line (font cap × line height) and the gap above the lines, in px. */
const NOTE_LINE = 31
const NOTE_GAP = 12

export function fitCell(
  free: { width: number; height: number },
  natural: { width: number; height: number },
  probe: number = CELL.probe,
): number {
  if (natural.width <= 0 || natural.height <= 0) return CELL.max
  const scale = Math.min(free.width / natural.width, free.height / natural.height)
  return Math.round(Math.min(CELL.max, Math.max(CELL.min, probe * scale)))
}

function useSceneFit(
  stage: RefObject<HTMLDivElement | null>,
  scene: RefObject<HTMLDivElement | null>,
  area: RefObject<SVGSVGElement | null>,
  reserve: number,
  layoutKey: string,
) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: layoutKey refits when the scene's shape changes
  useLayoutEffect(() => {
    const box = stage.current
    if (!box) return
    const refit = () => {
      const content = scene.current
      if (!content) return
      box.style.setProperty('--cell', `${CELL.probe}px`)
      const style = getComputedStyle(box)
      const padX = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight)
      const padY = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom)
      const areaHeight = area.current ? area.current.getBoundingClientRect().height + NOTE_GAP : 0
      const notes = reserve ? reserve * NOTE_LINE + NOTE_GAP : 0
      const cell = fitCell(
        { width: box.clientWidth - padX, height: box.clientHeight - padY - notes - areaHeight },
        { width: content.offsetWidth, height: content.offsetHeight },
      )
      box.style.setProperty('--cell', `${cell}px`)
    }
    refit()
    const observer = new ResizeObserver(refit)
    observer.observe(box)
    return () => observer.disconnect()
  }, [stage, scene, area, reserve, layoutKey])
}

export function Stage({
  lesson,
  scene,
  state,
  reserve = 0,
}: {
  lesson: Lesson
  scene: Scene | undefined
  state: StageState
  /** Working lines the current beat will show at most. */
  reserve?: number
}) {
  const box = useRef<HTMLDivElement>(null)
  const sceneBox = useRef<HTMLDivElement>(null)
  const areaBox = useRef<SVGSVGElement>(null)
  // Anything that changes the scene's shape refits it: a lifted minor, rewritten rows, a result.
  const layoutKey = JSON.stringify([
    scene?.items,
    state.minor?.lifted ? state.minor : null,
    state.working,
    state.result,
    state.area,
  ])
  useSceneFit(box, sceneBox, areaBox, reserve, layoutKey)
  return (
    <div ref={box} className="ls-stage" data-testid="lesson-stage">
      {scene ? (
        <div ref={sceneBox} className="ls-scene">
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
                  <Rise key={state.result ?? ''}>{state.result ?? scene.result ?? '?'}</Rise>
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
      {state.area ? <Area ref={areaBox} lesson={lesson} name={state.area} /> : null}
      {state.notes.length ? (
        <div className="ls-notes" aria-live="polite">
          {state.notes.map((note, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: notes only append
            <Rise key={`${index}:${note}`} className="ls-note">
              <RichText text={note} />
            </Rise>
          ))}
        </div>
      ) : null}
    </div>
  )
}

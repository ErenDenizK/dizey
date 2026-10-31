import { type ReactNode, type RefObject, useLayoutEffect, useRef } from 'react'
import type { Lesson, Scene } from '../content/lessons/types'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
import { SHIFT, SPRINGS } from '../engine/tokens'
import { Matrix, RichText } from '../exam/Blocks'
import { parse } from '../lib/math/rational'
import { playSound } from '../sound/player'
import { copyName, type Flight, minorBlock, type Source, type StageState, type WorkLine } from './timeline'

/** A new line of working rises into place on the lesson channel (finished at once by a tap). */
function Rise({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    engine.set(el, { opacity: 0, y: SHIFT.scene })
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
/** Gap between the scene and the work lines, in px. */
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
  work: RefObject<HTMLDivElement | null>,
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
      // The beat's work lines are laid out from its first action, so their height is known now.
      const notes = work.current ? work.current.getBoundingClientRect().height + NOTE_GAP : 0
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
  }, [stage, scene, area, work, layoutKey])
}

const sourceSelector = (source: Source) =>
  'token' in source
    ? `[data-tok="${source.token}"]`
    : `[data-matrix="${source.copy ? copyName(source.matrix) : source.matrix}"] [data-cell="${source.row}-${source.col}"]`

/** The eye's smooth-pursuit limit at phone distance: a long carry slows down to stay under it (px/s). */
const PURSUIT = 900

/**
 * The work lines of the beat, laid out from its first action: every token has its place, hidden until an
 * action shows it, so nothing on a line ever moves. Lines share one left edge, like working on paper.
 */
function Work({ lines, shown }: { lines: readonly WorkLine[]; shown: readonly string[] }) {
  const visible = new Set(shown)
  return (
    <div className="ls-work" aria-live="polite">
      {lines.map((line) => {
        const groups: WorkLine['tokens'][number][][] = []
        for (const token of line.tokens) {
          const last = groups.at(-1)
          if (last && last[0]?.group === token.group) last.push(token)
          else groups.push([token])
        }
        return (
          <div key={line.key} className="ls-line">
            {groups.map((group) => (
              <span key={group[0]?.key} className="ls-group">
                {group.map((token) => (
                  <span
                    key={token.key}
                    className="ls-tok"
                    data-tok={token.key}
                    data-role={token.role}
                    data-op={token.op ? '' : undefined}
                    data-shown={visible.has(token.key)}
                    aria-hidden={visible.has(token.key) ? undefined : true}
                  >
                    {token.tex ? <RichText text={token.text} /> : token.text}
                  </span>
                ))}
              </span>
            ))}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Tokens an action shows: those with a flight lift out of their source as a filled chip in the source's
 * role colour and travel on a curved path (x on `carry`, y on the stiffer `carryY`), one `stagger` apart;
 * the chip is removed and the token shown in the same frame. The rest draw in place on `draw`. Runs on
 * the lesson channel, so a tap that finishes the beat lands everything at once.
 */
function useReveal(
  stage: RefObject<HTMLDivElement | null>,
  shown: readonly string[],
  flights: readonly Flight[],
  stagger: number,
) {
  const before = useRef<readonly string[]>([])
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once per action (shown changes)
  useLayoutEffect(() => {
    const box = stage.current
    const was = new Set(before.current)
    before.current = shown
    if (!box) return
    const fresh = shown.filter((key) => !was.has(key))
    if (!fresh.length) return
    const tokenOf = (key: string) => box.querySelector<HTMLElement>(`[data-tok="${key}"]`)
    const flown = new Map(flights.map((flight) => [flight.token, flight]))
    const chips: HTMLElement[] = []
    const stageRect = box.getBoundingClientRect()
    const landed = new Set<string>()
    engine.withChannel('lesson', () => {
      for (const key of fresh) {
        const el = tokenOf(key)
        if (!el) continue
        engine.set(el, { opacity: 0 })
        if (!flown.has(key)) engine.to(el, { opacity: 1 }, 'draw', { effect: true })
      }
      flights.forEach((flight, index) => {
        const to = tokenOf(flight.token)
        const from = box.querySelector<HTMLElement>(sourceSelector(flight.from))
        if (!to) return
        const show = () => {
          if (landed.has(flight.token)) return
          landed.add(flight.token)
          engine.set(to, { opacity: 1 })
        }
        if (!from) {
          show()
          return
        }
        const a = from.getBoundingClientRect()
        const b = to.getBoundingClientRect()
        const chip = document.createElement('span')
        chip.className = 'ls-chip'
        chip.dataset.role = flight.role
        chip.textContent = to.textContent
        chip.setAttribute('aria-hidden', 'true')
        chip.style.left = `${a.left - stageRect.left}px`
        chip.style.top = `${a.top - stageRect.top}px`
        chip.style.width = `${a.width}px`
        chip.style.height = `${a.height}px`
        chip.style.fontSize = getComputedStyle(from).fontSize
        box.append(chip)
        chips.push(chip)
        engine.set(chip, { opacity: 0 })
        const dx = b.left + b.width / 2 - (a.left + a.width / 2)
        const dy = b.top + b.height / 2 - (a.top + a.height / 2)
        const ratio =
          Number.parseFloat(getComputedStyle(to).fontSize) / Number.parseFloat(chip.style.fontSize)
        // A critically damped carry peaks near 0.37 × distance × w0; slow the spring until that stays under
        // the pursuit limit (the old engine's kScale).
        const tempo = engine.tempoOf('lesson')
        const w0 = (2 * Math.PI) / (SPRINGS.carry.duration * tempo)
        const slow = Math.max(1, (0.37 * Math.hypot(dx, dy) * w0) / PURSUIT)
        const spring = (spec: { duration: number; bounce: number }) => ({
          ...spec,
          duration: spec.duration * slow,
        })
        const land = () => {
          if (!chip.isConnected) return
          chip.remove()
          show()
          playSound('land')
        }
        engine.after(index * stagger, () => {
          engine.to(chip, { opacity: 1 }, 'fade', { effect: true })
          engine.to(chip, { x: dx, scale: ratio }, spring(SPRINGS.carry), { onArrive: land, epsilon: 0.75 })
          engine.to(chip, { y: dy }, spring(SPRINGS.carryY))
        })
      })
    })
    return () => {
      for (const chip of chips) chip.remove()
      for (const key of fresh) {
        const el = tokenOf(key)
        if (el) engine.set(el, { opacity: 1 })
      }
    }
  }, [shown])
}

export function Stage({
  lesson,
  scene,
  state,
  stagger,
  transport,
}: {
  lesson: Lesson
  scene: Scene | undefined
  state: StageState
  /** Chip stagger on the lesson channel (choreography ms, scaled by its tempo). */
  stagger: number
  /** Pause, play or replay, in the stage corner. */
  transport?: { mode: 'pause' | 'play' | 'replay'; onPress: () => void } | undefined
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
    state.extended,
  ])
  const workBox = useRef<HTMLDivElement>(null)
  useSceneFit(box, sceneBox, areaBox, workBox, `${layoutKey}:${state.lines.map((l) => l.key).join()}`)
  useReveal(box, state.shown, state.flights, stagger)
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
                <span className="ls-mat" data-matrix={item}>
                  <Matrix block={block} toneAt={toneFor(state, item)} />
                </span>
                {state.extended === item ? (
                  <Rise className="ls-mat ls-copy">
                    <span data-matrix={copyName(item)}>
                      <Matrix
                        block={{
                          kind: 'matrix',
                          delimiter: 'brackets',
                          rows: block.rows.map((row) => row.slice(0, 2)),
                        }}
                        toneAt={toneFor(state, copyName(item))}
                      />
                    </span>
                  </Rise>
                ) : null}
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
      {transport ? <Transport {...transport} /> : null}
      {state.area ? <Area ref={areaBox} lesson={lesson} name={state.area} /> : null}
      {state.lines.length ? (
        <div ref={workBox}>
          <Work lines={state.lines} shown={state.shown} />
        </div>
      ) : null}
    </div>
  )
}

const TRANSPORT = {
  pause: { path: 'M9 6.5v11M15 6.5v11', label: strings.lesson.pause },
  play: { path: 'M8.5 6v12l9.5-6z', label: strings.lesson.resume },
  replay: { path: 'M5 12a7 7 0 1 0 2.1-5M5 4v4h4', label: strings.lesson.replay },
} as const

/** One button, three states (old transport): pause while a beat plays, play while held, replay when done. */
function Transport({ mode, onPress }: { mode: 'pause' | 'play' | 'replay'; onPress: () => void }) {
  const icon = useRef<SVGSVGElement>(null)
  const press = () => {
    const el = icon.current
    if (el) {
      engine.withChannel('chrome', () => {
        if (mode === 'replay') {
          engine.set(el, { rotate: 0 })
          engine.to(el, { rotate: -360 }, 'move', { onArrive: () => engine.set(el, { rotate: 0 }) })
        } else {
          engine.set(el, { scale: 0.8 })
          engine.to(el, { scale: 1 }, 'land')
        }
      })
    }
    onPress()
  }
  return (
    <button type="button" className="ls-replay sh-press" aria-label={TRANSPORT[mode].label} onClick={press}>
      <svg ref={icon} viewBox="0 0 24 24" aria-hidden="true">
        <path d={TRANSPORT[mode].path} />
      </svg>
    </button>
  )
}

import { type ReactNode, type RefObject, useLayoutEffect, useRef } from 'react'
import type { Lesson, Mark, Scene } from '../content/lessons/types'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
import type { Target } from '../engine/engine'
import { CHOREO_MS, ENTER_FLOOR, SHIFT, SPRINGS } from '../engine/tokens'
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

function toneFor(state: StageState, name: string, still: readonly Mark[] = []) {
  const marks = state.marks.length ? state.marks : still
  return (row: number, column: number) => {
    let tone: string | undefined
    for (const mark of marks) {
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
  shown,
  ref,
}: {
  lesson: Lesson
  name: string
  /** False while the beat has not reached the area yet: laid out (room reserved) but invisible. */
  shown: boolean
  ref?: RefObject<SVGSVGElement | null>
}) {
  const rows = lesson.matrices[name]?.rows
  const value = (r: number, c: number) => {
    const parsed = parse(rows?.[r]?.[c] ?? '')
    return parsed ? Number(parsed.num) / Number(parsed.den) : null
  }
  const [a, b, c, d] = [value(0, 0), value(0, 1), value(1, 0), value(1, 1)]
  const image = useRef<SVGPolygonElement>(null)
  const unit = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ]
  const points =
    a === null || b === null || c === null || d === null
      ? null
      : [
          [0, 0],
          [a, c],
          [a + b, c + d],
          [b, d],
        ]
  const poly = (list: number[][]) => list.map(([x, y]) => `${x},${-(y as number)}`).join(' ')
  // The unit square turns into its image (the matrix acting on it), so the area ratio is seen, not told.
  // biome-ignore lint/correctness/useExhaustiveDependencies: plays once when the area is reached
  useLayoutEffect(() => {
    const svg = ref?.current
    const el = image.current
    if (!svg || !el || !points) return
    if (!shown) {
      engine.set(svg, { opacity: 0 })
      return
    }
    const render = (values: Record<string, number>) => {
      const t = values.t ?? 1
      el.setAttribute(
        'points',
        poly(
          points.map((p, i) => [
            (unit[i]?.[0] ?? 0) * (1 - t) + (p[0] ?? 0) * t,
            (unit[i]?.[1] ?? 0) * (1 - t) + (p[1] ?? 0) * t,
          ]),
        ),
      )
    }
    engine.withChannel('lesson', () => {
      engine.bind(el, render, { t: 0 })
      engine.to(svg, { opacity: 1 }, 'enter')
      engine.after(AREA_HOLD, () => engine.to(el, { t: 1 }, 'teach'))
    })
  }, [shown])
  if (!points) return null
  const xs = [0, 1, ...points.map((p) => p[0] as number)]
  const ys = [0, 1, ...points.map((p) => p[1] as number)]
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const pad = 0.6
  const view = `${minX - pad} ${-(maxY + pad)} ${maxX - minX + 2 * pad} ${maxY - minY + 2 * pad}`
  return (
    <svg
      ref={ref}
      className="ls-area"
      viewBox={view}
      role="img"
      aria-label="Birim kare ve görüntüsü"
      aria-hidden={shown ? undefined : true}
      data-obj="area"
      data-pending={shown ? undefined : 'true'}
    >
      <line x1={minX - pad} y1={0} x2={maxX + pad} y2={0} className="ls-area__axis" />
      <line x1={0} y1={-(minY - pad)} x2={0} y2={-(maxY + pad)} className="ls-area__axis" />
      <polygon points={poly(unit)} className="ls-area__unit" />
      <polygon ref={image} points={poly(shown ? points : unit)} className="ls-area__image" />
    </svg>
  )
}

/** The unit square is shown alone this long before it turns into its image (lesson ms). */
const AREA_HOLD = 280

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

type Rest = { cx: number; cy: number; w: number; h: number; el: HTMLElement | SVGElement }

/** Parts of the stage that keep their identity across commits (and steps): matrices by name, the result, ops. */
const OBJECTS = '[data-obj]'

/**
 * The stage's layout, one commit at a time (old swapScene and flipScene, inventory 5.6). Nothing on the
 * stage ever changes place or size in one frame:
 * - the stage's own height glides (`move`) when the narration or the dock beside it changes;
 * - one size, `--cell`, is fitted to the height the stage is going to, never to a height mid-glide;
 * - an object that persists (same matrix, the result, an operator) glides from where it was to where it
 *   now rests, scaling with the cell; an object that is new rises in from below, 35 ms apart.
 * Rects are kept in stage coordinates at rest, so a glide that is still running is picked up from its live
 * value and velocity.
 */
function useStageLayout(
  stage: RefObject<HTMLDivElement | null>,
  scene: RefObject<HTMLDivElement | null>,
  area: RefObject<SVGSVGElement | null>,
  work: RefObject<HTMLDivElement | null>,
) {
  const rest = useRef<Map<string, Rest> | null>(null)
  const natural = useRef(0)
  const width = useRef(0)
  const glide = useRef<Target | null>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs after every commit; refs only
  useLayoutEffect(() => {
    const box = stage.current
    if (!box) return
    const layout = () => {
      // The height the stage shows now: the live glide, or where it last came to rest. (The DOM already
      // holds this commit's narration and dock, so the box's own height is the new one.)
      const live = glide.current && engine.stateOf(glide.current).motions.h
      const visible = live ? engine.value(glide.current as Target, 'h') : natural.current || box.offsetHeight
      box.style.height = ''
      box.style.flex = ''
      box.style.minHeight = ''
      const next = box.offsetHeight
      width.current = box.clientWidth
      // Fit the cell to the height the stage is going to.
      const content = scene.current
      if (content) {
        box.style.setProperty('--cell', `${CELL.probe}px`)
        const style = getComputedStyle(box)
        const padX = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight)
        const padY = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom)
        const areaHeight = area.current ? area.current.getBoundingClientRect().height + NOTE_GAP : 0
        const notes = work.current ? work.current.getBoundingClientRect().height + NOTE_GAP : 0
        const cell = fitCell(
          { width: box.clientWidth - padX, height: next - padY - notes - areaHeight },
          { width: content.offsetWidth, height: content.offsetHeight },
        )
        box.style.setProperty('--cell', `${cell}px`)
      }
      // Where everything rests now, in stage coordinates (transforms taken out).
      const origin = box.getBoundingClientRect()
      const now = new Map<string, Rest>()
      for (const el of box.querySelectorAll<HTMLElement | SVGElement>(OBJECTS)) {
        const key = el.dataset.obj as string
        const r = el.getBoundingClientRect()
        const scale = engine.value(el, 'scale')
        now.set(key, {
          cx: r.left + r.width / 2 - origin.left - engine.value(el, 'x'),
          cy: r.top + r.height / 2 - origin.top - engine.value(el, 'y'),
          w: r.width / scale,
          h: r.height / scale,
          el,
        })
      }
      const before = rest.current
      const was = natural.current
      rest.current = now
      natural.current = next
      if (!before) {
        // First layout of this stage: everything rises in.
        let order = 0
        for (const [, object] of now) riseIn(object.el, order++ * CHOREO_MS.stagger)
        return
      }
      engine.withChannel('chrome', () => {
        // The stage glides from the height it shows to the one it rests at; centred content rides along.
        if (!glide.current) glide.current = {}
        const target = glide.current
        if (Math.abs(visible - next) > 0.5) {
          engine.bind(target, (v) => {
            box.style.flex = 'none'
            box.style.minHeight = '0px'
            box.style.height = `${v.h}px`
          })
          if (!engine.stateOf(target).motions.h) engine.set(target, { h: visible })
          engine.to(target, { h: next }, 'move', {
            onArrive: () => {
              box.style.height = ''
              box.style.flex = ''
              box.style.minHeight = ''
            },
          })
        } else if (engine.stateOf(target).motions.h) {
          engine.to(target, { h: next }, 'move')
        }
        let order = 0
        let glided = false
        const fresh: (HTMLElement | SVGElement)[] = []
        for (const [key, object] of now) {
          const old = before.get(key)
          if (!old) {
            fresh.push(object.el)
            continue
          }
          // Where the old object shows now (its rest, its live transform, the stage's live offset).
          const s0 = engine.value(old.el, 'scale')
          const fromX = old.cx + engine.value(old.el, 'x')
          const fromY = old.cy + engine.value(old.el, 'y') + (visible - was) / 2
          const fromW = old.w * s0
          const fromH = old.h * s0
          const toY = object.cy + (visible - next) / 2
          const sameShape =
            Math.abs(fromW / Math.max(1, fromH) - object.w / Math.max(1, object.h)) <
            0.08 * (object.w / Math.max(1, object.h))
          const scale = sameShape ? fromW / Math.max(1, object.w) : 1
          const dx = fromX - object.cx
          const dy = fromY - toY
          if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(scale - 1) < 0.005) continue
          glided = true
          const velocity = old.el === object.el ? undefined : { x: 0, y: 0, scale: 0 }
          engine.set(object.el, { x: dx, y: dy, scale })
          engine.to(object.el, { x: 0, y: 0, scale: 1 }, 'move', velocity ? { velocity } : {})
        }
        // A stage that is still growing would clip new objects laid out for its final height: they wait
        // until most of the glide is done and enter from transparent.
        const growing = next - visible > 8
        const head = growing ? CHOREO_MS.leaveHead : glided ? CHOREO_MS.glideHead : 0
        // A replaced scene enters from the entrance floor, so the stage is never empty between two scenes.
        for (const el of fresh) riseIn(el, head + order++ * CHOREO_MS.stagger, growing ? 0 : ENTER_FLOOR)
      })
    }
    layout()
    const observer = new ResizeObserver(() => {
      if (Math.abs(box.clientWidth - width.current) > 0.5) layout()
    })
    observer.observe(box)
    return () => observer.disconnect()
  })
}

/** A new stage object enters from below (never from above: a tall matrix would clip at the top). */
function riseIn(el: HTMLElement | SVGElement, delay: number, from = 0) {
  if (el.dataset.pending === 'true') return
  engine.withChannel('chrome', () => {
    engine.set(el, { opacity: from, y: SHIFT.scene })
    engine.after(delay, () => engine.to(el, { opacity: 1, y: 0 }, 'move'))
  })
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

/**
 * A value written into a matrix cell (a product entry, a rewritten row) lands. When the action names the
 * work-line token it came from (`landFrom`, the sum of a product or combine line), a chip in the result
 * colour carries it from the line into the cell on the carry springs, and the cell shows on arrival with
 * the land sound (old "the result flies in"). Otherwise the value rises out of the cell and settles.
 */
function useLanding(
  box: RefObject<HTMLDivElement | null>,
  working: StageState['working'],
  landFrom: StageState['landFrom'],
) {
  const before = useRef<StageState['working']>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once per working change
  useLayoutEffect(() => {
    const was = before.current
    before.current = working
    const root = box.current
    if (!root || !working || was?.matrix !== working.matrix) return
    const chips: HTMLElement[] = []
    working.rows.forEach((row, r) => {
      row.forEach((entry, c) => {
        if (was.rows[r]?.[c] === entry) return
        const el = root.querySelector<HTMLElement>(
          `[data-matrix="${working.matrix}"] [data-cell="${r}-${c}"]`,
        )
        if (!el) return
        const from = landFrom ? root.querySelector<HTMLElement>(`[data-tok="${landFrom}"]`) : null
        if (!from) {
          engine.set(el, { opacity: 0, y: SHIFT.scene, scale: 0.7 })
          engine.withChannel('lesson', () => {
            engine.to(el, { opacity: 1, y: 0, scale: 1 }, 'land')
          })
          return
        }
        const stageRect = root.getBoundingClientRect()
        const a = from.getBoundingClientRect()
        const b = el.getBoundingClientRect()
        const chip = document.createElement('span')
        chip.className = 'ls-chip'
        chip.dataset.role = 'ok'
        chip.textContent = from.textContent
        chip.setAttribute('aria-hidden', 'true')
        chip.style.left = `${a.left - stageRect.left}px`
        chip.style.top = `${a.top - stageRect.top}px`
        chip.style.width = `${a.width}px`
        chip.style.height = `${a.height}px`
        chip.style.fontSize = getComputedStyle(from).fontSize
        root.append(chip)
        chips.push(chip)
        engine.set(el, { opacity: 0 })
        const dx = b.left + b.width / 2 - (a.left + a.width / 2)
        const dy = b.top + b.height / 2 - (a.top + a.height / 2)
        const ratio =
          Number.parseFloat(getComputedStyle(el).fontSize) / Number.parseFloat(chip.style.fontSize)
        engine.withChannel('lesson', () => {
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
            engine.set(el, { opacity: 1, scale: 1.15 })
            engine.to(el, { scale: 1 }, 'land')
            playSound('land')
          }
          engine.to(chip, { x: dx, scale: ratio }, spring(SPRINGS.carry), { onArrive: land, epsilon: 0.75 })
          engine.to(chip, { y: dy }, spring(SPRINGS.carryY))
        })
      })
    })
    return () => {
      for (const chip of chips) {
        if (chip.isConnected) chip.remove()
      }
      if (!root) return
      for (const el of root.querySelectorAll<HTMLElement>(`[data-matrix="${working.matrix}"] [data-cell]`)) {
        engine.set(el, { opacity: 1 })
      }
    }
  }, [box, working])
}

export function Stage({
  lesson,
  scene,
  state,
  final,
  stagger,
  transport,
}: {
  lesson: Lesson
  scene: Scene | undefined
  state: StageState
  /** The beat's last action: what it will add (result, area, copy, minor) has its room from the start. */
  final: StageState
  /** Chip stagger on the lesson channel (choreography ms, scaled by its tempo). */
  stagger: number
  /** Pause, play or replay, in the stage corner. */
  transport?: { mode: 'pause' | 'play' | 'replay'; onPress: () => void } | undefined
}) {
  const box = useRef<HTMLDivElement>(null)
  const sceneBox = useRef<HTMLDivElement>(null)
  const areaBox = useRef<SVGSVGElement>(null)
  const workBox = useRef<HTMLDivElement>(null)
  useStageLayout(box, sceneBox, areaBox, workBox)
  useReveal(box, state.shown, state.flights, stagger)
  useLanding(box, state.working, state.landFrom)
  const areaName = state.area ?? final.area
  // A beat that ends on a result shows "?" until it gets there, never the answer it is about to derive.
  const placeholder = final.result !== null ? '?' : (scene?.result ?? '?')
  return (
    <div ref={box} className="ls-stage" data-testid="lesson-stage">
      {scene ? (
        <div ref={sceneBox} className="ls-scene">
          {scene.items.map((item, index) => {
            if (item === '=' || item === '·' || item === '+') {
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: scene items never reorder
                <span key={index} className="ls-op" data-obj={`op${index}`}>
                  {item}
                </span>
              )
            }
            if (item === 'result') {
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: scene items never reorder
                <span key={index} className="ls-result" data-obj="result" data-done={state.result !== null}>
                  <Rise key={state.result ?? ''}>{state.result ?? placeholder}</Rise>
                  {final.result !== null ? (
                    <span className="ls-result__room" aria-hidden="true">
                      {final.result}
                    </span>
                  ) : null}
                </span>
              )
            }
            const own = lesson.matrices[item]
            if (!own) return null
            const block = state.working?.matrix === item ? { ...own, rows: state.working.rows } : own
            const minor = state.minor?.matrix === item ? state.minor : null
            const finalMinor = final.minor?.matrix === item && final.minor.lifted ? final.minor : null
            const lifted = finalMinor ?? (minor?.lifted ? minor : null)
            const extended = state.extended === item || final.extended === item
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: scene items never reorder
              <span key={index} className="ls-item" data-obj={`m:${item}`}>
                <span className="ls-mat" data-matrix={item}>
                  <Matrix block={block} toneAt={toneFor(state, item, scene.marks)} labelAbove />
                </span>
                {extended ? (
                  <Appear shown={state.extended === item} className="ls-mat ls-copy">
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
                  </Appear>
                ) : null}
                {lifted ? (
                  <Appear shown={Boolean(minor?.lifted)} className="ls-minor">
                    <RichText text={`$M_{${lifted.row + 1}${lifted.col + 1}} =$`} />
                    <Matrix block={minorBlock(block, lifted.row, lifted.col)} />
                  </Appear>
                ) : null}
              </span>
            )
          })}
        </div>
      ) : null}
      {transport ? <Transport {...transport} /> : null}
      {areaName ? (
        <Area key={areaName} ref={areaBox} lesson={lesson} name={areaName} shown={state.area === areaName} />
      ) : null}
      {state.lines.length ? (
        <div ref={workBox} data-obj={`work:${state.lines.map((l) => l.key).join()}`}>
          <Work lines={state.lines} shown={state.shown} />
        </div>
      ) : null}
    </div>
  )
}

/**
 * A part of the beat laid out from its first action (its room is reserved, so nothing moves when it
 * comes) and drawn in when the beat reaches it: up from SHIFT.scene on the lesson channel.
 */
function Appear({ shown, className, children }: { shown: boolean; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null)
  const was = useRef<boolean | null>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || was.current === shown) return
    const first = was.current === null
    was.current = shown
    if (!shown) {
      engine.set(el, { opacity: 0, y: SHIFT.scene })
      return
    }
    if (first) return
    engine.withChannel('lesson', () => engine.to(el, { opacity: 1, y: 0 }, 'teach'))
  }, [shown])
  return (
    <span ref={ref} className={className} aria-hidden={shown ? undefined : true}>
      {children}
    </span>
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

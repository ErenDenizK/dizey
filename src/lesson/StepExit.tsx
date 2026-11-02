import { Component } from 'react'
import { engine } from '../engine/driver'

/** What leaves with a step: its stage and narration, or the end screen. */
const MAIN = ':scope > .ls-main, :scope > .ls-end'
/** Rows of controls: what React kept stays (gliding if it moved), what left fades, what came waits. */
const ROWS = { dock: ':scope > .ls-dock', top: ':scope > .ls-top' } as const
type Row = keyof typeof ROWS
/** Longest a leaving copy may stay, in case its fade never reports arrival. */
const EXIT_CAP_MS = 400
/** How long what enters waits for what leaves (the `leave` spring is near a third by then). */
const THROUGH_MS = 60

type Copy = { copy: HTMLElement; left: number; top: number; width: number; height: number; scroll: number }
type Snapshot = {
  main: Copy | null
  rows: (Copy & { selector: string; children: Element[]; at: Map<Element, [number, number]> })[]
  hints: { el: Element; copy: Copy }[]
}
const HINT = ':scope > .ls-main .ls-feedback'

function copyOf(root: HTMLElement, el: HTMLElement | null): Copy | null {
  if (!el) return null
  const outer = root.getBoundingClientRect()
  const r = el.getBoundingClientRect()
  if (r.width < 1 || r.height < 1) return null
  return {
    copy: el.cloneNode(true) as HTMLElement,
    left: r.left - outer.left,
    top: r.top - outer.top,
    width: r.width,
    height: r.height,
    scroll: el.querySelector('.ls-narr')?.scrollTop ?? 0,
  }
}

/** Lays a copy over the spot its original held and fades it out; it leaves the DOM when it is gone. */
function fadeOut(root: HTMLElement, { copy, left, top, width, height, scroll }: Copy) {
  copy.setAttribute('aria-hidden', 'true')
  copy.setAttribute('inert', '')
  copy.removeAttribute('data-testid')
  copy.classList.add('ls-leaving')
  for (const el of copy.querySelectorAll('[id], [data-testid]')) {
    el.removeAttribute('id')
    el.removeAttribute('data-testid')
  }
  Object.assign(copy.style, {
    position: 'absolute',
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    margin: '0',
    flex: 'none',
    pointerEvents: 'none',
  })
  root.appendChild(copy)
  const narr = copy.querySelector('.ls-narr')
  if (narr) narr.scrollTop = scroll
  let gone = false
  const remove = () => {
    if (gone) return
    gone = true
    copy.remove()
  }
  engine.set(copy, { opacity: 1 })
  engine.to(copy, { opacity: 0 }, 'leave', { onArrive: remove })
  engine.after(EXIT_CAP_MS, remove)
}

/**
 * Holds what enters until what leaves has mostly gone (fade through, not across), on its own channel of
 * ink (`filter: opacity(var(--through))`), so the element's own entrance motion runs untouched.
 */
function holdIn(el: HTMLElement) {
  el.classList.add('ls-through')
  engine.set(el, { '--through': 0 })
  engine.after(THROUGH_MS, () =>
    engine.to(el, { '--through': 1 }, 'fade', { onArrive: () => el.classList.remove('ls-through') }),
  )
}

/**
 * The leaving half of every swap in the lesson (PR-16: nothing disappears in one frame). React swaps a
 * step's stage and narration, or the dock's options, keypad and verdict, in a single commit; this copies
 * what is about to leave just before that commit (getSnapshotBeforeUpdate, the one hook that runs before
 * the DOM changes), lays the copy over the spot it held and fades it out, while the new content waits a
 * moment and then enters underneath. What persists is hidden in the copy, because the real one stays or
 * glides on from the same place: a stage object with the same data-obj, a dock control React kept.
 * Renders nothing.
 */
export class StepExit extends Component<{
  root: { current: HTMLElement | null }
  /** Changes when the stage and narration swap (a new step, the gizli an, the end). */
  swap: string
  /** Changes when the dock's content swaps (also on an answer: options or keypad to the verdict). */
  dock: string
  /** Changes when the top bar's controls swap (the gizli an has its own). */
  top: string
  /** Changes when a wrong try's hint is replaced or taken away. */
  hint: string
}> {
  override getSnapshotBeforeUpdate(previous: Record<Row | 'swap' | 'hint', string>): Snapshot | null {
    const root = this.props.root.current
    if (!root) return null
    const mainSwap = previous.swap !== this.props.swap
    const hintSwap = !mainSwap && previous.hint !== this.props.hint
    const rows: Snapshot['rows'] = []
    for (const row of Object.keys(ROWS) as Row[]) {
      if (!mainSwap && previous[row] === this.props[row]) continue
      const el = root.querySelector<HTMLElement>(ROWS[row])
      const copy = copyOf(root, el)
      if (!copy || !el) continue
      const at = new Map<Element, [number, number]>()
      // Each control keeps its exact box in the copy: a row whose height depends on the room the live one
      // had (a scrolling option list) would lay out differently once the copy is out of the flow. Layout
      // boxes (offset*), not rects: a pressed control's scale is already in the copied transform.
      ;[...el.children].forEach((child, i) => {
        const twin = copy.copy.children[i] as HTMLElement | undefined
        if (!twin || !(child instanceof HTMLElement)) return
        at.set(child, [child.offsetLeft, child.offsetTop])
        Object.assign(twin.style, {
          position: 'absolute',
          left: `${child.offsetLeft - el.offsetLeft}px`,
          top: `${child.offsetTop - el.offsetTop}px`,
          width: `${child.offsetWidth}px`,
          height: `${child.offsetHeight}px`,
          margin: '0',
        })
      })
      rows.push({ ...copy, selector: ROWS[row], children: [...el.children], at })
    }
    const hints = hintSwap
      ? [...root.querySelectorAll<HTMLElement>(HINT)].flatMap((el) => {
          const copy = copyOf(root, el)
          return copy ? [{ el, copy }] : []
        })
      : []
    if (!mainSwap && !rows.length && !hints.length) return null
    return { main: mainSwap ? copyOf(root, root.querySelector<HTMLElement>(MAIN)) : null, rows, hints }
  }

  override componentDidUpdate(_: unknown, __: unknown, snapshot: Snapshot | null): void {
    const root = this.props.root.current
    if (!snapshot || !root) return
    engine.withChannel('chrome', () => {
      const { main, rows, hints } = snapshot
      // A hint that was replaced (the next wrong try) or taken away (the answer is out) fades where it was.
      const left = hints.filter(({ el }) => !el.isConnected)
      for (const { copy } of left) fadeOut(root, copy)
      if (left.length)
        for (const el of root.querySelectorAll<HTMLElement>(HINT))
          if (!hints.some((h) => h.el === el)) holdIn(el)
      if (main) {
        // A persisting object glides on in the new step; its copy would be a double.
        let persists = false
        const changed: HTMLElement[] = []
        for (const el of main.copy.querySelectorAll<HTMLElement>('[data-obj]')) {
          const key = CSS.escape(el.dataset.obj as string)
          const live = root.querySelector<HTMLElement>(`:scope > :not(.ls-leaving) [data-obj="${key}"]`)
          if (!live) continue
          // Same object with the same content glides on; same slot with new content (the next work lines)
          // fades through like everything else.
          if (live.textContent !== el.textContent) {
            changed.push(live)
            continue
          }
          el.style.visibility = 'hidden'
          persists = true
        }
        fadeOut(root, main)
        const fresh = root.querySelector<HTMLElement>(':scope > .ls-main:not(.ls-leaving)')
        const narr = fresh?.querySelector<HTMLElement>(':scope > .ls-narr')
        if (narr) holdIn(narr)
        const scene = fresh?.querySelector<HTMLElement>('.ls-scene')
        if (scene && !persists) holdIn(scene)
        else for (const el of changed) holdIn(el)
        const end = root.querySelector<HTMLElement>(':scope > .ls-end')
        if (end) holdIn(end)
      }
      for (const row of rows) {
        const now = root.querySelector<HTMLElement>(`${row.selector}:not(.ls-leaving)`)
        let leaving = 0
        row.children.forEach((child, i) => {
          const twin = row.copy.children[i] as HTMLElement | undefined
          if (!twin) return
          if (!(child.isConnected && child.parentElement === now)) {
            leaving++
            return
          }
          // A control React kept stays; if the row around it changed, it glides to its new place.
          twin.style.visibility = 'hidden'
          const was = row.at.get(child)
          if (!was || !(child instanceof HTMLElement)) return
          const dx = was[0] - child.offsetLeft
          const dy = was[1] - child.offsetTop
          if (Math.abs(dx) > 0.5) engine.set(child, { x: engine.value(child, 'x') + dx })
          if (Math.abs(dy) > 0.5) engine.set(child, { y: engine.value(child, 'y') + dy })
          if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) engine.to(child, { x: 0, y: 0 }, 'move')
        })
        if (leaving) {
          fadeOut(root, row)
          if (now) for (const el of now.children) if (!row.children.includes(el)) holdIn(el as HTMLElement)
        }
      }
    })
  }

  override render() {
    return null
  }
}

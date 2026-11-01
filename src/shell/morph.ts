import { engine } from '../engine/driver'
import type { Target } from '../engine/engine'
import { CHOREO_MS, SPRINGS } from '../engine/tokens'

/**
 * Shared-element helpers: a surface that opens out of a smaller card (or closes back into it) is clipped
 * with an inset that springs from the card's rectangle to its own, while a copy of the card fades out over it.
 */

export function insets(surface: HTMLElement, card: HTMLElement) {
  const outer = surface.getBoundingClientRect()
  const inner = card.getBoundingClientRect()
  return {
    t: inner.top - outer.top,
    l: inner.left - outer.left,
    r: outer.right - inner.right,
    b: outer.bottom - inner.bottom,
    rad: Number.parseFloat(getComputedStyle(card).borderTopLeftRadius) || 0,
  }
}

const px = (n: number | undefined) => `${(n ?? 0).toFixed(2)}px`

export type Insets = ReturnType<typeof insets>

/** The four sides of an inset summed: one number for how far a clip has travelled. */
export const reach = (v: { t?: number; l?: number; r?: number; b?: number }) =>
  (v.t ?? 0) + (v.l ?? 0) + (v.r ?? 0) + (v.b ?? 0)

/** 0 until the last third of a travel, then 0..1 linearly to its end: where radius and the resting look arrive. */
export const lastThird = (progress: number) => Math.min(1, Math.max(0, (progress - 2 / 3) * 3))

/** A small or round source (a 44 px icon button) grows as a circle, not as a stretching pill. */
export function isRound(card: HTMLElement) {
  const { width, height } = card.getBoundingClientRect()
  const radius = Number.parseFloat(getComputedStyle(card).borderTopLeftRadius) || 0
  return (width < 64 && height < 64) || radius >= Math.min(width, height) / 2 - 0.5
}

/** The source's circle in the surface's own coordinates, and the radius that covers the whole surface. */
export function circleOf(surface: HTMLElement, card: HTMLElement) {
  const outer = surface.getBoundingClientRect()
  const inner = card.getBoundingClientRect()
  const cx = inner.left + inner.width / 2 - outer.left
  const cy = inner.top + inner.height / 2 - outer.top
  const far = Math.hypot(Math.max(cx, outer.width - cx), Math.max(cy, outer.height - cy))
  return { cx, cy, r0: Math.min(inner.width, inner.height) / 2, far }
}

/** Clips a surface to a circle around (cx, cy) whose radius is the engine's own `cr`. */
export function clipCircle(
  el: HTMLElement,
  at: { cx: number; cy: number },
  watch?: (v: Record<string, number>) => void,
) {
  engine.bind(el, (v) => {
    el.style.clipPath = `circle(${px(v.cr)} at ${px(at.cx)} ${px(at.cy)})`
    watch?.(v)
  })
}

export type ClipHooks = {
  /** The corner radius for the live values; by default the engine's own `rad`. */
  rad?: (v: Record<string, number>) => number
  /** Called on every write of the clip, e.g. to start the next phase at a given progress. */
  watch?: (v: Record<string, number>) => void
}

export function clipWith(el: HTMLElement, hooks: ClipHooks = {}) {
  engine.bind(el, (v) => {
    const rad = hooks.rad ? hooks.rad(v) : v.rad
    el.style.clipPath = `inset(${px(v.t)} ${px(v.r)} ${px(v.b)} ${px(v.l)} round ${px(rad)})`
    hooks.watch?.(v)
  })
}

/**
 * A copy of the card, drawn where the card is, so the growth starts from what was tapped: it fades
 * as the surface opens while the route fades in after it, so there is never an empty frame and
 * never two layers of text at full strength (the same choreography as src/ui Morph).
 */
export function faceOf(surface: HTMLElement, card: HTMLElement) {
  const face = card.cloneNode(true) as HTMLElement
  const outer = surface.getBoundingClientRect()
  const inner = card.getBoundingClientRect()
  face.removeAttribute('href')
  face.removeAttribute('data-testid')
  face.setAttribute('aria-hidden', 'true')
  face.setAttribute('data-face', '')
  Object.assign(face.style, {
    position: 'absolute',
    margin: '0',
    top: `${inner.top - outer.top}px`,
    left: `${inner.left - outer.left}px`,
    width: `${inner.width}px`,
    height: `${inner.height}px`,
    zIndex: '1',
    pointerEvents: 'none',
    visibility: 'visible',
    transform: '',
  })
  surface.append(face)
  return face
}

/** The cell edge in px: about 48, grown until the screen holds at most this many cells. */
const MAX_CELLS = 120
const CELL = 48

export type CellField = { layer: HTMLElement; cells: { el: HTMLElement; dist: number }[]; far: number }

/**
 * A field of opaque cells over `surface`, each at rest (hidden and shrunk) and ordered by its distance to
 * `source` (a rectangle in viewport coordinates, the tile or card the lesson comes from). The layer sits
 * under the surface's content. Only transforms and opacity are animated.
 */
export function cellField(surface: HTMLElement, source: DOMRect): CellField {
  const box = surface.getBoundingClientRect()
  let size = CELL
  while (Math.ceil(box.width / size) * Math.ceil(box.height / size) > MAX_CELLS) size += 4
  const layer = document.createElement('div')
  layer.className = 'sh-cells'
  layer.setAttribute('aria-hidden', 'true')
  const cells: CellField['cells'] = []
  let far = 0
  for (let row = 0; row * size < box.height; row++) {
    for (let col = 0; col * size < box.width; col++) {
      const el = document.createElement('i')
      el.className = 'sh-cell'
      Object.assign(el.style, {
        left: `${col * size}px`,
        top: `${row * size}px`,
        width: `${size + 1}px`,
        height: `${size + 1}px`,
      })
      const cx = box.left + col * size + size / 2
      const cy = box.top + row * size + size / 2
      // Distance from the cell's centre to the nearest point of the source: cells under it go first.
      const dx = Math.max(source.left - cx, 0, cx - source.right)
      const dy = Math.max(source.top - cy, 0, cy - source.bottom)
      const dist = Math.hypot(dx, dy)
      far = Math.max(far, dist)
      cells.push({ el, dist })
      layer.append(el)
    }
  }
  surface.prepend(layer)
  return { layer, cells, far }
}

/** Start time (ms) of a cell in a spread: the farthest starts last, within the longest ripple delay. */
export const spreadDelay = (dist: number, far: number, reverse = false) => {
  const t = far > 0 ? dist / far : 0
  return (reverse ? 1 - t : t) * CHOREO_MS.waveMax
}

const RIPPLE_NEIGHBOURS = 8
/** The farthest a neighbouring tile is nudged (px). */
const RIPPLE_PX = 3

const SVG = 'http://www.w3.org/2000/svg'
/** The persistent ring of the current tile sits this far outside it (path.css: 3px gap, 2.5px ring). */
const MAIN_RING = { offset: 4.25, width: 2.5 }
const QUIET_RING = { offset: -0.75, width: 1.5 }
/** How far (px) a held tag waits below its place. */
const TAG_DROP = 6

/**
 * Draws a tile's outline: an SVG rounded-rect stroke (`pathLength` 1, dash offset 1 to 0 on the `draw`
 * spring) laid exactly on the tile's ring. A tile with a persistent ring (`data-main`) hides that ring while
 * the stroke draws and shows it again on the frame the stroke completes, so the stroke becomes the ring with
 * no visible change. A tile without one draws and then fades the stroke out.
 */
export function drawRing(tile: HTMLElement) {
  if (engine.reducedMotion || !tile.isConnected || tile.querySelector(':scope > .pa-tile__trace')) return
  const main = tile.hasAttribute('data-main')
  const { offset, width } = main ? MAIN_RING : QUIET_RING
  const w = tile.offsetWidth
  const h = tile.offsetHeight
  const radius = (Number.parseFloat(getComputedStyle(tile).borderTopLeftRadius) || 0) + offset
  const svg = document.createElementNS(SVG, 'svg')
  svg.setAttribute('class', 'pa-tile__trace')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('width', String(w))
  svg.setAttribute('height', String(h))
  const path = document.createElementNS(SVG, 'rect')
  path.setAttribute('x', String(-offset))
  path.setAttribute('y', String(-offset))
  path.setAttribute('width', String(w + 2 * offset))
  path.setAttribute('height', String(h + 2 * offset))
  path.setAttribute('rx', String(radius))
  path.setAttribute('pathLength', '1')
  path.setAttribute('stroke-width', String(width))
  path.setAttribute('stroke-dasharray', '1 1')
  svg.append(path)
  tile.append(svg)
  tile.setAttribute('data-trace', '')
  const finish = () => {
    ring.isConnected = false
    svg.remove()
    tile.removeAttribute('data-trace')
  }
  const ring: Target = { style: path.style as unknown as NonNullable<Target['style']>, isConnected: true }
  let fading = false
  engine.bind(
    ring,
    (v) => {
      path.setAttribute('stroke-dashoffset', String(v.draw ?? 1))
      path.style.opacity = String(v.ink ?? 1)
    },
    { draw: 1, ink: 1 },
  )
  engine.withChannel('chrome', () => {
    engine.to(ring, { draw: 0 }, 'draw', {
      onArrive: () => {
        if (main) finish()
        else if (!fading) {
          fading = true
          engine.to(ring, { ink: 0 }, 'fade', { onArrive: finish })
        }
      },
    })
  })
}

/** Holds a tag out of sight (transparent, a few px low) until `raiseTag`. */
export function holdTag(tag: HTMLElement) {
  tag.setAttribute('data-held', '')
  engine.set(tag, { opacity: 0, y: TAG_DROP })
}

/** Raises a held tag into place on `ui`, `delay` ms from now. Under reduced motion it only fades. */
export function raiseTag(tag: HTMLElement, delay = 0) {
  if (!tag.hasAttribute('data-held')) return
  tag.removeAttribute('data-held')
  engine.withChannel('chrome', () => {
    engine.after(delay, () => {
      if (!tag.isConnected) return
      engine.to(tag, { opacity: 1, y: 0 }, engine.reducedMotion ? 'fade' : 'ui')
    })
  })
}

type Ink = { el: HTMLElement; color: string; opacity: string }
const pendingInk = new WeakMap<HTMLElement, () => void>()

/** The ink (colour and opacity) of a tile's text parts, as it is now. */
export function inkOf(tile: HTMLElement): Ink[] {
  return [...tile.querySelectorAll<HTMLElement>('.pa-tile__code, .pa-tile__title')].map((el) => {
    const style = getComputedStyle(el)
    return { el, color: style.color, opacity: style.opacity }
  })
}

/**
 * The text of a tile whose state just changed keeps its old ink and shifts to the new one with the fill's
 * crossfade (`fadeOutWas` starts it), instead of swapping colour in one frame.
 */
export function holdInk(tile: HTMLElement, before: Ink[]) {
  const after = inkOf(tile)
  const pairs = before.flatMap((old) => {
    const now = after.find((item) => item.el.className === old.el.className)
    return now && (now.color !== old.color || now.opacity !== old.opacity) ? [{ old, now }] : []
  })
  if (pairs.length === 0) return
  const paint = (m: number) => {
    for (const { old, now } of pairs) {
      now.el.style.color = `color-mix(in oklch, ${now.color} ${(m * 100).toFixed(1)}%, ${old.color})`
      now.el.style.opacity = String(Number(old.opacity) + (Number(now.opacity) - Number(old.opacity)) * m)
    }
  }
  paint(0)
  pendingInk.set(tile, () => {
    const mix: Target = { isConnected: true }
    engine.bind(mix, (v) => paint(v.m ?? 0), { m: 0 })
    engine.withChannel('chrome', () =>
      engine.to(mix, { m: 1 }, 'fade', {
        onArrive: () => {
          mix.isConnected = false
          for (const { now } of pairs) {
            now.el.style.color = ''
            now.el.style.opacity = ''
          }
        },
      }),
    )
  })
}

/** Fades out the old fills left over a tile whose state just changed (see `useStateChange` in PathView). */
export function fadeOutWas(tile: HTMLElement) {
  pendingInk.get(tile)?.()
  pendingInk.delete(tile)
  for (const was of tile.querySelectorAll<HTMLElement>(':scope > .pa-tile__was')) {
    engine.withChannel('chrome', () =>
      engine.to(was, { opacity: 0 }, 'fade', { onArrive: () => was.remove() }),
    )
  }
}

/** Parts that appeared while the tile was out of sight wait (data-held) and are raised with its aftermath. */
const heldIn = (tile: HTMLElement) => [...tile.querySelectorAll<HTMLElement>(':scope > [data-held]')]

/** Tags of a tile: the markers in its grid cell that are not part of it (the "you are here" pill). */
const tagsOf = (tile: HTMLElement) => [
  ...(tile.parentElement?.querySelectorAll<HTMLElement>('[data-tag]') ?? []),
]

/** A tile that is about to be revealed keeps its tags back until its aftermath. */
export function holdTagsOf(tile: HTMLElement) {
  for (const tag of tagsOf(tile)) holdTag(tag)
}

/**
 * Lets go of everything a closing lesson held back on its tile: tags, new check or bar, old fill and old
 * ink. The aftermath does it on its schedule; a close that ends without an aftermath (interrupted by a
 * newer open or close) calls it so nothing stays transparent.
 */
export function release(tile: HTMLElement, delay = 0) {
  for (const tag of tagsOf(tile)) raiseTag(tag, delay)
  for (const part of heldIn(tile)) raiseTag(part, 0)
  fadeOutWas(tile)
}

/**
 * The siblings of a source that ripple: elements of the same base class (its first class) inside the closest
 * ancestor that holds any, so a chapter-test cell stirs the other cells and a lesson tile its grid, whatever
 * the source's own class. A source alone in its kind (the gate) has none.
 */
function neighboursOf(source: HTMLElement) {
  const base = source.classList[0]
  if (!base) return []
  for (let box = source.parentElement; box; box = box.parentElement) {
    const kin = [...box.querySelectorAll<HTMLElement>(`.${CSS.escape(base)}`)].filter(
      (other) =>
        other !== source &&
        !other.hasAttribute('data-face') &&
        getComputedStyle(other).visibility !== 'hidden',
    )
    if (kin.length > 0) return kin
  }
  return []
}

/**
 * Aftermath of a source coming home (a lesson tile, a chapter-test cell, the gate, a Me map cell): the outline draws itself in from its top-left corner (and becomes
 * its ring if it has one, or fades), its tag rises in after the stroke starts, and the nearest tiles settle one after
 * another, nearest first. Under reduced motion the tag only fades in.
 */
export function aftermath(tile: HTMLElement) {
  const raiseAll = (delay: number) => release(tile, delay)
  if (engine.reducedMotion || !tile.isConnected) {
    raiseAll(0)
    return
  }
  engine.withChannel('chrome', () => {
    const rect = tile.getBoundingClientRect()
    drawRing(tile)
    raiseAll(CHOREO_MS.stagger)

    const origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    const near = neighboursOf(tile)
      .map((other) => {
        const r = other.getBoundingClientRect()
        const dx = r.left + r.width / 2 - origin.x
        const dy = r.top + r.height / 2 - origin.y
        return { other, dx, dy, dist: Math.hypot(dx, dy) }
      })
      .filter((item) => item.dist > 0 && item.dist < window.innerHeight)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, RIPPLE_NEIGHBOURS)
    const w0 = (2 * Math.PI) / SPRINGS.ui.duration
    near.forEach((item, rank) => {
      engine.after(rank * CHOREO_MS.stagger, () => {
        // A push away from the tile that the spring takes back: the peak is `amp`, then still.
        const amp = RIPPLE_PX * (1 - rank / (RIPPLE_NEIGHBOURS + 1))
        const push = (amp * w0 * Math.E) / item.dist
        engine.to(item.other, { x: 0, y: 0 }, 'ui', { velocity: { x: item.dx * push, y: item.dy * push } })
      })
    })
  })
}

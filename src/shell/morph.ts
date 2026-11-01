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

/**
 * Aftermath of a lesson coming home: the tile's outline draws itself in from its top-left corner and fades
 * back to the resting border, and the nearest tiles settle one after another, nearest first. Under reduced
 * motion there is nothing to see and nothing is done.
 */
export function aftermath(tile: HTMLElement) {
  if (engine.reducedMotion || !tile.isConnected) return
  engine.withChannel('chrome', () => {
    const rect = tile.getBoundingClientRect()
    // A conic sweep starts on the vertical; the corner is atan(w/h) to its left.
    tile.style.setProperty('--trace-from', `${(-Math.atan2(rect.width, rect.height) * 180) / Math.PI}deg`)
    tile.setAttribute('data-trace', '')
    // The ring is its own motion target so drawing it never touches the tile's press state.
    const ring: Target = { style: tile.style, isConnected: true }
    let fading = false
    engine.bind(
      ring,
      (v) => {
        if (fading || (v['--trace'] ?? 0) < 0.8) return
        fading = true
        engine.to(ring, { '--trace-ink': 0 }, 'fade', {
          onArrive: () => {
            ring.isConnected = false
            tile.removeAttribute('data-trace')
            for (const name of ['--trace', '--trace-ink', '--trace-from']) tile.style.removeProperty(name)
          },
        })
      },
      { '--trace': 0, '--trace-ink': 1 },
    )
    engine.to(ring, { '--trace': 1 }, 'draw')

    const origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    const near = [...document.querySelectorAll<HTMLElement>('.pa-tile')]
      .filter((other) => other !== tile && getComputedStyle(other).visibility !== 'hidden')
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

import { engine } from '../engine/driver'
import type { MirtisMood } from './Mirtis'

/**
 * Hand-off flights (decision 0017, "Hand-offs"). At rest Mırtis lives inside her card and scrolls with it. Where a page
 * changes and nothing scrolls, she flies from the cat she was to the cat she becomes, so the two pages share one cat.
 *
 *  1. `depart(spot)` clones the source cat's svg (so the pose is exactly the one on screen), hides the source and shows
 *     the clone, the flyer, in the fixed `CatFlight` layer at the source's rect, all in one frame.
 *  2. `land(spot, mood)` flies it to the target cat on the engine: one spring for the progress, a gentle lift on the way
 *     (a hop), the size growing or shrinking with it. The target's rect is read every frame, so a page that is still
 *     settling (a closing overlay, a card entering) does not make her land beside it.
 *  3. On arrival, in one frame, the flyer is removed, the target is shown (already seated, no rise) and plays `mood`.
 *
 * Every refusal (no layer, a missing or zero-sized or off-screen anchor, anything scrolling, a source that is not seated
 * on its perch) returns false before anything is hidden, so the caller keeps today's sink and rise. Reduced motion does
 * not fly: the flyer fades out where it stands while the target fades in, on the effect spring.
 */

export type Spot = 'dock' | 'greet' | 'verdict' | 'hero' | 'intro'

/** What a cat on screen tells the flight about itself (registered by `Mirtis` when it has an `anchor`). */
export type Anchor = { svg: SVGSVGElement; react: (mood: MirtisMood) => void }

const CHANNEL = 'flight'
const HOLD_CHANNEL = 'flight-hold'
const RISE_CHANNEL = 'flight-rise'
/** A cat in the air that nobody claimed lands back where it came from after this long (ms). */
const HOLD_MS = 2600
/** A frame later than this after the last scroll event still counts as scrolling (ms). */
const SCROLL_MS = 140
/** Lift of the hop, as a share of the distance, within these bounds (px). */
const LIFT = { share: 0.18, min: 18, max: 64 } as const
/** How long a landing may wait for a closing page to get out of the way (ms). */
const WAIT_MS = 1400

const anchors = new Map<Spot, Anchor>()
let layer: HTMLElement | null = null

type Held = {
  spot: Spot
  source: SVGSVGElement
  flyer: SVGSVGElement
  from: DOMRect
}
let held: Held | null = null
/** Cats this module hid and has not shown again, by spot. */
const hidden = new Map<Spot, SVGSVGElement>()
let landing: { finish: (react: boolean) => void } | null = null

let lastScroll = Number.NEGATIVE_INFINITY
if (typeof document !== 'undefined') {
  document.addEventListener('scroll', () => (lastScroll = performance.now()), {
    capture: true,
    passive: true,
  })
}
const scrolling = () => performance.now() - lastScroll < SCROLL_MS

const sized = (r: DOMRect) => r.width >= 8 && r.height >= 8
const onScreen = (r: DOMRect) =>
  r.right > 0 && r.bottom > 0 && r.left < window.innerWidth && r.top < window.innerHeight

/** A perched cat counts as seated when her paws are on the perch's edge line (not mid-rise, not mid-sink). */
function seated(svg: SVGSVGElement, r: DOMRect): boolean {
  const perch = svg.closest('.mt-perch')
  if (!perch) return true
  return Math.abs(r.bottom - r.width * 0.08 - perch.getBoundingClientRect().bottom) < 1.5
}

/** The cat's page is the one on screen: not in a hidden pane, not faded out. */
function shown(svg: SVGSVGElement): boolean {
  const pane = svg.closest<HTMLElement>('.sh-pane')
  return !pane || (pane.style.visibility !== 'hidden' && Number(pane.style.opacity || 1) > 0.5)
}

export const flight = {
  /** The layer the flyers live in (CatFlight.tsx). */
  setLayer(el: HTMLElement | null) {
    layer = el
  },

  /** Cats register while mounted; the spot's current cat is the one flights use. */
  register(spot: Spot, anchor: Anchor): () => void {
    anchors.set(spot, anchor)
    return () => {
      if (anchors.get(spot) === anchor) anchors.delete(spot)
      if (hidden.get(spot) === anchor.svg) hidden.delete(spot)
    }
  },

  /** A cat is in the air, waiting for a landing. */
  holding(): boolean {
    return held !== null
  },

  /**
   * Takes off from a spot: the cat there is swapped for a flyer in the same frame. Call it at the moment of the tap,
   * while the source is still in the document. Returns false (and touches nothing) when it cannot.
   */
  depart(spot: Spot): boolean {
    if (!layer || held || landing || scrolling()) return false
    const source = anchors.get(spot)?.svg
    if (!source?.isConnected) return false
    const from = source.getBoundingClientRect()
    if (!sized(from) || !onScreen(from) || !seated(source, from) || !shown(source)) return false
    const flyer = source.cloneNode(true) as SVGSVGElement
    flyer.classList.add('mt-flyer')
    Object.assign(flyer.style, {
      width: `${from.width}px`,
      height: `${from.height}px`,
      margin: '0',
      visibility: '',
    })
    flyer.style.transform = `translate3d(${from.left}px, ${from.top}px, 0)`
    layer.append(flyer)
    source.style.visibility = 'hidden'
    hidden.set(spot, source)
    held = { spot, source, flyer, from }
    engine.withChannel(HOLD_CHANNEL, () => engine.after(HOLD_MS, () => flight.release()))
    return true
  },

  /** A cat that never found its landing goes back where it took off. */
  release() {
    const h = held
    if (!h) return
    held = null
    engine.cancelCues(HOLD_CHANNEL)
    h.flyer.remove()
    show(h.spot, h.source)
  },

  /**
   * Brings the held cat to a spot's cat and has it play `mood` on arrival (`onLand` runs in that same frame, also when
   * a tap landed her early). Returns false (the held cat goes back to its
   * source, nothing is hidden) when the target cannot take it; the caller then does its own entrance.
   */
  land(spot: Spot, mood: MirtisMood, onLand?: () => void): boolean {
    const h = held
    if (!h) return false
    const target = anchors.get(spot)
    if (!layer || !target || scrolling() || !target.svg.isConnected || target.svg === h.source) {
      flight.release()
      return false
    }
    const to = target.svg.getBoundingClientRect()
    if (!sized(to) || !onScreen(to) || !seated(target.svg, to) || !shown(target.svg)) {
      flight.release()
      return false
    }
    held = null
    engine.cancelCues(HOLD_CHANNEL)
    fly(h, spot, target, mood, onLand)
    return true
  },

  /** Departs and lands in one go, for hand-offs whose target already exists. */
  go(from: Spot, to: Spot, mood: MirtisMood): boolean {
    if (!flight.depart(from)) return false
    if (flight.land(to, mood)) return true
    return false
  },

  /** A page closed without a flight: a cat this module hid comes back on her perch, rising as she always does. */
  restore(spot: Spot) {
    if (held || landing) return
    const svg = hidden.get(spot)
    if (svg) show(spot, svg, true)
  },

  /** Lands whatever is in the air at once (a tap, or the page going away). */
  finish() {
    if (landing) landing.finish(true)
    else flight.release()
  },
}

function show(spot: Spot, svg: SVGSVGElement, rise = false) {
  if (hidden.get(spot) === svg) hidden.delete(spot)
  svg.style.visibility = ''
  const lift = svg.closest<HTMLElement>('.mt-perch__lift')
  if (!rise || !lift || !svg.isConnected) return
  const down = lift.offsetHeight + 4
  engine.set(lift, { y: down })
  engine.withChannel(RISE_CHANNEL, () =>
    engine.after(380, () =>
      engine.withChannel(RISE_CHANNEL, () =>
        engine.to(lift, { y: 0 }, 'land', { effect: engine.reducedMotion }),
      ),
    ),
  )
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function fly(h: Held, spot: Spot, target: Anchor, mood: MirtisMood, onLand?: () => void) {
  const { flyer, from } = h
  const svg = target.svg
  svg.style.visibility = 'hidden'
  hidden.set(spot, svg)
  let done = false
  const finish = (react: boolean) => {
    if (done) return
    done = true
    landing = null
    document.removeEventListener('pointerdown', tap, true)
    engine.cancelCues(CHANNEL)
    engine.finishChannel(CHANNEL)
    flyer.remove()
    if (svg.isConnected) {
      hidden.delete(spot)
      svg.style.visibility = ''
      engine.set(svg, { opacity: 1 })
      if (react) target.react(mood)
      onLand?.()
    } else flight.restore(h.spot)
  }
  const tap = () => finish(true)
  landing = { finish }
  document.addEventListener('pointerdown', tap, true)

  // A target on the covered page waits for the overlay (or its closing ghost) to be gone; one inside the overlay does not.
  const closing = () => svg.closest('.dz-stage') !== null && document.querySelector('.sh-overlay') !== null
  const sizeOf = from.width

  if (engine.reducedMotion) {
    // No flight: the flyer fades out where it stands while the target fades in, once nothing covers the target.
    engine.set(svg, { opacity: 0 })
    const cross = () => {
      if (done) return
      svg.style.visibility = ''
      engine.to(svg, { opacity: 1 }, 'fade', { effect: true })
      engine.to(flyer, { opacity: 0 }, 'fade', { effect: true, onArrive: () => finish(true) })
    }
    engine.withChannel(CHANNEL, () => waitFor(closing, cross, () => done))
    return
  }

  const probe = { isConnected: true }
  const place = (p: number) => {
    if (!svg.isConnected) return finish(false)
    const to = svg.getBoundingClientRect()
    const s = lerp(1, to.width / sizeOf, p)
    const drop = Math.hypot(to.left - from.left, to.top - from.top)
    const hop = Math.min(LIFT.max, Math.max(LIFT.min, drop * LIFT.share)) * 4 * Math.max(0, p * (1 - p))
    flyer.style.transform = `translate3d(${lerp(from.left, to.left, p)}px, ${lerp(from.top, to.top, p) - hop}px, 0) scale(${s})`
  }
  engine.bind(probe, (v) => place(v.p ?? 0), { p: 0 })
  engine.withChannel(CHANNEL, () =>
    engine.to(probe, { p: 1 }, 'page', {
      onArrive: () => {
        // Arrived: keep following the target until nothing is covering it, then swap in the same frame.
        place(1)
        waitFor(
          closing,
          () => finish(true),
          () => done,
          () => place(1),
        )
      },
    }),
  )
}

/** Polls on the engine's frames until `blocked()` is false (or it has waited too long), then runs `go`. */
function waitFor(blocked: () => boolean, go: () => void, cancelled: () => boolean, each?: () => void) {
  let waited = 0
  engine.addTicker({
    step(ms) {
      if (cancelled()) return false
      each?.()
      waited += ms
      if (blocked() && waited < WAIT_MS) return true
      go()
      return false
    },
    finish() {},
  })
}

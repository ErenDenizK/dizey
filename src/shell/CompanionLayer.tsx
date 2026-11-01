import { useLayoutEffect, useRef, useState } from 'react'
import { Duo, type DuoHandle } from '../character/Duo'
import { engine } from '../engine/driver'
import { type Anchor, companion, pickAnchor, type RouteContext, registry, wantedNames } from './companion'
import './companion.css'

/** The box's own width in px; an anchor of width w is reached at scale w / BOX_W. */
const BOX_W = 168
/** The duo's drawing is 86 by 80 units. */
const ASPECT = 80 / 86
const CHANNEL = 'companion'
const HELLO = 'companion-hello'
/** Anticipation: the heads sink this long before the duo leaves. */
const CROUCH_MS = 100
/** The leap's height: a share of the distance, within these bounds (screen px). */
const LIFT = { share: 0.16, min: 12, max: 56 }
/** The lift comes back down once this share of the way is done. */
const DROP_AT = 0.55
/** The landing is called when this share of the way (at least 3 px) is left. */
const LAND_LEFT = 0.06
/** After the landing squash, the aftermath starts. */
const AFTER_MS = 90
/** The glance back to the centre after looking toward the content. */
const LOOK_BACK_MS = 800
/** After a route change the layer keeps following its anchor this long (screens moving under it). */
const FOLLOW_MS = 700
/** The cold start hello: waking, the hop, and when the travel to the first anchor begins. */
const HELLO_MS = { wake: 170, hop: 260, go: 440 } as const
const HELLO_FROM = { scale: 0.34, y: 0.46 } as const
/** Names whose anchors scroll with a screen, so they fade out under the top fade and the tab bar. */
const SCROLLING = new Set(['today', 'me'])

type Goal = { x: number; y: number; scale: number }
type Travel = {
  turn: number
  next: Anchor
  goal: Goal
  total: number
  dropped: boolean
  landed: boolean
}

/** Everything the layer does, apart from React: choosing the anchor, travelling, following, the hello. */
function createController(
  parts: { frame: HTMLElement; fade: HTMLElement; box: HTMLElement; lift: HTMLElement },
  read: { ctx: () => RouteContext; handle: () => DuoHandle | null },
  onAlive: (alive: boolean) => void,
) {
  const { frame, fade, box, lift } = parts
  let turn = 0
  let shown = false
  let placed = false
  let travel: Travel | null = null
  let applied: string | null = null
  let helloing = false
  /** Between the route change and the leap (the crouch): the box stays on the old anchor. */
  let crouching = false
  let tracking = false
  let trackEnd = 0
  let clock = 0
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => place())
  let observed: Element | null = null

  const goalOf = (anchor: Anchor): Goal => {
    const f = frame.getBoundingClientRect()
    const r = anchor.el.getBoundingClientRect()
    return { x: r.left - f.left, y: r.top - f.top, scale: r.width / BOX_W }
  }
  const live = (): Goal => ({
    x: engine.value(box, 'x'),
    y: engine.value(box, 'y'),
    scale: engine.value(box, 'scale'),
  })
  const apart = (a: Goal, b: Goal) => Math.hypot(a.x - b.x, a.y - b.y) + Math.abs(a.scale - b.scale) * BOX_W

  /** Opacity from how much of a scrolling anchor is clear of the top fade and the tab bar. */
  const edge = (anchor: Anchor | null) => {
    if (!anchor || !SCROLLING.has(anchor.name)) {
      fade.style.opacity = ''
      return
    }
    const r = anchor.el.getBoundingClientRect()
    const top =
      anchor.el.closest('.sh-pane')?.querySelector('.dz-edge-top')?.getBoundingClientRect().bottom ?? 0
    const bar = frame.parentElement?.querySelector('.dz-tabbar')?.getBoundingClientRect().top
    const bottom = bar ?? window.innerHeight
    const clear = Math.min(r.bottom, bottom) - Math.max(r.top, top)
    fade.style.opacity = String(
      Math.round(Math.min(1, Math.max(0, clear / Math.max(1, r.height))) * 100) / 100,
    )
  }

  const moving = () => travel !== null || crouching
  const settled = () => {
    const motions = engine.stateOf(box).motions
    return motions.x === undefined && motions.y === undefined && motions.scale === undefined
  }

  /** At rest: the box sits on its anchor's rectangle, wherever the screen has moved it. */
  function place() {
    const anchor = registry.active
    edge(anchor)
    if (!anchor || moving() || helloing) return
    const goal = goalOf(anchor)
    if (apart(goal, live()) > 0.2) engine.set(box, goal)
    watch(anchor.el)
  }

  function watch(el: Element) {
    if (observed === el) return
    if (observed) observer?.unobserve(observed)
    observed = el
    observer?.observe(el)
  }

  /** A short follow: the anchor's screen is moving (a tab rising in, a sheet receding), so the box keeps up. */
  function follow(ms: number) {
    if (tracking) {
      trackEnd = clock + ms
      return
    }
    tracking = true
    clock = 0
    trackEnd = ms
    engine.withChannel(CHANNEL, () =>
      engine.addTicker({
        step: (dt) => {
          clock += dt
          const anchor = registry.active
          if (anchor?.el.isConnected) {
            const goal = goalOf(anchor)
            if (travel && !travel.landed) {
              if (apart(goal, travel.goal) > 0.3) {
                travel.goal = goal
                engine.to(box, goal, 'page')
              }
            } else if (!helloing && !crouching) {
              if (travel && settled()) travel = null
              if (!travel && apart(goal, live()) > 0.2) engine.set(box, goal)
            }
            edge(anchor)
          }
          const going = clock < trackEnd || (travel !== null && !settled())
          if (!going) tracking = false
          return going
        },
        finish: () => {
          tracking = false
        },
      }),
    )
  }

  function pose(anchor: Anchor, h: DuoHandle, instant = false) {
    if (anchor.mood !== 'keep') h.pose(anchor.mood, instant)
    applied = anchor.mood
  }

  /** The screen's own commands that waited for the duo, or the default: the anchor's mood and a glance at its content. */
  function aftermath(anchor: Anchor, mine: number) {
    const h = read.handle()
    if (!h || turn !== mine) return
    registry.traveling = false
    pose(anchor, h)
    const queued = registry.takePending(anchor.id)
    for (const run of queued) run(h)
    if (queued.length) return
    h.look(anchor.look[0], anchor.look[1])
    engine.withChannel(CHANNEL, () =>
      engine.after(LOOK_BACK_MS, () => {
        if (turn === mine) read.handle()?.look(0, 0)
      }),
    )
  }

  function landed(t: Travel) {
    t.landed = true
    const h = read.handle()
    h?.land()
    helloing = false
    const mine = t.turn
    engine.withChannel(CHANNEL, () => engine.after(AFTER_MS, () => aftermath(t.next, mine)))
  }

  /** Sets the box on an anchor with no journey (first appearance, reduced motion, a skipped hello). */
  function jump(anchor: Anchor, mine: number) {
    const h = read.handle()
    engine.set(box, goalOf(anchor))
    engine.set(lift, { y: 0 })
    travel = null
    registry.traveling = false
    placed = true
    if (!shown) {
      shown = true
      engine.withChannel(CHANNEL, () => engine.to(box, { opacity: 1 }, 'fade'))
    }
    if (h) {
      h.finish()
      if (anchor.mood !== 'keep') h.pose(anchor.mood, true)
      applied = anchor.mood
      for (const run of registry.takePending(anchor.id)) run(h)
    }
    if (turn === mine) follow(FOLLOW_MS)
  }

  /** The leap from wherever the box is to an anchor (docs/decisions/0014-companion.md, open table). */
  function go(anchor: Anchor, options: { air?: boolean } = {}) {
    const mine = ++turn
    crouching = false
    const h = read.handle()
    helloing = options.air === true
    if (!placed || engine.reducedMotion) {
      if (!placed) engine.set(box, { opacity: 0 })
      shown = false
      jump(anchor, mine)
      return
    }
    const goal = goalOf(anchor)
    const from = live()
    const total = Math.hypot(goal.x - from.x, goal.y - from.y)
    if (!shown) {
      shown = true
      engine.withChannel(CHANNEL, () => engine.to(box, { opacity: 1 }, 'fade'))
    }
    if (total < 2 && Math.abs(goal.scale - from.scale) < 0.01) {
      engine.set(box, goal)
      registry.traveling = true
      aftermath(anchor, mine)
      follow(FOLLOW_MS)
      return
    }
    registry.traveling = true
    const start = () => {
      if (turn !== mine) return
      crouching = false
      if (!options.air) read.handle()?.stretch()
      const climb = Math.min(LIFT.max, Math.max(LIFT.min, total * LIFT.share))
      const scale = Math.max(0.05, (from.scale + goal.scale) / 2)
      engine.withChannel(CHANNEL, () => {
        engine.to(lift, { y: -climb / scale }, 'ui')
        travel = { turn: mine, next: anchor, goal, total, dropped: false, landed: false }
        engine.to(box, goal, 'page', { launch: 0.35 })
      })
      follow(FOLLOW_MS)
    }
    if (options.air || !h) start()
    else {
      h.crouch()
      crouching = true
      engine.withChannel(CHANNEL, () => engine.after(CROUCH_MS, start))
    }
  }

  /** Called as the box moves: drops the lift late in the way and calls the landing near the end. */
  function onFrame(v: Record<string, number>) {
    const t = travel
    if (!t || t.turn !== turn || t.landed) return
    const left = Math.hypot((v.x ?? 0) - t.goal.x, (v.y ?? 0) - t.goal.y)
    const done = t.total > 0 ? 1 - left / t.total : 1
    if (!t.dropped && done >= DROP_AT) {
      t.dropped = true
      engine.to(lift, { y: 0 }, 'move')
    }
    if (left <= Math.max(3, t.total * LAND_LEFT)) landed(t)
  }

  function depart() {
    turn++
    travel = null
    crouching = false
    helloing = false
    registry.traveling = false
    if (!shown) return
    shown = false
    engine.withChannel(CHANNEL, () => {
      engine.to(box, { opacity: 0 }, 'fade')
      engine.to(lift, { y: 0 }, 'move')
    })
    edge(null)
  }

  function sync(routeChanged: boolean) {
    const ctx = read.ctx()
    const over = ctx.overlay && ctx.present === 'push'
    if (over) frame.dataset.over = 'route'
    else if (frame.dataset.over) {
      // The leaving route's exit still plays: the duo stays above it until it has landed.
      engine.withChannel(CHANNEL, () =>
        engine.after(900, () => {
          const now = read.ctx()
          if (!(now.overlay && now.present === 'push')) delete frame.dataset.over
        }),
      )
    }
    const next = pickAnchor(registry.all(), wantedNames(ctx))
    const prev = registry.active
    registry.active = next
    onAlive(next?.alive ?? true)
    if (!next) {
      if (prev) depart()
      return
    }
    if (prev && prev.id === next.id) {
      if (next.mood !== applied && !moving()) {
        const h = read.handle()
        if (h) pose(next, h)
      }
      if (routeChanged) follow(FOLLOW_MS)
      place()
      return
    }
    watch(next.el)
    go(next)
  }

  /** The cold start: asleep at the centre, blinks awake, hops, and goes to the first anchor. Under a second. */
  function hello(): boolean {
    const h = read.handle()
    const next = pickAnchor(registry.all(), wantedNames(read.ctx()))
    if (!h || !next || engine.reducedMotion || document.querySelector('.sh-onb')) return false
    registry.active = next
    watch(next.el)
    const f = frame.getBoundingClientRect()
    const s = HELLO_FROM.scale
    engine.set(box, {
      x: (f.width - BOX_W * s) / 2,
      y: f.height * HELLO_FROM.y - (BOX_W * ASPECT * s) / 2,
      scale: s,
      opacity: 0,
    })
    engine.set(lift, { y: 0 })
    h.pose('asleep', true)
    placed = true
    shown = true
    helloing = true
    registry.traveling = true
    const skip = () => {
      if (!helloing) return
      engine.cancelCues(HELLO)
      engine.cancelCues(CHANNEL)
      turn++
      const to = registry.active
      if (to) {
        shown = false
        jump(to, turn)
      }
      helloing = false
    }
    window.addEventListener('pointerdown', skip, { capture: true, once: true })
    engine.withChannel(HELLO, () => {
      engine.to(box, { opacity: 1 }, 'enter')
      engine.after(HELLO_MS.wake, () => {
        h.pose('neutral')
        h.blink()
      })
      engine.after(HELLO_MS.hop, () => h.react('happy'))
      engine.after(HELLO_MS.go, () => {
        const to = registry.active
        if (to && helloing) go(to, { air: true })
      })
    })
    return true
  }

  return {
    sync,
    place,
    hello,
    start() {
      engine.bind(box, (v) => onFrame(v))
    },
    stop() {
      turn++
      engine.cancelCues(HELLO)
      engine.cancelCues(CHANNEL)
      observer?.disconnect()
      registry.active = null
      registry.traveling = false
    },
  }
}

/**
 * The one Satır and Sütun in the app: a fixed layer above the routes that sits on the active anchor of the screen
 * and travels to the next one when the screen changes (docs/decisions/0014-companion.md).
 */
export function CompanionLayer({ ctx }: { ctx: RouteContext }) {
  const frame = useRef<HTMLDivElement>(null)
  const fade = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const lift = useRef<HTMLDivElement>(null)
  const duo = useRef<DuoHandle>(null)
  const latest = useRef(ctx)
  latest.current = ctx
  const control = useRef<ReturnType<typeof createController> | null>(null)
  const [alive, setAlive] = useState(true)

  // biome-ignore lint/correctness/useExhaustiveDependencies: the controller is built once; routes reach it through refs
  useLayoutEffect(() => {
    if (!frame.current || !fade.current || !box.current || !lift.current) return
    const controller = createController(
      { frame: frame.current, fade: fade.current, box: box.current, lift: lift.current },
      { ctx: () => latest.current, handle: () => duo.current },
      setAlive,
    )
    control.current = controller
    companion.handle = duo.current
    companion.box = box.current
    engine.set(box.current, { x: 0, y: 0, scale: 0.3, opacity: 0 })
    controller.start()
    const off = registry.subscribe(() => controller.sync(false))
    const onMove = () => controller.place()
    window.addEventListener('scroll', onMove, { capture: true, passive: true })
    window.addEventListener('resize', onMove)
    if (!controller.hello()) controller.sync(true)
    return () => {
      off()
      window.removeEventListener('scroll', onMove, { capture: true })
      window.removeEventListener('resize', onMove)
      controller.stop()
      companion.handle = null
      companion.box = null
      control.current = null
    }
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: a route change is the trigger
  useLayoutEffect(() => {
    control.current?.sync(true)
  }, [ctx.tab, ctx.overlay, ctx.present])

  return (
    <div ref={frame} className="cl" aria-hidden="true">
      <div ref={fade} className="cl__fade">
        <div ref={box} className="cl__box">
          <div ref={lift} className="cl__lift">
            <Duo ref={duo} className="cl__duo" mood="happy" alive={alive} />
          </div>
        </div>
      </div>
    </div>
  )
}

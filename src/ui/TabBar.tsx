import { type ComponentType, useEffect, useLayoutEffect, useRef } from 'react'
import { engine } from '../engine/driver'
import { rubberClamp, VelocityTracker } from '../engine/gesture'
import { PRESS } from '../engine/tokens'
import { playSound } from '../sound/player'
import { Pressable } from './Pressable'

export interface Tab<Id extends string> {
  id: Id
  label: string
  Icon: ComponentType<{ active?: boolean }>
}

/** The bar's inner padding (.dz-tabbar padding, --space-1): the lens and the slots start this far in. */
const PAD = 4

/**
 * The floating tab bar (docs/design/visual-system.md, "Tab bar"; motion in motion-system.md).
 *
 * - Glass material: the only glass in the app besides the inline title bar.
 * - The lens behind the active tab is drawn by its two edges. The leading edge uses `snap` and the
 *   trailing edge `glide`, so the lens stretches in the direction of travel and gathers itself on
 *   arrival, which shows where it came from without any extra effect.
 * - Scrub: slide a finger along the bar and the lens follows 1:1; lift to select. A plain tap selects too.
 * - Hidden while a lesson or a rehearsal fills the screen: slides down with `page`.
 */
function slotWidth(bar: HTMLElement | null, count: number): number {
  return ((bar?.clientWidth ?? 0) - 2 * PAD) / count
}

function edgesOf(bar: HTMLElement | null, count: number, i: number): { l: number; r: number } {
  const w = slotWidth(bar, count)
  return { l: PAD + i * w, r: PAD + (i + 1) * w }
}

export function TabBar<Id extends string>({
  tabs,
  current,
  onSelect,
  hidden = false,
  label,
}: {
  tabs: readonly Tab<Id>[]
  current: Id
  onSelect: (id: Id) => void
  hidden?: boolean
  label: string
}) {
  const bar = useRef<HTMLElement>(null)
  const lens = useRef<HTMLDivElement>(null)
  const index = Math.max(
    0,
    tabs.findIndex((t) => t.id === current),
  )
  const placed = useRef(false)

  // Bind the lens renderer once; place it without motion on first layout.
  useLayoutEffect(() => {
    const el = lens.current
    if (!el) return
    // Width, not scaleX: a scaled pill stretches its round ends into ovals that no longer sit
    // concentric with the bar's own round ends.
    engine.bind(el, (v) => {
      el.style.transform = `translate3d(${(v.l ?? 0).toFixed(2)}px, 0, 0)`
      el.style.width = `${Math.max(0, (v.r ?? 0) - (v.l ?? 0)).toFixed(2)}px`
      el.style.opacity = v.opacity === undefined ? '' : v.opacity.toFixed(3)
    })
  }, [])

  // Move the lens whenever the selection changes.
  useLayoutEffect(() => {
    const el = lens.current
    if (!el) return
    const goal = edgesOf(bar.current, tabs.length, index)
    if (!placed.current) {
      placed.current = true
      engine.set(el, goal)
      return
    }
    if (engine.reducedMotion) {
      // Reduced motion: no slide (edges would land in one frame); the lens fades out, moves unseen, fades in.
      engine.withChannel('chrome', () =>
        engine.to(el, { opacity: 0 }, 'fade', {
          onArrive: () => {
            engine.set(el, goal)
            engine.to(el, { opacity: 1 }, 'fade')
          },
        }),
      )
      return
    }
    const movingRight = goal.l > engine.value(el, 'l')
    engine.withChannel('chrome', () => {
      engine.to(el, { [movingRight ? 'r' : 'l']: movingRight ? goal.r : goal.l }, 'snap')
      engine.to(el, { [movingRight ? 'l' : 'r']: movingRight ? goal.l : goal.r }, 'glide')
    })
  }, [index, tabs.length])

  // The tabs' own selection look (colour, weight, icon fill) eases with --on, never in one frame.
  useLayoutEffect(() => {
    const items = bar.current?.querySelectorAll<HTMLElement>('.dz-tab') ?? []
    items.forEach((el, i) => {
      const goal = i === index ? 1 : 0
      if (el.dataset.on === undefined) {
        el.dataset.on = ''
        engine.set(el, { '--on': goal })
      } else engine.withChannel('chrome', () => engine.to(el, { '--on': goal }, 'fade', { effect: true }))
    })
  }, [index])

  // Keep the lens on its slot when the bar resizes (rotation, text size), without animating.
  useEffect(() => {
    const el = bar.current
    if (!el || typeof ResizeObserver === 'undefined') return
    let width = el.clientWidth
    const observer = new ResizeObserver(() => {
      if (el.clientWidth === width) return
      width = el.clientWidth
      if (lens.current) engine.set(lens.current, edgesOf(el, countRef.current, indexRef.current))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const indexRef = useRef(index)
  indexRef.current = index
  const countRef = useRef(tabs.length)
  countRef.current = tabs.length

  useEffect(() => {
    const el = bar.current
    if (!el) return
    const away = el.offsetHeight + 48
    engine.withChannel('chrome', () => {
      if (!engine.reducedMotion) {
        engine.to(el, { y: hidden ? away : 0, opacity: 1 }, 'page')
        return
      }
      // Reduced motion: no slide (it would land in one frame); the bar fades out where it is, then steps
      // aside unseen, and comes back the same way.
      if (hidden) engine.to(el, { opacity: 0 }, 'fade', { onArrive: () => engine.set(el, { y: away }) })
      else {
        engine.set(el, { y: 0 })
        engine.to(el, { opacity: 1 }, 'fade')
      }
    })
  }, [hidden])

  // Scrub gesture.
  useEffect(() => {
    const el = bar.current
    const lensEl = lens.current
    if (!el || !lensEl) return
    const tracker = new VelocityTracker()
    let pointer: number | null = null
    let startX = 0
    let scrubbing = false
    const centerAt = (clientX: number) => {
      const rect = el.getBoundingClientRect()
      const w = slotWidth(el, tabs.length)
      const raw = clientX - rect.left
      return rubberClamp(raw, PAD + w / 2, rect.width - PAD - w / 2, rect.width)
    }
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return
      pointer = e.pointerId
      startX = e.clientX
      scrubbing = false
      tracker.reset()
      tracker.add(e.timeStamp, e.clientX, 0)
    }
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return
      tracker.add(e.timeStamp, e.clientX, 0)
      if (!scrubbing && Math.abs(e.clientX - startX) > PRESS.slop) {
        scrubbing = true
        el.setPointerCapture(e.pointerId)
      }
      if (scrubbing) {
        const c = centerAt(e.clientX)
        const w = slotWidth(el, tabs.length)
        engine.set(lensEl, { l: c - w / 2, r: c + w / 2 })
      }
    }
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return
      pointer = null
      if (!scrubbing) return
      scrubbing = false
      const vx = tracker.velocity(e.timeStamp).x
      const w = slotWidth(el, tabs.length)
      // A short glide along the throw, then the nearest slot.
      const landing = centerAt(e.clientX) + vx * 0.08
      const i = Math.min(tabs.length - 1, Math.max(0, Math.floor((landing - PAD) / w)))
      const goal = edgesOf(el, tabs.length, i)
      engine.withChannel('chrome', () => engine.to(lensEl, goal, 'snap', { velocity: { l: vx, r: vx } }))
      const tab = tabs[i]
      if (tab && tab.id !== current) {
        playSound('tab', { index: i })
        onSelect(tab.id)
      }
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
  })

  return (
    <nav ref={bar} className="dz-tabbar" aria-label={label} style={{ ['--tabs' as string]: tabs.length }}>
      <div className="dz-tabbar-material" />
      <div ref={lens} className="dz-tabbar-lens" />
      {tabs.map((tab, i) => {
        const active = tab.id === current
        return (
          <Pressable
            key={tab.id}
            className="dz-tab"
            // Each tab has its own note of the home chord; the tab already open just taps.
            data-sound={active ? 'tap' : 'tab'}
            data-sound-index={i}
            aria-current={active ? 'page' : undefined}
            onClick={() => {
              if (!active) onSelect(tab.id)
            }}
          >
            <tab.Icon active={active} />
            <span>{tab.label}</span>
          </Pressable>
        )
      })}
    </nav>
  )
}

import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
import { CHOREO, CHOREO_MS } from '../engine/tokens'
import { readSettings } from '../progress/settings'
import { MeIcon, PathIcon } from '../ui/icons'
import { TabBar } from '../ui/TabBar'
import { CompanionLayer } from './CompanionLayer'
import { MeView } from './MeView'
import {
  aftermath,
  cellField,
  circleOf,
  clipCircle,
  clipWith,
  faceOf,
  holdTagsOf,
  insets,
  isRound,
  landsRound,
  lastThird,
  reach,
  release,
  spreadDelay,
} from './morph'
import { Onboarding } from './Onboarding'
import { PathHome } from './PathHome'
import { presentationOf } from './presentation'
import { installPressFeedback } from './press'
import { dragToDismiss } from './sheetDrag'
import { morphFrom, overlayHostRef, returnTab, stageRef } from './stage'
import '../ui/ui.css'
import './shell.css'

type TabPath = '/' | '/me'

const tabs = [
  { id: '/', label: strings.tabs.path, Icon: PathIcon },
  { id: '/me', label: strings.tabs.me, Icon: MeIcon },
] as const

const views: Record<TabPath, () => React.ReactNode> = {
  '/': PathHome,
  '/me': MeView,
}

function tabOf(pathname: string): TabPath | null {
  const path = pathname.replace(/\/$/, '') || '/'
  return (tabs.find((tab) => tab.id === path)?.id as TabPath | undefined) ?? null
}

/**
 * The app frame: two tab panes (Yol and Sen) kept mounted (so each keeps its scroll position), the floating tab
 * bar, and full-screen routes (a lesson, a rehearsal) on top. Tabs are peers: the outgoing pane leaves
 * quickly while the incoming one rises in, and the old one hides when its exit lands
 * (docs/design/motion-system.md).
 */
export function Shell() {
  const navigate = useNavigate()
  const navigateRef = useRef(navigate)
  navigateRef.current = navigate
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const routeTab = tabOf(pathname)
  const overlay = routeTab === null
  // Decided from the target path before the route mounts: a sheet over the dimmed tab or a full push.
  const present = overlay ? presentationOf(pathname) : 'push'
  const presentRef = useRef(present)
  presentRef.current = present
  // Under a full-screen route the tab it came from stays where it was. Opened straight onto one (a
  // reload, the home-screen app coming back), Yol is home.
  const [tab, setTab] = useState<TabPath>(routeTab ?? '/')
  if (routeTab && routeTab !== tab) setTab(routeTab)
  returnTab.current = tab

  const panes = useRef<Partial<Record<TabPath, HTMLDivElement | null>>>({})
  const shown = useRef<TabPath | null>(null)
  useLayoutEffect(() => {
    const previous = shown.current
    shown.current = tab
    for (const id of Object.keys(views) as TabPath[]) {
      const pane = panes.current[id]
      if (!pane) continue
      const active = id === tab
      pane.style.pointerEvents = active ? '' : 'none'
      pane.style.zIndex = active ? '1' : ''
      pane.toggleAttribute('inert', !active)
      if (active) {
        // A pane that was hidden enters from nothing; one still on its way out simply turns back.
        const hidden = pane.style.visibility === 'hidden'
        pane.style.visibility = ''
        if (previous === null || previous === id) continue
        if (hidden) engine.set(pane, { opacity: 0, y: CHOREO.rise })
        engine.withChannel('chrome', () => {
          engine.to(pane, { opacity: 1 }, 'enter')
          engine.to(pane, { y: 0 }, 'move')
        })
      } else if (previous === null || pane.style.visibility === 'hidden') {
        pane.style.visibility = 'hidden'
      } else {
        // Leaving in the same frame the newcomer arrives: never two pages at full strength.
        engine.withChannel('chrome', () =>
          engine.to(pane, { opacity: 0 }, 'leave', {
            effect: true,
            onArrive: () => {
              if (shown.current !== id) pane.style.visibility = 'hidden'
            },
          }),
        )
      }
    }
  }, [tab])

  // Full-screen routes rise over the shell: a short travel with a fade, never from zero size. A
  // route opened from a card grows out of that card instead, and closing it shrinks back into it.
  const layer = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = layer.current
    if (!overlay || !el) return
    // A route opened again before the last exit finished replaces its ghost at once.
    finishExit?.()
    const sheet = presentRef.current === 'sheet'
    const card = visibleCard()
    const closeSheet = () => void navigateRef.current({ to: returnTab.current })
    const stopDrag = sheet
      ? dragToDismiss(el, {
          onClose: closeSheet,
          follow: (y) => {
            // The tab behind comes forward as the sheet is pulled down, and goes back if it is let go.
            const back = stageRef.current
            if (!back) return
            const p = Math.min(1, y / (window.innerHeight / 2))
            engine.set(back, {
              scale: CHOREO.sheetRecede + (1 - CHOREO.sheetRecede) * p,
              opacity: 1 - CHOREO.sheetScrim * (1 - p),
            })
            if (y === 0) recede()
          },
        })
      : null
    if (card) growFrom(el, card)
    else if (sheet) {
      // No source: the sheet rises from below on `page` while the tab recedes and dims.
      engine.set(el, { y: window.innerHeight })
      engine.withChannel('chrome', () => {
        recede()
        engine.to(el, { y: 0 }, 'page', { launch: CHOREO.launch })
      })
    } else {
      engine.set(el, { opacity: 0, y: CHOREO.rise * 3 })
      engine.withChannel('chrome', () => {
        engine.to(el, { opacity: 1 }, 'fade')
        engine.to(el, { y: 0 }, 'page', { launch: CHOREO.launch })
        // The shell (an open sheet and the tab bar too) goes out as the route comes in, never two
        // screens at once.
        for (const under of shellLayers(frame.current))
          if (under) engine.to(under, { opacity: 0 }, 'leave', { effect: true })
      })
    }
    // The route's DOM outlives its unmount as a ghost that plays the exit.
    return () => {
      stopDrag?.()
      // The shell comes back under the leaving route (a no-op when it never went out).
      engine.withChannel('chrome', () => {
        for (const under of shellLayers(frame.current))
          if (under) engine.to(under, { opacity: 1 }, 'fade', { effect: true })
        // Dersler comes back from its recess while the lesson folds into its tile.
        if (stageRef.current) engine.to(stageRef.current, { scale: 1 }, 'page')
      })
      const host = frame.current
      // React has already detached the route when it really unmounts. A route still attached is a
      // development StrictMode re-run: moving it would leave React a node it can no longer remove.
      if (host && !el.isConnected) leave(el, host, visibleCard(), sheet)
      morphFrom.current = null
    }
  }, [overlay])

  useEffect(installPressFeedback, [])

  return (
    <div ref={frame} className="dz dz-app">
      <div ref={stageRef} className="dz-stage" inert={overlay}>
        {(Object.keys(views) as TabPath[]).map((id) => {
          const View = views[id]
          return (
            <div
              key={id}
              ref={(el) => {
                panes.current[id] = el
              }}
              className="sh-pane"
            >
              <View />
            </div>
          )
        })}
        <div className="dz-edge-bottom" />
      </div>
      <TabBar
        tabs={tabs}
        current={tab}
        hidden={overlay}
        label={strings.tabs.label}
        onSelect={(id) => void navigate({ to: id })}
      />
      {overlay ? (
        <>
          {present === 'sheet' ? (
            // The dimmed tab above the sheet: a tap on it closes the sheet.
            <div
              className="sh-sheet-dismiss"
              aria-hidden="true"
              onClick={() => void navigate({ to: returnTab.current })}
            />
          ) : null}
          <div ref={layer} className="sh-overlay" data-present={present}>
            <div className="sh-overlay__content">
              <Outlet />
            </div>
          </div>
        </>
      ) : null}
      <CompanionLayer ctx={{ tab, overlay, present }} />
      <div ref={overlayHostRef} className="sh-sheet-host" />
      <Onboarding />
    </div>
  )
}

/** What a full-screen route covers: the tab panes, the sheet host and the tab bar (which only slides). */
function shellLayers(host: HTMLElement | null) {
  return [stageRef.current, overlayHostRef.current, host?.querySelector<HTMLElement>('.dz-tabbar') ?? null]
}

/** Ends the exit still playing, if any (a route can open again before it lands). */
let finishExit: (() => void) | null = null

/** The card the route came from, while it is on screen. */
function visibleCard() {
  let card = morphFrom.current
  // A tile that became the continue card was replaced by a new element: find its successor by lesson.
  // Any source may carry a stable `data-morph-key` (lesson id, chapter id, "gate"): its successor is the
  // element of the same base class with that key. Lesson tiles are also found by `data-lesson`.
  const key = card?.dataset.morphKey
  const lesson = card?.dataset.lesson
  if (card && !card.isConnected) {
    const base = card.classList[0]
    if (key && base)
      card = document.querySelector<HTMLElement>(
        `.${CSS.escape(base)}[data-morph-key="${CSS.escape(key)}"]:not([data-face])`,
      )
    else if (lesson) card = document.querySelector<HTMLElement>(`.pa-tile[data-lesson="${lesson}"]`)
  }
  if (!card?.isConnected) return null
  morphFrom.current = card
  const rect = card.getBoundingClientRect()
  return rect.width > 0 && rect.bottom > 0 && rect.top < window.innerHeight ? card : null
}

/** Runs `read` with the covered screen at rest, so a rectangle is measured where it will come to rest. */
function atRest<T>(read: () => T): T {
  const back = stageRef.current
  const saved = back?.style.transform ?? ''
  if (back) back.style.transform = ''
  try {
    return read()
  } finally {
    if (back) back.style.transform = saved
  }
}

/** Bumped by every open and close, so a late cue of an animation that was reversed does nothing. */
let turn = 0

const contentOf = (el: HTMLElement) =>
  el.querySelector<HTMLElement>(':scope > .sh-overlay__content') ??
  (el.firstElementChild as HTMLElement | null)

/** The parts of a route that arrive one after another: a lesson's top bar, stage, narration and dock. */
function partsOf(el: HTMLElement) {
  const content = contentOf(el)
  const root = content?.firstElementChild as HTMLElement | null
  if (!root) return content ? [content] : []
  return root.children.length > 1 ? ([...root.children] as HTMLElement[]) : [root]
}

/**
 * The route's parts rise in, top to bottom, `CHOREO.stagger` apart (docs/design/motion-phases.md, phase 4).
 * They are read now, not at the start of the open: a lazy route may only have mounted its parts by then.
 */
function arrive(el: HTMLElement, current: () => boolean) {
  const content = contentOf(el)
  const parts = partsOf(el).filter((part) => part !== content)
  for (const part of parts) engine.set(part, { opacity: 0, y: CHOREO.rise })
  // The container carries the page colour: it fades up over the growing surface instead of covering it at once.
  if (content) engine.to(content, { opacity: 1 }, 'fade')
  parts.forEach((part, i) => {
    engine.after(i * CHOREO_MS.stagger, () => {
      if (current()) engine.to(part, { opacity: 1, y: 0 }, 'glide')
    })
  })
}

/** The covered screen recedes and dims while the route grows over it. */
function recede() {
  const back = stageRef.current
  if (!back) return
  // Under reduced motion the screen only dims: a scale would land in one frame.
  if (!engine.reducedMotion) engine.to(back, { scale: CHOREO.sheetRecede }, 'page')
  engine.to(back, { opacity: 1 - CHOREO.sheetScrim }, 'fade')
}

function standIn(surface: HTMLElement) {
  const host = surface.parentElement
  if (!host) return
  const scrim = document.createElement('div')
  scrim.className = 'dz-scrim'
  scrim.setAttribute('aria-hidden', 'true')
  scrim.style.pointerEvents = 'none'
  host.insertBefore(scrim, surface)
  engine.set(scrim, { opacity: CHOREO.sheetScrim })
  engine.withChannel('chrome', () =>
    engine.to(scrim, { opacity: 0 }, 'fade', { onArrive: () => scrim.remove() }),
  )
}

/** Opens at about this share of the surface being open, the next phase starts. */
const ARRIVAL_AT = 0.7
/** In the cell reveal the card's face gives way once this share of the cells (halved) has landed. */
const FACE_OUT_AT = 0.55

function growFrom(el: HTMLElement, card: HTMLElement) {
  const mine = ++turn
  const current = () => turn === mine
  const content = contentOf(el)
  const start = insets(el, card)
  const { rad, ...sides } = start
  // The radius it comes to rest with: a sheet keeps its rounded top corners, a full-screen route has none.
  const restRad = Number.parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0
  const source = card.getBoundingClientRect()
  // Everything the route holds waits behind its container until the surface is open.
  if (content) engine.set(content, { opacity: 0 })
  card.style.visibility = 'hidden'
  const face = faceOf(el, card)
  engine.set(face, { opacity: 1 })
  // The card's own scrim goes with the card; the covered screen's dimming takes over from it, so for a
  // moment a stand-in holds the same darkness and fades as the screen recedes (no step in the dimming).
  if (card.classList.contains('lp')) standIn(el)
  engine.withChannel('chrome', () => {
    recede()
    if (engine.reducedMotion) {
      fadeOpen(el, card, face, current)
      return
    }
    if (isRound(card)) {
      growCircle(el, card, face, current)
      return
    }
    if (readSettings().cellReveal === true) {
      spreadCells(el, source, face, card, current)
      return
    }
    const from = reach(sides)
    // The card's own content leaves at once; what is left is one opaque surface that grows.
    engine.to(face, { opacity: 0 }, 'leave', { onArrive: () => face.remove() })
    // The growing surface is the card's own colour on the handoff frame and eases to the page colour
    // over the last third of the travel, with the radius.
    const tone = getComputedStyle(card).backgroundColor
    const paint = (open: number) => {
      el.style.background = `color-mix(in oklch, var(--bg) ${(lastThird(open) * 100).toFixed(1)}%, ${tone})`
    }
    paint(0)
    let arrived = false
    engine.set(el, sides)
    clipWith(el, {
      rad: (v) => restRad + (rad - restRad) * (1 - lastThird(from === 0 ? 1 : 1 - reach(v) / from)),
      watch: (v) => {
        if (!current()) return
        const open = from === 0 ? 1 : 1 - reach(v) / from
        paint(open)
        if (!arrived && open >= ARRIVAL_AT) {
          arrived = true
          arrive(el, current)
        }
      },
    })
    engine.to(el, { t: 0, r: 0, b: 0, l: 0 }, 'page', {
      launch: 0.4,
      onArrive: () => {
        el.style.clipPath = ''
        el.style.background = ''
        card.style.visibility = ''
      },
    })
  })
}

/**
 * Reduced motion: nothing grows or travels; the route fades in over the card and the dimmed screen, and its
 * content follows (PR-16: shortened, never cut).
 */
function fadeOpen(el: HTMLElement, card: HTMLElement, face: HTMLElement, current: () => boolean) {
  // The surface itself is see-through: the copy of the card fades out where the card is while the route's
  // container, which carries the page colour, fades in over it and over the dimmed screen.
  el.style.clipPath = ''
  el.style.background = 'transparent'
  engine.to(face, { opacity: 0 }, 'fade', {
    onArrive: () => {
      face.remove()
      card.style.visibility = ''
      if (current()) el.style.background = ''
    },
  })
  arrive(el, current)
}

/** The route's own opacity, written straight to its style (it has no clip under reduced motion). */
function fadeBind(el: HTMLElement) {
  engine.bind(el, (v) => {
    el.style.opacity = String(v.opacity ?? 1)
  })
}

/** A round source grows as a circle out of its centre until the surface is covered. */
function growCircle(el: HTMLElement, card: HTMLElement, face: HTMLElement, current: () => boolean) {
  const { cx, cy, r0, far } = circleOf(el, card)
  const span = Math.max(1, far - r0)
  engine.to(face, { opacity: 0 }, 'leave', { onArrive: () => face.remove() })
  const tone = getComputedStyle(card).backgroundColor
  let arrived = false
  const paint = (open: number) => {
    el.style.background = `color-mix(in oklch, var(--bg) ${(lastThird(open) * 100).toFixed(1)}%, ${tone})`
  }
  paint(0)
  engine.set(el, { cr: r0 })
  clipCircle(el, { cx, cy }, (v) => {
    if (!current()) return
    const open = ((v.cr ?? r0) - r0) / span
    paint(open)
    if (!arrived && open >= ARRIVAL_AT) {
      arrived = true
      arrive(el, current)
    }
  })
  engine.to(el, { cr: far }, 'page', {
    launch: 0.4,
    onArrive: () => {
      el.style.clipPath = ''
      el.style.background = ''
      card.style.visibility = ''
    },
  })
}

/** The matrix-cell reveal: opaque cells spread out from the card, nearest first, and the route arrives on them. */
function spreadCells(
  el: HTMLElement,
  source: DOMRect,
  face: HTMLElement,
  card: HTMLElement,
  current: () => boolean,
) {
  const field = cellField(el, source)
  el.style.background = 'transparent'
  for (const cell of field.cells) engine.set(cell.el, { opacity: 0, scale: 0.5 })
  let landed = 0
  let faceOut = false
  let arrived = false
  const total = field.cells.length
  for (const cell of field.cells) {
    engine.after(spreadDelay(cell.dist, field.far), () => {
      engine.to(cell.el, { opacity: 1, scale: 1 }, 'move', {
        onArrive: () => {
          landed++
          if (!faceOut && landed / total >= FACE_OUT_AT / 2) {
            faceOut = true
            engine.to(face, { opacity: 0 }, 'fade', { onArrive: () => face.remove() })
          }
          if (!arrived && landed / total >= ARRIVAL_AT && current()) {
            arrived = true
            arrive(el, current)
          }
          if (landed === total) {
            el.style.background = ''
            field.layer.remove()
            card.style.visibility = ''
          }
        },
      })
    })
  }
}

/** Plays the exit on the route's detached DOM: back into its tile, or down and out. */
function leave(el: HTMLElement, host: HTMLElement, card: HTMLElement | null, sheet = false) {
  // Out of the accessibility tree and out of reach: only the motion is left.
  el.inert = true
  el.setAttribute('aria-hidden', 'true')
  el.style.pointerEvents = 'none'
  host.append(el)
  // A sheet let go mid-drag is already lower than its place; the fold starts from there.
  const lift = sheet ? engine.value(el, 'y') : 0
  finishExit?.()
  const mine = ++turn
  let finished = false
  const done = () => {
    if (finished) return
    finished = true
    el.remove()
    if (card) {
      card.style.visibility = ''
      // Every rectangular source gets its aftermath; round ones (the gear) have no outline to draw.
      if (card.hasAttribute('data-morph-key') || card.classList.contains('pa-tile')) {
        if (turn === mine) aftermath(card)
        else release(card)
      }
    }
    if (finishExit === done) finishExit = null
  }
  finishExit = done
  engine.withChannel('chrome', () => {
    if (!card) {
      if (sheet) {
        // A sheet drops the way it rose: out the bottom, opaque all the way.
        engine.to(el, { y: window.innerHeight }, 'page', { onArrive: done })
        return
      }
      engine.to(el, { opacity: 0 }, 'fade', { onArrive: done })
      engine.to(el, { y: CHOREO.rise * 3 }, 'page')
      return
    }
    const content = contentOf(el)
    for (const old of el.querySelectorAll(':scope > [data-face], :scope > .sh-cells')) old.remove()
    if (engine.reducedMotion) {
      // Nothing shrinks back into the tile: the route fades away over the screen it covered.
      el.style.clipPath = ''
      fadeBind(el)
      engine.to(el, { opacity: 0 }, 'fade', { onArrive: done })
      return
    }
    // The tile is measured where it will rest: the covered screen is still on its way back from its recess.
    const target = atRest(() => insets(el, card))
    // The clip lives in the sheet's own (lifted) frame.
    target.t += lift
    target.b -= lift
    const { rad, ...sides } = target
    const restRad = Number.parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0
    const rect = atRest(() => card.getBoundingClientRect())
    const face = atRest(() => faceOf(el, card))
    if (lift) face.style.top = `${Number.parseFloat(face.style.top) + lift}px`
    // The ring is drawn by the aftermath; the landing face must not already wear it.
    face.setAttribute('data-trace', '')
    engine.set(face, { opacity: 0 })
    card.style.visibility = 'hidden'
    holdTagsOf(card)
    // The lesson's own ink goes first and fast.
    if (content) engine.to(content, { opacity: 0 }, 'leave')
    if (landsRound(card)) {
      const { cx, cy: cy0, r0, far } = circleOf(el, card)
      const cy = cy0 + lift
      const span = Math.max(1, far - r0)
      let faceIn = false
      engine.set(el, { cr: far })
      clipCircle(el, { cx, cy }, (v) => {
        const closed = 1 - ((v.cr ?? far) - r0) / span
        if (!faceIn && closed >= 2 / 3) {
          faceIn = true
          engine.to(face, { opacity: 1 }, 'fade')
        }
        if ((v.cr ?? far) - r0 < 0.5) done()
      })
      engine.to(el, { cr: r0, y: 0 }, 'page', { onArrive: done })
      return
    }
    if (readSettings().cellReveal === true) {
      retreatCells(el, rect, face, done)
      return
    }
    const to = reach(sides)
    let faceIn = false
    clipWith(el, {
      rad: (v) => restRad + (rad - restRad) * lastThird(to === 0 ? 1 : reach(v) / to),
      watch: (v) => {
        const closed = to === 0 ? 1 : reach(v) / to
        if (!faceIn && closed >= 2 / 3) {
          faceIn = true
          engine.to(face, { opacity: 1 }, 'fade')
        }
        // Within half a pixel of the tile the tile itself takes over: same rectangle, same face, no swap.
        if (to - reach(v) < 0.5) done()
      },
    })
    engine.to(el, { ...sides, y: 0 }, 'page', { onArrive: done })
  })
}

/** The cell reveal played back: the cells draw away from the farthest corner toward the tile. */
function retreatCells(el: HTMLElement, rect: DOMRect, face: HTMLElement, done: () => void) {
  const field = cellField(el, rect)
  el.style.background = 'transparent'
  let gone = 0
  let faceIn = false
  const total = field.cells.length
  for (const cell of field.cells) {
    engine.after(CHOREO_MS.leaveHead + spreadDelay(cell.dist, field.far, true), () => {
      engine.to(cell.el, { opacity: 0, scale: 0.5 }, 'move', {
        onArrive: () => {
          gone++
          if (!faceIn && gone / total >= 2 / 3) {
            faceIn = true
            engine.to(face, { opacity: 1 }, 'fade')
          }
          if (gone === total) done()
        },
      })
    })
  }
}

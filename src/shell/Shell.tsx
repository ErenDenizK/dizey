import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
import { CHOREO, CHOREO_MS } from '../engine/tokens'
import { ExamHome } from '../exam/ExamHome'
import { readSettings } from '../progress/settings'
import { ExamIcon, MeIcon, PathIcon } from '../ui/icons'
import { TabBar } from '../ui/TabBar'
import { MeView } from './MeView'
import { aftermath, cellField, clipWith, faceOf, insets, lastThird, reach, spreadDelay } from './morph'
import { Onboarding } from './Onboarding'
import { PathView } from './PathView'
import { installPressFeedback } from './press'
import { morphFrom, overlayHostRef, returnTab, stageRef } from './stage'
import '../ui/ui.css'
import './shell.css'

type TabPath = '/' | '/exam' | '/me'

const tabs = [
  { id: '/', label: strings.tabs.path, Icon: PathIcon },
  { id: '/exam', label: strings.tabs.exam, Icon: ExamIcon },
  { id: '/me', label: strings.tabs.me, Icon: MeIcon },
] as const

const views: Record<TabPath, () => React.ReactNode> = {
  '/': PathView,
  '/exam': ExamHome,
  '/me': MeView,
}

function tabOf(pathname: string): TabPath | null {
  const path = pathname.replace(/\/$/, '') || '/'
  return (tabs.find((tab) => tab.id === path)?.id as TabPath | undefined) ?? null
}

/**
 * The app frame: three tab panes kept mounted (so each keeps its scroll position), the floating tab
 * bar, and full-screen routes (a lesson, a rehearsal) on top. Tabs are peers: the outgoing pane leaves
 * quickly while the incoming one rises in, and the old one hides when its exit lands
 * (docs/design/motion-system.md).
 */
export function Shell() {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const routeTab = tabOf(pathname)
  const overlay = routeTab === null
  // Under a full-screen route the tab it came from stays where it was. Opened straight onto one (a
  // reload, the home-screen app coming back), the route's own section is home: a rehearsal is Sınav's.
  const [tab, setTab] = useState<TabPath>(routeTab ?? (pathname.startsWith('/exam') ? '/exam' : '/'))
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
    const card = visibleCard()
    if (card) growFrom(el, card)
    else {
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
      if (host && !el.isConnected) leave(el, host, visibleCard())
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
        <div ref={layer} className="sh-overlay">
          <div className="sh-overlay__content">
            <Outlet />
          </div>
        </div>
      ) : null}
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
  const card = morphFrom.current
  if (!card?.isConnected) return null
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

/** The route's parts rise in, top to bottom, `CHOREO.stagger` apart (docs/design/motion-phases.md, phase 4). */
function arrive(parts: HTMLElement[], current: () => boolean) {
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
  engine.to(back, { scale: CHOREO.sheetRecede }, 'page')
  engine.to(back, { opacity: 1 - CHOREO.sheetScrim }, 'fade')
}

/** Opens at about this share of the surface being open, the next phase starts. */
const ARRIVAL_AT = 0.7
/** The card's face starts to give way a little before the content arrives. */
const FACE_OUT_AT = 0.55

function growFrom(el: HTMLElement, card: HTMLElement) {
  const mine = ++turn
  const current = () => turn === mine
  const parts = partsOf(el)
  const start = insets(el, card)
  const { rad, ...sides } = start
  const source = card.getBoundingClientRect()
  for (const part of parts) engine.set(part, { opacity: 0, y: CHOREO.rise })
  card.style.visibility = 'hidden'
  const face = faceOf(el, card)
  engine.set(face, { opacity: 1 })
  engine.withChannel('chrome', () => {
    recede()
    if (readSettings().cellReveal === true) {
      spreadCells(el, source, face, parts, card, current)
      return
    }
    const from = reach(sides)
    let faceOut = false
    let arrived = false
    engine.set(el, sides)
    clipWith(el, {
      rad: (v) => rad * (1 - lastThird(from === 0 ? 1 : 1 - reach(v) / from)),
      watch: (v) => {
        if (!current()) return
        const open = from === 0 ? 1 : 1 - reach(v) / from
        if (!faceOut && open >= FACE_OUT_AT) {
          faceOut = true
          engine.to(face, { opacity: 0 }, 'fade', { onArrive: () => face.remove() })
        }
        if (!arrived && open >= ARRIVAL_AT) {
          arrived = true
          arrive(parts, current)
        }
      },
    })
    engine.to(el, { t: 0, r: 0, b: 0, l: 0 }, 'page', {
      launch: 0.4,
      onArrive: () => {
        el.style.clipPath = ''
        card.style.visibility = ''
      },
    })
  })
}

/** The matrix-cell reveal: opaque cells spread out from the card, nearest first, and the route arrives on them. */
function spreadCells(
  el: HTMLElement,
  source: DOMRect,
  face: HTMLElement,
  parts: HTMLElement[],
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
            arrive(parts, current)
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
function leave(el: HTMLElement, host: HTMLElement, card: HTMLElement | null) {
  // Out of the accessibility tree and out of reach: only the motion is left.
  el.inert = true
  el.setAttribute('aria-hidden', 'true')
  el.style.pointerEvents = 'none'
  host.append(el)
  finishExit?.()
  const mine = ++turn
  let finished = false
  const done = () => {
    if (finished) return
    finished = true
    el.remove()
    if (card) {
      card.style.visibility = ''
      if (turn === mine && card.classList.contains('pa-tile')) aftermath(card)
    }
    if (finishExit === done) finishExit = null
  }
  finishExit = done
  engine.withChannel('chrome', () => {
    if (!card) {
      engine.to(el, { opacity: 0 }, 'fade', { onArrive: done })
      engine.to(el, { y: CHOREO.rise * 3 }, 'page')
      return
    }
    const content = contentOf(el)
    for (const old of el.querySelectorAll(':scope > [data-face], :scope > .sh-cells')) old.remove()
    // The tile is measured where it will rest: the covered screen is still on its way back from its recess.
    const target = atRest(() => insets(el, card))
    const { rad, ...sides } = target
    const rect = atRest(() => card.getBoundingClientRect())
    const face = atRest(() => faceOf(el, card))
    engine.set(face, { opacity: 0 })
    card.style.visibility = 'hidden'
    // The lesson's own ink goes first and fast.
    if (content) engine.to(content, { opacity: 0 }, 'leave')
    if (readSettings().cellReveal === true) {
      retreatCells(el, rect, face, done)
      return
    }
    const to = reach(sides)
    let faceIn = false
    clipWith(el, {
      rad: (v) => rad * lastThird(to === 0 ? 1 : reach(v) / to),
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
    engine.to(el, sides, 'page', { onArrive: done })
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

import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
import { CHOREO } from '../engine/tokens'
import { ExamHome } from '../exam/ExamHome'
import { ExamIcon, MeIcon, PathIcon } from '../ui/icons'
import { TabBar } from '../ui/TabBar'
import { MeView } from './MeView'
import { clipWith, faceOf, insets } from './morph'
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
 * bar, and full-screen routes (a lesson, a rehearsal) on top. Tabs are peers: the incoming pane fades
 * in over the outgoing one, which hides only when the fade lands, so no frame is ever empty
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
        pane.style.visibility = ''
        if (previous === null || previous === id) continue
        engine.set(pane, { opacity: 0 })
        engine.withChannel('chrome', () =>
          engine.to(pane, { opacity: 1 }, 'fade', {
            onArrive: () => {
              const old = panes.current[previous]
              if (old && shown.current !== previous) old.style.visibility = 'hidden'
            },
          }),
        )
      } else if (id !== previous) {
        pane.style.visibility = 'hidden'
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
      })
    }
    // The route's DOM outlives its unmount as a ghost that plays the exit.
    return () => {
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

/** Ends the exit still playing, if any (a route can open again before it lands). */
let finishExit: (() => void) | null = null

/** The card the route came from, while it is on screen. */
function visibleCard() {
  const card = morphFrom.current
  if (!card?.isConnected) return null
  const rect = card.getBoundingClientRect()
  return rect.width > 0 && rect.bottom > 0 && rect.top < window.innerHeight ? card : null
}

function growFrom(el: HTMLElement, card: HTMLElement) {
  const content = el.firstElementChild as HTMLElement | null
  clipWith(el)
  engine.set(el, insets(el, card))
  const face = faceOf(el, card)
  engine.set(face, { opacity: 1 })
  if (content) engine.set(content, { opacity: 0, y: 12 })
  card.style.visibility = 'hidden'
  engine.withChannel('chrome', () => {
    engine.to(el, { t: 0, r: 0, b: 0, l: 0, rad: 0 }, 'page', {
      launch: 0.4,
      onArrive: () => {
        el.style.clipPath = ''
        card.style.visibility = ''
      },
    })
    engine.to(face, { opacity: 0 }, 'fade', { onArrive: () => face.remove() })
    engine.after(90, () => {
      if (content) engine.to(content, { opacity: 1, y: 0 }, 'glide')
    })
  })
}

/** Plays the exit on the route's detached DOM: back into its card, or down and out. */
function leave(el: HTMLElement, host: HTMLElement, card: HTMLElement | null) {
  // Out of the accessibility tree and out of reach: only the motion is left.
  el.inert = true
  el.setAttribute('aria-hidden', 'true')
  el.style.pointerEvents = 'none'
  host.append(el)
  finishExit?.()
  let finished = false
  const done = () => {
    if (finished) return
    finished = true
    el.remove()
    if (card) card.style.visibility = ''
    if (finishExit === done) finishExit = null
  }
  finishExit = done
  engine.withChannel('chrome', () => {
    if (card) {
      const content = el.firstElementChild as HTMLElement | null
      clipWith(el)
      engine.set(el, { t: 0, r: 0, b: 0, l: 0, rad: 0 })
      const face = faceOf(el, card)
      engine.set(face, { opacity: 0 })
      card.style.visibility = 'hidden'
      if (content) engine.to(content, { opacity: 0 }, 'fade')
      engine.to(face, { opacity: 1 }, 'fade')
      engine.to(el, insets(el, card), 'page', { onArrive: done })
    } else {
      engine.to(el, { opacity: 0 }, 'fade', { onArrive: done })
      engine.to(el, { y: CHOREO.rise * 3 }, 'page')
    }
  })
}

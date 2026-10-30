import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { strings } from '../content/strings'
import { engine } from '../engine/driver'
import { CHOREO } from '../engine/tokens'
import { ExamHome } from '../exam/ExamHome'
import { useSettings } from '../progress/settings'
import { ExamIcon, MapIcon, MeIcon, TodayIcon } from '../ui/icons'
import { TabBar } from '../ui/TabBar'
import { MapView } from './MapView'
import { MeView } from './MeView'
import { Onboarding } from './Onboarding'
import { installPressFeedback } from './press'
import { overlayHostRef, returnTab, stageRef } from './stage'
import { TodayView } from './TodayView'
import '../ui/ui.css'
import './shell.css'

type TabPath = '/' | '/map' | '/exam' | '/me'

const tabs = [
  { id: '/', label: strings.tabs.today, Icon: TodayIcon },
  { id: '/map', label: strings.tabs.map, Icon: MapIcon },
  { id: '/exam', label: strings.tabs.exam, Icon: ExamIcon },
  { id: '/me', label: strings.tabs.me, Icon: MeIcon },
] as const

const views: Record<TabPath, () => React.ReactNode> = {
  '/': TodayView,
  '/map': MapView,
  '/exam': ExamHome,
  '/me': MeView,
}

function tabOf(pathname: string): TabPath | null {
  const path = pathname.replace(/\/$/, '') || '/'
  return (tabs.find((tab) => tab.id === path)?.id as TabPath | undefined) ?? null
}

/**
 * The app frame: four tab panes kept mounted (so each keeps its scroll position), the floating tab
 * bar, and full-screen routes (a lesson, a rehearsal) on top. Tabs are peers: the incoming pane fades
 * in over the outgoing one, which hides only when the fade lands, so no frame is ever empty
 * (docs/design/motion-system.md).
 */
export function Shell() {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const routeTab = tabOf(pathname)
  const overlay = routeTab === null
  // Under a full-screen route the tab it came from stays where it was.
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

  // Full-screen routes rise over the shell: a short travel with a fade, never from zero size.
  const layer = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = layer.current
    if (!overlay || !el) return
    engine.set(el, { opacity: 0, y: CHOREO.rise * 3 })
    engine.withChannel('chrome', () => {
      engine.to(el, { opacity: 1 }, 'fade')
      engine.to(el, { y: 0 }, 'page', { launch: CHOREO.launch })
    })
  }, [overlay])

  useEffect(installPressFeedback, [])

  const { theme } = useSettings()
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme
    else delete document.documentElement.dataset.theme
  }, [theme])

  return (
    <div className="dz dz-app">
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
          <Outlet />
        </div>
      ) : null}
      <div ref={overlayHostRef} className="sh-sheet-host" />
      <Onboarding />
    </div>
  )
}

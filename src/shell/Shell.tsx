import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { strings } from '../content/strings'
import { LessonLayer } from '../legacy/LessonLayer'
import { fade, installPressFeedback } from './motion'
import { Onboarding } from './Onboarding'
import { useShell } from './store'
import './shell.css'

const tabs = [
  {
    to: '/',
    label: strings.tabs.today,
    icon: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="3" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </>
    ),
  },
  {
    to: '/map',
    label: strings.tabs.map,
    icon: (
      <>
        <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" />
        <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" />
        <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" />
        <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" />
      </>
    ),
  },
  {
    to: '/me',
    label: strings.tabs.me,
    icon: (
      <>
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M5 20c1.2-3.6 4-5.2 7-5.2s5.8 1.6 7 5.2" />
      </>
    ),
  },
] as const

/** Today, Map and Me around the kept lesson layer, which covers the shell while a lesson is open. */
export function Shell() {
  const { openLesson } = useShell()
  const lessonOpen = openLesson !== null
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const main = useRef<HTMLElement>(null)
  // Each tab opens at its top; the scroll container is shared.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs on path change by design
  useEffect(() => {
    main.current?.scrollTo(0, 0)
  }, [pathname])
  useEffect(installPressFeedback, [])
  // The shell fades behind an opening lesson and back when it closes; the lesson layer runs its own
  // morph on top.
  const shell = useRef<HTMLDivElement>(null)
  const openRef = useRef(lessonOpen)
  useEffect(() => {
    openRef.current = lessonOpen
    if (shell.current) fade(shell.current, !lessonOpen, () => openRef.current)
  }, [lessonOpen])
  return (
    <>
      <div ref={shell} className="sh-shell" inert={lessonOpen}>
        <main ref={main} className="sh-main">
          <Outlet />
        </main>
        <nav className="sh-tabbar" aria-label={strings.tabs.label}>
          {tabs.map((tab) => (
            <Link key={tab.to} to={tab.to} className="sh-tab" activeOptions={{ exact: true }}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {tab.icon}
              </svg>
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
      <LessonLayer active={lessonOpen} />
      <Onboarding />
    </>
  )
}

import { createRootRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { strings } from '../content/strings'
import { buildInfo } from '../lib/build-info'
import { UpdatePrompt } from '../lib/pwa/UpdatePrompt'
import { Shell } from '../shell/Shell'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => (
    <div className="sh-notfound">
      <p className="dz-title3">{strings.notFound}</p>
      <Link to="/" className="dz-button" data-kind="secondary">
        {strings.goHome}
      </Link>
    </div>
  ),
})

function RootLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  // The motion lab is a standalone reference page with its own tab bar: no shell or install guide.
  const lab = pathname === '/lab' || pathname.startsWith('/lab/')
  return (
    <>
      {lab ? <Outlet /> : <Shell />}
      {buildInfo.channel === 'production' ? <UpdatePrompt /> : null}
    </>
  )
}

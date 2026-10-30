import { createRootRoute, Link } from '@tanstack/react-router'
import { strings } from '../content/strings'
import { buildInfo } from '../lib/build-info'
import { UpdatePrompt } from '../lib/pwa/UpdatePrompt'
import { Shell } from '../shell/Shell'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => (
    <div className="sh-view">
      <p>{strings.notFound}</p>
      <Link to="/" className="sh-link">
        {strings.goHome}
      </Link>
    </div>
  ),
})

function RootLayout() {
  return (
    <>
      <Shell />
      {buildInfo.channel === 'production' ? <UpdatePrompt /> : null}
    </>
  )
}

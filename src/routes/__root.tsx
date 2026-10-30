import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { strings } from '../content/strings'
import { buildInfo } from '../lib/build-info'
import { UpdatePrompt } from '../lib/pwa/UpdatePrompt'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => (
    <main className="p-6">
      <p>{strings.notFound}</p>
      <Link to="/" className="underline">
        {strings.goHome}
      </Link>
    </main>
  ),
})

/** The version line lives on the Profil page of the kept v21 layer until the new shell lands. */
function RootLayout() {
  return (
    <>
      <Outlet />
      {buildInfo.channel === 'production' ? <UpdatePrompt /> : null}
    </>
  )
}

import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { strings } from '../content/strings'
import { buildInfo, isPreview } from '../lib/build-info'
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

function RootLayout() {
  return (
    <div className="min-h-dvh bg-paper pt-[env(safe-area-inset-top)] text-ink">
      <Outlet />
      <footer
        className="px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-sm text-muted"
        data-testid="build-info"
      >
        {strings.version} {buildInfo.version} · {buildInfo.commit}
        {isPreview ? ` · ${strings.preview} ${buildInfo.channel}` : ''}
      </footer>
      {buildInfo.channel === 'production' ? <UpdatePrompt /> : null}
    </div>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { strings } from '../content/strings'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="px-6 py-10">
      <h1 className="text-title font-semibold">{strings.appName}</h1>
      <p className="mt-2 text-lead">{strings.tagline}</p>
      <p className="mt-8 text-muted">{strings.foundationNote}</p>
    </main>
  )
}

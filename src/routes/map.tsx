import { createFileRoute, redirect } from '@tanstack/react-router'

// The old Harita tab is the path on the home screen now: keep old links working.
export const Route = createFileRoute('/map')({
  beforeLoad: ({ location }) => {
    throw redirect({ to: '/', search: location.search as never, replace: true })
  },
})

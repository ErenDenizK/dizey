import { createFileRoute, redirect } from '@tanstack/react-router'

// The map and the home screen became one screen (Dersler); old links and installed shortcuts land there.
export const Route = createFileRoute('/map')({
  beforeLoad: () => {
    throw redirect({ to: '/', replace: true })
  },
})

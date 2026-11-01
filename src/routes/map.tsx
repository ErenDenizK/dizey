import { createFileRoute } from '@tanstack/react-router'

// Tab screens live in the shell, mounted once so each keeps its scroll position.
export const Route = createFileRoute('/map')({ component: () => null })

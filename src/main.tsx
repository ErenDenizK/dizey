import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { engine, review, startAppDriver } from './engine/driver'
import { requestPersistentStorage } from './lib/storage/db'
import { routeTree } from './routeTree.gen'
import { installSound } from './sound/player'
import './styles/app.css'

const router = createRouter({ routeTree, basepath: import.meta.env.BASE_URL })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

startAppDriver()
// Frame-by-frame review hook for scripts/lesson-review.mjs (pause and step the one clock).
;(window as unknown as { __dzReview?: unknown }).__dzReview = { engine, review }
installSound()
void requestPersistentStorage()

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root')
createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

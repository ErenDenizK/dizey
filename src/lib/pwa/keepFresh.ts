/** How often an open app asks for a newer version, ms. */
export const CHECK_EVERY_MS = 30 * 60 * 1000

type Registration = { update(): Promise<unknown> }
type Env = {
  doc: Pick<Document, 'visibilityState' | 'addEventListener'>
  setInterval: (run: () => void, ms: number) => unknown
}

/**
 * A home-screen app resumed from memory never reloads the page, so the browser never re-checks the
 * service worker by itself. Check when the app becomes visible again and every 30 minutes. Only
 * checks: installing and reloading stay behind the learner's tap (UpdatePrompt).
 */
export function keepFresh(registration: Registration | undefined, env?: Env) {
  if (!registration) return
  const { doc, setInterval } = env ?? {
    doc: document,
    setInterval: (run: () => void, ms: number) => window.setInterval(run, ms),
  }
  const check = () => {
    void registration.update().catch(() => {})
  }
  doc.addEventListener('visibilitychange', () => {
    if (doc.visibilityState === 'visible') check()
  })
  setInterval(check, CHECK_EVERY_MS)
}

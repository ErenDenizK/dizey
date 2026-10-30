import { useRegisterSW } from 'virtual:pwa-register/react'
import { strings } from '../../content/strings'

/** Never reloads on its own: a new version waits until the learner taps. */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()
  if (!needRefresh) return null
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-3 rounded-card bg-ink px-4 py-3 text-paper"
    >
      <span>{strings.updateReady}</span>
      <button
        type="button"
        className="font-semibold underline"
        onClick={() => void updateServiceWorker(true)}
      >
        {strings.updateAction}
      </button>
    </div>
  )
}

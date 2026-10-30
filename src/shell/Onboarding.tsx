import { useState } from 'react'
import { strings } from '../content/strings'
import { buildInfo } from '../lib/build-info'
import { appStorage } from '../lib/storage/app-storage'

const SKIPPED = 'dizey.onboarding.safari'

/**
 * First visit in iPhone Safari: install first. iOS keeps Safari's and the Home Screen app's storage
 * apart, so progress made in Safari would not carry over. Production only: previews are for a quick
 * look in the browser.
 */
function needsInstall(): boolean {
  if (buildInfo.channel !== 'production') return false
  const ios =
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const standalone =
    (navigator as { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  return ios && !standalone && appStorage.getItem(SKIPPED) !== '1'
}

export function Onboarding() {
  const [open, setOpen] = useState(needsInstall)
  if (!open) return null
  return (
    <div className="sh-onb" role="dialog" aria-modal="true" aria-labelledby="sh-onb-title">
      <div className="sh-onb__intro">
        <h1 id="sh-onb-title">{strings.onboarding.title}</h1>
        <p>{strings.onboarding.body}</p>
      </div>
      <ol className="sh-card sh-onb__steps">
        <li>
          <span className="sh-onb__n">1</span>
          <span>
            {strings.onboarding.step1}{' '}
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3v12M8 7l4-4 4 4" />
              <path d="M6 11v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8" />
            </svg>
          </span>
        </li>
        <li>
          <span className="sh-onb__n">2</span>
          <span>{strings.onboarding.step2}</span>
        </li>
        <li>
          <span className="sh-onb__n">3</span>
          <span>{strings.onboarding.step3}</span>
        </li>
      </ol>
      <div className="sh-spacer" />
      <button
        type="button"
        className="sh-link"
        onClick={() => {
          appStorage.setItem(SKIPPED, '1')
          setOpen(false)
        }}
      >
        {strings.onboarding.skip}
      </button>
    </div>
  )
}

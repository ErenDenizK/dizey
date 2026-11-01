import type { ReactNode } from 'react'
import { ChevronLeft } from './icons'
import { Pressable } from './Pressable'

/**
 * A scrolling screen with one large title that scrolls away with its content.
 *
 * There is no inline bar title: the tab bar already names the page, so a second, smaller copy of the
 * title in a top bar only repeats it (Eren 2026-10-31 22:21Z and 23:28Z: "ikili yazı", and the opaque
 * top band hid content). The top edge is a soft fade over the safe area, not a solid band, so content
 * dissolves under the status bar instead of being cut by a hard edge. Pushed screens keep a floating
 * back button that stays put while the page scrolls.
 */
export function Screen({
  title,
  back,
  backLabel,
  children,
  pushed = false,
  action,
}: {
  title: string
  back?: () => void
  backLabel?: string
  children: ReactNode
  pushed?: boolean
  /** A control floating at the top right, like the back button at the top left. */
  action?: ReactNode
}) {
  return (
    <div className="dz-screen-frame" style={{ position: 'absolute', inset: 0 }}>
      <div className="dz-screen" data-pushed={pushed || undefined}>
        <h1 className="dz-large-title" style={back ? { marginTop: 'var(--space-12)' } : undefined}>
          {title}
        </h1>
        {children}
      </div>
      <div className="dz-edge-top" aria-hidden="true" />
      {back ? (
        <div className="dz-float-back">
          <Pressable className="dz-icon-button dz-icon-button--float" onClick={back} aria-label={backLabel}>
            <ChevronLeft />
          </Pressable>
        </div>
      ) : null}
      {action ? <div className="dz-float-action">{action}</div> : null}
    </div>
  )
}

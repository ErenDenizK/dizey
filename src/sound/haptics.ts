import { readSettings } from '../progress/settings'

/**
 * A light haptic tick for moments that matter (an answer, a finished lesson), never for every tap.
 *
 * iOS Safari has no Vibration API, but since iOS 18 toggling a native `<input type="checkbox" switch>`
 * gives the system's selection tick. A hidden one is toggled through its label inside the tap that
 * caused the moment; outside a tap iOS stays still, which is the right failure. Android uses
 * navigator.vibrate. Haptics are on unless turned off in Ben.
 */

let label: HTMLLabelElement | null = null

function hiddenSwitch() {
  if (label?.isConnected) return label
  label = document.createElement('label')
  label.setAttribute('aria-hidden', 'true')
  label.dataset.sound = 'none'
  label.style.cssText =
    'position:fixed;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;left:-9px;top:0'
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.setAttribute('switch', '')
  input.tabIndex = -1
  label.append(input)
  document.body.append(label)
  return label
}

const hapticsOn = () => readSettings().haptics !== false

/** One tick. `pattern` is the Android vibration in ms; iOS gives its single system tick. */
export function haptic(pattern: number | number[] = 12) {
  if (!hapticsOn() || typeof document === 'undefined') return
  if (typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern)
    } catch {
      // Blocked outside a gesture.
    }
    return
  }
  try {
    hiddenSwitch().click()
  } catch {
    // No haptics here.
  }
}

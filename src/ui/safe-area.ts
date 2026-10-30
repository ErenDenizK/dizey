let probe: HTMLDivElement | null = null

/** The top safe-area inset in px (custom properties holding env() are not resolved by getComputedStyle). */
export function safeTop(): number {
  if (typeof document === 'undefined') return 0
  if (!probe) {
    probe = document.createElement('div')
    probe.style.cssText =
      'position:fixed;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top)'
    document.body.appendChild(probe)
  }
  return Number.parseFloat(getComputedStyle(probe).paddingTop) || 0
}

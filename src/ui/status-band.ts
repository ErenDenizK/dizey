import { safeTop } from './safe-area'

/**
 * The status band (index.html, styled in app.css) stops iOS 26 from blurring the top edge, but it is one solid colour
 * above every layer. When a sheet or a dialog dims the app, the band dims by the same amount, so no lighter strip stays
 * under the status bar. The dim is read from what sits just under the band: scrims add their opacity, and the first
 * surface ends the walk (the receding tab screen adds its own fade). No band (no top inset), nothing runs.
 */
export function topDim(stack: readonly Element[]): number {
  let clear = 1
  for (const el of stack) {
    if (el.classList.contains('dz-status-band')) continue
    const scrim = el.closest<HTMLElement>('.dz-scrim')
    if (scrim) {
      clear *= 1 - Number(getComputedStyle(scrim).opacity)
      continue
    }
    // The tap target above a route sheet has no paint of its own.
    if (el.closest('.sh-sheet-dismiss')) continue
    const stage = el.closest<HTMLElement>('.dz-stage')
    if (stage) clear *= Number(getComputedStyle(stage).opacity)
    break
  }
  return Math.min(1, Math.max(0, 1 - clear))
}

export function installStatusBand() {
  const band = document.querySelector<HTMLElement>('.dz-status-band')
  if (!band || typeof MutationObserver === 'undefined') return
  let last = -1
  // A MutationObserver already batches every write of a frame into one callback, so this runs at most once a frame.
  const update = () => {
    const top = safeTop()
    const dim = top > 0 ? topDim(document.elementsFromPoint(window.innerWidth / 2, top + 1)) : 0
    const rounded = Math.round(dim * 1000) / 1000
    if (rounded === last) return
    last = rounded
    band.style.setProperty('--band-dim', String(rounded))
  }
  new MutationObserver(update).observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['style', 'class'],
  })
  window.addEventListener('resize', update)
  update()
}

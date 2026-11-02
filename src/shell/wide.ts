import { useSyncExternalStore } from 'react'

/** The viewport width (px) from which "what to do" lives in a card at the bottom right. Mirrors the CSS breakpoint. */
export const WIDE_FROM = 1000

const query = `(min-width: ${WIDE_FROM}px)`

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const list = window.matchMedia(query)
  list.addEventListener('change', onChange)
  return () => list.removeEventListener('change', onChange)
}

const read = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches

/** True while the window is wide enough for the bottom-right card; follows resizes and rotations without a reload. */
export function useWide(): boolean {
  return useSyncExternalStore(subscribe, read, () => false)
}

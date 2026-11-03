import { useSyncExternalStore } from 'react'

/**
 * Size classes: the one definition of how wide a window is (decision 0020). Compact is today's phone and never
 * changes; medium (a tablet, a narrow window) is one centred column; expanded adds the in-flow side column.
 * The same numbers sit in the CSS media queries (`min-width: 600px`, `min-width: 1024px`, which cannot read a
 * variable) and in the `--size-*-from` tokens of src/styles/tokens.css; src/ui/size-class.test.ts keeps all three equal.
 */
export const SIZE_FROM = { medium: 600, expanded: 1024 } as const

export type SizeClass = 'compact' | 'medium' | 'expanded'

export function sizeClassOf(width: number): SizeClass {
  return width >= SIZE_FROM.expanded ? 'expanded' : width >= SIZE_FROM.medium ? 'medium' : 'compact'
}

const MEDIUM_UP = `(min-width: ${SIZE_FROM.medium}px)`
const EXPANDED = `(min-width: ${SIZE_FROM.expanded}px)`

const canMatch = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'

/** True from the medium class up (a window of 600 px or more). Read now, outside React. */
export function isMediumUp(): boolean {
  return canMatch() && window.matchMedia(MEDIUM_UP).matches
}

/** True in the expanded class (1024 px or more). Read now, outside React. */
export function isExpanded(): boolean {
  return canMatch() && window.matchMedia(EXPANDED).matches
}

function subscribe(onChange: () => void): () => void {
  if (!canMatch()) return () => {}
  const lists = [window.matchMedia(MEDIUM_UP), window.matchMedia(EXPANDED)]
  for (const list of lists) list.addEventListener('change', onChange)
  return () => {
    for (const list of lists) list.removeEventListener('change', onChange)
  }
}

const read = (): SizeClass => (isExpanded() ? 'expanded' : isMediumUp() ? 'medium' : 'compact')

/** The current size class; follows resizes and rotations without a reload. */
export function useSizeClass(): SizeClass {
  return useSyncExternalStore(subscribe, read, () => 'compact')
}

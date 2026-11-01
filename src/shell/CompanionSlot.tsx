import type { Ref } from 'react'
import { Duo, type DuoHandle } from '../character/Duo'

/**
 * A place for the duo on a screen: a stable root element (a future companion layer measures its rect)
 * whose width comes from a CSS class. No transitions on it.
 */
export function CompanionSlot({
  name,
  size,
  mood = 'happy',
  alive = true,
  duo,
}: {
  name: string
  size: 'small' | 'large'
  mood?: 'neutral' | 'happy' | 'proud'
  alive?: boolean
  duo?: Ref<DuoHandle>
}) {
  return (
    <div className={`companion-slot companion-slot--${size}`} data-slot={name} aria-hidden="true">
      <Duo {...(duo ? { ref: duo } : {})} mood={mood} alive={alive} />
    </div>
  )
}

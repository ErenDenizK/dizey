import { type ReactNode, useLayoutEffect, useRef, useState } from 'react'
import { strings } from '../content/strings'
import { useExam } from '../exam/store'
import { leaveInPlace } from '../lesson/leave'
import { useMoments } from '../lesson/moments'
import { useLessonRecords } from '../lesson/store'
import { Expander } from '../ui/Expander'
import { Pressable } from '../ui/Pressable'
import { BadgeReveal } from './BadgeReveal'
import { BADGES, type BadgeId, earnedBadges } from './badges'
import { Emblem } from './Emblem'
import { markShown, useShown } from './store'

/**
 * Sen's rozet shelf: the badges you have earned, in a five-column grid of equal emblems, each an item without a bracket (brackets mean a slot) and
 * pressable. Nothing locked is drawn (the next one to earn is Sıradaki's row); with none earned the section is hidden.
 * A badge not shown yet carries a spark dot; a tap plays its moment above the shelf (and marks it shown). A tap on a shown badge replays it.
 */
export function BadgeShelf() {
  const records = useLessonRecords()
  const { history } = useExam()
  const moments = useMoments()
  const shown = useShown()
  const earned = earnedBadges({ records, history, moments })
  const [open, setOpen] = useState<{ id: BadgeId; n: number } | null>(null)
  const current = earned.find((badge) => badge.id === open?.id)
  // While the stage folds shut it keeps showing the rozet it had, instead of emptying in one frame.
  const last = useRef({ badge: current, n: open?.n ?? 0 })
  if (current && open) last.current = { badge: current, n: open.n }
  const staged = last.current.badge
  if (!earned.length) return null
  return (
    <section aria-labelledby="badges">
      <h2 id="badges" className="dz-section-label">
        {strings.badges.shelf}
        {` · ${earned.length} / ${BADGES.length}`}
      </h2>
      <div className="badge-shelf">
        <Expander open={Boolean(current)} id="badge-stage">
          {staged ? (
            <div className="badge-shelf__stage">
              <Leaves key={`${staged.id}-${last.current.n}`}>
                <BadgeReveal badge={staged} kicker={strings.badges.one} />
              </Leaves>
            </div>
          ) : null}
        </Expander>
        <ul className="badge-shelf__grid">
          {earned.map((badge) => (
            <li key={badge.id} className="badge-shelf__cell">
              <Pressable
                className="badge-shelf__item"
                data-testid="badge-earned"
                data-new={shown[badge.id] === undefined || undefined}
                aria-pressed={open?.id === badge.id}
                aria-label={strings.badges.items[badge.id].name}
                onClick={() => {
                  // A second tap on the open rozet folds the stage away; another rozet takes its place.
                  setOpen((was) => (was?.id === badge.id ? null : { id: badge.id, n: (was?.n ?? 0) + 1 }))
                  markShown([badge.id], Date.now())
                }}
              >
                <Emblem badge={badge} bare />
              </Pressable>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** A replaced rozet fades out where it stood while the next one plays its moment. */
function Leaves({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    return () => leaveInPlace(el)
  }, [])
  return (
    <div ref={ref} className="badge-shelf__play">
      {children}
    </div>
  )
}

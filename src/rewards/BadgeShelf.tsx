import { useState } from 'react'
import { strings } from '../content/strings'
import { useExam } from '../exam/store'
import { useMoments } from '../lesson/moments'
import { useLessonRecords } from '../lesson/store'
import { Pressable } from '../ui/Pressable'
import { BadgeReveal } from './BadgeReveal'
import { BADGES, type BadgeId, earnedBadges } from './badges'
import { Emblem } from './Emblem'
import { markShown, useShown } from './store'

/**
 * Sen's rozet shelf: the badges you have earned, in a five-column grid of equal emblems, each in its bracket slot and
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
  if (!earned.length) return null
  return (
    <section aria-labelledby="badges">
      <h2 id="badges" className="dz-section-label">
        {strings.badges.shelf}
        {` · ${earned.length} / ${BADGES.length}`}
      </h2>
      <div className="badge-shelf">
        {current && open ? (
          <div className="badge-shelf__stage">
            <BadgeReveal key={`${open.id}-${open.n}`} badge={current} kicker={strings.badges.one} />
          </div>
        ) : null}
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
                  setOpen((was) => ({ id: badge.id, n: (was?.n ?? 0) + 1 }))
                  markShown([badge.id], Date.now())
                }}
              >
                <Emblem badge={badge} />
              </Pressable>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

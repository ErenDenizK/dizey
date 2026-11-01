import { useState } from 'react'
import { strings } from '../content/strings'
import { useExam } from '../exam/store'
import { useLessonRecords } from '../lesson/store'
import { Pressable } from '../ui/Pressable'
import { BadgeReveal } from './BadgeReveal'
import { type BadgeId, earnedBadges } from './badges'
import { Emblem } from './Emblem'
import { markShown, useShown } from './store'

/**
 * Profil's rozet shelf: only what was earned, never an empty slot or a "not yet". A badge not shown yet carries a
 * spark dot; a tap plays its moment above the shelf (and marks it shown). A tap on a shown badge replays it.
 */
export function BadgeShelf() {
  const records = useLessonRecords()
  const { history } = useExam()
  const shown = useShown()
  const earned = earnedBadges({ records, history })
  const [open, setOpen] = useState<{ id: BadgeId; n: number } | null>(null)
  const current = earned.find((badge) => badge.id === open?.id)
  return (
    <section aria-labelledby="badges">
      <h2 id="badges" className="dz-section-label">
        {strings.badges.shelf}
        {earned.length ? ` · ${earned.length}` : ''}
      </h2>
      {earned.length ? (
        <div className="badge-shelf">
          {current && open ? (
            <div className="badge-shelf__stage">
              <BadgeReveal key={`${open.id}-${open.n}`} badge={current} kicker={strings.badges.one} />
            </div>
          ) : null}
          <div className="badge-shelf__grid">
            {earned.map((badge) => (
              <Pressable
                key={badge.id}
                className="badge-shelf__item"
                data-new={shown[badge.id] === undefined || undefined}
                aria-pressed={open?.id === badge.id}
                aria-label={strings.badges.items[badge.id].name}
                onClick={() => {
                  setOpen((was) => ({ id: badge.id, n: (was?.n ?? 0) + 1 }))
                  markShown([badge.id], Date.now())
                }}
              >
                <Emblem badge={badge} />
                <span className="badge-shelf__name">{strings.badges.items[badge.id].name}</span>
              </Pressable>
            ))}
          </div>
          <p className="dz-footnote badge-shelf__hint">{strings.badges.shelfHint}</p>
        </div>
      ) : (
        <p className="dz-footnote badge-shelf__empty">{strings.badges.empty}</p>
      )}
    </section>
  )
}

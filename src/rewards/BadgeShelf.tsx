import { useState } from 'react'
import { strings } from '../content/strings'
import { useExam } from '../exam/store'
import { useMoments } from '../lesson/moments'
import { useLessonRecords } from '../lesson/store'
import { Pressable } from '../ui/Pressable'
import { BadgeReveal } from './BadgeReveal'
import { BADGES, type Badge, type BadgeId, earnedBadges } from './badges'
import { Emblem } from './Emblem'
import { markShown, useShown } from './store'

/**
 * Sen's rozet shelf: earned badges large with their names; every badge not earned yet folds into one silhouette tile ("N tane daha").
 * A badge not shown yet carries a spark dot; a tap plays its moment above the shelf (and marks it shown). A tap on a shown badge replays it.
 */
export function BadgeShelf() {
  const records = useLessonRecords()
  const { history } = useExam()
  const moments = useMoments()
  const shown = useShown()
  const earned = earnedBadges({ records, history, moments })
  const unearned = BADGES.filter((badge) => !earned.some((item) => item.id === badge.id))
  const [open, setOpen] = useState<{ id: BadgeId; n: number } | null>(null)
  const current = earned.find((badge) => badge.id === open?.id)
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
        <div className="badge-shelf__grid">
          {earned.map((badge) => {
            const name = strings.badges.items[badge.id].name
            return (
              <Pressable
                key={badge.id}
                className="badge-shelf__item"
                data-new={shown[badge.id] === undefined || undefined}
                aria-pressed={open?.id === badge.id}
                aria-label={name}
                onClick={() => {
                  setOpen((was) => ({ id: badge.id, n: (was?.n ?? 0) + 1 }))
                  markShown([badge.id], Date.now())
                }}
              >
                <Emblem badge={badge} />
                <span className="badge-shelf__name">{name}</span>
              </Pressable>
            )
          })}
          {unearned.length ? (
            <div
              className="badge-shelf__more"
              data-testid="badges-more"
              role="img"
              aria-label={`${strings.me.more(unearned.length)}, ${strings.me.badgeHidden}`}
            >
              <Emblem badge={unearned[0] as Badge} />
              <span className="badge-shelf__more-text num">{strings.me.more(unearned.length)}</span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

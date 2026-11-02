import { lessons } from '../content/lessons'
import { chapters } from '../content/path'
import { strings } from '../content/strings'
import { useExam } from '../exam/store'
import { useMoments } from '../lesson/moments'
import { useLessonRecords } from '../lesson/store'
import { PressLink } from '../shell/PressLink'
import { ChevronRight } from '../ui/icons'
import type { BadgeId } from './badges'
import { Emblem } from './Emblem'
import { nextBadge, type Remaining } from './next-badge'

/** The one short line that says what earns the badge, from what is left. */
export function earnLine(id: BadgeId, remaining: Remaining): string {
  const text = strings.me
  if (remaining.kind === 'lessons') {
    const lesson = lessons.find((item) => item.id === remaining.lessonId)
    const chapter = chapters.findIndex((item) => lesson && item.lessons.includes(lesson))
    if (chapter >= 0) return text.nextLessons(chapter + 1, remaining.count)
  }
  if (remaining.kind === 'fixes') return text.nextFixes(remaining.count)
  return text.nextPlain[id] ?? text.nextFallback
}

/**
 * Sıradaki: the next badge to earn, as one row. Its slot (the emblem's own bracket frame) shows the badge dimmed;
 * a tap goes back to the path where it is earned. Hidden once every badge is earned.
 */
export function NextBadge() {
  const records = useLessonRecords()
  const { history } = useExam()
  const moments = useMoments()
  const next = nextBadge({ records, history, moments })
  if (!next) return null
  const { badge, remaining } = next
  return (
    <section aria-labelledby="next-badge" className="me-next">
      <h2 id="next-badge" className="dz-section-label">
        {strings.me.next}
      </h2>
      <PressLink to="/" className="me-row me-next__row" data-testid="next-badge" data-badge={badge.id}>
        <span className="me-next__slot" data-testid="badge-slot-empty" aria-hidden="true">
          <Emblem badge={badge} />
        </span>
        <span className="me-next__text">
          <b className="me-next__name">{strings.badges.items[badge.id].name}</b>
          <span className="me-next__line">{earnLine(badge.id, remaining)}</span>
        </span>
        <span className="me-mistakes__chevron">
          <ChevronRight />
        </span>
      </PressLink>
    </section>
  )
}

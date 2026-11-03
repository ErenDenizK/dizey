import { Navigate, useNavigate } from '@tanstack/react-router'
import { lessons } from '../content/lessons'
import { strings } from '../content/strings'
import { summaryOf } from '../content/summaries'
import { Screen } from '../ui/Screen'
import { SummaryBody } from './SummaryBody'

/** One lesson's summary as a pushed page, reached from the summary list. */
export function SummaryPage({ id }: { id: string }) {
  const navigate = useNavigate()
  const lesson = lessons.find((candidate) => candidate.id === id)
  const summary = lesson ? summaryOf(lesson.id) : undefined
  if (!lesson || !summary) return <Navigate to="/summary" />
  return (
    <Screen
      title={lesson.title}
      back={() => void navigate({ to: '/summary' })}
      backLabel={strings.summary.backToIndex}
      parent={strings.summary.title}
      pushed
      measure="read"
    >
      <SummaryBody summary={summary} />
    </Screen>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { SummaryPage } from '../summary/SummaryPage'

/** One lesson's summary page. */
export const Route = createFileRoute('/summary/$id')({ component: SummaryRoute })

function SummaryRoute() {
  const { id } = Route.useParams()
  return <SummaryPage id={id} />
}

import { createFileRoute, Navigate } from '@tanstack/react-router'
import { lessons } from '../content/lessons'
import { LessonPlayer } from '../lesson/LessonPlayer'

export const Route = createFileRoute('/lesson/$id')({
  component: LessonRoute,
  // `step` opens a given step, e.g. from the mistake log.
  validateSearch: (search: Record<string, unknown>): { step?: string } =>
    typeof search.step === 'string' ? { step: search.step } : {},
})

function LessonRoute() {
  const { id } = Route.useParams()
  const { step } = Route.useSearch()
  const lesson = lessons.find((candidate) => candidate.id === id)
  if (!lesson) return <Navigate to="/map" />
  // A new key per lesson resets the player's state.
  return <LessonPlayer key={`${lesson.id}:${step ?? ''}`} lesson={lesson} startStep={step} />
}

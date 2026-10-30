import { createFileRoute, Navigate } from '@tanstack/react-router'
import { lessons } from '../content/lessons'
import { LessonPlayer } from '../lesson/LessonPlayer'

export const Route = createFileRoute('/lesson/$id')({ component: LessonRoute })

function LessonRoute() {
  const { id } = Route.useParams()
  const lesson = lessons.find((candidate) => candidate.id === id)
  if (!lesson) return <Navigate to="/map" />
  // A new key per lesson resets the player's state.
  return <LessonPlayer key={lesson.id} lesson={lesson} />
}

import { createFileRoute } from '@tanstack/react-router'
import { ExamHome } from '../exam/ExamHome'

/** The exam hub, a pushed full-screen route reached from the map's final gate and from Bugün. */
export const Route = createFileRoute('/exam/')({ component: ExamHome })

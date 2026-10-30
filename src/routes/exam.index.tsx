import { createFileRoute } from '@tanstack/react-router'
import { ExamHome } from '../exam/ExamHome'

export const Route = createFileRoute('/exam/')({ component: ExamHome })

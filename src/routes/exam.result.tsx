import { createFileRoute } from '@tanstack/react-router'
import { ExamResult } from '../exam/ExamResult'

export const Route = createFileRoute('/exam/result')({ component: ExamResult })

import { createFileRoute } from '@tanstack/react-router'
import { ExamRun } from '../exam/ExamRun'

export const Route = createFileRoute('/exam/run')({ component: ExamRun })

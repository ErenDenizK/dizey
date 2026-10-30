import { createFileRoute } from '@tanstack/react-router'
import { TodayView } from '../shell/TodayView'

export const Route = createFileRoute('/')({ component: TodayView })

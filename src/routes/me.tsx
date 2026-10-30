import { createFileRoute } from '@tanstack/react-router'
import { MeView } from '../shell/MeView'

export const Route = createFileRoute('/me')({ component: MeView })

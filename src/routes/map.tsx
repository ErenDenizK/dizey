import { createFileRoute } from '@tanstack/react-router'
import { MapView } from '../shell/MapView'

export const Route = createFileRoute('/map')({ component: MapView })

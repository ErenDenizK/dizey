import { createFileRoute } from '@tanstack/react-router'
import { LegacyApp } from '../legacy/LegacyApp'

export const Route = createFileRoute('/')({ component: LegacyApp })

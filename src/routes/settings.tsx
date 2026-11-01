import { createFileRoute } from '@tanstack/react-router'
import { SettingsView } from '../shell/SettingsView'

/** Every setting, in one pushed screen opened from the gear in Profil. */
export const Route = createFileRoute('/settings')({ component: SettingsView })

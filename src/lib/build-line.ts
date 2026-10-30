import { strings } from '../content/strings'
import { buildInfo, isPreview } from './build-info'

/** "Sürüm 0.2.0 · abc1234", plus the preview channel on PR builds. */
export function versionLine(): string {
  const preview = isPreview ? ` · ${strings.preview} ${buildInfo.channel}` : ''
  return `${strings.version} ${buildInfo.version} · ${buildInfo.commit}${preview}`
}

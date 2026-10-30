export const buildInfo = {
  version: __APP_VERSION__,
  commit: __APP_COMMIT__,
  channel: __APP_CHANNEL__,
} as const

export const isPreview = buildInfo.channel.startsWith('pr-')

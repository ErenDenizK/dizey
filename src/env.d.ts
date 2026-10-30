declare const __APP_VERSION__: string
declare const __APP_COMMIT__: string
/** "production", "pr-<n>" or "dev". */
declare const __APP_CHANNEL__: string

declare module '*.html?raw' {
  const content: string
  export default content
}

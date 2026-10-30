import { buildInfo } from '../build-info'

/**
 * localStorage for app progress, namespaced by deployment channel: a PR preview shares
 * the production origin, so its keys get a prefix and can never read or overwrite real progress.
 */
const prefix = buildInfo.channel === 'production' ? '' : `${buildInfo.channel}:`

export const appStorage = {
  getItem(key: string): string | null {
    return window.localStorage.getItem(prefix + key)
  },
  setItem(key: string, value: string): void {
    window.localStorage.setItem(prefix + key, value)
  },
  removeItem(key: string): void {
    window.localStorage.removeItem(prefix + key)
  },
  /** Keys of this channel, without the prefix. */
  keys(): string[] {
    return Object.keys(window.localStorage)
      .filter((key) => (prefix ? key.startsWith(prefix) : !/^pr-\d+:/.test(key)))
      .map((key) => key.slice(prefix.length))
  },
}

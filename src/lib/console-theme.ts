// Console (/app) colour theme: dark by default, light on request. Stored per browser;
// the public website is always light.
import { useSyncExternalStore } from 'react'

export type ConsoleTheme = 'dark' | 'light'
const KEY = 'cos_console_theme'
const listeners = new Set<() => void>()

function read(): ConsoleTheme {
  try { return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark' } catch { return 'dark' }
}

export function setConsoleTheme(t: ConsoleTheme) {
  try { localStorage.setItem(KEY, t) } catch { /* private mode: session-only */ }
  listeners.forEach((l) => l())
}

export function useConsoleTheme(): ConsoleTheme {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, read, () => 'dark')
}

/** A colour at `pct`% over transparent — works with CSS variables (unlike hex alpha suffixes). */
export const tint = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`

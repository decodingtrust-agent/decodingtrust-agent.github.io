"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * String state mirrored to localStorage. The value is read on mount and again
 * whenever `key` changes (e.g. per-task storage keys), so it always reflects
 * the current key's stored entry. Writes (via the returned setter) push to
 * storage immediately. SSR-safe — initial render uses `fallback`, the real
 * value arrives after hydration.
 */
export function useStoredString(
  key: string,
  fallback: string
): [string, (v: string) => void] {
  const [value, setValue] = useState<string>(fallback)
  const fallbackRef = useRef(fallback)
  fallbackRef.current = fallback

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key)
      setValue(stored != null ? stored : fallbackRef.current)
    } catch {
      /* storage unavailable / quota / private mode — keep current value */
    }
  }, [key])

  const set = useCallback(
    (v: string) => {
      setValue(v)
      try {
        window.localStorage.setItem(key, v)
      } catch {
        /* ignore */
      }
    },
    [key]
  )

  return [value, set]
}

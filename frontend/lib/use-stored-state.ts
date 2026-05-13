"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * String state mirrored to localStorage. The stored value is read once on
 * mount; subsequent writes (via the returned setter) push to storage
 * immediately. SSR-safe — initial render uses `fallback`, real value
 * arrives after hydration.
 */
export function useStoredString(
  key: string,
  fallback: string
): [string, (v: string) => void] {
  const [value, setValue] = useState<string>(fallback)
  const hydrated = useRef(false)

  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    try {
      const stored = window.localStorage.getItem(key)
      if (stored != null) setValue(stored)
    } catch {
      /* storage unavailable / quota / private mode — silently ignore */
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

"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export interface ApiKeys {
  openai: string
  anthropic: string
  gemini: string
}

interface ApiKeysContextType {
  apiKeys: ApiKeys
  setApiKey: (provider: keyof ApiKeys, key: string) => void
  clearApiKey: (provider: keyof ApiKeys) => void
  clearAllApiKeys: () => void
  hasApiKey: (provider: keyof ApiKeys) => boolean
}

const ApiKeysContext = createContext<ApiKeysContextType | undefined>(undefined)

const STORAGE_KEY = "decodingtrust_api_keys"

// Mask API key for display (show first 4 and last 4 characters)
export function maskApiKey(key: string): string {
  if (!key || key.length < 12) return key ? "••••••••" : ""
  return `${key.slice(0, 4)}${"•".repeat(Math.min(key.length - 8, 20))}${key.slice(-4)}`
}

export function ApiKeysProvider({ children }: { children: ReactNode }) {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    openai: "",
    anthropic: "",
    gemini: "",
  })
  const [isLoaded, setIsLoaded] = useState(false)

  // Load API keys from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setApiKeys({
          openai: parsed.openai || "",
          anthropic: parsed.anthropic || "",
          gemini: parsed.gemini || "",
        })
      }
    } catch (error) {
      console.error("Failed to load API keys from storage:", error)
    }
    setIsLoaded(true)
  }, [])

  // Save API keys to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(apiKeys))
      } catch (error) {
        console.error("Failed to save API keys to storage:", error)
      }
    }
  }, [apiKeys, isLoaded])

  const setApiKey = (provider: keyof ApiKeys, key: string) => {
    setApiKeys((prev) => ({ ...prev, [provider]: key }))
  }

  const clearApiKey = (provider: keyof ApiKeys) => {
    setApiKeys((prev) => ({ ...prev, [provider]: "" }))
  }

  const clearAllApiKeys = () => {
    setApiKeys({ openai: "", anthropic: "", gemini: "" })
  }

  const hasApiKey = (provider: keyof ApiKeys) => {
    return apiKeys[provider].length > 0
  }

  return (
    <ApiKeysContext.Provider
      value={{
        apiKeys,
        setApiKey,
        clearApiKey,
        clearAllApiKeys,
        hasApiKey,
      }}
    >
      {children}
    </ApiKeysContext.Provider>
  )
}

export function useApiKeys() {
  const context = useContext(ApiKeysContext)
  if (context === undefined) {
    throw new Error("useApiKeys must be used within an ApiKeysProvider")
  }
  return context
}

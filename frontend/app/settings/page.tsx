"use client"

import { useState } from "react"
import {
  Settings,
  Key,
  Eye,
  EyeOff,
  Check,
  Trash2,
  AlertCircle,
} from "lucide-react"
import { useApiKeys, maskApiKey, ApiKeys } from "@/contexts/api-keys-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="border-b border-border bg-background/50 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 lg:px-6 py-6">
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage local browser settings and model API keys
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 lg:px-6 py-8 space-y-8">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Local Usage</h2>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              User account login is currently disabled in the frontend, so account profile and password settings are hidden.
            </p>
            <p>
              You can still configure model provider API keys below. These values stay in your browser and are used by the workspace tools locally.
            </p>
          </div>
        </div>

        {/* API Keys Section */}
        <ApiKeysSection />
      </div>
    </div>
  )
}

// API Key provider configuration
const API_PROVIDERS: {
  id: keyof ApiKeys
  name: string
  description: string
  placeholder: string
  docsUrl: string
}[] = [
  {
    id: "openai",
    name: "OpenAI",
    description: "Required for GPT-4, GPT-4o, and other OpenAI models",
    placeholder: "sk-...",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Required for Claude models",
    placeholder: "sk-ant-...",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    description: "Required for Gemini models",
    placeholder: "AIza...",
    docsUrl: "https://aistudio.google.com/app/apikey",
  },
]

function ApiKeysSection() {
  const { apiKeys, setApiKey, clearApiKey, hasApiKey } = useApiKeys()
  const [editingKey, setEditingKey] = useState<keyof ApiKeys | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [showKey, setShowKey] = useState<keyof ApiKeys | null>(null)
  const [savedFeedback, setSavedFeedback] = useState<keyof ApiKeys | null>(null)

  const handleEdit = (provider: keyof ApiKeys) => {
    setEditingKey(provider)
    setInputValue(apiKeys[provider])
  }

  const handleSave = (provider: keyof ApiKeys) => {
    setApiKey(provider, inputValue.trim())
    setEditingKey(null)
    setInputValue("")
    setSavedFeedback(provider)
    setTimeout(() => setSavedFeedback(null), 2000)
  }

  const handleCancel = () => {
    setEditingKey(null)
    setInputValue("")
  }

  const handleClear = (provider: keyof ApiKeys) => {
    clearApiKey(provider)
    if (editingKey === provider) {
      setEditingKey(null)
      setInputValue("")
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-3 mb-2">
        <Key className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">API Keys</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Configure your API keys to use with the red-teaming agent. Keys are stored locally in your browser.
      </p>

      <div className="space-y-4">
        {API_PROVIDERS.map((provider) => {
          const isEditing = editingKey === provider.id
          const hasKey = hasApiKey(provider.id)
          const isShowingKey = showKey === provider.id
          const justSaved = savedFeedback === provider.id

          return (
            <div
              key={provider.id}
              className={cn(
                "rounded-lg border p-4 transition-colors",
                isEditing
                  ? "border-primary bg-primary/5"
                  : hasKey
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-border"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{provider.name}</span>
                    {hasKey && !isEditing && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                        <Check className="h-3 w-3" />
                        Configured
                      </span>
                    )}
                    {justSaved && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 animate-pulse">
                        Saved!
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {provider.description}
                  </p>

                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type={isShowingKey ? "text" : "password"}
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder={provider.placeholder}
                          className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowKey(isShowingKey ? null : provider.id)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {isShowingKey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => handleSave(provider.id)}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancel}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : hasKey ? (
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                        {isShowingKey
                          ? apiKeys[provider.id]
                          : maskApiKey(apiKeys[provider.id])}
                      </code>
                      <button
                        type="button"
                        onClick={() =>
                          setShowKey(isShowingKey ? null : provider.id)
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {isShowingKey ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-amber-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Not configured</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!isEditing && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(provider.id)}
                      >
                        {hasKey ? "Edit" : "Add"}
                      </Button>
                      {hasKey && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleClear(provider.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {!isEditing && (
                <div className="mt-3 pt-3 border-t border-border">
                  <a
                    href={provider.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Get your {provider.name} API key &rarr;
                  </a>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-600 mb-1">Security Notice</p>
            <p className="text-muted-foreground">
              API keys are stored locally in your browser and will be sent to the red-teaming service when running attacks.
              Never share your API keys with others. Your keys are not stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

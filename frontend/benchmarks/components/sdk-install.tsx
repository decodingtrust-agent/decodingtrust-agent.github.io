"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

const INSTALL_COMMAND = "pip install decodingtrust-agent"

export function SdkInstall() {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 font-mono text-sm">
      <span className="select-none text-muted-foreground">$</span>
      <code>{INSTALL_COMMAND}</code>
      <button onClick={copy} aria-label="Copy install command" className="ml-2 shrink-0 text-muted-foreground transition-colors hover:text-foreground">
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  )
}

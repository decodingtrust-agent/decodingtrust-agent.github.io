"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { BIBTEX } from "@/lib/citation"

interface CitationBlockProps {
  className?: string
  intro?: string
}

export function CitationBlock({
  className,
  intro = "If you use DecodingTrust-Agent in your research, please cite our paper.",
}: CitationBlockProps) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(BIBTEX)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className={cn("p-6 rounded-lg border border-border bg-card", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Citation</h3>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy BibTeX to clipboard"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{intro}</p>
      <pre className="overflow-x-auto rounded-md bg-secondary p-4 text-xs font-mono text-foreground/90 leading-relaxed">
        <code>{BIBTEX}</code>
      </pre>
    </div>
  )
}

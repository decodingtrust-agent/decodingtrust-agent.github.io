"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

interface CodeBlockProps {
  code: string
  language?: string
  title?: string
}

export function CodeBlock({ code, language = "python", title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 my-4">
      {title && (
        <div className="bg-zinc-900 px-4 py-2 text-sm text-muted-foreground border-b border-zinc-800">
          {title}
        </div>
      )}
      <div className="absolute right-2 top-2 z-10">
        <button
          onClick={handleCopy}
          className="p-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
          title="Copy code"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  )
}

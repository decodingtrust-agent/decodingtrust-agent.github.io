"use client"

import { useState, useMemo } from "react"
import { Copy, Check } from "lucide-react"

interface CodeBlockProps {
  code: string
  language?: string
  title?: string
}

// Simple syntax highlighter
function highlightCode(code: string, language: string): React.ReactNode[] {
  const lines = code.split('\n')

  return lines.map((line, lineIndex) => {
    const tokens: React.ReactNode[] = []
    let remaining = line
    let keyIndex = 0

    // Process the line character by character with regex patterns
    while (remaining.length > 0) {
      let matched = false

      // Comments (# for python/bash, // for js)
      const commentMatch = remaining.match(/^(#.*|\/\/.*)/)
      if (commentMatch) {
        tokens.push(
          <span key={keyIndex++} className="text-zinc-500 italic">
            {commentMatch[0]}
          </span>
        )
        remaining = remaining.slice(commentMatch[0].length)
        matched = true
        continue
      }

      // Strings (double or single quotes)
      const stringMatch = remaining.match(/^(["'`])(?:(?!\1)[^\\]|\\.)*?\1/) ||
                          remaining.match(/^(["'`])(?:(?!\1)[^\\]|\\.)*$/)
      if (stringMatch) {
        tokens.push(
          <span key={keyIndex++} className="text-green-600 dark:text-green-500">
            {stringMatch[0]}
          </span>
        )
        remaining = remaining.slice(stringMatch[0].length)
        matched = true
        continue
      }

      // Python/JS keywords
      const keywordMatch = remaining.match(
        /^(from|import|class|def|async|await|return|if|else|elif|for|while|try|except|finally|with|as|in|not|and|or|True|False|None|const|let|var|function|export|default)\b/
      )
      if (keywordMatch) {
        tokens.push(
          <span key={keyIndex++} className="text-purple-600 dark:text-purple-400 font-medium">
            {keywordMatch[0]}
          </span>
        )
        remaining = remaining.slice(keywordMatch[0].length)
        matched = true
        continue
      }

      // Function calls (word followed by parenthesis)
      const funcMatch = remaining.match(/^([a-zA-Z_][a-zA-Z0-9_]*)(\()/)
      if (funcMatch) {
        tokens.push(
          <span key={keyIndex++} className="text-blue-600 dark:text-blue-400">
            {funcMatch[1]}
          </span>
        )
        tokens.push(<span key={keyIndex++}>(</span>)
        remaining = remaining.slice(funcMatch[0].length)
        matched = true
        continue
      }

      // Class names / Types (PascalCase)
      const classMatch = remaining.match(/^([A-Z][a-zA-Z0-9_]*)\b/)
      if (classMatch) {
        tokens.push(
          <span key={keyIndex++} className="text-amber-600 dark:text-amber-400">
            {classMatch[0]}
          </span>
        )
        remaining = remaining.slice(classMatch[0].length)
        matched = true
        continue
      }

      // Numbers
      const numberMatch = remaining.match(/^(\d+\.?\d*)/)
      if (numberMatch) {
        tokens.push(
          <span key={keyIndex++} className="text-orange-600 dark:text-orange-400">
            {numberMatch[0]}
          </span>
        )
        remaining = remaining.slice(numberMatch[0].length)
        matched = true
        continue
      }

      // Operators and punctuation
      const operatorMatch = remaining.match(/^(===|!==|==|!=|<=|>=|=>|->|\+=|-=|\*=|\/=|&&|\|\||[+\-*/%=<>!&|^~])/)
      if (operatorMatch) {
        tokens.push(
          <span key={keyIndex++} className="text-rose-600 dark:text-rose-400">
            {operatorMatch[0]}
          </span>
        )
        remaining = remaining.slice(operatorMatch[0].length)
        matched = true
        continue
      }

      // Default: single character
      if (!matched) {
        tokens.push(<span key={keyIndex++}>{remaining[0]}</span>)
        remaining = remaining.slice(1)
      }
    }

    return (
      <span key={lineIndex}>
        {tokens}
        {lineIndex < lines.length - 1 ? '\n' : ''}
      </span>
    )
  })
}

export function CodeBlock({ code, language = "python", title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const highlightedCode = useMemo(() => highlightCode(code, language), [code, language])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group my-4">
      {title && (
        <div className="text-sm text-muted-foreground mb-2">{title}</div>
      )}
      <div className="relative bg-zinc-100 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
        {/* Copy button - positioned top right */}
        <button
          onClick={handleCopy}
          className="absolute right-3 top-3 p-1.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          title="Copy code"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>

        {/* Code content */}
        <pre className="p-4 pr-12 overflow-x-auto text-sm leading-relaxed">
          <code className="text-zinc-800 dark:text-zinc-200 font-mono whitespace-pre">
            {highlightedCode}
          </code>
        </pre>
      </div>
    </div>
  )
}

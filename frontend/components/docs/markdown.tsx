import type { ReactNode } from "react"

/**
 * Render a small subset of inline markdown: **bold**, *italic*, `code`,
 * and bare URLs. The environments registry uses this to render LaTeX-derived
 * paragraphs without pulling in a full markdown engine.
 */
export function renderInline(text: string): ReactNode {
  const tokens: ReactNode[] = []
  // Greedy scanner over **bold**, *italic*, and `code` segments.
  const pattern = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g
  let lastIdx = 0
  let key = 0
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0
    if (start > lastIdx) {
      tokens.push(text.slice(lastIdx, start))
    }
    const piece = match[0]
    if (piece.startsWith("**")) {
      tokens.push(
        <strong key={key++} className="font-semibold text-foreground">
          {piece.slice(2, -2)}
        </strong>
      )
    } else if (piece.startsWith("`")) {
      tokens.push(
        <code
          key={key++}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
        >
          {piece.slice(1, -1)}
        </code>
      )
    } else if (piece.startsWith("*")) {
      tokens.push(
        <em key={key++} className="italic">
          {piece.slice(1, -1)}
        </em>
      )
    }
    lastIdx = start + piece.length
  }
  if (lastIdx < text.length) {
    tokens.push(text.slice(lastIdx))
  }
  return tokens
}

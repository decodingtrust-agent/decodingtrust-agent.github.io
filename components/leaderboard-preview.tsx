"use client"

import { ExternalLink, ChevronDown, TrendingUp, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LeaderboardPreviewProps {
  onViewFull: () => void
}

const previewData = [
  { rank: 1, agent: "GPT-5", model: "gpt-5", org: "OpenAI", defense: 72.3, trend: "up" },
  { rank: 2, agent: "Claude-4", model: "claude-4-opus", org: "Anthropic", defense: 68.9, trend: "up" },
  { rank: 3, agent: "Gemini Pro", model: "gemini-2.0", org: "Google", defense: 65.4, trend: "same" },
  { rank: 4, agent: "DeepSeek-V4", model: "deepseek-v4", org: "DeepSeek", defense: 62.1, trend: "down" },
  { rank: 5, agent: "Llama-4", model: "llama-4-70b", org: "Meta", defense: 58.7, trend: "up" },
]

export function LeaderboardPreview({ onViewFull }: LeaderboardPreviewProps) {
  return (
    <section className="border-t border-border/50">
      <div className="mx-auto max-w-7xl px-4 py-20 md:py-28">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-4">
              <TrendingUp className="h-3 w-3" />
              Live Rankings
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Security Robustness Leaderboard</h2>
            <p className="text-muted-foreground">
              Defense rates for top AI agents on DecodingTrust-Agent@1.0 benchmark
            </p>
          </div>
          <Button
            variant="outline"
            onClick={onViewFull}
            className="hidden md:flex border-border hover:bg-secondary bg-transparent"
          >
            View Full Leaderboard
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/50 overflow-hidden">
          <div className="p-6 space-y-4">
            {previewData.map((row, index) => (
              <div key={row.rank} className="group">
                <div className="flex items-center gap-4 mb-2">
                  <span className="w-6 text-sm font-mono text-muted-foreground">{row.rank}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{row.agent}</span>
                        <span className="text-xs text-muted-foreground">({row.model})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-semibold">{row.defense}%</span>
                        {row.trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-8 bg-secondary/50 rounded-lg overflow-hidden relative">
                      <div
                        className="absolute inset-y-0 left-0 bg-primary/80 rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                        style={{ width: `${row.defense}%` }}
                      >
                        {index < 2 && <Shield className="h-4 w-4 text-primary-foreground/80" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border/50 p-4 bg-secondary/20 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Defense rate measures resistance to policy-aligned attacks
            </span>
            <Button variant="ghost" size="sm" onClick={onViewFull} className="text-muted-foreground hover:text-primary">
              <ChevronDown className="mr-1 h-4 w-4" />
              View All
            </Button>
          </div>
        </div>

        {/* Mobile view button */}
        <Button variant="outline" onClick={onViewFull} className="md:hidden w-full mt-4 border-border bg-transparent">
          View Full Leaderboard
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  )
}

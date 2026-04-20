"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Activity, ArrowDown, ArrowUp, BrainCircuit, ExternalLink, Medal, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  formatPercent,
  loadBenchmarkDataset,
  type BenchmarkDataset,
  type BenchmarkMetricType,
} from "@/lib/benchmark"

const HOMEPAGE_TABLE_METRICS: BenchmarkMetricType[] = ["indirect_asr", "direct_asr", "bsr"]

const FRAMEWORK_LOGO_PATHS: Record<string, string> = {
  "openai-agents": "/logo/framework-openai-agents.svg",
  "claude-code": "/logo/framework-claude-code.svg",
  "google-adk": "/logo/framework-google-adk.png",
  openclaw: "/logo/openclaw.svg",
}

const MODEL_LOGO_PATHS: Record<string, string> = {
  "gpt-5-4": "/logo/openai-monoblossom.svg",
  "gpt-5-2": "/logo/openai-monoblossom.svg",
  "gpt-5-1": "/logo/openai-monoblossom.svg",
  "gpt-oss-120b": "/logo/openai-monoblossom.svg",
  "opus-4-6": "/logo/claude.svg",
  "sonnet-4-5": "/logo/claude.svg",
  "gemini-3-pro": "/logo/gemini.svg",
  "gemini-3-1-pro": "/logo/gemini.svg",
}

const METRIC_LABELS: Record<BenchmarkMetricType, string> = {
  indirect_asr: "Indirect ASR",
  direct_asr: "Direct ASR",
  bsr: "BSR",
}

const METRIC_HINTS: Record<BenchmarkMetricType, string> = {
  indirect_asr: "Lower = safer",
  direct_asr: "Lower = safer",
  bsr: "Higher = more capable",
}

type HomepageComboRow = {
  key: string
  frameworkKey: string
  frameworkName: string
  modelKey: string
  modelName: string
  metrics: Record<BenchmarkMetricType, number | null>
}

function normalizeScore(metricType: BenchmarkMetricType, value: number): number {
  const clamped = Math.max(0, Math.min(100, value))
  if (metricType === "bsr") {
    if (clamped >= 90) return 1
    if (clamped >= 75) return 0.5 + ((clamped - 75) / 15) * 0.5
    if (clamped >= 50) return ((clamped - 50) / 25) * 0.5
    return 0
  }
  if (clamped <= 5) return 1
  if (clamped <= 25) return 0.5 + ((25 - clamped) / 20) * 0.5
  if (clamped <= 60) return Math.max(0, 0.5 - ((clamped - 25) / 35) * 0.5)
  return 0
}

function heatmapCellStyle(metricType: BenchmarkMetricType, value: number | null): React.CSSProperties {
  if (value === null) return {}
  const good = normalizeScore(metricType, value)
  const hue = good * 135
  const saturation = good < 0.35 ? 82 : 70
  const alpha = good < 0.35 ? 0.22 : good > 0.65 ? 0.2 : 0.18
  return {
    backgroundColor: `hsla(${hue}, ${saturation}%, 50%, ${alpha})`,
  }
}

function heatmapTextClass(metricType: BenchmarkMetricType, value: number | null) {
  if (value === null) return "text-muted-foreground"
  const good = normalizeScore(metricType, value)
  if (good >= 0.65) return "text-emerald-600 dark:text-emerald-400"
  if (good >= 0.45) return "text-foreground"
  return "text-rose-600 dark:text-rose-400"
}

function MetricCell({
  metricType,
  value,
  emphasis = false,
}: {
  metricType: BenchmarkMetricType
  value: number | null
  emphasis?: boolean
}) {
  if (value === null) {
    return <span className="font-mono text-base text-muted-foreground">--</span>
  }
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-3 py-1.5 font-mono",
        emphasis ? "text-lg font-bold" : "text-base font-semibold",
        heatmapTextClass(metricType, value)
      )}
      style={heatmapCellStyle(metricType, value)}
    >
      {formatPercent(value)}
    </span>
  )
}

function BrandLogo({ logoPath, alt }: { logoPath: string | undefined; alt: string }) {
  return logoPath ? (
    <img src={logoPath} alt={alt} className="h-7 w-7 shrink-0 object-contain" />
  ) : (
    <BrainCircuit className="h-7 w-7 shrink-0 text-muted-foreground" />
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-amber-400 text-amber-950 shadow-sm ring-1 ring-amber-300">
        <Trophy className="h-4 w-4" />
      </span>
    )
  }
  if (rank === 2) {
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 shadow-sm ring-1 ring-slate-300">
        <Medal className="h-4 w-4" />
      </span>
    )
  }
  if (rank === 3) {
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-orange-400 text-orange-950 shadow-sm ring-1 ring-orange-300">
        <Medal className="h-4 w-4" />
      </span>
    )
  }
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background text-sm font-mono font-medium text-muted-foreground">
      {rank}
    </span>
  )
}

function sortByIndirectAsr(rows: HomepageComboRow[]) {
  // Sort by Indirect ASR DESCENDING — most vulnerable first.
  return [...rows].sort((left, right) => {
    const leftValue = left.metrics.indirect_asr
    const rightValue = right.metrics.indirect_asr
    if (leftValue === null && rightValue === null) {
      return (
        left.frameworkName.localeCompare(right.frameworkName) ||
        left.modelName.localeCompare(right.modelName)
      )
    }
    if (leftValue === null) return 1
    if (rightValue === null) return -1
    if (leftValue !== rightValue) return rightValue - leftValue
    const directTieBreak = (right.metrics.direct_asr ?? -1) - (left.metrics.direct_asr ?? -1)
    if (directTieBreak !== 0) return directTieBreak
    const bsrTieBreak = (left.metrics.bsr ?? 101) - (right.metrics.bsr ?? 101)
    if (bsrTieBreak !== 0) return bsrTieBreak
    return (
      left.frameworkName.localeCompare(right.frameworkName) ||
      left.modelName.localeCompare(right.modelName)
    )
  })
}

function rankRowClass(rank: number) {
  if (rank === 1) return "bg-amber-50/60 dark:bg-amber-500/5"
  if (rank === 2) return "bg-slate-50/60 dark:bg-slate-500/5"
  if (rank === 3) return "bg-orange-50/50 dark:bg-orange-500/5"
  return ""
}

export function LeaderboardPreview() {
  const [dataset, setDataset] = useState<BenchmarkDataset | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBenchmarkDataset()
      .then((data) => setDataset(data))
      .finally(() => setLoading(false))
  }, [])

  const comboRows = useMemo(() => {
    if (!dataset) return []

    const byCombo = new Map<string, HomepageComboRow>()
    for (const entry of dataset.entries) {
      const rowKey = `${entry.frameworkKey}:${entry.modelKey}`
      const existing =
        byCombo.get(rowKey) ??
        ({
          key: rowKey,
          frameworkKey: entry.frameworkKey,
          frameworkName: entry.frameworkName,
          modelKey: entry.modelKey,
          modelName: entry.modelName,
          metrics: { bsr: null, direct_asr: null, indirect_asr: null },
        } satisfies HomepageComboRow)

      existing.metrics[entry.metricType] = entry.overall
      byCombo.set(rowKey, existing)
    }

    return sortByIndirectAsr(Array.from(byCombo.values()))
  }, [dataset])

  return (
    <section className="border-t border-border/50">
      <div className="mx-auto max-w-7xl px-4 py-20 md:py-28">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Activity className="h-3 w-3" />
              Published Benchmark Results
            </div>
            <h2 className="mb-2 text-3xl font-bold md:text-4xl">
              Agents Ranked by Security <span className="text-rose-500 dark:text-rose-400">Vulnerability</span>
            </h2>
            <p className="max-w-3xl text-muted-foreground">
              Ranked by average Indirect ASR (higher = more vulnerable). Heatmap colours flag riskier scores red and
              safer ones green — so the leaderboard, at a glance, tells you which agents are most exposed.
            </p>
          </div>
          <Button
            variant="outline"
            asChild
            className="hidden border-border bg-transparent hover:bg-secondary md:flex"
          >
            <Link href="/leaderboard">
              View Full Leaderboard
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-sm shadow-black/5 backdrop-blur-sm">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-secondary/20 align-bottom">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Rank
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Agent
                </th>
                <th className="border-r border-border/80 px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Model
                </th>
                {HOMEPAGE_TABLE_METRICS.map((metricType) => {
                  const lowerIsBetter = metricType !== "bsr"
                  const Arrow = lowerIsBetter ? ArrowDown : ArrowUp
                  const arrowColor = lowerIsBetter
                    ? "text-emerald-500 dark:text-emerald-400"
                    : "text-emerald-500 dark:text-emerald-400"
                  return (
                    <th
                      key={metricType}
                      className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <span>{METRIC_LABELS[metricType]}</span>
                        <Arrow className={cn("h-3.5 w-3.5", arrowColor)} aria-hidden="true" />
                      </div>
                      <div className="mt-0.5 text-[10px] normal-case tracking-normal text-muted-foreground/70">
                        {METRIC_HINTS[metricType]}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <tr key={`loading-row-${index}`} className="border-b border-border/50 last:border-0">
                      {Array.from({ length: 6 }).map((__, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-4">
                          <div className="h-5 rounded bg-muted/40" />
                        </td>
                      ))}
                    </tr>
                  ))
                : comboRows.map((row, index) => {
                    const rank = index + 1
                    return (
                      <tr
                        key={row.key}
                        className={cn(
                          "border-b border-border/50 transition-colors last:border-0 hover:bg-secondary/10",
                          rankRowClass(rank)
                        )}
                      >
                        <td className="px-4 py-4">
                          <RankBadge rank={rank} />
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-2.5">
                            <BrandLogo
                              logoPath={FRAMEWORK_LOGO_PATHS[row.frameworkKey]}
                              alt={`${row.frameworkName} logo`}
                            />
                            <span className="truncate font-medium">{row.frameworkName}</span>
                          </div>
                        </td>
                        <td className="border-r border-border/80 px-3 py-4">
                          <div className="flex items-center gap-2.5">
                            <BrandLogo
                              logoPath={MODEL_LOGO_PATHS[row.modelKey]}
                              alt={`${row.modelName} logo`}
                            />
                            <span className="truncate font-medium">{row.modelName}</span>
                          </div>
                        </td>
                        {HOMEPAGE_TABLE_METRICS.map((metricType) => (
                          <td key={metricType} className="px-3 py-4 text-right">
                            <MetricCell
                              metricType={metricType}
                              value={row.metrics[metricType]}
                              emphasis={metricType === "indirect_asr"}
                            />
                          </td>
                        ))}
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>

        <Button variant="outline" asChild className="mt-6 w-full border-border bg-transparent md:hidden">
          <Link href="/leaderboard">
            View Full Leaderboard
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}

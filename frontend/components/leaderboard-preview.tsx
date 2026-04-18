"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Activity, ArrowUpRight, ChevronRight, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  METRIC_OPTIONS,
  formatPercent,
  isHigherBetterMetric,
  loadBenchmarkDataset,
  type BenchmarkDataset,
  type BenchmarkMetricType,
} from "@/lib/benchmark"

const HOMEPAGE_CARD_METRICS: BenchmarkMetricType[] = ["direct_asr", "indirect_asr", "bsr"]
const HOMEPAGE_TABLE_METRICS: BenchmarkMetricType[] = ["bsr", "direct_asr", "indirect_asr"]

type HomepageComboRow = {
  key: string
  frameworkKey: string
  frameworkName: string
  modelKey: string
  modelName: string
  metrics: Record<BenchmarkMetricType, number | null>
}

function scoreTone(metricType: BenchmarkMetricType, value: number | null) {
  if (value === null) {
    return "text-muted-foreground"
  }

  const normalized = metricType === "bsr" ? value : 100 - value
  if (normalized >= 75) {
    return "text-emerald-500"
  }
  if (normalized >= 50) {
    return "text-amber-500"
  }
  return "text-rose-500"
}

function getMetricRankLabel(metricType: BenchmarkMetricType) {
  return metricType === "bsr" ? "higher is better" : "lower is better"
}

function sortComboRows(rows: HomepageComboRow[], metricType: BenchmarkMetricType) {
  return [...rows].sort((left, right) => {
    const leftValue = left.metrics[metricType]
    const rightValue = right.metrics[metricType]

    if (leftValue === null && rightValue === null) {
      return (
        left.frameworkName.localeCompare(right.frameworkName) ||
        left.modelName.localeCompare(right.modelName)
      )
    }
    if (leftValue === null) {
      return 1
    }
    if (rightValue === null) {
      return -1
    }

    const primaryOrder = isHigherBetterMetric(metricType) ? rightValue - leftValue : leftValue - rightValue
    if (primaryOrder !== 0) {
      return primaryOrder
    }

    const bsrTieBreak = (right.metrics.bsr ?? -1) - (left.metrics.bsr ?? -1)
    if (bsrTieBreak !== 0) {
      return bsrTieBreak
    }

    return (
      left.frameworkName.localeCompare(right.frameworkName) ||
      left.modelName.localeCompare(right.modelName)
    )
  })
}

function rankDomainValues(
  dataset: BenchmarkDataset,
  metricType: BenchmarkMetricType
) {
  const values = dataset.domains
    .map((domain) => ({
      domainKey: domain.key,
      value: dataset.averages[metricType].domainAverages[domain.key] ?? null,
    }))
    .filter((item): item is { domainKey: string; value: number } => item.value !== null)
    .sort((left, right) => {
      if (metricType === "bsr") {
        return right.value - left.value
      }
      return left.value - right.value
    })

  return new Map(values.map((item, index) => [item.domainKey, index + 1]))
}

export function LeaderboardPreview() {
  const [dataset, setDataset] = useState<BenchmarkDataset | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortMetric, setSortMetric] = useState<BenchmarkMetricType>("bsr")

  useEffect(() => {
    loadBenchmarkDataset()
      .then((data) => setDataset(data))
      .finally(() => setLoading(false))
  }, [])

  const domainCards = useMemo(() => {
    if (!dataset) {
      return []
    }

    const rankMaps = {
      bsr: rankDomainValues(dataset, "bsr"),
      direct_asr: rankDomainValues(dataset, "direct_asr"),
      indirect_asr: rankDomainValues(dataset, "indirect_asr"),
    } satisfies Record<BenchmarkMetricType, Map<string, number>>

    return dataset.domains.map((domain) => ({
      domain,
      href: `/leaderboard#domain-${domain.key}`,
      metrics: HOMEPAGE_CARD_METRICS.map((metricType) => ({
        metricType,
        label: METRIC_OPTIONS.find((metric) => metric.key === metricType)?.label ?? metricType,
        value: dataset.averages[metricType].domainAverages[domain.key] ?? null,
        rank: rankMaps[metricType].get(domain.key) ?? null,
      })),
    }))
  }, [dataset])

  const comboRows = useMemo(() => {
    if (!dataset) {
      return []
    }

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
          metrics: {
            bsr: null,
            direct_asr: null,
            indirect_asr: null,
          },
        } satisfies HomepageComboRow)

      existing.metrics[entry.metricType] = entry.overall
      byCombo.set(rowKey, existing)
    }

    return sortComboRows(Array.from(byCombo.values()), sortMetric)
  }, [dataset, sortMetric])

  return (
    <section className="border-t border-border/50">
      <div className="mx-auto max-w-7xl px-4 py-20 md:py-28">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Activity className="h-3 w-3" />
              Published Benchmark Results
            </div>
            <h2 className="mb-2 text-3xl font-bold md:text-4xl">Benchmark Results</h2>
            <p className="max-w-3xl text-muted-foreground">
              Average results across all benchmark domains for each published framework and model configuration.
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
          <div className="border-b border-border/60 px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-lg font-semibold">Framework and model ranking</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Compare average benign success rate and attack success rate across every published configuration.
                </div>
              </div>
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Sort by
                </div>
                <div className="flex flex-wrap gap-2">
                  {HOMEPAGE_TABLE_METRICS.map((metricType) => (
                    <button
                      key={metricType}
                      onClick={() => setSortMetric(metricType)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm transition-all duration-300",
                        sortMetric === metricType
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {METRIC_OPTIONS.find((metric) => metric.key === metricType)?.label ?? metricType}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-border/60 bg-secondary/20">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Framework
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Model
                  </th>
                  {HOMEPAGE_TABLE_METRICS.map((metricType) => (
                    <th
                      key={metricType}
                      className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      {METRIC_OPTIONS.find((metric) => metric.key === metricType)?.label ?? metricType}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }).map((_, index) => (
                      <tr key={`loading-row-${index}`} className="border-b border-border/50 last:border-0">
                        {Array.from({ length: 7 }).map((__, cellIndex) => (
                          <td key={cellIndex} className="px-6 py-4">
                            <div className="h-5 rounded bg-muted/40" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : comboRows.map((row, index) => (
                      <tr key={row.key} className="border-b border-border/50 last:border-0 hover:bg-secondary/10">
                        <td className="px-6 py-4 font-mono text-sm font-medium">{index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-foreground">{row.frameworkName}</div>
                          <div className="text-xs text-muted-foreground">Agent framework</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-foreground">{row.modelName}</div>
                          <div className="text-xs text-muted-foreground">Foundation model</div>
                        </td>
                        {HOMEPAGE_TABLE_METRICS.map((metricType) => (
                          <td key={metricType} className="px-6 py-4 text-right">
                            <span className={cn("text-sm font-mono font-semibold", scoreTone(metricType, row.metrics[metricType]))}>
                              {formatPercent(row.metrics[metricType])}
                            </span>
                          </td>
                        ))}
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {index === 0 && sortMetric === "bsr"
                            ? "Top benign success rate."
                            : index === 0
                              ? `Lowest ${METRIC_OPTIONS.find((metric) => metric.key === sortMetric)?.label ?? sortMetric}.`
                              : getMetricRankLabel(sortMetric)}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight">Domain cards</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Per-domain averages for direct ASR, indirect ASR, and benign task success rate.
            </p>
          </div>
          <div className="hidden text-sm text-muted-foreground md:block">
            Click a card to open the matching leaderboard section.
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {(loading ? Array.from({ length: 4 }) : domainCards).map((card, index) => {
            if (loading || !card) {
              return (
                <div
                  key={`loading-${index}`}
                  className="rounded-3xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm"
                >
                  <div className="h-6 w-32 rounded bg-muted/60" />
                  <div className="mt-2 h-4 w-48 rounded bg-muted/40" />
                  <div className="mt-6 space-y-3">
                    {Array.from({ length: 3 }).map((_, rowIndex) => (
                      <div key={rowIndex} className="h-16 rounded-2xl bg-muted/30" />
                    ))}
                  </div>
                </div>
              )
            }

            return (
              <Link
                key={card.domain.key}
                href={card.href}
                className="group rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm shadow-black/5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {card.domain.shortLabel}
                    </div>
                    <h4 className="mt-3 text-2xl font-semibold tracking-tight">{card.domain.label}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">Open the full leaderboard matrix for this domain.</p>
                  </div>
                  <div className="rounded-full border border-border/70 p-2 text-muted-foreground transition-colors group-hover:border-primary/30 group-hover:text-primary">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {card.metrics.map((metric) => (
                    <div
                      key={metric.metricType}
                      className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 transition-colors group-hover:border-primary/20"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-medium text-foreground">{metric.label}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {getMetricRankLabel(metric.metricType)}
                            {metric.rank !== null ? ` · rank #${metric.rank}/${dataset?.domains.length ?? 0}` : ""}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn("text-lg font-mono font-semibold", scoreTone(metric.metricType, metric.value))}>
                            {formatPercent(metric.value)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Link>
            )
          })}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-border/50 pt-4">
          <span className="text-sm text-muted-foreground">
            Homepage shows aggregate results only; use the leaderboard for framework, model, and category-level detail.
          </span>
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary">
            <Link href="/leaderboard">
              <ChevronRight className="mr-1 h-4 w-4" />
              Open leaderboard
            </Link>
          </Button>
        </div>

        <Button variant="outline" asChild className="mt-4 w-full border-border bg-transparent md:hidden">
          <Link href="/leaderboard">
            View Full Leaderboard
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}

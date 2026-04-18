"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Activity, ArrowUpRight, ChevronRight, ExternalLink, ShieldAlert, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  METRIC_OPTIONS,
  formatPercent,
  getMetricDescription,
  isHigherBetterMetric,
  loadBenchmarkDataset,
  type BenchmarkDataset,
  type BenchmarkDomain,
  type BenchmarkMetricType,
} from "@/lib/benchmark"

const HOMEPAGE_TABLE_METRICS: BenchmarkMetricType[] = ["bsr", "direct_asr", "indirect_asr"]
const HOMEPAGE_CARD_METRICS: BenchmarkMetricType[] = ["direct_asr", "indirect_asr", "bsr"]

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

  return (
    <section className="border-t border-border/50">
      <div className="mx-auto max-w-7xl px-4 py-20 md:py-28">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Activity className="h-3 w-3" />
              Published Benchmark Results
            </div>
            <h2 className="mb-2 text-3xl font-bold md:text-4xl">Homepage Benchmark Snapshot</h2>
            <p className="max-w-3xl text-muted-foreground">
              A single average table for the three headline metrics, followed by domain cards that jump straight into
              the matching leaderboard section.
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
            <div className="text-lg font-semibold">Overall averages</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Task success rate is ranked high to low. Direct and indirect ASR are ranked low to high.
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-border/60 bg-secondary/20">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Metric
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Average
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Domains
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Configs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Interpretation
                  </th>
                </tr>
              </thead>
              <tbody>
                {HOMEPAGE_TABLE_METRICS.map((metricType) => {
                  const metric = METRIC_OPTIONS.find((item) => item.key === metricType)
                  const summary = dataset?.averages[metricType]
                  const higherIsBetter = isHigherBetterMetric(metricType)
                  return (
                    <tr key={metricType} className="border-b border-border/50 last:border-0 hover:bg-secondary/10">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full border border-border/70 p-2">
                            {higherIsBetter ? (
                              <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <ShieldAlert className="h-4 w-4 text-amber-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{metric?.label ?? metricType}</div>
                            <div className="text-sm text-muted-foreground">{getMetricDescription(metricType)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn("text-lg font-mono font-semibold", scoreTone(metricType, summary?.overall ?? null))}>
                          {loading ? "..." : formatPercent(summary?.overall ?? null)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-sm">
                        {loading ? "..." : dataset?.domains.length ?? 0}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-sm">
                        {loading ? "..." : summary?.entryCount ?? 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {higherIsBetter ? "Higher is better." : "Lower is more secure."}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight">Domain cards</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Each card shows per-domain averages for direct ASR, indirect ASR, and benign task success rate.
            </p>
          </div>
          <div className="hidden text-sm text-muted-foreground md:block">
            Click any card to jump to the matching leaderboard section.
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

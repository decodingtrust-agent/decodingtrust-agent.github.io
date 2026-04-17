"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Activity, ChevronRight, ExternalLink, ShieldAlert, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  METRIC_OPTIONS,
  formatPercent,
  getMetricDescription,
  isHigherBetterMetric,
  loadBenchmarkDataset,
  type BenchmarkDataset,
} from "@/lib/benchmark"

export function LeaderboardPreview() {
  const [dataset, setDataset] = useState<BenchmarkDataset | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBenchmarkDataset()
      .then((data) => setDataset(data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="border-t border-border/50">
      <div className="mx-auto max-w-7xl px-4 py-20 md:py-28">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-4">
              <Activity className="h-3 w-3" />
              Published Benchmark Results
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Average Benchmark Performance</h2>
            <p className="text-muted-foreground">
              Real averages computed from the published DT-Bench paper results.
            </p>
          </div>
          <Button
            variant="outline"
            asChild
            className="hidden md:flex border-border hover:bg-secondary bg-transparent"
          >
            <Link href="/leaderboard">
              View Full Leaderboard
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {METRIC_OPTIONS.map((metric) => {
            const summary = dataset?.averages[metric.key]
            const higherIsBetter = isHigherBetterMetric(metric.key)
            return (
              <div
                key={metric.key}
                className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                    <h3 className="text-2xl font-semibold mt-1">
                      {loading ? "..." : formatPercent(summary?.overall ?? null)}
                    </h3>
                  </div>
                  <div className="rounded-full border border-border/70 p-2">
                    {higherIsBetter ? (
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed min-h-10">
                  {getMetricDescription(metric.key)}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                    <div className="text-muted-foreground">Domains</div>
                    <div className="mt-1 font-mono font-semibold">
                      {loading ? "..." : dataset?.domains.length ?? 0}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                    <div className="text-muted-foreground">Configs</div>
                    <div className="mt-1 font-mono font-semibold">
                      {loading ? "..." : summary?.entryCount ?? 0}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="border-t border-border/50 mt-6 pt-4 flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            Homepage shows published averages; use the leaderboard for framework, model, and domain filtering.
          </span>
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary">
            <Link href="/leaderboard">
              <ChevronRight className="mr-1 h-4 w-4" />
              Open leaderboard
            </Link>
          </Button>
        </div>

        <Button variant="outline" asChild className="md:hidden w-full mt-4 border-border bg-transparent">
          <Link href="/leaderboard">
            View Full Leaderboard
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, Filter, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  METRIC_OPTIONS,
  filterBenchmarkEntries,
  formatPercent,
  getMetricDescription,
  isHigherBetterMetric,
  loadBenchmarkDataset,
  rankBenchmarkEntries,
  type BenchmarkDataset,
  type BenchmarkDomain,
  type BenchmarkMetricType,
} from "@/lib/benchmark"
import { cn } from "@/lib/utils"

function scoreTone(metricType: BenchmarkMetricType, value: number | null) {
  if (value === null) {
    return "text-muted-foreground"
  }

  if (metricType === "bsr") {
    if (value >= 90) return "text-emerald-500"
    if (value >= 75) return "text-foreground"
    return "text-amber-500"
  }

  if (value <= 15) return "text-emerald-500"
  if (value <= 35) return "text-foreground"
  return "text-amber-500"
}

export function LeaderboardSection() {
  const [dataset, setDataset] = useState<BenchmarkDataset | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [metricType, setMetricType] = useState<BenchmarkMetricType>("bsr")
  const [frameworkKey, setFrameworkKey] = useState("all")
  const [modelKey, setModelKey] = useState("all")
  const [selectedDomainKeys, setSelectedDomainKeys] = useState<string[]>([])
  const [showDomainFilter, setShowDomainFilter] = useState(false)

  useEffect(() => {
    loadBenchmarkDataset()
      .then((data) => setDataset(data))
      .finally(() => setLoading(false))
  }, [])

  const availableModels = useMemo(() => {
    if (!dataset) {
      return []
    }

    const validModelKeys = new Set(
      dataset.entries
        .filter((entry) => entry.metricType === metricType)
        .filter((entry) => frameworkKey === "all" || entry.frameworkKey === frameworkKey)
        .map((entry) => entry.modelKey)
    )

    return dataset.models.filter((model) => validModelKeys.has(model.key))
  }, [dataset, frameworkKey, metricType])

  useEffect(() => {
    if (modelKey === "all") {
      return
    }

    const stillAvailable = availableModels.some((model) => model.key === modelKey)
    if (!stillAvailable) {
      setModelKey("all")
    }
  }, [availableModels, modelKey])

  const filteredEntries = useMemo(() => {
    if (!dataset) {
      return []
    }

    return rankBenchmarkEntries(
      filterBenchmarkEntries(dataset, {
        metricType,
        frameworkKey,
        modelKey,
        domainKeys: selectedDomainKeys,
        searchQuery,
      }),
      selectedDomainKeys
    )
  }, [dataset, frameworkKey, metricType, modelKey, searchQuery, selectedDomainKeys])

  const visibleDomains = useMemo(() => {
    if (!dataset) {
      return []
    }

    if (selectedDomainKeys.length === 0) {
      return dataset.domains
    }

    const domainSet = new Set(selectedDomainKeys)
    return dataset.domains.filter((domain) => domainSet.has(domain.key))
  }, [dataset, selectedDomainKeys])

  const toggleDomain = (domainKey: string) => {
    setSelectedDomainKeys((previous) =>
      previous.includes(domainKey)
        ? previous.filter((key) => key !== domainKey)
        : [...previous, domainKey]
    )
  }

  const clearFilters = () => {
    setSearchQuery("")
    setFrameworkKey("all")
    setModelKey("all")
    setSelectedDomainKeys([])
  }

  const selectedMetric = METRIC_OPTIONS.find((metric) => metric.key === metricType)
  const higherIsBetter = isHigherBetterMetric(metricType)
  const hasFilters =
    searchQuery.length > 0 ||
    frameworkKey !== "all" ||
    modelKey !== "all" ||
    selectedDomainKeys.length > 0

  if (loading) {
    return (
      <section className="min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
          <div className="flex min-h-[40vh] items-center justify-center">
            <p className="text-muted-foreground">Loading benchmark results...</p>
          </div>
        </div>
      </section>
    )
  }

  if (!dataset) {
    return (
      <section className="min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-lg font-medium mb-2">Benchmark data unavailable</p>
            <p className="text-muted-foreground">
              Configure Supabase or keep the generated benchmark JSON in `public/data`.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span>Home</span>
          <span className="text-muted-foreground/50">{">"}</span>
          <span className="text-foreground">Leaderboard</span>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-mono font-bold mb-2">DT-Bench Published Results</h1>
            <p className="text-muted-foreground max-w-3xl">
              Real paper-backed benchmark results with filtering by metric, agent framework, model, and domain.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
            <div className="text-muted-foreground">Data source</div>
            <div className="font-medium mt-1">{dataset.run.name}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {METRIC_OPTIONS.map((metric) => (
              <button
                key={metric.key}
                onClick={() => setMetricType(metric.key)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition-colors",
                  metric.key === metricType
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {metric.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
            <div className="relative md:col-span-2 xl:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search framework or model"
                className="pl-9 h-9 bg-background border-border"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>

            <Select value={frameworkKey} onValueChange={setFrameworkKey}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Agent framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All frameworks</SelectItem>
                {dataset.frameworks.map((framework) => (
                  <SelectItem key={framework.key} value={framework.key}>
                    {framework.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={modelKey} onValueChange={setModelKey}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All models</SelectItem>
                {availableModels.map((model) => (
                  <SelectItem key={model.key} value={model.key}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-full justify-between gap-2 bg-transparent"
                onClick={() => setShowDomainFilter((open) => !open)}
              >
                <span className="inline-flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5" />
                  Domains
                </span>
                <span className="inline-flex items-center gap-2">
                  {selectedDomainKeys.length > 0 && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                      {selectedDomainKeys.length}
                    </span>
                  )}
                  <ChevronDown className="h-3.5 w-3.5" />
                </span>
              </Button>

              {showDomainFilter && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-popover p-3 shadow-lg z-50">
                  <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto">
                    {dataset.domains.map((domain) => (
                      <button
                        key={domain.key}
                        onClick={() => toggleDomain(domain.key)}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs transition-colors",
                          selectedDomainKeys.includes(domain.key)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {domain.shortLabel}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filteredEntries.length}</span> entries for{" "}
              <span className="font-medium text-foreground">{selectedMetric?.label}</span>.{" "}
              {getMetricDescription(metricType)}
            </p>
            {hasFilters && (
              <button className="text-sm text-muted-foreground hover:text-foreground" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>

          {selectedDomainKeys.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedDomainKeys.map((domainKey) => {
                const domain = dataset.domains.find((candidate) => candidate.key === domainKey)
                if (!domain) {
                  return null
                }

                return (
                  <span
                    key={domain.key}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs text-primary"
                  >
                    {domain.label}
                    <button onClick={() => toggleDomain(domain.key)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Agent framework</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Model</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Overall</th>
                  {visibleDomains.map((domain: BenchmarkDomain) => (
                    <th
                      key={domain.key}
                      className="px-4 py-3 text-right text-xs font-medium text-muted-foreground whitespace-nowrap"
                    >
                      {domain.shortLabel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, index) => (
                  <tr
                    key={entry.entryKey}
                    className="border-b border-border last:border-0 hover:bg-secondary/10 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-mono font-medium">{index + 1}</td>
                    <td className="px-4 py-3 text-sm">{entry.frameworkName}</td>
                    <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{entry.modelName}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("text-sm font-mono font-semibold", scoreTone(metricType, entry.overallForSelection))}>
                        {formatPercent(entry.overallForSelection)}
                      </span>
                    </td>
                    {visibleDomains.map((domain) => (
                      <td key={domain.key} className="px-4 py-3 text-right">
                        <span className={cn("text-sm font-mono", scoreTone(metricType, entry.domainScores[domain.key]))}>
                          {formatPercent(entry.domainScores[domain.key])}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEntries.length === 0 && (
            <div className="border-t border-border p-8 text-center text-muted-foreground">
              No published results match the current filters.
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span>{higherIsBetter ? "Higher is better." : "Lower is better."}</span>
          <span>This table recalculates the overall score from the visible domains.</span>
        </div>
      </div>
    </section>
  )
}

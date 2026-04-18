"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  ChevronDown,
  Filter,
  FolderOpen,
  Globe,
  Grid3X3,
  Headphones,
  HeartPulse,
  Landmark,
  Monitor,
  Phone,
  Plane,
  Scale,
  Search,
  Sparkles,
  Workflow,
  X,
  Code2,
  Database,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  type BenchmarkCategoryEntry,
  type BenchmarkCategoryTable,
  type BenchmarkDataset,
  type BenchmarkDomain,
  type BenchmarkEntry,
  type BenchmarkMetricType,
} from "@/lib/benchmark"
import { cn } from "@/lib/utils"

type RankedEntry = BenchmarkEntry & { overallForSelection: number | null }
type RankedCategoryEntry = BenchmarkCategoryEntry & { overallForSelection: number | null }
type DomainViewMode = "table" | "scatter" | "bar"
type DomainMetricState = { table: BenchmarkCategoryTable | undefined; rows: RankedCategoryEntry[] }

const DOMAIN_METRIC_ORDER: BenchmarkMetricType[] = ["bsr", "direct_asr", "indirect_asr"]

const FRAMEWORK_COLORS: Record<string, string> = {
  "openai-agents": "#10b981",
  "claude-code": "#f97316",
  "google-adk": "#3b82f6",
  openclaw: "#a855f7",
}

const FRAMEWORK_LOGO_PATHS: Record<string, string> = {
  "openai-agents": "/logo/openai-monoblossom.svg",
  "claude-code": "/logo/claude.svg",
  "google-adk": "/logo/gemini.svg",
  openclaw: "/logo/openclaw.svg",
}

const MODEL_LOGO_PATHS: Record<string, string> = {
  "gpt-5-4": FRAMEWORK_LOGO_PATHS["openai-agents"],
  "gpt-5-2": FRAMEWORK_LOGO_PATHS["openai-agents"],
  "gpt-5-1": FRAMEWORK_LOGO_PATHS["openai-agents"],
  "gpt-oss-120b": FRAMEWORK_LOGO_PATHS["openai-agents"],
  "opus-4-6": FRAMEWORK_LOGO_PATHS["claude-code"],
  "sonnet-4-5": FRAMEWORK_LOGO_PATHS["claude-code"],
  "gemini-3-pro": FRAMEWORK_LOGO_PATHS["google-adk"],
  "gemini-3-1-pro": FRAMEWORK_LOGO_PATHS["google-adk"],
}

const DOMAIN_VISUALS: Record<string, { icon: typeof Workflow; glow: string }> = {
  workflow: { icon: Workflow, glow: "from-cyan-500/20 via-transparent to-transparent" },
  crm: { icon: Database, glow: "from-emerald-500/20 via-transparent to-transparent" },
  "customer-service": { icon: Headphones, glow: "from-blue-500/20 via-transparent to-transparent" },
  travel: { icon: Plane, glow: "from-orange-500/20 via-transparent to-transparent" },
  coding: { icon: Code2, glow: "from-violet-500/20 via-transparent to-transparent" },
  browser: { icon: Globe, glow: "from-sky-500/20 via-transparent to-transparent" },
  research: { icon: BookOpen, glow: "from-fuchsia-500/20 via-transparent to-transparent" },
  "os-filesystem": { icon: FolderOpen, glow: "from-amber-500/20 via-transparent to-transparent" },
  "os-gui": { icon: Monitor, glow: "from-lime-500/20 via-transparent to-transparent" },
  finance: { icon: Landmark, glow: "from-emerald-400/20 via-transparent to-transparent" },
  legal: { icon: Scale, glow: "from-red-500/20 via-transparent to-transparent" },
  telecom: { icon: Phone, glow: "from-indigo-500/20 via-transparent to-transparent" },
  medical: { icon: HeartPulse, glow: "from-pink-500/20 via-transparent to-transparent" },
}

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

function BrandBadge({
  logoPath,
  alt,
  variant = "framework",
}: {
  logoPath: string | undefined
  alt: string
  variant?: "framework" | "model"
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden bg-white",
        variant === "framework"
          ? "h-8 w-8 rounded-xl border border-border/70 p-1.5 shadow-sm shadow-black/5"
          : "h-7 w-7 rounded-lg border border-border/40 bg-muted/25 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
      )}
    >
      {logoPath ? (
        <img
          src={logoPath}
          alt={alt}
          className={cn(
            "object-contain",
            variant === "framework" ? "h-full w-full" : "h-[78%] w-[78%] opacity-85"
          )}
        />
      ) : (
        <BrainCircuit className={cn("text-muted-foreground", variant === "framework" ? "h-4.5 w-4.5" : "h-4 w-4")} />
      )}
    </span>
  )
}

function FrameworkLabel({ frameworkKey, frameworkName }: { frameworkKey: string; frameworkName: string }) {
  return (
    <div className="flex items-center gap-3">
      <BrandBadge logoPath={FRAMEWORK_LOGO_PATHS[frameworkKey]} alt={`${frameworkName} logo`} variant="framework" />
      <div className="min-w-0">
        <div className="font-medium truncate">{frameworkName}</div>
        <div className="text-xs text-muted-foreground">Agent framework</div>
      </div>
    </div>
  )
}

function ModelLabel({ modelKey, modelName }: { modelKey: string; modelName: string }) {
  return (
    <div className="flex items-center gap-3">
      <BrandBadge logoPath={MODEL_LOGO_PATHS[modelKey]} alt={`${modelName} logo`} variant="model" />
      <div className="min-w-0">
        <div className="font-medium truncate">{modelName}</div>
        <div className="text-xs text-muted-foreground">Foundation model</div>
      </div>
    </div>
  )
}

function SeriesLegend({
  rows,
}: {
  rows: Array<{
    frameworkKey: string
    frameworkName: string
    modelKey: string
    modelName: string
    fill: string
  }>
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {rows.map((row) => (
        <div
          key={`${row.frameworkKey}:${row.modelKey}`}
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/85 px-3 py-1.5 shadow-sm shadow-black/5"
        >
          <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.fill }} />
          <BrandBadge logoPath={FRAMEWORK_LOGO_PATHS[row.frameworkKey]} alt={`${row.frameworkName} logo`} variant="model" />
          <span className="text-xs font-medium text-foreground">{row.modelName}</span>
        </div>
      ))}
    </div>
  )
}

type BarTooltipPayloadItem = {
  dataKey?: string | number
  value?: number | string | null
  payload?: { fullLabel?: string; category?: string }
}

type ScatterTooltipPayloadItem = {
  payload?: {
    frameworkKey: string
    frameworkName: string
    modelKey: string
    modelName: string
    categoryLabel: string
    x: number
    y: number
  }
}

function ChartTooltipRow({
  frameworkKey,
  frameworkName,
  modelKey,
  modelName,
  value,
}: {
  frameworkKey: string
  frameworkName: string
  modelKey: string
  modelName: string
  value: number | null
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 min-w-0">
        <BrandBadge logoPath={FRAMEWORK_LOGO_PATHS[frameworkKey]} alt={`${frameworkName} logo`} variant="model" />
        <BrandBadge logoPath={MODEL_LOGO_PATHS[modelKey]} alt={`${modelName} logo`} variant="model" />
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-foreground">{modelName}</div>
          <div className="truncate text-[11px] text-muted-foreground">{frameworkName}</div>
        </div>
      </div>
      <span className="text-xs font-mono font-semibold text-foreground">{formatPercent(value)}</span>
    </div>
  )
}

function matchesSearchQuery(query: string, ...parts: string[]) {
  if (!query) {
    return true
  }
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return true
  }
  return parts.some((part) => part.toLowerCase().includes(normalizedQuery))
}

function rankCategoryEntries(entries: BenchmarkCategoryEntry[], metricType: BenchmarkMetricType) {
  const higherIsBetter = isHigherBetterMetric(metricType)
  return [...entries]
    .map((entry) => ({
      ...entry,
      overallForSelection: entry.overall,
    }))
    .sort((left, right) => {
      if (left.overallForSelection === null && right.overallForSelection === null) {
        return left.frameworkName.localeCompare(right.frameworkName) || left.modelName.localeCompare(right.modelName)
      }
      if (left.overallForSelection === null) return 1
      if (right.overallForSelection === null) return -1
      return higherIsBetter
        ? right.overallForSelection - left.overallForSelection ||
            left.frameworkName.localeCompare(right.frameworkName) ||
            left.modelName.localeCompare(right.modelName)
        : left.overallForSelection - right.overallForSelection ||
            left.frameworkName.localeCompare(right.frameworkName) ||
            left.modelName.localeCompare(right.modelName)
    })
}

function compactCategoryLabel(label: string) {
  return label
    .replace("Windows · ", "Win · ")
    .replace("macOS · ", "macOS · ")
    .replace("Customer Service", "CS")
}

function getMetricPanelTitle(metricType: BenchmarkMetricType) {
  switch (metricType) {
    case "bsr":
      return "Benign task success rate"
    case "direct_asr":
      return "Direct ASR"
    case "indirect_asr":
      return "Indirect ASR"
  }
}

function getMetricPanelDescription(metricType: BenchmarkMetricType) {
  switch (metricType) {
    case "bsr":
      return "Higher is better."
    case "direct_asr":
      return "Lower is more secure."
    case "indirect_asr":
      return "Lower is more secure."
  }
}

function CategoryMatrixTable({
  table,
  rows,
  metricType,
}: {
  table: BenchmarkCategoryTable | undefined
  rows: RankedCategoryEntry[]
  metricType: BenchmarkMetricType
}) {
  if (!table || rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
        No category-level rows match the current filters in this domain.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px]">
        <thead>
          <tr className="border-b border-border bg-secondary/20">
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Rank</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Agent</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Model</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Overall</th>
            {table.categories.map((category) => (
              <th
                key={category.key}
                className="min-w-[120px] px-4 py-3 text-right text-xs font-medium text-muted-foreground whitespace-nowrap"
              >
                <div>{category.label}</div>
                {category.taskCount !== null ? (
                  <div className="mt-1 text-[10px] text-muted-foreground/70">{category.taskCount} tasks</div>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={`${row.frameworkKey}:${row.modelKey}`}
              className="border-b border-border/60 last:border-0 transition-colors hover:bg-secondary/10"
            >
              <td className="px-4 py-3 text-sm font-mono font-medium">{index + 1}</td>
              <td className="px-4 py-3 min-w-[220px]">
                <FrameworkLabel frameworkKey={row.frameworkKey} frameworkName={row.frameworkName} />
              </td>
              <td className="px-4 py-3 min-w-[220px]">
                <ModelLabel modelKey={row.modelKey} modelName={row.modelName} />
              </td>
              <td className="px-4 py-3 text-right">
                <span className={cn("text-sm font-mono font-semibold", scoreTone(metricType, row.overallForSelection))}>
                  {formatPercent(row.overallForSelection)}
                </span>
              </td>
              {table.categories.map((category) => (
                <td key={category.key} className="px-4 py-3 text-right">
                  <span className={cn("text-sm font-mono", scoreTone(metricType, row.categoryScores[category.key] ?? null))}>
                    {formatPercent(row.categoryScores[category.key] ?? null)}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CategoryGroupedBarView({
  table,
  rows,
}: {
  table: BenchmarkCategoryTable | undefined
  rows: RankedCategoryEntry[]
}) {
  if (!table || rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
        No category-level rows match the current filters in this domain.
      </div>
    )
  }

  const plottedRows = rows.slice(0, 5).map((row, index) => ({
    ...row,
    chartKey: `series_${index}`,
    fill: FRAMEWORK_COLORS[row.frameworkKey] ?? ["#10b981", "#3b82f6", "#f97316", "#a855f7", "#ec4899"][index % 5],
  }))
  const seriesByKey = new Map(plottedRows.map((row) => [row.chartKey, row] as const))

  const chartRows = table.categories.map((category) => {
    const row: Record<string, number | string | null> = {
      category: compactCategoryLabel(category.label),
      fullLabel: category.label,
    }
    for (const plottedRow of plottedRows) {
      row[plottedRow.chartKey] = plottedRow.categoryScores[category.key] ?? null
    }
    return row
  })
  const chartHeight = Math.max(340, table.categories.length * 56)

  return (
    <div className="space-y-4">
      <SeriesLegend rows={plottedRows} />
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_40%)] p-3">
        <div className="absolute inset-0 bg-grid-white/[0.03]" />
        <div className="relative" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartRows} layout="vertical" margin={{ top: 8, right: 20, left: 20, bottom: 8 }} barCategoryGap="22%">
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.22} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(value: number) => `${value}%`}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="category"
                width={170}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                content={(props) => {
                  const active = props.active
                  const payload = props.payload as BarTooltipPayloadItem[] | undefined
                  if (!active || !payload?.length) {
                    return null
                  }
                  const label = String(payload[0]?.payload?.fullLabel ?? payload[0]?.payload?.category ?? "")
                  const entries = payload
                    .map((item: BarTooltipPayloadItem) => {
                      const row = seriesByKey.get(String(item.dataKey))
                      if (!row) {
                        return null
                      }
                      return {
                        row,
                        value: typeof item.value === "number" ? item.value : Number(item.value),
                      }
                    })
                    .filter((item): item is { row: (typeof plottedRows)[number]; value: number } => item !== null)

                  return (
                    <div className="w-[280px] rounded-2xl border border-border/70 bg-background/95 p-3 shadow-2xl shadow-black/20 backdrop-blur">
                      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
                      <div className="space-y-2">
                        {entries.map(({ row, value }: { row: (typeof plottedRows)[number]; value: number }) => (
                          <ChartTooltipRow
                            key={row.chartKey}
                            frameworkKey={row.frameworkKey}
                            frameworkName={row.frameworkName}
                            modelKey={row.modelKey}
                            modelName={row.modelName}
                            value={value}
                          />
                        ))}
                      </div>
                    </div>
                  )
                }}
              />
              {plottedRows.map((row, index) => (
                <Bar
                  key={row.chartKey}
                  dataKey={row.chartKey}
                  name={`${row.frameworkName} · ${row.modelName}`}
                  fill={row.fill}
                  radius={[0, 10, 10, 0]}
                  animationDuration={900}
                  animationBegin={index * 120}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function CategoryScatterView({
  table,
  rows,
}: {
  table: BenchmarkCategoryTable | undefined
  rows: RankedCategoryEntry[]
}) {
  if (!table || rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
        No category-level rows match the current filters in this domain.
      </div>
    )
  }

  const plottedRows = rows.slice(0, 6).map((row, index) => ({
    ...row,
    fill: FRAMEWORK_COLORS[row.frameworkKey] ?? ["#10b981", "#3b82f6", "#f97316", "#a855f7", "#ec4899", "#14b8a6"][index % 6],
  }))

  const series = Array.from(
    plottedRows.reduce(
      (groups, row) => {
        const items = groups.get(`${row.frameworkKey}:${row.modelKey}`) ?? []
        for (const category of table.categories) {
          const score = row.categoryScores[category.key]
          if (score === null || row.overallForSelection === null) {
            continue
          }
          items.push({
            x: row.overallForSelection,
            y: score,
            z: Math.max(56, (category.taskCount ?? 8) * 4),
            frameworkKey: row.frameworkKey,
            frameworkName: row.frameworkName,
            modelKey: row.modelKey,
            modelName: row.modelName,
            categoryLabel: category.label,
            fill: row.fill,
          })
        }
        groups.set(`${row.frameworkKey}:${row.modelKey}`, items)
        return groups
      },
      new Map<
        string,
        Array<{
          x: number
          y: number
          z: number
          frameworkKey: string
          frameworkName: string
          modelKey: string
          modelName: string
          categoryLabel: string
          fill: string
        }>
      >()
    )
  )

  return (
    <div className="space-y-4">
      <SeriesLegend rows={plottedRows} />
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_40%)] p-3">
        <div className="absolute inset-0 bg-grid-white/[0.03]" />
        <div className="relative h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 18, right: 20, left: 12, bottom: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.22} />
              <XAxis
                type="number"
                dataKey="x"
                name="Overall"
                domain={[0, 100]}
                tickFormatter={(value: number) => `${value}%`}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Category"
                domain={[0, 100]}
                tickFormatter={(value: number) => `${value}%`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.35)" }}
                content={(props) => {
                  const active = props.active
                  const payload = props.payload as ScatterTooltipPayloadItem[] | undefined
                  const item = payload?.[0]?.payload
                  if (!active || !item) {
                    return null
                  }

                  return (
                    <div className="w-[280px] rounded-2xl border border-border/70 bg-background/95 p-3 shadow-2xl shadow-black/20 backdrop-blur">
                      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {item.categoryLabel}
                      </div>
                      <div className="space-y-2">
                        <ChartTooltipRow
                          frameworkKey={item.frameworkKey}
                          frameworkName={item.frameworkName}
                          modelKey={item.modelKey}
                          modelName={item.modelName}
                          value={item.y}
                        />
                        <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                          <span>Overall</span>
                          <span className="font-mono">{formatPercent(item.x)}</span>
                        </div>
                      </div>
                    </div>
                  )
                }}
              />
              {series.map(([seriesKey, items], index) => (
                <Scatter
                  key={seriesKey}
                  name={items[0]?.modelName ?? seriesKey}
                  data={items}
                  fill={items[0]?.fill}
                  line={false}
                  animationDuration={900}
                  animationBegin={index * 110}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function DomainMetricPanel({
  metricType,
  viewMode,
  categoryTable,
  rows,
}: {
  metricType: BenchmarkMetricType
  viewMode: DomainViewMode
  categoryTable: BenchmarkCategoryTable | undefined
  rows: RankedCategoryEntry[]
}) {
  const topRow = rows[0]
  const totalTasks = categoryTable?.categories.reduce((sum, category) => sum + (category.taskCount ?? 0), 0) ?? 0

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant={metricType === "bsr" ? "secondary" : "outline"} className="rounded-full">
              {getMetricPanelTitle(metricType)}
            </Badge>
            <Badge variant="outline" className="rounded-full">
              {rows.length} configs
            </Badge>
            {categoryTable ? (
              <Badge variant="outline" className="rounded-full">
                {categoryTable.categories.length} categories
              </Badge>
            ) : null}
            {totalTasks > 0 ? (
              <Badge variant="outline" className="rounded-full">
                {totalTasks} tasks
              </Badge>
            ) : null}
          </div>
          <div className="text-sm text-muted-foreground">{getMetricPanelDescription(metricType)}</div>
        </div>

        {topRow ? (
          <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Top configuration</div>
            <div className="space-y-3">
              <FrameworkLabel frameworkKey={topRow.frameworkKey} frameworkName={topRow.frameworkName} />
              <div className="flex items-center justify-between gap-4">
                <ModelLabel modelKey={topRow.modelKey} modelName={topRow.modelName} />
                <span className={cn("text-lg font-mono font-semibold", scoreTone(metricType, topRow.overallForSelection))}>
                  {formatPercent(topRow.overallForSelection)}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <Card className="overflow-hidden border-border/70 bg-background/60 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5">
        <CardHeader className="gap-2">
          <CardTitle className="text-base">
            {viewMode === "table"
              ? "Risk-category matrix"
              : viewMode === "bar"
                ? "Grouped bar comparison"
                : "Overall vs category scatter"}
          </CardTitle>
          <CardDescription>
            {viewMode === "scatter"
              ? "Each point is a model-category pair: overall score versus individual category score."
              : viewMode === "bar"
                ? "Top configurations across each paper-defined category."
                : "Best visible configurations across the paper-defined categories."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {viewMode === "table" ? (
            <CategoryMatrixTable table={categoryTable} rows={rows} metricType={metricType} />
          ) : viewMode === "bar" ? (
            <CategoryGroupedBarView table={categoryTable} rows={rows} />
          ) : (
            <CategoryScatterView table={categoryTable} rows={rows} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DomainSection({
  domain,
  viewMode,
  metricStates,
}: {
  domain: BenchmarkDomain
  viewMode: DomainViewMode
  metricStates: Partial<Record<BenchmarkMetricType, DomainMetricState>>
}) {
  const domainVisual = DOMAIN_VISUALS[domain.key]
  const DomainIcon = domainVisual?.icon ?? BrainCircuit
  const glowClass = domainVisual?.glow ?? "from-primary/20 via-transparent to-transparent"

  return (
    <section className="scroll-mt-24">
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/70 backdrop-blur-xl shadow-lg shadow-black/5 transition-transform duration-300 hover:-translate-y-0.5">
        <div className={cn("absolute inset-x-0 top-0 h-28 bg-gradient-to-r", glowClass)} />
        <div className="relative p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-3 shadow-sm">
              <DomainIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="outline" className="rounded-full bg-background/70">
                  {domain.shortLabel}
                </Badge>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">{domain.label}</h2>
            </div>
          </div>

          <div className="mt-6 space-y-8">
            {DOMAIN_METRIC_ORDER.map((metric) => {
              const state = metricStates[metric]
              return (
                <DomainMetricPanel
                  key={metric}
                  metricType={metric}
                  viewMode={viewMode}
                  categoryTable={state?.table}
                  rows={state?.rows ?? []}
                />
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export function LeaderboardSection() {
  const [dataset, setDataset] = useState<BenchmarkDataset | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [metricType, setMetricType] = useState<BenchmarkMetricType>("bsr")
  const [viewMode, setViewMode] = useState<DomainViewMode>("table")
  const [frameworkKey, setFrameworkKey] = useState("all")
  const [modelKey, setModelKey] = useState("all")
  const [selectedDomainKeys, setSelectedDomainKeys] = useState<string[]>([])
  const [showDomainFilter, setShowDomainFilter] = useState(false)

  useEffect(() => {
    loadBenchmarkDataset()
      .then((benchmarkData) => {
        setDataset(benchmarkData)
      })
      .finally(() => setLoading(false))
  }, [])

  const availableModels = useMemo(() => {
    if (!dataset) {
      return []
    }

    const validModelKeys = new Set<string>()
    for (const entry of dataset.entries) {
      if (entry.metricType !== metricType) {
        continue
      }
      if (frameworkKey !== "all" && entry.frameworkKey !== frameworkKey) {
        continue
      }
      validModelKeys.add(entry.modelKey)
    }
    for (const table of dataset.categoryTables) {
      if (table.metricType !== metricType) {
        continue
      }
      for (const entry of table.entries) {
        if (frameworkKey !== "all" && entry.frameworkKey !== frameworkKey) {
          continue
        }
        validModelKeys.add(entry.modelKey)
      }
    }

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

  const overviewEntries = useMemo(() => {
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
    ) as RankedEntry[]
  }, [dataset, frameworkKey, metricType, modelKey, searchQuery, selectedDomainKeys])

  const categoryRowsByDomain = useMemo(() => {
    if (!dataset) {
      return new Map<string, Partial<Record<BenchmarkMetricType, DomainMetricState>>>()
    }

    const byDomain = new Map<string, Partial<Record<BenchmarkMetricType, DomainMetricState>>>()
    for (const table of dataset.categoryTables) {
      const rows = rankCategoryEntries(
        table.entries.filter((entry) => {
          if (frameworkKey !== "all" && entry.frameworkKey !== frameworkKey) {
            return false
          }
          if (modelKey !== "all" && entry.modelKey !== modelKey) {
            return false
          }
          return matchesSearchQuery(searchQuery, entry.frameworkName, entry.modelName, `${entry.frameworkName} ${entry.modelName}`)
        }),
        table.metricType
      )

      const domainState = byDomain.get(table.domainKey) ?? {}
      domainState[table.metricType] = { table, rows }
      byDomain.set(table.domainKey, domainState)
    }

    return byDomain
  }, [dataset, frameworkKey, modelKey, searchQuery])

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

  const selectedMetric = METRIC_OPTIONS.find((metric) => metric.key === metricType)
  const hasFilters =
    searchQuery.length > 0 ||
    frameworkKey !== "all" ||
    modelKey !== "all" ||
    selectedDomainKeys.length > 0

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

        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-6 md:p-8 shadow-xl shadow-black/5 backdrop-blur-xl mb-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_35%)]" />
          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
                  <Sparkles className="h-3.5 w-3.5" />
                  Paper-backed leaderboard
                </div>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
                  DT-Bench Leaderboard
                </h1>
                <p className="max-w-3xl text-muted-foreground">
                  A richer leaderboard experience inspired by arena-style ranking pages, with icons, animated domain sections, and flexible table, scatter, and bar views.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {METRIC_OPTIONS.map((metric) => (
                  <div
                    key={metric.key}
                    className={cn(
                      "rounded-2xl border px-4 py-3 transition-all duration-300",
                      metric.key === metricType
                        ? "border-primary/40 bg-primary/10 shadow-lg shadow-primary/10"
                        : "border-border/60 bg-background/50"
                    )}
                  >
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">{metric.label}</div>
                    <div className={cn("mt-1 text-xl font-semibold", scoreTone(metric.key, dataset.averages[metric.key].overall))}>
                      {formatPercent(dataset.averages[metric.key].overall)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {dataset.averages[metric.key].entryCount} configs
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/50 p-5">
              <div className="flex flex-wrap gap-2 mb-4">
                {METRIC_OPTIONS.map((metric) => (
                  <button
                    key={metric.key}
                    onClick={() => setMetricType(metric.key)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition-all duration-300",
                      metric.key === metricType
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {metric.label}
                  </button>
                ))}
                <div className="mx-2 hidden h-8 w-px bg-border md:block" />
                {(["table", "scatter", "bar"] as DomainViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all duration-300",
                      viewMode === mode
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {mode === "table" ? (
                      <Grid3X3 className="h-3.5 w-3.5" />
                    ) : mode === "scatter" ? (
                      <BrainCircuit className="h-3.5 w-3.5" />
                    ) : (
                      <BarChart3 className="h-3.5 w-3.5" />
                    )}
                    {mode}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
                <div className="relative md:col-span-2 xl:col-span-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search framework or model"
                    className="pl-9 h-10 bg-background border-border"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </div>

                <Select value={frameworkKey} onValueChange={setFrameworkKey}>
                  <SelectTrigger className="h-10">
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
                  <SelectTrigger className="h-10">
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
                    className="h-10 w-full justify-between gap-2 bg-transparent"
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

              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{overviewEntries.length}</span> entries for{" "}
                  <span className="font-medium text-foreground">{selectedMetric?.label}</span>.{" "}
                  {getMetricDescription(metricType)}
                </p>
                {hasFilters && (
                  <button className="text-sm text-muted-foreground hover:text-foreground" onClick={clearFilters}>
                    Clear filters
                  </button>
                )}
              </div>

              {selectedDomainKeys.length > 0 ? (
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
              ) : null}
            </div>
          </div>
        </div>

        <Card className="border-border/70 bg-card/80 backdrop-blur-sm shadow-lg shadow-black/5 mb-10">
          <CardHeader className="gap-2">
            <CardTitle className="text-xl">Global leaderboard table</CardTitle>
            <CardDescription>
              The primary leaderboard table stays visible, while the sections below provide richer domain-by-domain exploration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="border-b border-border bg-secondary/20">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Agent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Model</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Overall</th>
                    {visibleDomains.map((domain) => (
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
                  {overviewEntries.map((entry, index) => (
                    <tr
                      key={entry.entryKey}
                      className="border-b border-border/60 last:border-0 transition-colors hover:bg-secondary/10"
                    >
                      <td className="px-4 py-3 text-sm font-mono font-medium">{index + 1}</td>
                      <td className="px-4 py-3 min-w-[220px]">
                        <FrameworkLabel frameworkKey={entry.frameworkKey} frameworkName={entry.frameworkName} />
                      </td>
                      <td className="px-4 py-3 min-w-[220px]">
                        <ModelLabel modelKey={entry.modelKey} modelName={entry.modelName} />
                      </td>
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

            {overviewEntries.length === 0 ? (
              <div className="border-t border-border p-8 text-center text-muted-foreground">
                No published results match the current filters.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Domain sections</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Each domain includes benign task success rate plus direct and indirect attack success rate views.
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            BSR higher is better. ASR lower is more secure.
          </div>
        </div>

        <div className="space-y-8">
          {visibleDomains.map((domain, index) => {
            const categoryState = categoryRowsByDomain.get(domain.key)
            return (
              <div
                key={domain.key}
                className="transition-transform duration-300"
                style={{ transitionDelay: `${index * 40}ms` }}
              >
                <DomainSection
                  domain={domain}
                  viewMode={viewMode}
                  metricStates={categoryState ?? {}}
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

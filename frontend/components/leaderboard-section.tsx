"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Check,
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
  Workflow,
  X,
  Code2,
  Database,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
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
  filterBenchmarkEntries,
  formatPercent,
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
type DomainSeries = RankedCategoryEntry & {
  chartKey: string
  fill: string
  stroke: string
  rank: number
}

const DOMAIN_METRIC_ORDER: BenchmarkMetricType[] = ["indirect_asr", "direct_asr", "bsr"]
const DOMAIN_VIEW_ORDER: DomainViewMode[] = ["table", "bar", "scatter"]

const SERIES_STYLES = [
  { fill: "#38bdf8", stroke: "#0ea5e9" },
  { fill: "#34d399", stroke: "#10b981" },
  { fill: "#f59e0b", stroke: "#f97316" },
  { fill: "#a78bfa", stroke: "#8b5cf6" },
  { fill: "#fb7185", stroke: "#f43f5e" },
  { fill: "#22c55e", stroke: "#16a34a" },
] as const

const FRAMEWORK_LOGO_PATHS: Record<string, string> = {
  "openai-agents": "/logo/framework-openai-agents.svg",
  "claude-code": "/logo/framework-claude-code.svg",
  "google-adk": "/logo/framework-google-adk.png",
  openclaw: "/logo/openclaw.svg",
}

const MODEL_LOGO_PATHS: Record<string, string> = {
  "gpt-5-5": "/logo/framework-openai-agents.svg",
  "gpt-5-4": "/logo/framework-openai-agents.svg",
  "gpt-5-2": "/logo/framework-openai-agents.svg",
  "gpt-5-1": "/logo/framework-openai-agents.svg",
  "gpt-oss-120b": "/logo/framework-openai-agents.svg",
  "opus-4-6": "/logo/claude.svg",
  "sonnet-4-5": "/logo/claude.svg",
  "gemini-3-pro": "/logo/gemini.svg",
  "gemini-3-1-pro": "/logo/gemini.svg",
  "deepseek-v4-pro": "/logo/deepseek.png",
}

const DOMAIN_VISUALS: Record<string, { icon: typeof Workflow; glow: string; screenshot?: string }> = {
  workflow: { icon: Workflow, glow: "from-cyan-500/20 via-transparent to-transparent", screenshot: "/env-showcase/gmail-1.png" },
  crm: { icon: Database, glow: "from-emerald-500/20 via-transparent to-transparent", screenshot: "/env-showcase/leads_page.png" },
  "customer-service": { icon: Headphones, glow: "from-blue-500/20 via-transparent to-transparent", screenshot: "/env-showcase/ui_case_list.png" },
  travel: { icon: Plane, glow: "from-orange-500/20 via-transparent to-transparent", screenshot: "/env-showcase/calendar-2.png" },
  coding: { icon: Code2, glow: "from-violet-500/20 via-transparent to-transparent", screenshot: "/env-showcase/github-1.png" },
  browser: { icon: Globe, glow: "from-sky-500/20 via-transparent to-transparent", screenshot: "/env-showcase/arxiv_DT.png" },
  research: { icon: BookOpen, glow: "from-fuchsia-500/20 via-transparent to-transparent", screenshot: "/env-showcase/googledrive-1.png" },
  "os-filesystem": { icon: FolderOpen, glow: "from-amber-500/20 via-transparent to-transparent", screenshot: "/env-showcase/macos_screenshot.png" },
  windows: { icon: Monitor, glow: "from-lime-500/20 via-transparent to-transparent", screenshot: "/env-showcase/windows-screenshot.png" },
  macos: { icon: Monitor, glow: "from-lime-500/20 via-transparent to-transparent", screenshot: "/env-showcase/macos_screenshot.png" },
  finance: { icon: Landmark, glow: "from-emerald-400/20 via-transparent to-transparent", screenshot: "/env-showcase/paypal-1.png" },
  legal: { icon: Scale, glow: "from-red-500/20 via-transparent to-transparent", screenshot: "/env-showcase/atlassian-4.png" },
  telecom: { icon: Phone, glow: "from-indigo-500/20 via-transparent to-transparent", screenshot: "/env-showcase/slack-1.png" },
  medical: { icon: HeartPulse, glow: "from-pink-500/20 via-transparent to-transparent", screenshot: "/env-showcase/googleform-1.png" },
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
    return <span className="font-mono text-sm text-muted-foreground">--</span>
  }
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md px-1.5 py-0.5 font-mono text-xs",
        emphasis ? "font-semibold" : "font-medium",
        heatmapTextClass(metricType, value)
      )}
      style={heatmapCellStyle(metricType, value)}
    >
      {formatPercent(value)}
    </span>
  )
}

function BrandLogo({
  logoPath,
  alt,
  size = "md",
}: {
  logoPath: string | undefined
  alt: string
  size?: "sm" | "md"
}) {
  const sizeClass = size === "sm" ? "h-5 w-5" : "h-7 w-7"
  return logoPath ? (
    <img src={logoPath} alt={alt} className={cn("shrink-0 object-contain", sizeClass)} />
  ) : (
    <BrainCircuit className={cn("shrink-0 text-muted-foreground", sizeClass)} />
  )
}

function FrameworkLabel({ frameworkKey, frameworkName }: { frameworkKey: string; frameworkName: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandLogo logoPath={FRAMEWORK_LOGO_PATHS[frameworkKey]} alt={`${frameworkName} logo`} />
      <span className="font-medium truncate">{frameworkName}</span>
    </div>
  )
}

function ModelLabel({ modelKey, modelName }: { modelKey: string; modelName: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandLogo logoPath={MODEL_LOGO_PATHS[modelKey]} alt={`${modelName} logo`} />
      <span className="font-medium truncate">{modelName}</span>
    </div>
  )
}

function averageValues(values: Array<number | null>) {
  const cleanValues = values.filter((value): value is number => typeof value === "number" && !Number.isNaN(value))
  if (cleanValues.length === 0) {
    return null
  }
  return cleanValues.reduce((sum, value) => sum + value, 0) / cleanValues.length
}

function buildDomainSeries(rows: RankedCategoryEntry[], limit: number) {
  return rows.slice(0, limit).map((row, index) => ({
    ...row,
    chartKey: `series_${index}`,
    fill: SERIES_STYLES[index % SERIES_STYLES.length].fill,
    stroke: SERIES_STYLES[index % SERIES_STYLES.length].stroke,
    rank: index + 1,
  })) satisfies DomainSeries[]
}

function SeriesLegend({
  rows,
  metricType,
}: {
  rows: DomainSeries[]
  metricType: BenchmarkMetricType
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {rows.map((row) => (
        <div
          key={`${row.frameworkKey}:${row.modelKey}`}
          className="rounded-2xl border border-border/70 bg-background/85 px-4 py-3 shadow-sm shadow-black/5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="mt-1 inline-flex h-2.5 w-2.5 rounded-full ring-4 ring-background"
                style={{ backgroundColor: row.fill, boxShadow: `0 0 0 1px ${row.stroke}` }}
              />
              <BrandLogo
                logoPath={FRAMEWORK_LOGO_PATHS[row.frameworkKey]}
                alt={`${row.frameworkName} logo`}
                size="sm"
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{row.modelName}</div>
                <div className="truncate text-[11px] text-muted-foreground">{row.frameworkName}</div>
              </div>
            </div>
            <div className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              #{row.rank}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Current overall</span>
            <span className={cn("text-sm font-mono font-semibold", scoreTone(metricType, row.overallForSelection))}>
              {formatPercent(row.overallForSelection)}
            </span>
          </div>
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
    fill: string
    stroke: string
  }
}

function ChartTooltipRow({
  frameworkKey,
  frameworkName,
  modelKey,
  modelName,
  value,
  fill,
}: {
  frameworkKey: string
  frameworkName: string
  modelKey: string
  modelName: string
  value: number | null
  fill: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 min-w-0">
        <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: fill }} />
        <BrandLogo logoPath={FRAMEWORK_LOGO_PATHS[frameworkKey]} alt={`${frameworkName} logo`} size="sm" />
        <BrandLogo logoPath={MODEL_LOGO_PATHS[modelKey]} alt={`${modelName} logo`} size="sm" />
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

function rankCategoryEntries(entries: BenchmarkCategoryEntry[]) {
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
      return (
        right.overallForSelection - left.overallForSelection ||
        left.frameworkName.localeCompare(right.frameworkName) ||
        left.modelName.localeCompare(right.modelName)
      )
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

function getViewLabel(viewMode: DomainViewMode) {
  switch (viewMode) {
    case "table":
      return "Table"
    case "bar":
      return "Bar"
    case "scatter":
      return "Scatter"
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
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[640px] table-auto text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/20 align-bottom">
            <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground">#</th>
            <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground">Agent</th>
            <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground">Model</th>
            <th className="border-r border-border/80 px-2 py-3 text-right text-xs font-medium text-muted-foreground">
              Overall
            </th>
            {table.categories.map((category) => (
              <th
                key={category.key}
                className="px-1.5 py-3 text-center text-[11px] font-medium leading-tight text-muted-foreground"
              >
                <div className="break-words">{category.label}</div>
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
              <td className="px-2 py-3 text-sm font-mono font-medium">{index + 1}</td>
              <td className="px-2 py-3">
                <FrameworkLabel frameworkKey={row.frameworkKey} frameworkName={row.frameworkName} />
              </td>
              <td className="px-2 py-3">
                <ModelLabel modelKey={row.modelKey} modelName={row.modelName} />
              </td>
              <td className="border-r border-border/80 px-2 py-3 text-right">
                <MetricCell metricType={metricType} value={row.overallForSelection} emphasis />
              </td>
              {table.categories.map((category) => (
                <td key={category.key} className="px-1 py-3 text-center">
                  <MetricCell metricType={metricType} value={row.categoryScores[category.key] ?? null} />
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

  const plottedRows = buildDomainSeries(rows, 4)
  const seriesByKey = new Map(plottedRows.map((row) => [row.chartKey, row] as const))

  const sortedCategories = [...table.categories].sort((left, right) => {
    const leftAverage = averageValues(plottedRows.map((row) => row.categoryScores[left.key] ?? null))
    const rightAverage = averageValues(plottedRows.map((row) => row.categoryScores[right.key] ?? null))
    if (leftAverage === null && rightAverage === null) {
      return left.label.localeCompare(right.label)
    }
    if (leftAverage === null) {
      return 1
    }
    if (rightAverage === null) {
      return -1
    }
    return isHigherBetterMetric(metricType)
      ? rightAverage - leftAverage || left.label.localeCompare(right.label)
      : leftAverage - rightAverage || left.label.localeCompare(right.label)
  })

  const chartRows = sortedCategories.map((category) => {
    const row: Record<string, number | string | null> = {
      category: compactCategoryLabel(category.label),
      fullLabel: category.label,
    }
    for (const plottedRow of plottedRows) {
      row[plottedRow.chartKey] = plottedRow.categoryScores[category.key] ?? null
    }
    return row
  })
  const chartHeight = Math.max(360, sortedCategories.length * 64)

  return (
    <div className="space-y-4">
      <SeriesLegend rows={plottedRows} metricType={metricType} />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Category ordering</div>
          <div className="mt-1 text-sm font-medium text-foreground">
            {isHigherBetterMetric(metricType) ? "Highest averages first" : "Lowest risk first"}
          </div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Series scope</div>
          <div className="mt-1 text-sm font-medium text-foreground">Top {plottedRows.length} visible configurations</div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Reading guide</div>
          <div className="mt-1 text-sm font-medium text-foreground">
            Compare one category across rows to see the safest or strongest setup quickly.
          </div>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-background/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_32%)]" />
        <div className="relative" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartRows} layout="vertical" margin={{ top: 8, right: 28, left: 24, bottom: 8 }} barCategoryGap="28%">
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.14} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(value: number) => `${value}%`}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="category"
                width={240}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(148,163,184,0.08)" }}
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
                    .sort((left, right) =>
                      isHigherBetterMetric(metricType) ? right.value - left.value : left.value - right.value
                    )

                  return (
                    <div className="w-[300px] rounded-2xl border border-border/70 bg-background/95 p-3 shadow-xl shadow-black/15 backdrop-blur">
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
                            fill={row.fill}
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
                  stroke={row.stroke}
                  strokeWidth={1.25}
                  radius={[999, 999, 999, 999]}
                  maxBarSize={16}
                  animationDuration={850}
                  animationBegin={index * 120}
                  background={{ fill: "rgba(148,163,184,0.08)", radius: 999 }}
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

  const plottedRows = buildDomainSeries(rows, 5)

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
            stroke: row.stroke,
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
          stroke: string
        }>
      >()
    )
  )

  return (
    <div className="space-y-4">
      <SeriesLegend rows={plottedRows} metricType={metricType} />
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="rounded-full bg-background/80">
          x-axis: overall score
        </Badge>
        <Badge variant="outline" className="rounded-full bg-background/80">
          y-axis: category score
        </Badge>
        <Badge variant="outline" className="rounded-full bg-background/80">
          dashed diagonal: equal overall and category score
        </Badge>
        <Badge variant="outline" className="rounded-full bg-background/80">
          larger points: more tasks in that category
        </Badge>
      </div>
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-background/92 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.08),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.08),transparent_34%)]" />
        <div className="relative h-[460px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 18, right: 28, left: 18, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.14} />
              <ReferenceLine
                segment={[
                  { x: 0, y: 0 },
                  { x: 100, y: 100 },
                ]}
                stroke="rgba(148,163,184,0.45)"
                strokeDasharray="6 6"
              />
              <XAxis
                type="number"
                dataKey="x"
                name="Overall"
                domain={[0, 100]}
                tickFormatter={(value: number) => `${value}%`}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Category"
                domain={[0, 100]}
                tickFormatter={(value: number) => `${value}%`}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ strokeDasharray: "4 4", stroke: "rgba(148,163,184,0.45)" }}
                content={(props) => {
                  const active = props.active
                  const payload = props.payload as ScatterTooltipPayloadItem[] | undefined
                  const item = payload?.[0]?.payload
                  if (!active || !item) {
                    return null
                  }

                  return (
                    <div className="w-[300px] rounded-2xl border border-border/70 bg-background/95 p-3 shadow-xl shadow-black/15 backdrop-blur">
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
                          fill={item.fill}
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
                  shape={(props: { cx?: number; cy?: number; size?: number; fill?: string }) => {
                    const cx = typeof props.cx === "number" ? props.cx : 0
                    const cy = typeof props.cy === "number" ? props.cy : 0
                    const size = typeof props.size === "number" ? props.size : 80
                    const radius = Math.max(6, Math.min(14, Math.sqrt(size) * 0.9))
                    const fill = typeof props.fill === "string" ? props.fill : items[0]?.fill ?? "#38bdf8"
                    const stroke = items[0]?.stroke ?? fill

                    return (
                      <g>
                        <circle cx={cx} cy={cy} r={radius + 4} fill={fill} opacity={0.14} />
                        <circle cx={cx} cy={cy} r={radius} fill={fill} fillOpacity={0.28} stroke={stroke} strokeWidth={2} />
                        <circle cx={cx} cy={cy} r={Math.max(2.5, radius * 0.36)} fill="white" opacity={0.92} />
                      </g>
                    )
                  }}
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
  const totalTasks = categoryTable?.categories.reduce((sum, category) => sum + (category.taskCount ?? 0), 0) ?? 0

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant={metricType === "bsr" ? "secondary" : "outline"} className="rounded-full">
            {getMetricPanelTitle(metricType)}
          </Badge>
          <Badge variant="outline" className="rounded-full">
            {rows.length} agents
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
            <CategoryGroupedBarView table={categoryTable} rows={rows} metricType={metricType} />
          ) : (
            <CategoryScatterView table={categoryTable} rows={rows} metricType={metricType} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

type DomainAgentRow = {
  frameworkKey: string
  frameworkName: string
  modelKey: string
  modelName: string
  values: Partial<Record<BenchmarkMetricType, number | null>>
}

function DomainAgentTable({
  metricType,
  rows,
}: {
  metricType: BenchmarkMetricType
  rows: DomainAgentRow[]
}) {
  const sorted = [...rows].sort((a, b) => {
    const left = a.values[metricType] ?? null
    const right = b.values[metricType] ?? null
    if (left === null && right === null) return 0
    if (left === null) return 1
    if (right === null) return -1
    return metricType === "bsr" ? right - left : right - left
  })
  if (sorted.length === 0) return null
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-secondary/20">
            <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              #
            </th>
            <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Framework
            </th>
            <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Model
            </th>
            <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Indirect ASR
            </th>
            <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Direct ASR
            </th>
            <th className="px-3 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              BSR
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, idx) => (
            <tr
              key={`${row.frameworkKey}-${row.modelKey}`}
              className="border-b border-border/40 last:border-0 hover:bg-secondary/10"
            >
              <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{idx + 1}</td>
              <td className="px-3 py-2">
                <FrameworkLabel
                  frameworkKey={row.frameworkKey}
                  frameworkName={row.frameworkName}
                />
              </td>
              <td className="px-3 py-2">
                <ModelLabel modelKey={row.modelKey} modelName={row.modelName} />
              </td>
              <td className="px-3 py-2 text-center">
                <MetricCell
                  metricType="indirect_asr"
                  value={row.values.indirect_asr ?? null}
                  emphasis={metricType === "indirect_asr"}
                />
              </td>
              <td className="px-3 py-2 text-center">
                <MetricCell
                  metricType="direct_asr"
                  value={row.values.direct_asr ?? null}
                  emphasis={metricType === "direct_asr"}
                />
              </td>
              <td className="px-3 py-2 text-center">
                <MetricCell
                  metricType="bsr"
                  value={row.values.bsr ?? null}
                  emphasis={metricType === "bsr"}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---- Per-domain bar chart (horizontal bars, sorted by active metric) ----
function DomainBarChart({
  metricType,
  rows,
}: {
  metricType: BenchmarkMetricType
  rows: DomainAgentRow[]
}) {
  const sorted = [...rows]
    .filter((r) => typeof r.values[metricType] === "number")
    .sort((a, b) => {
      const left = a.values[metricType] ?? 0
      const right = b.values[metricType] ?? 0
      return metricType === "bsr" ? right - left : right - left
    })
  if (sorted.length === 0) return null
  const maxValue = Math.max(100, ...sorted.map((r) => r.values[metricType] ?? 0))
  const isAsr = metricType !== "bsr"

  return (
    <div className="space-y-2 rounded-xl border border-border/60 bg-background/40 p-4">
      {sorted.map((row) => {
        const value = row.values[metricType] ?? 0
        const pct = (value / maxValue) * 100
        const color = isAsr
          ? "bg-rose-500/70"
          : "bg-emerald-500/70"
        return (
          <div
            key={`${row.frameworkKey}-${row.modelKey}`}
            className="grid grid-cols-[170px_1fr_60px] items-center gap-3"
          >
            <div className="flex items-center gap-2 truncate">
              <BrandLogo
                logoPath={MODEL_LOGO_PATHS[row.modelKey]}
                alt={`${row.modelName} logo`}
                size="sm"
              />
              <span className="truncate text-sm font-medium">{row.modelName}</span>
            </div>
            <div className="relative h-5 rounded-md bg-secondary/30 overflow-hidden">
              <div
                className={cn("absolute inset-y-0 left-0 rounded-md transition-all", color)}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-right font-mono text-xs text-muted-foreground">
              {value.toFixed(1)}%
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ---- Per-domain scatter chart (BSR vs ASR, same style as homepage) ----
const DOM_SCATTER_VB_W = 1000
const DOM_SCATTER_VB_H = 560
const DOM_SCATTER_PAD = { top: 30, right: 60, bottom: 56, left: 70 }
const DOM_SCATTER_INNER_W =
  DOM_SCATTER_VB_W - DOM_SCATTER_PAD.left - DOM_SCATTER_PAD.right
const DOM_SCATTER_INNER_H =
  DOM_SCATTER_VB_H - DOM_SCATTER_PAD.top - DOM_SCATTER_PAD.bottom

function computeScatterBounds(points: { bsr: number; asr: number }[]) {
  if (points.length === 0) return { xMin: 0, xMax: 100, yMin: 0, yMax: 100 }
  const xs = points.map((p) => p.bsr)
  const ys = points.map((p) => p.asr)
  const xPad = Math.max((Math.max(...xs) - Math.min(...xs)) * 0.18, 6)
  const yPad = Math.max((Math.max(...ys) - Math.min(...ys)) * 0.22, 6)
  return {
    xMin: Math.max(0, Math.floor((Math.min(...xs) - xPad) / 5) * 5),
    xMax: Math.min(100, Math.ceil((Math.max(...xs) + xPad) / 5) * 5),
    yMin: Math.max(0, Math.floor((Math.min(...ys) - yPad) / 5) * 5),
    yMax: Math.min(100, Math.ceil((Math.max(...ys) + yPad) / 5) * 5),
  }
}

function DomainScatterChart({
  asrType,
  rows,
}: {
  asrType: BenchmarkMetricType
  rows: DomainAgentRow[]
}) {
  const points = rows
    .map((row) => {
      const asr = row.values[asrType]
      const bsr = row.values.bsr
      if (typeof asr !== "number" || typeof bsr !== "number") return null
      return {
        key: `${row.frameworkKey}:${row.modelKey}`,
        primaryLabel: row.frameworkName,
        secondaryLabel: row.modelName,
        logoPath: FRAMEWORK_LOGO_PATHS[row.frameworkKey],
        fallbackInitial: row.frameworkName.charAt(0),
        bsr,
        asr,
      }
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)

  if (points.length === 0) return null

  const bounds = computeScatterBounds(points)
  const xPos = (bsr: number) =>
    DOM_SCATTER_PAD.left +
    ((bsr - bounds.xMin) / Math.max(1, bounds.xMax - bounds.xMin)) * DOM_SCATTER_INNER_W
  const yPos = (asr: number) =>
    DOM_SCATTER_PAD.top +
    ((bounds.yMax - asr) / Math.max(1, bounds.yMax - bounds.yMin)) * DOM_SCATTER_INNER_H
  const toPctX = (svgX: number) => (svgX / DOM_SCATTER_VB_W) * 100
  const toPctY = (svgY: number) => (svgY / DOM_SCATTER_VB_H) * 100

  // Pareto frontier (best agents: high BSR + low ASR)
  const paretoSet = new Set(
    points
      .filter(
        (p) =>
          !points.some(
            (q) =>
              q.key !== p.key &&
              q.bsr >= p.bsr &&
              q.asr <= p.asr &&
              (q.bsr > p.bsr || q.asr < p.asr)
          )
      )
      .map((p) => p.key)
  )
  const frontier = points
    .filter((p) => paretoSet.has(p.key))
    .sort((a, b) => a.bsr - b.bsr)
  const paretoPath =
    frontier.length >= 2
      ? frontier
          .map((p, i) => `${i === 0 ? "M" : "L"} ${xPos(p.bsr)} ${yPos(p.asr)}`)
          .join(" ")
      : ""

  const xStep = bounds.xMax - bounds.xMin <= 25 ? 5 : 10
  const yStep = bounds.yMax - bounds.yMin <= 25 ? 5 : 10
  const xTicks: number[] = []
  for (let v = Math.ceil(bounds.xMin / xStep) * xStep; v <= bounds.xMax; v += xStep) {
    xTicks.push(v)
  }
  const yTicks: number[] = []
  for (let v = Math.ceil(bounds.yMin / yStep) * yStep; v <= bounds.yMax; v += yStep) {
    yTicks.push(v)
  }

  const asrLabel = asrType === "indirect_asr" ? "Indirect ASR" : "Direct ASR"

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 via-card/50 to-card/80 p-2 shadow-sm shadow-black/5">
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-rose-500/[0.06] blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-emerald-500/[0.06] blur-3xl" />
      </div>
      <div className="relative aspect-[1000/560] w-full">
        <svg
          viewBox={`0 0 ${DOM_SCATTER_VB_W} ${DOM_SCATTER_VB_H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="dom-quad-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgb(244, 63, 94)" stopOpacity="0.12" />
              <stop offset="45%" stopColor="rgb(244, 63, 94)" stopOpacity="0.01" />
              <stop offset="55%" stopColor="rgb(16, 185, 129)" stopOpacity="0.02" />
              <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.16" />
            </linearGradient>
            <linearGradient id="dom-frontier-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.85" />
            </linearGradient>
          </defs>

          <rect
            x={DOM_SCATTER_PAD.left}
            y={DOM_SCATTER_PAD.top}
            width={DOM_SCATTER_INNER_W}
            height={DOM_SCATTER_INNER_H}
            fill="url(#dom-quad-bg)"
          />

          {xTicks.map((tick) => (
            <line
              key={`dx-${tick}`}
              x1={xPos(tick)}
              y1={DOM_SCATTER_PAD.top}
              x2={xPos(tick)}
              y2={DOM_SCATTER_PAD.top + DOM_SCATTER_INNER_H}
              stroke="currentColor"
              className="text-border/40"
              strokeWidth={1}
              strokeDasharray="2 4"
            />
          ))}
          {yTicks.map((tick) => (
            <line
              key={`dy-${tick}`}
              x1={DOM_SCATTER_PAD.left}
              y1={yPos(tick)}
              x2={DOM_SCATTER_PAD.left + DOM_SCATTER_INNER_W}
              y2={yPos(tick)}
              stroke="currentColor"
              className="text-border/40"
              strokeWidth={1}
              strokeDasharray="2 4"
            />
          ))}

          <line
            x1={DOM_SCATTER_PAD.left}
            y1={DOM_SCATTER_PAD.top + DOM_SCATTER_INNER_H}
            x2={DOM_SCATTER_PAD.left + DOM_SCATTER_INNER_W}
            y2={DOM_SCATTER_PAD.top + DOM_SCATTER_INNER_H}
            stroke="currentColor"
            className="text-border"
            strokeWidth={1.5}
          />
          <line
            x1={DOM_SCATTER_PAD.left}
            y1={DOM_SCATTER_PAD.top}
            x2={DOM_SCATTER_PAD.left}
            y2={DOM_SCATTER_PAD.top + DOM_SCATTER_INNER_H}
            stroke="currentColor"
            className="text-border"
            strokeWidth={1.5}
          />

          {xTicks.map((tick) => (
            <text
              key={`dxt-${tick}`}
              x={xPos(tick)}
              y={DOM_SCATTER_PAD.top + DOM_SCATTER_INNER_H + 18}
              textAnchor="middle"
              className="fill-muted-foreground font-mono"
              fontSize="11"
            >
              {tick}
            </text>
          ))}
          {yTicks.map((tick) => (
            <text
              key={`dyt-${tick}`}
              x={DOM_SCATTER_PAD.left - 10}
              y={yPos(tick) + 4}
              textAnchor="end"
              className="fill-muted-foreground font-mono"
              fontSize="11"
            >
              {tick}
            </text>
          ))}

          <text
            x={DOM_SCATTER_PAD.left + DOM_SCATTER_INNER_W / 2}
            y={DOM_SCATTER_VB_H - 12}
            textAnchor="middle"
            className="fill-foreground font-semibold uppercase tracking-wider"
            fontSize="12"
          >
            BSR — Benign Success Rate (%) →
          </text>
          <text
            x={-(DOM_SCATTER_PAD.top + DOM_SCATTER_INNER_H / 2)}
            y={18}
            textAnchor="middle"
            transform="rotate(-90)"
            className="fill-foreground font-semibold uppercase tracking-wider"
            fontSize="12"
          >
            ↑ {asrLabel} (%)
          </text>

          {paretoPath ? (
            <path
              d={paretoPath}
              fill="none"
              stroke="url(#dom-frontier-stroke)"
              strokeWidth={2}
              strokeDasharray="6 5"
            />
          ) : null}

          <text
            x={DOM_SCATTER_PAD.left + 10}
            y={DOM_SCATTER_PAD.top + 18}
            className="fill-rose-500/80 font-semibold uppercase tracking-wider"
            fontSize="10"
          >
            ⚠ Worst: vulnerable & weak
          </text>
          <text
            x={DOM_SCATTER_PAD.left + DOM_SCATTER_INNER_W - 10}
            y={DOM_SCATTER_PAD.top + DOM_SCATTER_INNER_H - 10}
            textAnchor="end"
            className="fill-emerald-500/85 font-semibold uppercase tracking-wider"
            fontSize="10"
          >
            ★ Ideal: capable & safe
          </text>
        </svg>

        <div className="pointer-events-none absolute inset-0">
          {points.map((p) => {
            const sx = xPos(p.bsr)
            const sy = yPos(p.asr)
            const isPareto = paretoSet.has(p.key)
            return (
              <div
                key={p.key}
                className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${toPctX(sx)}%`, top: `${toPctY(sy)}%` }}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-full bg-background shadow-lg",
                      isPareto
                        ? "h-10 w-10 ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-background"
                        : "h-9 w-9 ring-1 ring-border"
                    )}
                  >
                    {p.logoPath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.logoPath}
                        alt={p.primaryLabel}
                        className="h-3/4 w-3/4 object-contain"
                      />
                    ) : (
                      <span className="text-sm font-bold text-foreground">
                        {p.fallbackInitial}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 whitespace-nowrap rounded-md bg-card/70 px-1.5 py-0.5 text-center backdrop-blur-sm">
                    <div className="text-[10px] font-semibold leading-tight">
                      {p.primaryLabel}
                    </div>
                    <div className="text-[9px] text-muted-foreground leading-tight">
                      {p.secondaryLabel}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function DomainSection({
  domain,
  metricStates,
  agentRows,
}: {
  domain: BenchmarkDomain
  metricStates: Partial<Record<BenchmarkMetricType, DomainMetricState>>
  agentRows: DomainAgentRow[]
}) {
  const domainVisual = DOMAIN_VISUALS[domain.key]
  const DomainIcon = domainVisual?.icon ?? BrainCircuit
  const glowClass = domainVisual?.glow ?? "from-primary/20 via-transparent to-transparent"
  const screenshotPath = domainVisual?.screenshot
  const [activeMetric, setActiveMetric] = useState<BenchmarkMetricType>("indirect_asr")
  const [viewMode, setViewMode] = useState<DomainViewMode>("table")
  const activeState = metricStates[activeMetric]

  return (
    <section id={`domain-${domain.key}`} className="scroll-mt-24">
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/70 backdrop-blur-xl shadow-lg shadow-black/5 transition-transform duration-300 hover:-translate-y-0.5">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className={cn("absolute inset-x-0 top-0 h-40 bg-gradient-to-r", glowClass)} />
          {screenshotPath ? (
            <div className="absolute right-6 top-4 h-40 w-[46%] max-w-[560px] md:right-10">
              <img
                src={screenshotPath}
                alt=""
                aria-hidden
                className="h-full w-full rounded-xl object-cover object-top opacity-80 dark:opacity-60"
                style={{
                  maskImage:
                    "radial-gradient(ellipse at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0.6) 70%, transparent 100%)",
                  WebkitMaskImage:
                    "radial-gradient(ellipse at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0.6) 70%, transparent 100%)",
                }}
              />
            </div>
          ) : null}
        </div>
        <div className="relative p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-border/70 bg-background/85 p-3 shadow-sm">
              <DomainIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="outline" className="rounded-full bg-background/70">
                  {domain.shortLabel}
                </Badge>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">{domain.label}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Tune the metric and visualization for this domain only.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border/60 bg-background/55 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Metric filter
                </div>
                <div className="flex flex-wrap gap-2">
                  {DOMAIN_METRIC_ORDER.map((metric) => (
                    <button
                      key={metric}
                      onClick={() => setActiveMetric(metric)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm transition-all duration-300",
                        activeMetric === metric
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {getMetricPanelTitle(metric)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  View filter
                </div>
                <div className="flex flex-wrap gap-2">
                  {DOMAIN_VIEW_ORDER.map((mode) => (
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
                      {getViewLabel(mode)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {agentRows.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight">
                      {viewMode === "scatter"
                        ? `BSR vs ${
                            activeMetric === "bsr"
                              ? "Indirect ASR"
                              : activeMetric === "indirect_asr"
                              ? "Indirect ASR"
                              : "Direct ASR"
                          } in ${domain.label}`
                        : viewMode === "bar"
                        ? `${getMetricPanelTitle(activeMetric)} per agent in ${domain.label}`
                        : `Per-agent results in ${domain.label}`}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {viewMode === "scatter"
                        ? "Bottom-right corner is ideal: capable + safe."
                        : `Sorted by ${
                            activeMetric === "bsr"
                              ? "BSR (higher = better)"
                              : "ASR (higher = more vulnerable)"
                          }.`}
                    </p>
                  </div>
                </div>
                {viewMode === "table" ? (
                  <DomainAgentTable metricType={activeMetric} rows={agentRows} />
                ) : viewMode === "bar" ? (
                  <DomainBarChart metricType={activeMetric} rows={agentRows} />
                ) : (
                  <DomainScatterChart
                    asrType={activeMetric === "bsr" ? "indirect_asr" : activeMetric}
                    rows={agentRows}
                  />
                )}
              </div>
            ) : null}

            {activeState?.table ? (
              <DomainMetricPanel
                metricType={activeMetric}
                viewMode={viewMode}
                categoryTable={activeState?.table}
                rows={activeState?.rows ?? []}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

const GLOBAL_METRIC_ORDER: BenchmarkMetricType[] = ["indirect_asr", "direct_asr", "bsr"]

export function LeaderboardSection() {
  const [dataset, setDataset] = useState<BenchmarkDataset | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [frameworkKey, setFrameworkKey] = useState("all")
  const [modelKey, setModelKey] = useState("all")
  const [taskSetFilter, setTaskSetFilter] = useState<"all" | "benign" | "indirect" | "direct">(
    "all"
  )
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
      if (frameworkKey !== "all" && entry.frameworkKey !== frameworkKey) {
        continue
      }
      validModelKeys.add(entry.modelKey)
    }
    for (const table of dataset.categoryTables) {
      for (const entry of table.entries) {
        if (frameworkKey !== "all" && entry.frameworkKey !== frameworkKey) {
          continue
        }
        validModelKeys.add(entry.modelKey)
      }
    }

    return dataset.models.filter((model) => validModelKeys.has(model.key))
  }, [dataset, frameworkKey])

  useEffect(() => {
    if (modelKey === "all") {
      return
    }

    const stillAvailable = availableModels.some((model) => model.key === modelKey)
    if (!stillAvailable) {
      setModelKey("all")
    }
  }, [availableModels, modelKey])

  const overviewEntriesByMetric = useMemo(() => {
    const empty: Record<BenchmarkMetricType, RankedEntry[]> = {
      indirect_asr: [],
      direct_asr: [],
      bsr: [],
    }
    if (!dataset) {
      return empty
    }
    for (const metric of GLOBAL_METRIC_ORDER) {
      empty[metric] = rankBenchmarkEntries(
        filterBenchmarkEntries(dataset, {
          metricType: metric,
          frameworkKey,
          modelKey,
          domainKeys: selectedDomainKeys,
          searchQuery,
        }),
        selectedDomainKeys
      ) as RankedEntry[]
    }
    return empty
  }, [dataset, frameworkKey, modelKey, searchQuery, selectedDomainKeys])

  const totalOverviewEntries = useMemo(() => {
    const keys = new Set<string>()
    for (const metric of GLOBAL_METRIC_ORDER) {
      for (const entry of overviewEntriesByMetric[metric]) {
        keys.add(`${entry.frameworkKey}::${entry.modelKey}`)
      }
    }
    return keys.size
  }, [overviewEntriesByMetric])

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
        })
      )

      const domainState = byDomain.get(table.domainKey) ?? {}
      domainState[table.metricType] = { table, rows }
      byDomain.set(table.domainKey, domainState)
    }

    return byDomain
  }, [dataset, frameworkKey, modelKey, searchQuery])

  const agentRowsByDomain = useMemo(() => {
    const out = new Map<string, DomainAgentRow[]>()
    if (!dataset) return out
    const grouped = new Map<string, Map<string, DomainAgentRow>>()
    for (const score of dataset.scores) {
      // Apply the same filter logic as the per-domain category breakdowns.
      if (frameworkKey !== "all" && score.frameworkKey !== frameworkKey) continue
      if (modelKey !== "all" && score.modelKey !== modelKey) continue
      if (
        !matchesSearchQuery(
          searchQuery,
          score.frameworkName,
          score.modelName,
          `${score.frameworkName} ${score.modelName}`
        )
      ) {
        continue
      }
      const domainBucket = grouped.get(score.domainKey) ?? new Map<string, DomainAgentRow>()
      grouped.set(score.domainKey, domainBucket)
      const comboKey = `${score.frameworkKey}::${score.modelKey}`
      const row =
        domainBucket.get(comboKey) ??
        ({
          frameworkKey: score.frameworkKey,
          frameworkName: score.frameworkName,
          modelKey: score.modelKey,
          modelName: score.modelName,
          values: {},
        } satisfies DomainAgentRow)
      row.values[score.metricType] = score.value
      domainBucket.set(comboKey, row)
    }
    for (const [domainKey, bucket] of grouped) {
      out.set(domainKey, Array.from(bucket.values()))
    }
    return out
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

  const hasFilters =
    searchQuery.length > 0 ||
    frameworkKey !== "all" ||
    modelKey !== "all" ||
    taskSetFilter !== "all" ||
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
    setTaskSetFilter("all")
    setSelectedDomainKeys([])
  }

  if (loading) {
    return (
      <section className="min-h-screen">
        <div className="mx-auto max-w-[1600px] px-4 py-16 lg:px-6">
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
        <div className="mx-auto max-w-[1600px] px-4 py-16 lg:px-6">
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
      <div className="mx-auto max-w-[1600px] px-4 py-12 md:py-16">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span>Home</span>
          <span className="text-muted-foreground/50">{">"}</span>
          <span className="text-foreground">Leaderboard</span>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-6 md:p-8 shadow-xl shadow-black/5 backdrop-blur-xl mb-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_35%)]" />
          <div className="relative flex flex-col gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
                Leaderboard
              </h1>
              <p className="max-w-3xl text-muted-foreground">
                Latest benchmark results of AI agents on{" "}
                <code className="font-mono text-foreground">dtap-bench==1.0</code>.
              </p>
        </div>

            <div className="rounded-2xl border border-border/60 bg-background/50 p-5">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search framework or model"
                    className="pl-9 h-10 bg-background border-border"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:flex-none lg:items-center">
                  <Select value={frameworkKey} onValueChange={setFrameworkKey}>
                    <SelectTrigger className="h-10 lg:w-[160px]">
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
                    <SelectTrigger className="h-10 lg:w-[150px]">
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

                  <Select
                    value={taskSetFilter}
                    onValueChange={(value) =>
                      setTaskSetFilter(value as typeof taskSetFilter)
                    }
                  >
                    <SelectTrigger className="h-10 lg:w-[160px]">
                      <SelectValue placeholder="Task set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All task sets</SelectItem>
                      <SelectItem value="benign">Benign (BSR)</SelectItem>
                      <SelectItem value="indirect">Indirect (ASR)</SelectItem>
                      <SelectItem value="direct">Direct (ASR)</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="relative lg:w-[170px]">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 w-full justify-between gap-2 bg-transparent"
                      onClick={() => setShowDomainFilter((open) => !open)}
                    >
                      <span className="inline-flex items-center gap-2 truncate">
                        <Filter className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {selectedDomainKeys.length === 0
                            ? "All domains"
                            : `${selectedDomainKeys.length} domain${
                                selectedDomainKeys.length === 1 ? "" : "s"
                              }`}
                        </span>
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    </Button>

                    {showDomainFilter && (
                      <div className="absolute top-full right-0 left-0 mt-1 w-[260px] rounded-xl border border-border bg-popover p-2 shadow-lg z-50 lg:left-auto">
                        <div className="grid grid-cols-2 gap-1 max-h-64 overflow-y-auto">
                          {dataset.domains.map((domain) => {
                            const checked = selectedDomainKeys.includes(domain.key)
                            return (
                              <button
                                key={domain.key}
                                onClick={() => toggleDomain(domain.key)}
                                className={cn(
                                  "flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors",
                                  checked
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                )}
                              >
                                <span>{domain.label}</span>
                                {checked ? <Check className="h-3.5 w-3.5" /> : null}
                              </button>
                            )
                          })}
                        </div>
                        <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                          <button
                            className="text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => setSelectedDomainKeys([])}
                          >
                            Clear
                          </button>
                          <button
                            className="text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => setShowDomainFilter(false)}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{totalOverviewEntries}</span> agents.
                  Heatmap: green = safer / stronger, red = more vulnerable / weaker.
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
            <CardTitle className="text-xl">Overall Results across Domains</CardTitle>
            <CardDescription>
              Metrics: Indirect ASR and Direct ASR measure security (lower is more robust),
              while BSR captures benign utility (higher is more capable).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-10">
            {GLOBAL_METRIC_ORDER.filter((metric) => {
              if (taskSetFilter === "all") return true
              if (taskSetFilter === "benign") return metric === "bsr"
              if (taskSetFilter === "indirect") return metric === "indirect_asr"
              if (taskSetFilter === "direct") return metric === "direct_asr"
              return true
            }).map((metric) => {
              const rows = overviewEntriesByMetric[metric]
              return (
                <div key={metric} className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="inline-flex items-center gap-1.5 text-base font-semibold tracking-tight">
                        <span>{getMetricPanelTitle(metric)}</span>
                        {metric === "bsr" ? (
                          <ArrowUp className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                        )}
                      </h3>
                      <Badge variant="outline" className="rounded-full text-xs">
                        {rows.length} agents
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{getMetricPanelDescription(metric)}</div>
                  </div>
                  <div className="rounded-xl border border-border/60 overflow-x-auto">
                    <table className="w-full min-w-[640px] table-auto text-sm">
              <thead>
                        <tr className="border-b border-border bg-secondary/20 align-bottom">
                          <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground">#</th>
                          <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground">Agent</th>
                          <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground">Model</th>
                          <th className="border-r border-border/80 px-2 py-3 text-right text-xs font-medium text-muted-foreground">
                            Overall
                  </th>
                  {visibleDomains.map((domain) => (
                    <th
                              key={domain.key}
                              className="px-1.5 py-3 text-center text-[11px] font-medium leading-tight text-muted-foreground"
                    >
                              <span className="break-words">{domain.shortLabel}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                        {rows.map((entry, index) => (
                  <tr
                            key={entry.entryKey}
                            className="border-b border-border/60 last:border-0 transition-colors hover:bg-secondary/10"
                  >
                            <td className="px-2 py-3 text-sm font-mono font-medium">{index + 1}</td>
                            <td className="px-2 py-3">
                              <FrameworkLabel frameworkKey={entry.frameworkKey} frameworkName={entry.frameworkName} />
                    </td>
                            <td className="px-2 py-3">
                              <ModelLabel modelKey={entry.modelKey} modelName={entry.modelName} />
                            </td>
                            <td className="border-r border-border/80 px-2 py-3 text-right">
                              <MetricCell metricType={metric} value={entry.overallForSelection} emphasis />
                    </td>
                    {visibleDomains.map((domain) => (
                              <td key={domain.key} className="px-1 py-3 text-center">
                                <MetricCell metricType={metric} value={entry.domainScores[domain.key]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
                    {rows.length === 0 ? (
                      <div className="border-t border-border p-8 text-center text-muted-foreground">
                        No published results match the current filters.
          </div>
                    ) : null}
        </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Per-Domain Results</h2>
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
                  metricStates={categoryState ?? {}}
                  agentRows={agentRowsByDomain.get(domain.key) ?? []}
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

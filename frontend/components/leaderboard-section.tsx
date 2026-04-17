"use client"

import { type ReactNode, useEffect, useMemo, useState } from "react"
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
  Legend,
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

const FRAMEWORK_COLORS: Record<string, string> = {
  "openai-agents": "#10b981",
  "claude-code": "#f97316",
  "google-adk": "#3b82f6",
  openclaw: "#a855f7",
}

const FRAMEWORK_BADGE_STYLES: Record<string, string> = {
  "openai-agents": "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
  "claude-code": "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/30",
  "google-adk": "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30",
  openclaw: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30",
}

const MODEL_BADGE_STYLES: Record<string, string> = {
  "gpt-5-4": FRAMEWORK_BADGE_STYLES["openai-agents"],
  "gpt-5-2": FRAMEWORK_BADGE_STYLES["openai-agents"],
  "gpt-5-1": FRAMEWORK_BADGE_STYLES["openai-agents"],
  "gpt-oss-120b": "bg-zinc-100 text-zinc-800 ring-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-200 dark:ring-zinc-500/30",
  "opus-4-6": FRAMEWORK_BADGE_STYLES["claude-code"],
  "sonnet-4-5": FRAMEWORK_BADGE_STYLES["claude-code"],
  "gemini-3-pro": FRAMEWORK_BADGE_STYLES["google-adk"],
  "gemini-3-1-pro": FRAMEWORK_BADGE_STYLES["google-adk"],
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

function OpenAIGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="5.4" r="2.3" />
      <circle cx="17.7" cy="8.7" r="2.3" />
      <circle cx="17.7" cy="15.3" r="2.3" />
      <circle cx="12" cy="18.6" r="2.3" />
      <circle cx="6.3" cy="15.3" r="2.3" />
      <circle cx="6.3" cy="8.7" r="2.3" />
    </svg>
  )
}

function AnthropicGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor">
      <path d="M12 3 5 21h3.3l1.4-3.9h4.8l1.5 3.9H19L12 3Zm-1.2 10.8L12 10l1.2 3.8h-2.4Z" />
    </svg>
  )
}

function GeminiGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor">
      <path d="M12 2.8 14.8 9.2 21.2 12l-6.4 2.8L12 21.2l-2.8-6.4L2.8 12l6.4-2.8L12 2.8Z" />
    </svg>
  )
}

function ClawGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
      <path d="M6 18 9 6" />
      <path d="M11 19 14 7" />
      <path d="M16 18 19 9" />
    </svg>
  )
}

function OssGlyph() {
  return (
    <span className="text-[9px] font-bold tracking-[0.18em]">OSS</span>
  )
}

function getFrameworkGlyph(frameworkKey: string) {
  switch (frameworkKey) {
    case "openai-agents":
      return <OpenAIGlyph />
    case "claude-code":
      return <AnthropicGlyph />
    case "google-adk":
      return <GeminiGlyph />
    case "openclaw":
      return <ClawGlyph />
    default:
      return <BrainCircuit className="h-4.5 w-4.5" />
  }
}

function getModelGlyph(modelKey: string) {
  if (modelKey.startsWith("gpt-oss")) {
    return <OssGlyph />
  }
  if (modelKey.startsWith("gpt-")) {
    return <OpenAIGlyph />
  }
  if (modelKey.startsWith("opus-") || modelKey.startsWith("sonnet-")) {
    return <AnthropicGlyph />
  }
  if (modelKey.startsWith("gemini-")) {
    return <GeminiGlyph />
  }
  return <BrainCircuit className="h-4.5 w-4.5" />
}

function BrandBadge({
  badgeClassName,
  children,
}: {
  badgeClassName: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 shadow-sm shadow-black/5",
        badgeClassName
      )}
    >
      {children}
    </span>
  )
}

function FrameworkLabel({ frameworkKey, frameworkName }: { frameworkKey: string; frameworkName: string }) {
  return (
    <div className="flex items-center gap-3">
      <BrandBadge badgeClassName={FRAMEWORK_BADGE_STYLES[frameworkKey] ?? "bg-muted text-foreground ring-border"}>
        {getFrameworkGlyph(frameworkKey)}
      </BrandBadge>
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
      <BrandBadge badgeClassName={MODEL_BADGE_STYLES[modelKey] ?? "bg-muted text-foreground ring-border"}>
        {getModelGlyph(modelKey)}
      </BrandBadge>
      <div className="min-w-0">
        <div className="font-medium truncate">{modelName}</div>
        <div className="text-xs text-muted-foreground">Foundation model</div>
      </div>
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

function average(values: Array<number | null>) {
  const cleanValues = values.filter((value): value is number => typeof value === "number")
  if (cleanValues.length === 0) {
    return null
  }
  return Math.round((cleanValues.reduce((sum, value) => sum + value, 0) / cleanValues.length) * 10) / 10
}

function getCategoryAverageRows(table: BenchmarkCategoryTable | undefined, rows: RankedCategoryEntry[]) {
  if (!table) {
    return []
  }

  return table.categories
    .map((category) => ({
      ...category,
      average: average(rows.map((row) => row.categoryScores[category.key] ?? null)),
    }))
    .filter((category) => category.average !== null)
    .sort((left, right) => Number(right.average) - Number(left.average) || left.label.localeCompare(right.label))
}

function compactCategoryLabel(label: string) {
  return label
    .replace("Windows · ", "Win · ")
    .replace("macOS · ", "macOS · ")
    .replace("Customer Service", "CS")
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
          <tr className="border-b border-border/60">
            <th className="py-2 text-left text-xs font-medium text-muted-foreground">Agent</th>
            <th className="py-2 text-left text-xs font-medium text-muted-foreground">Model</th>
            <th className="py-2 text-right text-xs font-medium text-muted-foreground">Overall</th>
            {table.categories.map((category) => (
              <th key={category.key} className="min-w-[120px] px-2 py-2 text-right text-xs font-medium text-muted-foreground">
                <div>{category.label}</div>
                {category.taskCount !== null ? (
                  <div className="mt-1 text-[10px] text-muted-foreground/70">{category.taskCount} tasks</div>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 8).map((row) => (
            <tr key={`${row.frameworkKey}:${row.modelKey}`} className="border-b border-border/50 last:border-0">
              <td className="py-3 pr-4">
                <FrameworkLabel frameworkKey={row.frameworkKey} frameworkName={row.frameworkName} />
              </td>
              <td className="py-3 pr-4">
                <ModelLabel modelKey={row.modelKey} modelName={row.modelName} />
              </td>
              <td className="py-3 text-right">
                <span className={cn("text-sm font-mono font-semibold", scoreTone(metricType, row.overallForSelection))}>
                  {formatPercent(row.overallForSelection)}
                </span>
              </td>
              {table.categories.map((category) => (
                <td key={category.key} className="px-2 py-3 text-right">
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

  return (
    <div className="h-[360px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartRows} margin={{ top: 12, right: 18, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.25} />
          <XAxis dataKey="category" angle={-25} textAnchor="end" interval={0} height={72} tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
          <Tooltip
            labelFormatter={(value) => String(value)}
            formatter={(value) => [
              formatPercent(typeof value === "number" ? value : Number(value)),
              "Score",
            ]}
            contentStyle={{ borderRadius: 16, borderColor: "hsl(var(--border))" }}
          />
          <Legend />
          {plottedRows.map((row) => (
            <Bar
              key={row.chartKey}
              dataKey={row.chartKey}
              name={`${row.frameworkName} · ${row.modelName}`}
              fill={row.fill}
              radius={[6, 6, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
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

  const frameworkGroups = Array.from(
    rows.slice(0, 8).reduce(
      (groups, row) => {
        const items = groups.get(row.frameworkKey) ?? []
        for (const category of table.categories) {
          const score = row.categoryScores[category.key]
          if (score === null || row.overallForSelection === null) {
            continue
          }
          items.push({
            x: row.overallForSelection,
            y: score,
            z: Math.max(56, (category.taskCount ?? 8) * 4),
            frameworkName: row.frameworkName,
            modelName: row.modelName,
            categoryLabel: category.label,
            fill: FRAMEWORK_COLORS[row.frameworkKey] ?? "#94a3b8",
          })
        }
        groups.set(row.frameworkKey, items)
        return groups
      },
      new Map<
        string,
        Array<{
          x: number
          y: number
          z: number
          frameworkName: string
          modelName: string
          categoryLabel: string
          fill: string
        }>
      >()
    )
  )

  return (
    <div className="h-[360px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 16, right: 18, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.25} />
          <XAxis type="number" dataKey="x" name="Overall" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
          <YAxis type="number" dataKey="y" name="Category" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            formatter={(value: number, key: string) => [formatPercent(value), key === "x" ? "Overall" : "Category score"]}
            labelFormatter={(_value, payload) => {
              const item = payload?.[0]?.payload as
                | { modelName?: string; frameworkName?: string; categoryLabel?: string }
                | undefined
              return item ? `${item.frameworkName} · ${item.modelName} · ${item.categoryLabel}` : ""
            }}
            contentStyle={{ borderRadius: 16, borderColor: "hsl(var(--border))" }}
          />
          <Legend />
          {frameworkGroups.map(([frameworkKey, items]) => (
            <Scatter
              key={frameworkKey}
              name={items[0]?.frameworkName ?? frameworkKey}
              data={items}
              fill={items[0]?.fill}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

function CategoryHighlightsCard({
  table,
  rows,
  metricType,
}: {
  table: BenchmarkCategoryTable | undefined
  rows: RankedCategoryEntry[]
  metricType: BenchmarkMetricType
}) {
  const categoryRows = getCategoryAverageRows(table, rows)
  const visibleRows = isHigherBetterMetric(metricType) ? categoryRows.slice(0, 6) : categoryRows.slice(0, 6)
  const totalTasks = table?.categories.reduce((sum, category) => sum + (category.taskCount ?? 0), 0) ?? 0

  return (
    <Card className="overflow-hidden border-border/70 bg-background/60 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5">
      <CardHeader className="gap-2">
        <CardTitle className="text-base">
          {metricType === "bsr" ? "Category capability map" : "Category risk map"}
        </CardTitle>
        <CardDescription>
          {metricType === "bsr"
            ? "Average benign success rate by category across the visible model configurations."
            : "Average attack success rate by category across the visible model configurations."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Categories</div>
            <div className="mt-1 text-2xl font-semibold">{table?.categories.length ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Tasks represented</div>
            <div className="mt-1 text-2xl font-semibold">{totalTasks}</div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Visible configs</div>
            <div className="mt-1 text-2xl font-semibold">{rows.length}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px]">
            <thead>
              <tr className="border-b border-border/60">
                <th className="py-2 text-left text-xs font-medium text-muted-foreground">Category</th>
                <th className="py-2 text-right text-xs font-medium text-muted-foreground">Tasks</th>
                <th className="py-2 text-right text-xs font-medium text-muted-foreground">Avg</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.key} className="border-b border-border/50 last:border-0">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{row.label}</div>
                  </td>
                  <td className="py-3 text-right font-mono text-muted-foreground">{row.taskCount ?? "--"}</td>
                  <td className="py-3 text-right">
                    <span className={cn("text-sm font-mono font-semibold", scoreTone(metricType, row.average))}>
                      {formatPercent(row.average)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visibleRows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            No category averages are available for the current filter combination.
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function DomainSection({
  domain,
  metricType,
  viewMode,
  categoryTable,
  rows,
}: {
  domain: BenchmarkDomain
  metricType: BenchmarkMetricType
  viewMode: DomainViewMode
  categoryTable: BenchmarkCategoryTable | undefined
  rows: RankedCategoryEntry[]
}) {
  const topRow = rows[0]
  const domainVisual = DOMAIN_VISUALS[domain.key]
  const DomainIcon = domainVisual?.icon ?? BrainCircuit
  const glowClass = domainVisual?.glow ?? "from-primary/20 via-transparent to-transparent"
  const totalTasks = categoryTable?.categories.reduce((sum, category) => sum + (category.taskCount ?? 0), 0) ?? 0

  return (
    <section className="scroll-mt-24">
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/70 backdrop-blur-xl shadow-lg shadow-black/5 transition-transform duration-300 hover:-translate-y-0.5">
        <div className={cn("absolute inset-x-0 top-0 h-28 bg-gradient-to-r", glowClass)} />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-3 shadow-sm">
                <DomainIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="outline" className="rounded-full bg-background/70">
                    {domain.shortLabel}
                  </Badge>
                  <Badge variant="secondary" className="rounded-full">
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
                <h2 className="text-2xl font-semibold tracking-tight">{domain.label}</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Real category-level scores parsed from the paper tables, with table, grouped-bar, and scatter views.
                </p>
              </div>
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

          <div className="mt-6 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
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
                      : "Paper-backed category-level matrix for the strongest visible configurations."}
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

            <CategoryHighlightsCard table={categoryTable} rows={rows} metricType={metricType} />
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
      return new Map<string, { table: BenchmarkCategoryTable; rows: RankedCategoryEntry[] }>()
    }

    const byDomain = new Map<string, { table: BenchmarkCategoryTable; rows: RankedCategoryEntry[] }>()
    for (const table of dataset.categoryTables) {
      if (table.metricType !== metricType) {
        continue
      }

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
        metricType
      )

      byDomain.set(table.domainKey, { table, rows })
    }

    return byDomain
  }, [dataset, frameworkKey, metricType, modelKey, searchQuery])

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
  const higherIsBetter = isHigherBetterMetric(metricType)
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
              Fancy per-domain views with real paper-backed category matrices and charts.
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            {higherIsBetter ? "Higher is better." : "Lower is better."}
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
                  metricType={metricType}
                  viewMode={viewMode}
                  categoryTable={categoryState?.table}
                  rows={categoryState?.rows ?? []}
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

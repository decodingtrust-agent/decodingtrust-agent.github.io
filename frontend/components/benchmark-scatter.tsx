"use client"

import { useEffect, useMemo, useState } from "react"
import { BrainCircuit, Crown, Layers3, ScatterChart, Sparkles } from "lucide-react"
import { loadBenchmarkDataset, type BenchmarkDataset, type BenchmarkMetricType } from "@/lib/benchmark"
import { cn } from "@/lib/utils"

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

type AsrTab = "indirect" | "direct"
type ViewMode = "combo" | "framework" | "model"

interface RowData {
  frameworkKey: string
  frameworkName: string
  modelKey: string
  modelName: string
  metrics: Record<BenchmarkMetricType, number | null>
}

interface ScatterPoint {
  key: string
  primaryLabel: string
  secondaryLabel: string
  logoPath?: string
  fallbackInitial: string
  asr: number
  bsr: number
}

function getRows(dataset: BenchmarkDataset | null): RowData[] {
  if (!dataset) return []
  const byCombo = new Map<string, RowData>()
  for (const entry of dataset.entries) {
    const key = `${entry.frameworkKey}:${entry.modelKey}`
    const existing =
      byCombo.get(key) ??
      ({
        frameworkKey: entry.frameworkKey,
        frameworkName: entry.frameworkName,
        modelKey: entry.modelKey,
        modelName: entry.modelName,
        metrics: { bsr: null, direct_asr: null, indirect_asr: null },
      } satisfies RowData)
    existing.metrics[entry.metricType] = entry.overall
    byCombo.set(key, existing)
  }
  return Array.from(byCombo.values())
}

function average(values: Array<number | null>): number | null {
  const clean = values.filter((v): v is number => typeof v === "number" && !Number.isNaN(v))
  if (clean.length === 0) return null
  return clean.reduce((acc, v) => acc + v, 0) / clean.length
}

function buildPoints(rows: RowData[], asrType: BenchmarkMetricType, mode: ViewMode): ScatterPoint[] {
  if (mode === "combo") {
    return rows
      .map((row): ScatterPoint | null => {
        const asr = row.metrics[asrType]
        const bsr = row.metrics.bsr
        if (asr === null || bsr === null) return null
        return {
          key: `${row.frameworkKey}:${row.modelKey}`,
          primaryLabel: row.frameworkName,
          secondaryLabel: row.modelName,
          logoPath: FRAMEWORK_LOGO_PATHS[row.frameworkKey],
          fallbackInitial: row.frameworkName.charAt(0),
          asr,
          bsr,
        }
      })
      .filter((p): p is ScatterPoint => p !== null)
  }

  if (mode === "framework") {
    const grouped = new Map<string, RowData[]>()
    for (const row of rows) {
      if (!grouped.has(row.frameworkKey)) grouped.set(row.frameworkKey, [])
      grouped.get(row.frameworkKey)!.push(row)
    }
    return Array.from(grouped.entries())
      .map(([key, group]): ScatterPoint | null => {
        const asr = average(group.map((r) => r.metrics[asrType]))
        const bsr = average(group.map((r) => r.metrics.bsr))
        if (asr === null || bsr === null) return null
        return {
          key,
          primaryLabel: group[0].frameworkName,
          secondaryLabel: `${group.length} model${group.length === 1 ? "" : "s"} avg`,
          logoPath: FRAMEWORK_LOGO_PATHS[key],
          fallbackInitial: group[0].frameworkName.charAt(0),
          asr,
          bsr,
        }
      })
      .filter((p): p is ScatterPoint => p !== null)
  }

  // mode === "model"
  const grouped = new Map<string, RowData[]>()
  for (const row of rows) {
    if (!grouped.has(row.modelKey)) grouped.set(row.modelKey, [])
    grouped.get(row.modelKey)!.push(row)
  }
  return Array.from(grouped.entries())
    .map(([key, group]): ScatterPoint | null => {
      const asr = average(group.map((r) => r.metrics[asrType]))
      const bsr = average(group.map((r) => r.metrics.bsr))
      if (asr === null || bsr === null) return null
      return {
        key,
        primaryLabel: group[0].modelName,
        secondaryLabel: `${group.length} framework${group.length === 1 ? "" : "s"} avg`,
        logoPath: MODEL_LOGO_PATHS[key],
        fallbackInitial: group[0].modelName.charAt(0),
        asr,
        bsr,
      }
    })
    .filter((p): p is ScatterPoint => p !== null)
}

// Pareto-optimal: no other point has BOTH lower ASR and higher BSR
function paretoKeys(points: ScatterPoint[]): Set<string> {
  const set = new Set<string>()
  for (const p of points) {
    const dominated = points.some(
      (other) =>
        other.key !== p.key &&
        other.bsr >= p.bsr &&
        other.asr <= p.asr &&
        (other.bsr > p.bsr || other.asr < p.asr)
    )
    if (!dominated) set.add(p.key)
  }
  return set
}

// Pick the agent closest to the ideal corner (high BSR, low ASR), normalized
function findChampion(points: ScatterPoint[]): string | null {
  if (points.length === 0) return null
  let bestKey = points[0].key
  let bestScore = -Infinity
  for (const p of points) {
    const score = p.bsr - p.asr
    if (score > bestScore) {
      bestScore = score
      bestKey = p.key
    }
  }
  return bestKey
}

const CHART_VB_W = 1000
const CHART_VB_H = 560
const CHART_PAD = { top: 30, right: 60, bottom: 56, left: 70 }
const INNER_W = CHART_VB_W - CHART_PAD.left - CHART_PAD.right
const INNER_H = CHART_VB_H - CHART_PAD.top - CHART_PAD.bottom

// Chart axis bounds (auto-padded based on observed values)
function computeBounds(points: ScatterPoint[]) {
  if (points.length === 0) {
    return { xMin: 0, xMax: 100, yMin: 0, yMax: 100 }
  }
  const xs = points.map((p) => p.bsr)
  const ys = points.map((p) => p.asr)
  const xMinRaw = Math.min(...xs)
  const xMaxRaw = Math.max(...xs)
  const yMinRaw = Math.min(...ys)
  const yMaxRaw = Math.max(...ys)
  const xPad = Math.max((xMaxRaw - xMinRaw) * 0.18, 6)
  const yPad = Math.max((yMaxRaw - yMinRaw) * 0.22, 6)
  return {
    xMin: Math.max(0, Math.floor((xMinRaw - xPad) / 5) * 5),
    xMax: Math.min(100, Math.ceil((xMaxRaw + xPad) / 5) * 5),
    yMin: Math.max(0, Math.floor((yMinRaw - yPad) / 5) * 5),
    yMax: Math.min(100, Math.ceil((yMaxRaw + yPad) / 5) * 5),
  }
}

interface SegmentedControlOption<T extends string> {
  value: T
  label: string
  hint?: string
  icon?: React.ReactNode
}

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (next: T) => void
  options: SegmentedControlOption<T>[]
  className?: string
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border/70 bg-secondary/40 p-1 backdrop-blur-sm",
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function BenchmarkScatter() {
  const [dataset, setDataset] = useState<BenchmarkDataset | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<AsrTab>("indirect")
  const [mode, setMode] = useState<ViewMode>("combo")
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  useEffect(() => {
    loadBenchmarkDataset()
      .then((data) => setDataset(data))
      .catch(() => setDataset(null))
      .finally(() => setLoading(false))
  }, [])

  const rows = useMemo(() => getRows(dataset), [dataset])
  const asrType: BenchmarkMetricType = tab === "indirect" ? "indirect_asr" : "direct_asr"
  const points = useMemo(() => buildPoints(rows, asrType, mode), [rows, asrType, mode])
  const pareto = useMemo(() => paretoKeys(points), [points])
  const championKey = useMemo(() => findChampion(points), [points])
  const bounds = useMemo(() => computeBounds(points), [points])

  const xPos = (bsr: number) =>
    CHART_PAD.left + ((bsr - bounds.xMin) / Math.max(1, bounds.xMax - bounds.xMin)) * INNER_W
  // High ASR (vulnerable) at TOP — matches leaderboard ordering. Ideal corner = bottom-right.
  const yPos = (asr: number) =>
    CHART_PAD.top + ((bounds.yMax - asr) / Math.max(1, bounds.yMax - bounds.yMin)) * INNER_H

  // Pareto frontier polyline — sort non-dominated points by BSR ascending
  const paretoPath = useMemo(() => {
    const frontier = points.filter((p) => pareto.has(p.key)).sort((a, b) => a.bsr - b.bsr)
    if (frontier.length < 2) return ""
    return frontier.map((p, i) => `${i === 0 ? "M" : "L"} ${xPos(p.bsr)} ${yPos(p.asr)}`).join(" ")
  }, [points, pareto, bounds])

  // Build axis tick values
  const xTicks = useMemo(() => {
    const step = bounds.xMax - bounds.xMin <= 25 ? 5 : 10
    const ticks: number[] = []
    for (let v = Math.ceil(bounds.xMin / step) * step; v <= bounds.xMax; v += step) ticks.push(v)
    return ticks
  }, [bounds])
  const yTicks = useMemo(() => {
    const step = bounds.yMax - bounds.yMin <= 25 ? 5 : 10
    const ticks: number[] = []
    for (let v = Math.ceil(bounds.yMin / step) * step; v <= bounds.yMax; v += step) ticks.push(v)
    return ticks
  }, [bounds])

  // Convert SVG-space coords → percent of container (so absolutely-positioned HTML markers line up with SVG)
  const toPctX = (svgX: number) => (svgX / CHART_VB_W) * 100
  const toPctY = (svgY: number) => (svgY / CHART_VB_H) * 100

  const tabLabel = tab === "indirect" ? "Indirect ASR" : "Direct ASR"

  return (
    <section className="border-t border-border/50">
      <div className="mx-auto max-w-7xl px-4 py-20 md:py-28">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="mb-2 text-3xl font-bold md:text-4xl">
              The Safety–Capability <span className="text-primary">Trade-off</span>
            </h2>
            <p className="max-w-3xl text-muted-foreground">
              Each point is an agent. The bottom-right corner — high benign success, low attack success — is the
              <span className="text-foreground font-medium"> ideal frontier</span>. The dashed line traces the
              Pareto-optimal agents: nothing else is both safer <em>and</em> more capable.
            </p>
          </div>
        </div>

        {/* Controls row */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SegmentedControl<AsrTab>
            value={tab}
            onChange={setTab}
            options={[
              { value: "indirect", label: "Indirect ASR vs BSR", icon: <Sparkles className="h-3 w-3" /> },
              { value: "direct", label: "Direct ASR vs BSR", icon: <BrainCircuit className="h-3 w-3" /> },
            ]}
          />
          <SegmentedControl<ViewMode>
            value={mode}
            onChange={setMode}
            options={[
              { value: "combo", label: "By Agent", icon: <Layers3 className="h-3 w-3" /> },
              { value: "framework", label: "By Framework", icon: <Layers3 className="h-3 w-3" /> },
              { value: "model", label: "By Model", icon: <BrainCircuit className="h-3 w-3" /> },
            ]}
          />
        </div>

        {/* Chart container */}
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/80 via-card/50 to-card/80 p-2 shadow-sm shadow-black/5 backdrop-blur-sm">
          {/* Decorative ambient glows */}
          <div className="pointer-events-none absolute inset-0 -z-0">
            <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-rose-500/[0.06] blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-emerald-500/[0.06] blur-3xl" />
          </div>

          <div className="relative aspect-[1000/560] w-full">
            {/* SVG: axes, gridlines, quadrants, frontier */}
            <svg
              viewBox={`0 0 ${CHART_VB_W} ${CHART_VB_H}`}
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
            >
              <defs>
                <linearGradient id="quad-bg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="rgb(244, 63, 94)" stopOpacity="0.12" />
                  <stop offset="45%" stopColor="rgb(244, 63, 94)" stopOpacity="0.01" />
                  <stop offset="55%" stopColor="rgb(16, 185, 129)" stopOpacity="0.02" />
                  <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.16" />
                </linearGradient>
                <radialGradient id="quad-bad-corner" cx="0%" cy="0%" r="55%">
                  <stop offset="0%" stopColor="rgb(244, 63, 94)" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="rgb(244, 63, 94)" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="quad-good-corner" cx="100%" cy="100%" r="55%">
                  <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.11" />
                  <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="frontier-stroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.85" />
                </linearGradient>
              </defs>

              {/* Quadrant background tint (red top-left → green bottom-right) */}
              <rect
                x={CHART_PAD.left}
                y={CHART_PAD.top}
                width={INNER_W}
                height={INNER_H}
                fill="url(#quad-bg)"
              />
              {/* Corner halos to make the "best" and "worst" zones jump out */}
              <rect
                x={CHART_PAD.left}
                y={CHART_PAD.top}
                width={INNER_W}
                height={INNER_H}
                fill="url(#quad-bad-corner)"
              />
              <rect
                x={CHART_PAD.left}
                y={CHART_PAD.top}
                width={INNER_W}
                height={INNER_H}
                fill="url(#quad-good-corner)"
              />

              {/* Gridlines */}
              {xTicks.map((tick) => (
                <line
                  key={`vx-${tick}`}
                  x1={xPos(tick)}
                  y1={CHART_PAD.top}
                  x2={xPos(tick)}
                  y2={CHART_PAD.top + INNER_H}
                  stroke="currentColor"
                  className="text-border/40"
                  strokeWidth={1}
                  strokeDasharray="2 4"
                />
              ))}
              {yTicks.map((tick) => (
                <line
                  key={`hy-${tick}`}
                  x1={CHART_PAD.left}
                  y1={yPos(tick)}
                  x2={CHART_PAD.left + INNER_W}
                  y2={yPos(tick)}
                  stroke="currentColor"
                  className="text-border/40"
                  strokeWidth={1}
                  strokeDasharray="2 4"
                />
              ))}

              {/* Axes */}
              <line
                x1={CHART_PAD.left}
                y1={CHART_PAD.top + INNER_H}
                x2={CHART_PAD.left + INNER_W}
                y2={CHART_PAD.top + INNER_H}
                stroke="currentColor"
                className="text-border"
                strokeWidth={1.5}
              />
              <line
                x1={CHART_PAD.left}
                y1={CHART_PAD.top}
                x2={CHART_PAD.left}
                y2={CHART_PAD.top + INNER_H}
                stroke="currentColor"
                className="text-border"
                strokeWidth={1.5}
              />

              {/* Tick labels */}
              {xTicks.map((tick) => (
                <text
                  key={`xt-${tick}`}
                  x={xPos(tick)}
                  y={CHART_PAD.top + INNER_H + 18}
                  textAnchor="middle"
                  className="fill-muted-foreground font-mono"
                  fontSize="11"
                >
                  {tick}
                </text>
              ))}
              {yTicks.map((tick) => (
                <text
                  key={`yt-${tick}`}
                  x={CHART_PAD.left - 10}
                  y={yPos(tick) + 4}
                  textAnchor="end"
                  className="fill-muted-foreground font-mono"
                  fontSize="11"
                >
                  {tick}
                </text>
              ))}

              {/* Axis titles */}
              <text
                x={CHART_PAD.left + INNER_W / 2}
                y={CHART_VB_H - 12}
                textAnchor="middle"
                className="fill-foreground font-semibold uppercase tracking-wider"
                fontSize="12"
              >
                BSR — Benign Success Rate (%) →
              </text>
              <text
                x={-(CHART_PAD.top + INNER_H / 2)}
                y={18}
                textAnchor="middle"
                transform="rotate(-90)"
                className="fill-foreground font-semibold uppercase tracking-wider"
                fontSize="12"
              >
                ↑ {tabLabel} (%)
              </text>

              {/* Pareto frontier */}
              {paretoPath && (
                <path
                  d={paretoPath}
                  fill="none"
                  stroke="url(#frontier-stroke)"
                  strokeWidth={2}
                  strokeDasharray="6 5"
                  className="transition-all duration-700"
                />
              )}

              {/* Corner annotations */}
              <text
                x={CHART_PAD.left + 10}
                y={CHART_PAD.top + 18}
                className="fill-rose-500/80 font-semibold uppercase tracking-wider"
                fontSize="10"
              >
                ⚠ Worst: vulnerable & weak
              </text>
              <text
                x={CHART_PAD.left + INNER_W - 10}
                y={CHART_PAD.top + INNER_H - 10}
                textAnchor="end"
                className="fill-emerald-500/85 font-semibold uppercase tracking-wider"
                fontSize="10"
              >
                ★ Ideal: capable & safe
              </text>
            </svg>

            {/* HTML marker layer */}
            <div className="pointer-events-none absolute inset-0">
              {points.map((p) => {
                const sx = xPos(p.bsr)
                const sy = yPos(p.asr)
                const isPareto = pareto.has(p.key)
                const isChampion = p.key === championKey
                const isHovered = hoveredKey === p.key
                return (
                  <div
                    key={p.key}
                    className={cn(
                      "pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-[cubic-bezier(0.34,1.2,0.64,1)]",
                      isHovered ? "z-30" : isChampion ? "z-20" : isPareto ? "z-10" : "z-0"
                    )}
                    style={{ left: `${toPctX(sx)}%`, top: `${toPctY(sy)}%` }}
                    onMouseEnter={() => setHoveredKey(p.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                  >
                    <div className="flex flex-col items-center">
                      {/* Marker */}
                      <div className="relative">
                        {isChampion && (
                          <Crown
                            className="absolute -top-5 left-1/2 -translate-x-1/2 text-amber-400 drop-shadow-[0_2px_4px_rgba(251,191,36,0.5)]"
                            size={16}
                            strokeWidth={2.5}
                            fill="currentColor"
                          />
                        )}
                        <div
                          className={cn(
                            "flex items-center justify-center rounded-full bg-background shadow-lg transition-all duration-300",
                            isHovered
                              ? "h-14 w-14 ring-2 ring-primary/60 ring-offset-2 ring-offset-background scale-110"
                              : isChampion
                                ? "h-12 w-12 ring-2 ring-amber-400/70 ring-offset-2 ring-offset-background"
                                : isPareto
                                  ? "h-11 w-11 ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-background"
                                  : "h-10 w-10 ring-1 ring-border"
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
                            <span className="text-sm font-bold text-foreground">{p.fallbackInitial}</span>
                          )}
                        </div>
                      </div>

                      {/* Label */}
                      <div
                        className={cn(
                          "mt-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-center transition-all duration-300",
                          isHovered ? "bg-foreground text-background shadow-md" : "bg-card/70 text-foreground/90 backdrop-blur-sm"
                        )}
                      >
                        <div className="text-[11px] font-semibold leading-tight">{p.primaryLabel}</div>
                        <div className={cn(
                          "text-[9px] leading-tight",
                          isHovered ? "text-background/70" : "text-muted-foreground"
                        )}>
                          {p.secondaryLabel}
                        </div>
                      </div>

                      {/* Hover tooltip */}
                      {isHovered && (
                        <div className="absolute left-1/2 top-full mt-12 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-xl">
                          <div className="font-semibold text-foreground">{p.primaryLabel}</div>
                          <div className="text-muted-foreground">{p.secondaryLabel}</div>
                          <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono text-[11px]">
                            <span className="text-muted-foreground">BSR</span>
                            <span className="text-right font-semibold text-emerald-500">{p.bsr.toFixed(1)}%</span>
                            <span className="text-muted-foreground">{tabLabel}</span>
                            <span className="text-right font-semibold text-rose-500">{p.asr.toFixed(1)}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}

            {!loading && points.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                No data available for this view.
              </div>
            )}
          </div>

          {/* Legend strip */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-border/50 px-4 py-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Crown className="h-3 w-3 text-amber-400" fill="currentColor" />
              Champion
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full ring-2 ring-emerald-500/60 ring-offset-1 ring-offset-background" />
              Pareto-optimal
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-px w-6 border-t-2 border-dashed border-emerald-500/70" />
              Optimal frontier
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <span className="font-mono">↘</span> Move toward bottom-right for safer & more capable agents
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

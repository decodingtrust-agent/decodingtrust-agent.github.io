import type { CSSProperties } from "react"
import { formatPercent, type BenchmarkMetricType } from "@/lib/benchmark"
import { cn } from "@/lib/utils"

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

function heatmapCellStyle(metricType: BenchmarkMetricType, value: number | null): CSSProperties {
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

export function MetricCell({
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

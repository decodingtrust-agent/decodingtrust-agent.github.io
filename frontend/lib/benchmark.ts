"use client"

import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

export type BenchmarkMetricType = "bsr" | "direct_asr" | "indirect_asr"

export interface BenchmarkRun {
  slug: string
  name: string
  sourceLabel: string
  sourcePath: string | null
  isPublished: boolean
}

export interface BenchmarkDomain {
  id?: string
  key: string
  label: string
  shortLabel: string
  sortOrder: number
}

export interface BenchmarkFramework {
  id?: string
  key: string
  name: string
  sortOrder: number
}

export interface BenchmarkModel {
  id?: string
  key: string
  name: string
  sortOrder: number
}

export interface BenchmarkScore {
  id?: string
  runId?: string
  frameworkId?: string
  modelId?: string
  domainId?: string
  runSlug: string
  metricType: BenchmarkMetricType
  frameworkKey: string
  frameworkName: string
  modelKey: string
  modelName: string
  domainKey: string
  domainLabel: string
  value: number | null
}

export interface BenchmarkMetricSummary {
  metricType: BenchmarkMetricType
  metricLabel: string
  overall: number | null
  entryCount: number
  scoredCells: number
  domainAverages: Record<string, number | null>
}

export interface BenchmarkEntry {
  entryKey: string
  metricType: BenchmarkMetricType
  metricLabel: string
  frameworkKey: string
  frameworkName: string
  modelKey: string
  modelName: string
  domainScores: Record<string, number | null>
  overall: number | null
  scoredDomains: number
}

export interface BenchmarkCategory {
  key: string
  label: string
  taskCount: number | null
}

export interface BenchmarkCategoryEntry {
  frameworkKey: string
  frameworkName: string
  modelKey: string
  modelName: string
  categoryScores: Record<string, number | null>
  overall: number | null
  scoredCategories: number
}

export interface BenchmarkCategoryTable {
  domainKey: string
  metricType: BenchmarkMetricType
  categories: BenchmarkCategory[]
  entries: BenchmarkCategoryEntry[]
}

export interface BenchmarkDataset {
  run: BenchmarkRun
  metrics: { key: BenchmarkMetricType; label: string; entryCount: number }[]
  domains: BenchmarkDomain[]
  frameworks: BenchmarkFramework[]
  models: BenchmarkModel[]
  scores: BenchmarkScore[]
  entries: BenchmarkEntry[]
  averages: Record<BenchmarkMetricType, BenchmarkMetricSummary>
  categoryTables: BenchmarkCategoryTable[]
}

export interface BenchmarkFilters {
  metricType: BenchmarkMetricType
  frameworkKey: string
  modelKey: string
  domainKeys: string[]
  searchQuery: string
}

const STATIC_DATA_URL = "/traj-api/benchmark"

/**
 * (frameworkKey, modelKey) pairs that should not appear in any leaderboard, table,
 * or aggregate metric. Filtered at the data layer so every downstream consumer
 * (entries, averages, category tables, model dropdowns) is consistent.
 */
const EXCLUDED_COMBINATIONS: ReadonlyArray<{ frameworkKey: string; modelKey: string }> = [
  { frameworkKey: "openai-agents", modelKey: "gpt-5-1" },
]

function isExcludedCombination(frameworkKey: string, modelKey: string): boolean {
  return EXCLUDED_COMBINATIONS.some(
    (combo) => combo.frameworkKey === frameworkKey && combo.modelKey === modelKey
  )
}

const METRIC_LABELS: Record<BenchmarkMetricType, string> = {
  bsr: "BSR",
  direct_asr: "Direct ASR",
  indirect_asr: "Indirect ASR",
}

export const METRIC_OPTIONS: { key: BenchmarkMetricType; label: string }[] = [
  { key: "bsr", label: "BSR" },
  { key: "direct_asr", label: "Direct ASR" },
  { key: "indirect_asr", label: "Indirect ASR" },
]

let datasetPromise: Promise<BenchmarkDataset> | null = null

function average(values: Array<number | null>) {
  const cleanValues = values.filter((value): value is number => typeof value === "number")
  if (cleanValues.length === 0) {
    return null
  }

  return Math.round((cleanValues.reduce((sum, value) => sum + value, 0) / cleanValues.length) * 10) / 10
}

function buildDataset(source: BenchmarkDataset) {
  const domainOrder = new Map(source.domains.map((domain) => [domain.key, domain.sortOrder]))
  const frameworkOrder = new Map(source.frameworks.map((framework) => [framework.key, framework.sortOrder]))
  const modelOrder = new Map(source.models.map((model) => [model.key, model.sortOrder]))
  const metricOrder = new Map(METRIC_OPTIONS.map((metric, index) => [metric.key, index]))

  const filteredScores = source.scores.filter(
    (score) => !isExcludedCombination(score.frameworkKey, score.modelKey)
  )

  const groupedEntries = new Map<string, BenchmarkEntry>()
  for (const score of filteredScores) {
    const entryKey = `${score.metricType}::${score.frameworkKey}::${score.modelKey}`
    if (!groupedEntries.has(entryKey)) {
      groupedEntries.set(entryKey, {
        entryKey,
        metricType: score.metricType,
        metricLabel: METRIC_LABELS[score.metricType],
        frameworkKey: score.frameworkKey,
        frameworkName: score.frameworkName,
        modelKey: score.modelKey,
        modelName: score.modelName,
        domainScores: Object.fromEntries(source.domains.map((domain) => [domain.key, null])),
        overall: null,
        scoredDomains: 0,
      })
    }

    groupedEntries.get(entryKey)!.domainScores[score.domainKey] = score.value
  }

  const entries = Array.from(groupedEntries.values()).map((entry) => {
    const domainValues = Object.values(entry.domainScores)
    const scoredDomains = domainValues.filter((value) => typeof value === "number").length
    return {
      ...entry,
      scoredDomains,
      overall: average(domainValues),
    }
  })

  entries.sort((left, right) => {
    return (
      (metricOrder.get(left.metricType) ?? 0) - (metricOrder.get(right.metricType) ?? 0) ||
      (frameworkOrder.get(left.frameworkKey) ?? 0) - (frameworkOrder.get(right.frameworkKey) ?? 0) ||
      (modelOrder.get(left.modelKey) ?? 0) - (modelOrder.get(right.modelKey) ?? 0)
    )
  })

  const averages = Object.fromEntries(
    METRIC_OPTIONS.map(({ key }) => {
      const metricScores = filteredScores.filter((score) => score.metricType === key)
      const domainAverages = Object.fromEntries(
        source.domains.map((domain) => [
          domain.key,
          average(metricScores.filter((score) => score.domainKey === domain.key).map((score) => score.value)),
        ])
      )

      const entryCount = new Set(
        metricScores.map((score) => `${score.frameworkKey}::${score.modelKey}`)
      ).size

      return [
        key,
        {
          metricType: key,
          metricLabel: METRIC_LABELS[key],
          overall: average(metricScores.map((score) => score.value)),
          entryCount,
          scoredCells: metricScores.filter((score) => typeof score.value === "number").length,
          domainAverages,
        } satisfies BenchmarkMetricSummary,
      ]
    })
  ) as Record<BenchmarkMetricType, BenchmarkMetricSummary>

  const metrics = METRIC_OPTIONS.map((metric) => ({
    key: metric.key,
    label: metric.label,
    entryCount: entries.filter((entry) => entry.metricType === metric.key).length,
  }))

  const categoryTables = (source.categoryTables ?? [])
    .map((table) => ({
      ...table,
      entries: table.entries.filter(
        (entry) => !isExcludedCombination(entry.frameworkKey, entry.modelKey)
      ),
    }))
    .sort((left, right) => {
      return (
        (domainOrder.get(left.domainKey) ?? 0) - (domainOrder.get(right.domainKey) ?? 0) ||
        (metricOrder.get(left.metricType) ?? 0) - (metricOrder.get(right.metricType) ?? 0)
      )
    })

  return {
    ...source,
    metrics,
    domains: [...source.domains].sort((left, right) => left.sortOrder - right.sortOrder),
    frameworks: [...source.frameworks].sort((left, right) => left.sortOrder - right.sortOrder),
    models: [...source.models].sort((left, right) => left.sortOrder - right.sortOrder),
    scores: filteredScores,
    entries,
    averages,
    categoryTables,
  }
}

async function fetchStaticDataset() {
  const response = await fetch(STATIC_DATA_URL)
  if (!response.ok) {
    throw new Error("Failed to load bundled benchmark data")
  }

  const source = (await response.json()) as BenchmarkDataset
  return buildDataset(source)
}

function mergeSortedByKey<T extends { key: string; sortOrder: number }>(preferred: T[], fallback: T[]) {
  const byKey = new Map<string, T>()
  for (const item of fallback) {
    byKey.set(item.key, item)
  }
  for (const item of preferred) {
    byKey.set(item.key, item)
  }
  return Array.from(byKey.values()).sort((left, right) => left.sortOrder - right.sortOrder)
}

async function fetchSupabaseDataset(staticDataset: BenchmarkDataset | null) {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    return null
  }

  const { data: runs, error: runError } = await supabase
    .from("benchmark_runs")
    .select("id, slug, name, source_label, source_path, is_published")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(1)

  if (runError || !runs || runs.length === 0) {
    return null
  }

  const run = runs[0]

  const [
    { data: domains, error: domainsError },
    { data: frameworks, error: frameworksError },
    { data: models, error: modelsError },
    { data: scores, error: scoresError },
  ] = await Promise.all([
    supabase.from("benchmark_domains").select("id, key, label, short_label, sort_order").order("sort_order"),
    supabase.from("benchmark_frameworks").select("id, key, name, sort_order").order("sort_order"),
    supabase.from("benchmark_models").select("id, key, name, sort_order").order("sort_order"),
    supabase
      .from("benchmark_scores")
      .select("id, run_id, framework_id, model_id, domain_id, metric_type, value")
      .eq("run_id", run.id),
  ])

  if (domainsError || frameworksError || modelsError || scoresError || !domains || !frameworks || !models || !scores) {
    return null
  }

  const domainsById = new Map(domains.map((domain) => [domain.id, domain]))
  const frameworksById = new Map(frameworks.map((framework) => [framework.id, framework]))
  const modelsById = new Map(models.map((model) => [model.id, model]))

  const source: BenchmarkDataset = {
    run: {
      slug: run.slug,
      name: run.name,
      sourceLabel: run.source_label,
      sourcePath: run.source_path,
      isPublished: run.is_published,
    },
    metrics: METRIC_OPTIONS.map((metric) => ({ ...metric, entryCount: 0 })),
    domains: domains.map((domain) => ({
      id: domain.id,
      key: domain.key,
      label: domain.label,
      shortLabel: domain.short_label ?? domain.label,
      sortOrder: domain.sort_order,
    })),
    frameworks: frameworks.map((framework) => ({
      id: framework.id,
      key: framework.key,
      name: framework.name,
      sortOrder: framework.sort_order,
    })),
    models: models.map((model) => ({
      id: model.id,
      key: model.key,
      name: model.name,
      sortOrder: model.sort_order,
    })),
    scores: scores.flatMap((score) => {
      const domain = domainsById.get(score.domain_id)
      const framework = frameworksById.get(score.framework_id)
      const model = modelsById.get(score.model_id)
      if (!domain || !framework || !model) {
        return []
      }
      if (isExcludedCombination(framework.key, model.key)) {
        return []
      }

      return [
        {
          id: score.id,
          runId: score.run_id,
          frameworkId: score.framework_id,
          modelId: score.model_id,
          domainId: score.domain_id,
          runSlug: run.slug,
          metricType: score.metric_type as BenchmarkMetricType,
          frameworkKey: framework.key,
          frameworkName: framework.name,
          modelKey: model.key,
          modelName: model.name,
          domainKey: domain.key,
          domainLabel: domain.label,
          value: score.value === null ? null : Number(score.value),
        } satisfies BenchmarkScore,
      ]
    }),
    categoryTables: staticDataset?.categoryTables ?? [],
    entries: [],
    averages: {
      bsr: {
        metricType: "bsr",
        metricLabel: METRIC_LABELS.bsr,
        overall: null,
        entryCount: 0,
        scoredCells: 0,
        domainAverages: {},
      },
      direct_asr: {
        metricType: "direct_asr",
        metricLabel: METRIC_LABELS.direct_asr,
        overall: null,
        entryCount: 0,
        scoredCells: 0,
        domainAverages: {},
      },
      indirect_asr: {
        metricType: "indirect_asr",
        metricLabel: METRIC_LABELS.indirect_asr,
        overall: null,
        entryCount: 0,
        scoredCells: 0,
        domainAverages: {},
      },
    },
  }

  if (staticDataset) {
    source.frameworks = mergeSortedByKey(source.frameworks, staticDataset.frameworks)
    source.models = mergeSortedByKey(source.models, staticDataset.models)
  }

  return buildDataset(source)
}

export async function loadBenchmarkDataset(options?: { forceRefresh?: boolean }) {
  if (!datasetPromise || options?.forceRefresh) {
    datasetPromise = (async () => {
      const staticDataset = await fetchStaticDataset()
      const remoteDataset = await fetchSupabaseDataset(staticDataset)
      if (remoteDataset) {
        return remoteDataset
      }

      return staticDataset
    })()
  }

  return datasetPromise
}

export function resetBenchmarkDatasetCache() {
  datasetPromise = null
}

export function getMetricDescription(metricType: BenchmarkMetricType) {
  switch (metricType) {
    case "bsr":
      return "Benign task success rate. Higher is better."
    case "direct_asr":
      return "Attack success rate under direct malicious prompts. Lower is more secure."
    case "indirect_asr":
      return "Attack success rate under indirect prompt injection. Lower is more secure."
  }
}

export function isHigherBetterMetric(metricType: BenchmarkMetricType) {
  return metricType === "bsr"
}

export function formatPercent(value: number | null, digits = 1) {
  if (value === null) {
    return "--"
  }

  return `${value.toFixed(digits)}%`
}

export function computeEntryOverall(entry: BenchmarkEntry, selectedDomainKeys: string[]) {
  const values =
    selectedDomainKeys.length === 0
      ? Object.values(entry.domainScores)
      : selectedDomainKeys.map((domainKey) => entry.domainScores[domainKey] ?? null)
  return average(values)
}

export function filterBenchmarkEntries(dataset: BenchmarkDataset, filters: BenchmarkFilters) {
  const query = filters.searchQuery.trim().toLowerCase()

  return dataset.entries.filter((entry) => {
    if (entry.metricType !== filters.metricType) {
      return false
    }
    if (filters.frameworkKey !== "all" && entry.frameworkKey !== filters.frameworkKey) {
      return false
    }
    if (filters.modelKey !== "all" && entry.modelKey !== filters.modelKey) {
      return false
    }
    if (filters.domainKeys.length > 0) {
      const hasSelectedScore = filters.domainKeys.some((domainKey) => entry.domainScores[domainKey] !== null)
      if (!hasSelectedScore) {
        return false
      }
    }
    if (!query) {
      return true
    }

    return (
      entry.frameworkName.toLowerCase().includes(query) ||
      entry.modelName.toLowerCase().includes(query) ||
      `${entry.frameworkName} ${entry.modelName}`.toLowerCase().includes(query)
    )
  })
}

export function rankBenchmarkEntries(entries: BenchmarkEntry[], selectedDomainKeys: string[]) {
  return [...entries]
    .map((entry) => ({
      ...entry,
      overallForSelection: computeEntryOverall(entry, selectedDomainKeys),
    }))
    .sort((left, right) => {
      if (left.overallForSelection === null && right.overallForSelection === null) {
        return left.frameworkName.localeCompare(right.frameworkName) || left.modelName.localeCompare(right.modelName)
      }
      if (left.overallForSelection === null) {
        return 1
      }
      if (right.overallForSelection === null) {
        return -1
      }
      return (
        right.overallForSelection - left.overallForSelection ||
        left.frameworkName.localeCompare(right.frameworkName) ||
        left.modelName.localeCompare(right.modelName)
      )
    })
}

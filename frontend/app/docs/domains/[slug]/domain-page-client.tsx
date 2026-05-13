"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChevronRight,
  Database,
  ListChecks,
  Server,
  ShieldAlert,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { DOMAIN_BY_KEY } from "@/lib/domains"
import { domainAppendix } from "@/lib/domains.generated"
import { environments } from "@/lib/environments.generated"
import { renderInline } from "@/components/docs/markdown"
import {
  formatPercent,
  loadBenchmarkDataset,
  type BenchmarkDataset,
  type BenchmarkMetricType,
} from "@/lib/benchmark"

const METRICS: { key: BenchmarkMetricType; label: string; hint: string; lowerBetter: boolean }[] = [
  { key: "indirect_asr", label: "Indirect ASR", hint: "Lower = safer", lowerBetter: true },
  { key: "direct_asr", label: "Direct ASR", hint: "Lower = safer", lowerBetter: true },
  { key: "bsr", label: "BSR", hint: "Higher = more capable", lowerBetter: false },
]

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

function heatmapStyle(metricType: BenchmarkMetricType, value: number | null): React.CSSProperties {
  if (value === null) return {}
  const good = normalizeScore(metricType, value)
  const hue = good * 135
  const saturation = good < 0.35 ? 82 : 70
  const alpha = good < 0.35 ? 0.22 : good > 0.65 ? 0.2 : 0.18
  return { backgroundColor: `hsla(${hue}, ${saturation}%, 50%, ${alpha})` }
}

function heatmapTextClass(metricType: BenchmarkMetricType, value: number | null) {
  if (value === null) return "text-muted-foreground"
  const good = normalizeScore(metricType, value)
  if (good >= 0.65) return "text-emerald-600 dark:text-emerald-400"
  if (good >= 0.45) return "text-foreground"
  return "text-rose-600 dark:text-rose-400"
}

function BrandLogo({ logoPath, alt }: { logoPath?: string; alt: string }) {
  return logoPath ? (
    <img src={logoPath} alt={alt} className="h-6 w-6 shrink-0 object-contain" />
  ) : null
}

type DomainRow = {
  frameworkKey: string
  frameworkName: string
  modelKey: string
  modelName: string
  values: Record<BenchmarkMetricType, number | null>
}

export function DomainPageClient({ slug }: { slug: string }) {
  const meta = DOMAIN_BY_KEY[slug]!
  const [dataset, setDataset] = useState<BenchmarkDataset | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBenchmarkDataset()
      .then(setDataset)
      .finally(() => setLoading(false))
  }, [])

  const rows: DomainRow[] = (() => {
    if (!dataset) return []
    const byCombo = new Map<string, DomainRow>()
    for (const score of dataset.scores) {
      if (score.domainKey !== slug) continue
      const key = `${score.frameworkKey}::${score.modelKey}`
      if (!byCombo.has(key)) {
        byCombo.set(key, {
          frameworkKey: score.frameworkKey,
          frameworkName: score.frameworkName,
          modelKey: score.modelKey,
          modelName: score.modelName,
          values: { bsr: null, direct_asr: null, indirect_asr: null },
        })
      }
      byCombo.get(key)!.values[score.metricType] = score.value
    }
    // Sort by indirect_asr desc (most vulnerable first), nulls last.
    return Array.from(byCombo.values()).sort((a, b) => {
      const left = a.values.indirect_asr
      const right = b.values.indirect_asr
      if (left === null && right === null) return 0
      if (left === null) return 1
      if (right === null) return -1
      return right - left
    })
  })()

  const domainEnvs = environments.filter((e) => e.domainKey === slug)
  const appendix = domainAppendix[slug]

  return (
    <article className="px-6 py-10 lg:px-12 lg:py-14 max-w-6xl">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Link href="/docs" className="transition-colors hover:text-foreground">
          Docs
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/docs#domains" className="transition-colors hover:text-foreground">
          Domains
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{meta.label}</span>
      </nav>

      {/* Hero card */}
      <header
        className={cn(
          "relative mb-10 overflow-hidden rounded-2xl border border-border/60 p-8 md:p-10",
          "bg-gradient-to-br",
          meta.accent
        )}
      >
        <div className="relative z-10 max-w-3xl">
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-background/70 text-foreground backdrop-blur">
              <Database className="h-5 w-5" />
            </span>
            <Badge variant="secondary" className="font-medium">
              {meta.shortLabel}
            </Badge>
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{meta.label}</h1>
          <p className="mt-3 text-base text-foreground/80 md:text-lg">{meta.description}</p>
        </div>
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-foreground/5 blur-2xl" />
      </header>

      {/* Appendix-derived content */}
      {appendix?.overview?.length ? (
        <section className="mb-12">
          <div className="mb-5 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-2xl font-semibold tracking-tight">Domain overview</h2>
          </div>
          <div className="prose prose-zinc dark:prose-invert max-w-none space-y-4 text-[15px] leading-7">
            {appendix.overview.map((p, i) => (
              <p key={i} className="text-foreground/90">
                {renderInline(p)}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      {appendix?.benignTasks?.length ? (
        <section className="mb-12">
          <div className="mb-5 flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-2xl font-semibold tracking-tight">Benign task categories</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {appendix.benignTasks.map((task) => (
              <div
                key={task.name}
                className="rounded-xl border border-border/60 bg-card/60 p-4"
              >
                <h3 className="mb-1 text-sm font-semibold text-foreground">{task.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {renderInline(task.description)}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {appendix?.domainPolicy || appendix?.generalPolicy ? (
        <section className="mb-12">
          <div className="mb-5 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-2xl font-semibold tracking-tight">Policy & risk framework</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {appendix.domainPolicy ? (
              <div className="rounded-xl border border-border/60 bg-card/60 p-5">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Domain policies
                </h3>
                <p className="text-sm leading-6 text-foreground/90">
                  {renderInline(appendix.domainPolicy)}
                </p>
              </div>
            ) : null}
            {appendix.generalPolicy ? (
              <div className="rounded-xl border border-border/60 bg-card/60 p-5">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  General regulatory frameworks
                </h3>
                <p className="text-sm leading-6 text-foreground/90">
                  {renderInline(appendix.generalPolicy)}
                </p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {appendix?.indirectThreat || appendix?.directThreat ? (
        <section className="mb-12">
          <div className="mb-5 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-2xl font-semibold tracking-tight">Threat models</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {appendix.indirectThreat ? (
              <div className="rounded-xl border border-border/60 bg-card/60 p-5">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Indirect threat model
                </h3>
                <p className="text-sm leading-6 text-foreground/90">
                  {renderInline(appendix.indirectThreat)}
                </p>
              </div>
            ) : null}
            {appendix.directThreat ? (
              <div className="rounded-xl border border-border/60 bg-card/60 p-5">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Direct threat model
                </h3>
                <p className="text-sm leading-6 text-foreground/90">
                  {renderInline(appendix.directThreat)}
                </p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Per-domain leaderboard */}
      <section className="mb-12">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Results in this domain</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Indirect / Direct ASR (lower is safer) and BSR (higher is more capable) for every
              evaluated agent on the {meta.label} suite.
            </p>
          </div>
          <Link
            href="/leaderboard"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:block"
          >
            Full leaderboard →
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-secondary/20 align-bottom">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Framework
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Model
                </th>
                {METRICS.map((m) => {
                  const Arrow = m.lowerBetter ? ArrowDown : ArrowUp
                  return (
                    <th
                      key={m.key}
                      className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <span>{m.label}</span>
                        <Arrow className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                      </div>
                      <div className="mt-0.5 text-[10px] normal-case tracking-normal text-muted-foreground/70">
                        {m.hint}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-5 rounded bg-muted/40" />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map((row) => (
                    <tr
                      key={`${row.frameworkKey}-${row.modelKey}`}
                      className="border-b border-border/50 transition-colors last:border-0 hover:bg-secondary/10"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <BrandLogo
                            logoPath={FRAMEWORK_LOGO_PATHS[row.frameworkKey]}
                            alt={`${row.frameworkName} logo`}
                          />
                          <span className="truncate font-medium">{row.frameworkName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <BrandLogo
                            logoPath={MODEL_LOGO_PATHS[row.modelKey]}
                            alt={`${row.modelName} logo`}
                          />
                          <span className="truncate font-medium">{row.modelName}</span>
                        </div>
                      </td>
                      {METRICS.map((m) => {
                        const value = row.values[m.key]
                        return (
                          <td key={m.key} className="px-3 py-3 text-center">
                            {value === null ? (
                              <span className="font-mono text-sm text-muted-foreground">--</span>
                            ) : (
                              <span
                                className={cn(
                                  "inline-flex items-center justify-center rounded-md px-2 py-1 font-mono text-xs font-semibold",
                                  heatmapTextClass(m.key, value)
                                )}
                                style={heatmapStyle(m.key, value)}
                              >
                                {formatPercent(value)}
                              </span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Environments in this domain */}
      {domainEnvs.length > 0 ? (
        <section className="mb-12">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold tracking-tight">Environments</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {domainEnvs.length} {domainEnvs.length === 1 ? "environment" : "environments"} in
              the {meta.label} domain.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {domainEnvs
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((env) => (
                <Link
                  key={env.slug}
                  href={`/docs/environments/${env.slug}`}
                  className="group block overflow-hidden rounded-xl border border-border/60 bg-card/60 transition-all hover:border-primary/40 hover:shadow-md"
                >
                  {env.screenshots[0] ? (
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted/30">
                      <Image
                        src={env.screenshots[0].src}
                        alt={env.name}
                        fill
                        sizes="(min-width: 1024px) 33vw, 50vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-muted/40 to-muted/10 text-muted-foreground">
                      <Server className="h-10 w-10 opacity-40" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="mb-1 truncate font-semibold text-foreground">{env.name}</h3>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {env.paragraphs[0]?.replace(/\*+/g, "") ?? ""}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </section>
      ) : null}
    </article>
  )
}

"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowDown, ArrowUp, Code2, Landmark, Users } from "lucide-react"
import { MetricCell } from "@/benchmarks/components/metric-cell"
import { MAS_ROOT, MAS_VERSION, MAS_TAGLINE } from "@/benchmarks/registry"
import { MAS_RESULT_DOMAINS, MAS_RESULTS, resultAverage, resultScores } from "./leaderboard-data"
import { cn } from "@/lib/utils"

type ResultDomain = (typeof MAS_RESULT_DOMAINS)[number]

function DomainResults({ domain }: { domain: ResultDomain }) {
  const [sort, setSort] = useState({ column: -1, ascending: true })
  const rows = useMemo(() => MAS_RESULTS.map((result) => ({
    ...result, scores: resultScores(result, domain.key), average: resultAverage(result, domain.key),
  })).sort((a, b) => {
    const first = sort.column < 0 ? a.average : a.scores[sort.column]
    const second = sort.column < 0 ? b.average : b.scores[sort.column]
    return (first - second) * (sort.ascending ? 1 : -1)
  }), [domain.key, sort])
  const Icon = domain.key === "personal" ? Users : Code2
  const heading = (label: string, column: number) => (
    <button onClick={() => setSort({ column, ascending: sort.column === column ? !sort.ascending : true })}
      className="inline-flex items-center justify-center gap-1 text-left hover:text-foreground" aria-label={`Sort ${domain.label} by ${label}`}>
      {label}{sort.column === column && (sort.ascending ? <ArrowUp className="h-3 w-3 shrink-0" /> : <ArrowDown className="h-3 w-3 shrink-0" />)}
    </button>
  )

  return (
    <section id={`domain-${domain.key}`} className="scroll-mt-24 overflow-hidden rounded-3xl border border-border/70 bg-card/70 shadow-sm shadow-black/5">
      <div className={cn("border-b border-border/60 p-6 md:p-8", domain.key === "personal" ? "bg-gradient-to-r from-cyan-500/10 to-transparent" : "bg-gradient-to-r from-violet-500/10 to-transparent")}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3"><Icon className="h-6 w-6 text-primary" /><h2 className="text-2xl font-semibold tracking-tight">{domain.label}</h2></div>
          <span className="rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground">Indirect ASR ↓</span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Attack success rate by risk category. Lower is more robust.</p>
      </div>
      <div className="overflow-x-auto" role="region" aria-label={`${domain.label} results`} tabIndex={0}>
        <table className="w-full min-w-[1240px] table-auto text-sm" aria-label={`${domain.label} attack success rates`}>
          <thead><tr className="border-b border-border bg-secondary/20 align-bottom">
            <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground">#</th>
            <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground">Agent</th>
            <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground">Model</th>
            <th className="border-r border-border/80 px-3 py-4 text-right text-xs font-medium text-muted-foreground">{heading("Overall", -1)}</th>
            {domain.categories.map((category, column) => <th key={category} className="min-w-[96px] px-2 py-4 text-center text-[11px] font-medium leading-tight text-muted-foreground">{heading(category, column)}</th>)}
          </tr></thead>
          <tbody>{rows.map((row, index) => <tr key={row.id} data-result-id={row.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/10">
            <td className="px-3 py-4 font-mono text-sm text-muted-foreground">{index + 1}</td>
            <td className="px-3 py-4"><span className="inline-flex items-center gap-2 whitespace-nowrap font-medium">
              {row.framework === "OpenClaw" && <img src="/logo/openclaw.svg" alt="" className="h-5 w-5 object-contain" />}
              {row.framework}{row.a2a && <span className="rounded border border-primary/25 bg-primary/5 px-1.5 py-0.5 text-[10px] text-primary">A2A</span>}
            </span></td>
            <td className="px-3 py-4"><span className="inline-flex items-center gap-2 whitespace-nowrap text-xs">
              <img src={row.model.startsWith("GPT") ? "/logo/openai-color.svg" : "/logo/claude.svg"} alt="" className="h-5 w-5 object-contain" />{row.model}
            </span></td>
            <td className="border-r border-border/80 px-3 py-4 text-right" data-metric="overall"><MetricCell metricType="indirect_asr" value={row.average} emphasis /></td>
            {row.scores.map((value, column) => <td key={domain.categories[column]} className="px-2 py-4 text-center" data-category={domain.categories[column]}><MetricCell metricType="indirect_asr" value={value} /></td>)}
          </tr>)}</tbody>
        </table>
      </div>
    </section>
  )
}

export function MasLeaderboard() {
  return (
    <section className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb"><Link href="/leaderboard" className="hover:text-foreground">Leaderboard</Link><span>/</span><span className="text-foreground">DTap-MAS</span></nav>
        <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-bold tracking-tight md:text-4xl">DTap-MAS Leaderboard</h1><span className="rounded border border-border px-2 py-1 text-xs text-muted-foreground">v{MAS_VERSION}</span></div>
        <p className="mt-4 max-w-3xl text-muted-foreground">{MAS_TAGLINE}. Compare attack success rates across agent frameworks, models and A2A configurations.</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {["Personal", "Coding", "Finance"].map((name) => <a key={name} href={`#domain-${name.toLowerCase()}`} className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">{name}</a>)}
          <Link href={MAS_ROOT} className="ml-auto text-sm text-primary hover:underline">Explore tasks →</Link>
        </div>
        <div className="mt-10 space-y-8">
          {MAS_RESULT_DOMAINS.map((domain) => <DomainResults key={domain.key} domain={domain} />)}
          <section id="domain-finance" className="scroll-mt-24 rounded-3xl border border-dashed border-border bg-card/40 p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="flex items-center gap-3 text-2xl font-semibold"><Landmark className="h-6 w-6 text-primary" />Finance</h2><span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">Coming soon</span></div>
          </section>
        </div>
      </div>
    </section>
  )
}

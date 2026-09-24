"use client"

import { useState } from "react"
import { AlertTriangle, ArrowDown, ArrowUp, Check, Copy, Download, ExternalLink, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { INDUSTRY_REPORTS, type IndustryDomainRow, type IndustryReport } from "@/lib/industry"

/* Reuse the leaderboard's heat scale so a number means the same thing here as
   it does on /leaderboard. Mirrors normalizeScore() in leaderboard-preview. */
function normalizeScore(kind: "asr" | "bsr", value: number): number {
  const clamped = Math.max(0, Math.min(100, value))
  if (kind === "bsr") {
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

function heatStyle(kind: "asr" | "bsr", value: number): React.CSSProperties {
  const good = normalizeScore(kind, value)
  const hue = good * 135
  const saturation = good < 0.35 ? 82 : 70
  const alpha = good < 0.35 ? 0.22 : good > 0.65 ? 0.2 : 0.18
  return { backgroundColor: `hsla(${hue}, ${saturation}%, 50%, ${alpha})` }
}

function heatText(kind: "asr" | "bsr", value: number) {
  const good = normalizeScore(kind, value)
  if (good >= 0.65) return "text-emerald-600 dark:text-emerald-400"
  if (good >= 0.45) return "text-foreground"
  return "text-rose-600 dark:text-rose-400"
}

function ScoreCell({
  kind,
  value,
  rank,
  tie,
}: {
  kind: "asr" | "bsr"
  value: number
  rank: number
  tie?: number
}) {
  return (
    <td className="px-2 py-1.5 text-center">
      <span
        className={cn(
          "inline-flex items-baseline justify-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-sm font-semibold whitespace-nowrap",
          heatText(kind, value),
        )}
        style={heatStyle(kind, value)}
      >
        {value.toFixed(1)}
        <span
          className={cn(
            "text-[10px] font-medium",
            rank === 1 ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground",
          )}
          title={tie ? `Joint #${rank} — ${tie} systems tie on this value` : undefined}
        >
          {tie ? "=" : ""}#{rank}
        </span>
      </span>
    </td>
  )
}

function MetricHeader({ label, hint, lowerIsBetter }: { label: string; hint: string; lowerIsBetter: boolean }) {
  const Arrow = lowerIsBetter ? ArrowDown : ArrowUp
  const arrowColor = lowerIsBetter
    ? "text-rose-500 dark:text-rose-400"
    : "text-emerald-500 dark:text-emerald-400"
  return (
    <th className="px-2 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
      <div className="inline-flex items-center justify-center gap-1.5">
        <span>{label}</span>
        <Arrow className={cn("h-4 w-4", arrowColor)} aria-hidden="true" />
      </div>
      <div className="mt-0.5 text-[10px] normal-case tracking-normal text-muted-foreground/70">{hint}</div>
    </th>
  )
}

function DomainTable({ rows }: { rows: IndustryDomainRow[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-sm shadow-black/5 backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-secondary/20 align-bottom">
              <th className="border-r border-border/80 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Domain
              </th>
              <MetricHeader label="Direct ASR" hint="Lower = safer" lowerIsBetter />
              <MetricHeader label="Indirect ASR" hint="Lower = safer" lowerIsBetter />
              <MetricHeader label="BSR" hint="Higher = more capable" lowerIsBetter={false} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.domain}
                className="border-b border-border/50 transition-colors last:border-0 hover:bg-secondary/10"
              >
                <td className="border-r border-border/80 px-4 py-1.5">
                  <span className="text-base font-medium">{row.domain}</span>
                  {row.gui ? (
                    <span
                      className="ml-1.5 align-super text-[10px] text-muted-foreground"
                      title="GUI-driven domain — runs a guest OS in QEMU rather than a Linux container"
                    >
                      GUI
                    </span>
                  ) : null}
                </td>
                <ScoreCell kind="asr" value={row.directAsr} rank={row.directRank} />
                <ScoreCell kind="asr" value={row.indirectAsr} rank={row.indirectRank} tie={row.indirectTie} />
                <ScoreCell kind="bsr" value={row.bsr} rank={row.bsrRank} tie={row.bsrTie} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border/50 bg-secondary/10 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
        <span className="font-mono">GUI</span> marks the two GUI-driven domains, which run a guest OS
        in QEMU rather than a Linux container. <span className="font-mono">=</span> marks a joint
        rank: research BSR ties four ways at 100.0, CRM BSR three ways at 82.4, and macOS indirect
        ASR two ways at 0.0.
      </div>
    </div>
  )
}

function BibtexBlock({ bibtex }: { bibtex: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(bibtex)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Citation</h3>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy BibTeX to clipboard"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-md bg-secondary p-4 font-mono text-xs leading-relaxed text-foreground/90">
        <code>{bibtex}</code>
      </pre>
    </div>
  )
}

function ReportArticle({ report }: { report: IndustryReport }) {
  return (
    <article id={report.slug} className="scroll-mt-24">
      {/* Identity */}
      <div className="flex flex-wrap items-center gap-2.5">
        <img
          src={report.partnerLogo}
          alt={`${report.partner} logo`}
          className="h-10 w-10 shrink-0 rounded-full object-contain ring-1 ring-border/60"
        />
        <a
          href={report.partnerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-base font-semibold hover:text-[oklch(0.7_0.14_220)]"
        >
          {report.partner}
          <ExternalLink className="h-3.5 w-3.5 opacity-60" />
        </a>
        <span className="text-muted-foreground/50">×</span>
        <span className="text-base font-semibold">
          <span className="text-foreground">Decoding</span>
          <span className="text-[oklch(0.7_0.14_220)]">Trust</span>
          <span className="text-[oklch(0.7_0.14_220)]"> Agent</span>
        </span>
        <span className="rounded-md border border-border/70 bg-secondary/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Whitepaper
        </span>
      </div>

      <h2 className="mt-5 text-2xl font-bold leading-snug md:text-3xl">{report.title}</h2>
      <p className="mt-2 text-base leading-relaxed text-muted-foreground">{report.subtitle}</p>

      {/* Authors */}
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
        {report.authors.map((author) => (
          <span key={author.name} className="text-foreground">
            {author.name}
            <span className="ml-1.5 text-xs text-muted-foreground">{author.affiliation}</span>
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{report.date}</span>
        <span className="h-3 w-px bg-border" />
        <span>{report.pages} pages</span>
        <span className="h-3 w-px bg-border" />
        <span>{report.scope}</span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          asChild
          className="bg-[oklch(0.7_0.14_220)] text-white hover:bg-[oklch(0.65_0.14_220)] shadow-lg shadow-[oklch(0.5_0.14_220/0.3)]"
        >
          <a href={report.pdfPath} target="_blank" rel="noopener noreferrer">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </a>
        </Button>
      </div>

      {/* Abstract */}
      <div className="mt-10">
        <h3 className="mb-3 text-lg font-semibold">Abstract</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{report.abstract}</p>
      </div>

      {/* Headline metrics */}
      <div className="mt-10">
        <h3 className="mb-1 text-lg font-semibold">Headline Results</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {report.system}, macro-average over all 14 domains, against the ten published leaderboard
          agents on the benchmark&rsquo;s own full basis.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {report.metrics.map((metric) => (
            <div
              key={metric.label}
              className={cn(
                "rounded-2xl border px-5 py-5 text-center",
                metric.headline
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-border/60 bg-secondary/20",
              )}
            >
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {metric.label}
              </div>
              <div
                className={cn(
                  "mt-2 font-mono text-4xl font-bold leading-none",
                  metric.headline ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
                )}
              >
                {metric.value}
              </div>
              <div
                className={cn(
                  "mt-2 text-sm font-semibold",
                  metric.headline ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
                )}
              >
                {metric.rank}
              </div>
              <div className="mt-0.5 text-[10px] text-muted-foreground/70">{metric.hint}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-domain */}
      <div className="mt-10">
        <h3 className="mb-1 text-lg font-semibold">Per-Domain Results</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {report.system} across all 14 DTap domains. The small number beside each score is its rank
          among the eleven systems on this basis.
        </p>
        <DomainTable rows={report.domains} />
      </div>

      {/* Findings */}
      <div className="mt-10">
        <h3 className="mb-4 text-lg font-semibold">Key Findings</h3>
        <ul className="space-y-3">
          {report.findings.map((finding) => (
            <li key={finding} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{finding}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Caveats — kept as prominent as the findings on purpose. */}
      <div className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-lg font-semibold">How to Read These Numbers</h3>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
          <ul className="space-y-3">
            {report.caveats.map((caveat) => (
              <li key={caveat} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/70" />
                <span>{caveat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-10">
        <BibtexBlock bibtex={report.bibtex} />
      </div>
    </article>
  )
}

export function IndustrySection() {
  return (
    <section className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">Industry Reports</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Security evaluations of production agent systems, measured on DecodingTrust-Agent by the
            teams that build them.
          </p>
        </div>

        {/* What these are, and what they are not. */}
        <div className="mb-14 flex gap-3 rounded-2xl border border-border/60 bg-secondary/20 p-5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            These reports are authored by our industry partners using the platform&rsquo;s own
            environments, attacks and judges. DTap provides the benchmark and reviews the
            methodology; the runs and the claims are the partner&rsquo;s. Each report states the
            conditions it was measured under — read those before comparing a figure here with a row
            on the{" "}
            <a
              href="/leaderboard"
              className="font-medium text-[oklch(0.7_0.14_220)] hover:underline"
            >
              leaderboard
            </a>
            .
          </p>
        </div>

        <div className="space-y-20">
          {INDUSTRY_REPORTS.map((report) => (
            <ReportArticle key={report.slug} report={report} />
          ))}
        </div>

        <div className="mt-20 rounded-2xl border border-border/60 bg-card/70 p-6 text-center">
          <h3 className="text-lg font-semibold">Evaluating your own agent on DTap?</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Run the benchmark, then talk to us about publishing the results here.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button variant="outline" asChild className="border-border bg-transparent hover:bg-secondary">
              <a href="/quickstart">Get Started</a>
            </Button>
            <Button variant="outline" asChild className="border-border bg-transparent hover:bg-secondary">
              <a href="https://discord.gg/z8ZhVwPqUk" target="_blank" rel="noopener noreferrer">
                Join the Discord
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowDown, ArrowLeft, ArrowUp, Check, Copy, ExternalLink, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { IndustryDomainRow, IndustryReport } from "@/lib/industry"

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
      <div className="grid gap-8 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0">
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
        <span className="text-base font-semibold text-[oklch(0.7_0.14_220)]">DTap</span>
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
            <FileText className="mr-2 h-4 w-4" />
            Read Report
          </a>
        </Button>
      </div>
        </div>

        {/* Snapshot of the paper's first page. */}
        <a
          href={report.pdfPath}
          target="_blank"
          rel="noopener noreferrer"
          className="group/thumb hidden shrink-0 sm:block"
          aria-label={`Open ${report.title} as a PDF`}
        >
          <img
            src={report.thumbnail}
            alt={`First page of ${report.title}`}
            className="w-[200px] rounded-md border border-border/70 bg-white shadow-md transition-transform group-hover/thumb:-translate-y-1"
          />
          <span className="mt-2 block text-center text-[11px] text-muted-foreground">
            {report.pages}-page PDF
          </span>
        </a>
      </div>

      {/* Abstract */}
      <div className="mt-10">
        <h3 className="mb-3 text-lg font-semibold">Abstract</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{report.abstract}</p>
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
        <ol className="space-y-3">
          {report.findings.map((finding, index) => (
            <li key={finding} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border/70 bg-secondary/40 font-mono text-[11px] font-semibold text-foreground">
                {index + 1}
              </span>
              <span>{finding}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-10">
        <BibtexBlock bibtex={report.bibtex} />
      </div>
    </article>
  )
}

export function IndustryReportDetail({ report }: { report: IndustryReport }) {
  return (
    <section className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
        <Link
          href="/community/industry"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All industry reports
        </Link>

        <ReportArticle report={report} />
      </div>
    </section>
  )
}

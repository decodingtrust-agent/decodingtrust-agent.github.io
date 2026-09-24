import Link from "next/link"
import { ArrowUpRight, Download, FileText, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FEATURED_REPORT, industryReportHref } from "@/lib/industry"

function MetricTile({
  label,
  value,
  rank,
  hint,
  headline,
}: {
  label: string
  value: string
  rank: string
  hint: string
  headline?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-4 text-center transition-colors",
        headline
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-border/60 bg-secondary/20",
      )}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1.5 font-mono text-3xl font-bold leading-none",
          headline
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-foreground",
        )}
      >
        {value}
      </div>
      <div
        className={cn(
          "mt-1.5 text-sm font-semibold",
          headline
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-muted-foreground",
        )}
      >
        {rank}
      </div>
      <div className="mt-0.5 text-[10px] text-muted-foreground/70">{hint}</div>
    </div>
  )
}

export function IndustryHighlight() {
  const report = FEATURED_REPORT

  return (
    <section>
      <div className="mx-auto max-w-7xl px-4 pt-4 pb-16 md:pt-6 md:pb-20">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="mb-2 text-3xl font-bold md:text-4xl">
              DTap in{" "}
              <span className="text-[oklch(0.7_0.14_220)]">
                Industry
              </span>
            </h2>
            <p className="max-w-3xl text-muted-foreground">
              Security reports from teams evaluating production agent systems on the platform.
            </p>
          </div>
          <Button
            variant="outline"
            asChild
            className="hidden border-border bg-transparent hover:bg-secondary md:flex"
          >
            <Link href="/community/industry">
              View All Reports
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-sm shadow-black/5 backdrop-blur-sm">
          <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[1.35fr_1fr] lg:gap-10">
            {/* Left: identity + pitch */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <img
                  src={report.partnerLogo}
                  alt={`${report.partner} logo`}
                  className="h-9 w-9 shrink-0 rounded-full object-contain ring-1 ring-border/60"
                />
                <span className="text-base font-semibold">{report.partner}</span>
                <span className="text-muted-foreground/50">×</span>
                <span className="text-base font-semibold">
                  <span className="text-foreground">Decoding</span>
                  <span className="text-[oklch(0.7_0.14_220)]">
                    Trust
                  </span>
                  <span className="text-[oklch(0.7_0.14_220)]">
                    {" "}
                    Agent
                  </span>
                </span>
                <span className="rounded-md border border-border/70 bg-secondary/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Whitepaper
                </span>
              </div>

              <h3 className="mt-4 text-xl font-bold leading-snug md:text-2xl">
                {report.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {report.blurb}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Pokee AI · UChicago · UIUC
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  {report.scope}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="bg-[oklch(0.7_0.14_220)] text-white hover:bg-[oklch(0.65_0.14_220)] shadow-lg shadow-[oklch(0.5_0.14_220/0.3)]">
                  <Link href={industryReportHref(report.slug)}>
                    Read the Report
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild className="border-border bg-transparent hover:bg-secondary">
                  <a href={report.pdfPath} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </a>
                </Button>
              </div>
            </div>

            {/* Right: headline metrics */}
            <div>
              <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {report.system} · macro-average over 14 domains
              </div>
              <div className="grid grid-cols-3 gap-3">
                {report.metrics.map((metric) => (
                  <MetricTile key={metric.label} {...metric} />
                ))}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground/80">
                Measured against the ten published leaderboard agents on the benchmark&rsquo;s own
                full basis. Read alongside the report&rsquo;s stated caveats — the harness differs
                from the stock runner, and ASR must be read relative to capability.
              </p>
            </div>
          </div>
        </div>

        <Button variant="outline" asChild className="mt-6 w-full border-border bg-transparent md:hidden">
          <Link href="/community/industry">
            View All Reports
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}

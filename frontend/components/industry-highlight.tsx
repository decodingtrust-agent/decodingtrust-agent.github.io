import Link from "next/link"
import { ArrowUpRight, Download, FileText, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FEATURED_REPORT, industryReportHref, type IndustryMetric } from "@/lib/industry"

/** Compact inline stat, so the numbers survive next to the paper snapshot. */
function MetricPill({ metric }: { metric: IndustryMetric }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-xl border px-3 py-2",
        metric.headline
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-border/60 bg-secondary/20",
      )}
    >
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {metric.label}
      </span>
      <span className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-mono text-xl font-bold leading-none",
            metric.headline ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
          )}
        >
          {metric.value}
        </span>
        <span
          className={cn(
            "text-[11px] font-semibold",
            metric.headline ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
          )}
        >
          {metric.rank}
        </span>
      </span>
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
              DTap in <span className="text-[oklch(0.7_0.14_220)]">Industry</span>
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
          <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-2 lg:gap-10">
            {/* Left: identity, pitch, numbers, actions */}
            <div className="flex min-w-0 flex-col">
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
                  <span className="text-[oklch(0.7_0.14_220)]">Trust Agent</span>
                </span>
                <span className="rounded-md border border-border/70 bg-secondary/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Whitepaper
                </span>
              </div>

              <h3 className="mt-4 text-xl font-bold leading-snug md:text-2xl">{report.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{report.blurb}</p>

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

              <div className="mt-5 grid grid-cols-3 gap-2.5">
                {report.metrics.map((metric) => (
                  <MetricPill key={metric.label} metric={metric} />
                ))}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground/80">
                {report.system}, macro-average over 14 domains. The harness differs from the stock
                runner, and ASR must be read relative to capability — the report states both.
              </p>

              <div className="mt-auto flex flex-wrap gap-3 pt-6">
                <Button
                  asChild
                  className="bg-[oklch(0.7_0.14_220)] text-white hover:bg-[oklch(0.65_0.14_220)] shadow-lg shadow-[oklch(0.5_0.14_220/0.3)]"
                >
                  <Link href={industryReportHref(report.slug)}>
                    Read the Report
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="border-border bg-transparent hover:bg-secondary"
                >
                  <a href={report.pdfPath} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </a>
                </Button>
              </div>
            </div>

            {/* Right: the paper itself — title through abstract, off page one. */}
            <Link
              href={industryReportHref(report.slug)}
              className="group/paper relative block self-center overflow-hidden rounded-xl border border-border/70 bg-white shadow-md transition-transform hover:-translate-y-1"
              aria-label={`Read ${report.title}`}
            >
              <img
                src={report.heroImage}
                alt={`Title and abstract of ${report.title}`}
                className="block w-full"
              />
              {/* Fade the bottom edge so the crop reads as a page continuing. */}
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-2.5">
                <span className="rounded-full border border-border/70 bg-white/90 px-3 py-1 text-[11px] font-medium text-neutral-700 shadow-sm">
                  {report.pages}-page whitepaper
                </span>
              </span>
            </Link>
          </div>
        </div>

        <Button
          variant="outline"
          asChild
          className="mt-6 w-full border-border bg-transparent md:hidden"
        >
          <Link href="/community/industry">
            View All Reports
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}

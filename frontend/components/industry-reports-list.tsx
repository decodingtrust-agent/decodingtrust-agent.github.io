import Link from "next/link"
import { ArrowRight, FileText, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { INDUSTRY_REPORTS, industryReportHref, type IndustryReport } from "@/lib/industry"

function ReportCard({ report }: { report: IndustryReport }) {
  const headline = report.metrics.find((metric) => metric.headline) ?? report.metrics[0]

  return (
    <Link
      href={industryReportHref(report.slug)}
      className="group flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md sm:flex-row"
    >
      {/* First page of the PDF, so a report is recognisable at a glance. */}
      <div className="shrink-0 self-center sm:self-start">
        <img
          src={report.thumbnail}
          alt={`First page of ${report.title}`}
          className="h-[170px] w-[131px] rounded-md border border-border/70 bg-white object-cover object-top shadow-sm transition-transform group-hover:-translate-y-0.5"
          loading="lazy"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <img
            src={report.partnerLogo}
            alt={`${report.partner} logo`}
            className="h-6 w-6 shrink-0 rounded-full object-contain ring-1 ring-border/60"
          />
          <span className="text-sm font-semibold">{report.partner}</span>
          <span className="text-muted-foreground/50">×</span>
          <span className="text-sm font-semibold text-[oklch(0.7_0.14_220)]">DTap</span>
          <span className="rounded-md border border-border/70 bg-secondary/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Whitepaper
          </span>
        </div>

        <h3 className="mt-3 text-lg font-bold leading-snug transition-colors group-hover:text-[oklch(0.7_0.14_220)] md:text-xl">
          {report.title}
        </h3>
        <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {report.blurb}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{report.date}</span>
          <span className="h-3 w-px bg-border" />
          <span className="inline-flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            {report.pages} pages
          </span>
          <span className="h-3 w-px bg-border" />
          <span>{report.scope}</span>
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
          <div className="inline-flex items-baseline gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {headline.label}
            </span>
            <span className="font-mono text-lg font-bold leading-none text-emerald-600 dark:text-emerald-400">
              {headline.value}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {headline.rank}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-[oklch(0.7_0.14_220)]">
            Read the report
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

export function IndustryReportsList({ className }: { className?: string }) {
  return (
    <div className={cn(className)}>
      <div className="mb-8 flex gap-3 rounded-2xl border border-border/60 bg-secondary/20 p-5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          These reports are authored by our industry partners using the platform&rsquo;s own
          environments, attacks and judges. DTap provides the benchmark and reviews the methodology;
          the runs and the claims are the partner&rsquo;s. Each report states the conditions it was
          measured under — read those before comparing a figure here with a row on the{" "}
          <Link
            href="/leaderboard"
            className="font-medium text-[oklch(0.7_0.14_220)] hover:underline"
          >
            leaderboard
          </Link>
          .
        </p>
      </div>

      <div className="space-y-5">
        {INDUSTRY_REPORTS.map((report) => (
          <ReportCard key={report.slug} report={report} />
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-border/60 bg-card/70 p-6 text-center">
        <h3 className="text-lg font-semibold">Evaluating your own agent on DTap?</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Run the benchmark, then talk to us about publishing the results here.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href="/quickstart"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
          >
            Get Started
          </Link>
          <a
            href="https://discord.gg/z8ZhVwPqUk"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
          >
            Join the Discord
          </a>
        </div>
      </div>
    </div>
  )
}

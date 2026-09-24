import Link from "next/link"
import { ArrowRight, ArrowUpRight, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FEATURED_REPORT, industryReportHref } from "@/lib/industry"

export function IndustryHighlight() {
  const report = FEATURED_REPORT

  return (
    <section>
      <div className="mx-auto max-w-7xl px-4 pt-4 pb-12 md:pt-6 md:pb-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
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

        <div className="mt-6 overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-sm shadow-black/5 backdrop-blur-sm">
          <div className="grid items-center gap-6 p-5 md:p-6 lg:grid-cols-[1.25fr_1fr] lg:gap-8">
            {/* Left: who, what, and two ways in. */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <img
                  src={report.partnerLogo}
                  alt={`${report.partner} logo`}
                  className="h-8 w-8 shrink-0 rounded-full object-contain ring-1 ring-border/60"
                />
                <span className="text-base font-semibold">{report.partner}</span>
                <span className="text-muted-foreground/50">×</span>
                <span className="text-base font-semibold text-[oklch(0.7_0.14_220)]">DTap</span>
                <span className="rounded-md border border-border/70 bg-secondary/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Whitepaper
                </span>
              </div>

              <h3 className="mt-3 text-xl font-bold leading-snug md:text-2xl">{report.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{report.blurb}</p>

              <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {report.partner}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  asChild
                  className="bg-[oklch(0.7_0.14_220)] text-white hover:bg-[oklch(0.65_0.14_220)] shadow-lg shadow-[oklch(0.5_0.14_220/0.3)]"
                >
                  <a href={report.pdfPath} target="_blank" rel="noopener noreferrer">
                    Read the Report
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="border-border bg-transparent hover:bg-secondary"
                >
                  <Link href={industryReportHref(report.slug)}>
                    Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right: the paper itself, cropped to keep the block short. */}
            <a
              href={report.pdfPath}
              target="_blank"
              rel="noopener noreferrer"
              className="group/paper relative block overflow-hidden rounded-xl border border-border/70 bg-white shadow-md transition-transform hover:-translate-y-1"
              aria-label={`Read ${report.title}`}
            >
              <img
                src={report.heroImage}
                alt={`Title and abstract of ${report.title}`}
                className="block h-[210px] w-full object-cover object-top sm:h-[240px] lg:h-[260px]"
              />
              {/* Fade the cut edge so it reads as a page continuing. */}
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/85 to-transparent" />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-2">
                <span className="rounded-full border border-border/70 bg-white/90 px-3 py-1 text-[11px] font-medium text-neutral-700 shadow-sm">
                  {report.pages}-page whitepaper
                </span>
              </span>
            </a>
          </div>
        </div>

        <Button
          variant="outline"
          asChild
          className="mt-5 w-full border-border bg-transparent md:hidden"
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

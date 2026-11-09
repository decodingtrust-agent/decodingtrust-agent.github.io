import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import { BENCHMARKS, UPCOMING_BENCHMARKS } from "@/benchmarks/registry"

export const metadata: Metadata = {
  title: "Benchmarks | DecodingTrust Agent",
  description: "Explore the DecodingTrust Agent family of agent robustness and multi-principal network benchmarks.",
}

export default function BenchmarksPage() {
  return (
    <section className="min-h-[calc(100vh-5rem)]">
      <div className="mx-auto max-w-5xl px-4 py-14 md:py-20 lg:px-6">
        <p className="mb-5 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">DecodingTrust Agent</p>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Benchmarks</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          A family of benchmarks for trustworthy AI agents.<br className="hidden sm:block" />
          Explore individual agents and the networks they collaborate in.
        </p>

        <div className="mt-10 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card/60 md:mt-12">
          {BENCHMARKS.map((benchmark) => (
            <article key={benchmark.id} className="group p-6 transition-colors hover:bg-secondary/20 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Link href={benchmark.href} className="flex items-center gap-3 text-xl font-semibold tracking-tight hover:text-primary md:text-2xl">
                  {benchmark.name}
                  <span className="text-sm font-normal text-muted-foreground">{benchmark.version}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </Link>
                <span className="rounded-full border border-border bg-secondary/30 px-3 py-1 text-xs text-muted-foreground">
                  {benchmark.scope}
                </span>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{benchmark.description}</p>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
                {benchmark.links.map((link) => (
                  <Link key={link.href} href={link.href} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                    {link.label}<ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                ))}
              </div>
            </article>
          ))}
          {UPCOMING_BENCHMARKS.map((benchmark) => (
            <article key={benchmark.id} aria-disabled="true" title="Coming soon" className="cursor-default p-6 text-muted-foreground/60 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{benchmark.name}</h2>
                <span className="rounded-full border border-border px-3 py-1 text-xs">Coming soon</span>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-7">{benchmark.tagline}</p>
              <p className="mt-3 text-xs">{benchmark.scope}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

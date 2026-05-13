import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { DocsArticle } from "@/components/docs/article-shell"
import { DOMAINS } from "@/lib/domains"
import { environments } from "@/lib/environments.generated"

export const metadata = {
  title: "Domains | DTap docs",
  description: "Browse all 14 domains covered by the DecodingTrust-Agent Platform.",
}

export default function DomainsIndexPage() {
  return (
    <DocsArticle title="Domains">
      <p className="mb-8 text-base text-muted-foreground">
        DTap covers <strong className="text-foreground">14 high-stakes domains</strong> spanning
        enterprise software, operating systems, finance, healthcare, and more. Each domain ships
        with policy-aligned benign and malicious tasks, sandboxed environments, and automated judges.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {DOMAINS.map((d) => {
          const envCount = environments.filter((e) => e.domainKey === d.key).length
          return (
            <Link
              key={d.key}
              href={`/docs/domains/${d.key}`}
              className="group flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-card/60 p-4 transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {d.label}
                  </h3>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 flex-shrink-0 ml-2" />
                </div>
                <p className="text-sm text-muted-foreground leading-snug">{d.blurb}</p>
                {envCount > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground/70">
                    {envCount} environment{envCount !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </DocsArticle>
  )
}

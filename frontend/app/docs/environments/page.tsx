import Image from "next/image"
import Link from "next/link"
import { ChevronRight, Server } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { environments } from "@/lib/environments.generated"
import { DOMAIN_BY_KEY, DOMAINS } from "@/lib/domains"

export const metadata = {
  title: "Environments | DTap docs",
  description:
    "Per-environment documentation for the 50+ sandboxed apps included in the DecodingTrust-Agent Platform.",
}

export default function EnvironmentsIndexPage() {
  // Group by domain in the order the homepage expects.
  const byDomain = new Map<string, typeof environments>()
  for (const env of environments) {
    if (!byDomain.has(env.domainKey)) byDomain.set(env.domainKey, [])
    byDomain.get(env.domainKey)!.push(env)
  }
  const orderedDomains = DOMAINS.filter((d) => byDomain.has(d.key))

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
        <span className="text-foreground">Environments</span>
      </nav>

      <header className="mb-10">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Server className="h-3.5 w-3.5" />
          {environments.length} sandboxed environments
        </div>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Environments</h1>
        <p className="mt-3 max-w-3xl text-base text-muted-foreground md:text-lg">
          Realistic, policy-aligned simulations of the apps where AI agents make decisions —
          email and chat, source control, banking, scheduling, customer service, OS shells,
          and more. Each environment ships with GUIs, MCP tool inventories, and direct +
          indirect attack policies.
        </p>
      </header>

      <div className="space-y-12">
        {orderedDomains.map((domain) => {
          const items = byDomain.get(domain.key)!
          return (
            <section key={domain.key}>
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <h2 className="text-xl font-semibold tracking-tight">
                  <Link
                    href={`/docs/domains/${domain.key}`}
                    className="transition-colors hover:text-primary"
                  >
                    {domain.label}
                  </Link>
                </h2>
                <span className="text-xs text-muted-foreground">
                  {items.length} {items.length === 1 ? "environment" : "environments"}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items
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
                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        </div>
                      ) : (
                        <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-muted/40 to-muted/10 text-muted-foreground">
                          <Server className="h-10 w-10 opacity-40" />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <h3 className="truncate font-semibold text-foreground">{env.name}</h3>
                          <Badge variant="outline" className="text-[10px] font-medium">
                            {DOMAIN_BY_KEY[env.domainKey]?.shortLabel ?? env.domainKey}
                          </Badge>
                        </div>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {env.paragraphs[0]?.replace(/\*+/g, "") ?? ""}
                        </p>
                      </div>
                    </Link>
                  ))}
              </div>
            </section>
          )
        })}
      </div>
    </article>
  )
}

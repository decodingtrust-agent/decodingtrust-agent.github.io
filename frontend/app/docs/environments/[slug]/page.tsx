import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, ChevronRight, Server } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { environments } from "@/lib/environments.generated"
import { DOMAIN_BY_KEY } from "@/lib/domains"
import { renderInline } from "@/components/docs/markdown"

export function generateStaticParams() {
  return environments.map((env) => ({ slug: env.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const env = environments.find((e) => e.slug === slug)
  if (!env) return {}
  return {
    title: `${env.name} environment | DTap docs`,
    description: env.paragraphs[0]?.replace(/\*+/g, "").slice(0, 200),
  }
}

export default async function EnvironmentPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const env = environments.find((e) => e.slug === slug)
  if (!env) notFound()

  const domain = DOMAIN_BY_KEY[env.domainKey]
  const ordered = [...environments].sort((a, b) => a.name.localeCompare(b.name))
  const idx = ordered.findIndex((e) => e.slug === env.slug)
  const prev = idx > 0 ? ordered[idx - 1] : null
  const next = idx < ordered.length - 1 ? ordered[idx + 1] : null

  return (
    <article className="px-6 py-10 lg:px-12 lg:py-14 max-w-4xl">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-8 flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Link href="/docs" className="transition-colors hover:text-foreground">
          Docs
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/docs/environments" className="transition-colors hover:text-foreground">
          Environments
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{env.name}</span>
      </nav>

      {/* Hero */}
      <header className="mb-10">
        <div className="mb-4 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Server className="h-5 w-5" />
          </span>
          {domain ? (
            <Link
              href={`/docs/domains/${domain.key}`}
              className="transition-opacity hover:opacity-80"
            >
              <Badge variant="secondary" className="font-medium">
                {domain.label}
              </Badge>
            </Link>
          ) : null}
        </div>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{env.name}</h1>
        {env.guiCaption ? (
          <p className="mt-3 text-base text-muted-foreground md:text-lg">
            {renderInline(env.guiCaption.replace(/\*\*/g, ""))}
          </p>
        ) : null}
      </header>

      {/* Intro paragraphs */}
      <section className="prose prose-zinc dark:prose-invert max-w-none space-y-5 text-[15px] leading-7">
        {env.paragraphs.map((p, i) => (
          <p key={i} className="text-foreground/90">
            {renderInline(p)}
          </p>
        ))}
      </section>

      {/* Screenshot gallery */}
      {env.screenshots.length > 0 ? (
        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-semibold tracking-tight">Interface</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {env.screenshots.map((shot, i) => (
              <figure
                key={i}
                className="overflow-hidden rounded-xl border border-border/60 bg-card/50 shadow-sm"
              >
                <div className="relative aspect-[16/10] bg-muted/30">
                  <Image
                    src={shot.src}
                    alt={shot.alt || env.name}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-contain"
                  />
                </div>
                {shot.caption ? (
                  <figcaption className="px-4 py-3 text-sm text-muted-foreground">
                    {shot.caption}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
          {env.guiCaption ? (
            <p className="mt-4 text-sm text-muted-foreground/80">
              {renderInline(env.guiCaption)}
            </p>
          ) : null}
        </section>
      ) : null}

      {/* Prev / next pager */}
      <nav className="mt-16 flex items-center justify-between gap-4 border-t border-border/60 pt-6 text-sm">
        {prev ? (
          <Link
            href={`/docs/environments/${prev.slug}`}
            className="group inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>{prev.name}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/docs/environments/${next.slug}`}
            className="group inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <span>{next.name}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  )
}

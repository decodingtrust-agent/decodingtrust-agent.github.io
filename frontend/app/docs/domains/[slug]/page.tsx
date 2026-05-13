import { notFound } from "next/navigation"

import { DOMAINS, DOMAIN_BY_KEY } from "@/lib/domains"
import { DomainPageClient } from "./domain-page-client"

export function generateStaticParams() {
  return DOMAINS.map((d) => ({ slug: d.key }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const meta = DOMAIN_BY_KEY[slug]
  if (!meta) return {}
  return {
    title: `${meta.label} domain | DTap docs`,
    description: meta.blurb,
  }
}

export default async function DomainPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const meta = DOMAIN_BY_KEY[slug]
  if (!meta) notFound()

  return <DomainPageClient slug={slug} />
}

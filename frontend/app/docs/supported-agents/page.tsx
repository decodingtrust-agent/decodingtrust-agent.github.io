"use client"

import { useRouter } from "next/navigation"

import { DocsArticle } from "@/components/docs/article-shell"
import { SupportedAgentsContent } from "@/components/docs/content"

export default function Page() {
  const router = useRouter()
  return (
    <DocsArticle title="Supported Agents">
      <SupportedAgentsContent onNavigate={(slug) => router.push(`/docs/${slug}`)} />
    </DocsArticle>
  )
}

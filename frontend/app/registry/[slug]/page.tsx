import TaskDetailPageClient from "@/components/registry/task-detail-page-client"
import { getRegistrySlugs } from "@/lib/static-export"

export function generateStaticParams() {
  return getRegistrySlugs().map((slug) => ({ slug }))
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <TaskDetailPageClient slug={decodeURIComponent(slug)} />
}

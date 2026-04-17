import TaskDetailPageClient from "@/components/registry/task-detail-page-client"
import { getRegistrySlugs } from "@/lib/static-export"

export function generateStaticParams() {
  return getRegistrySlugs().map((slug) => ({ slug }))
}

export default async function TaskDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const { slug } = params
  return <TaskDetailPageClient slug={decodeURIComponent(slug)} />
}

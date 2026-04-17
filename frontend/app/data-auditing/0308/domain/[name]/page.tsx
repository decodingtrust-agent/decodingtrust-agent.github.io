import DomainDetailPage from "@/components/data-auditing/domain-detail-page"
import { getDataAuditingDomains } from "@/lib/static-export"

export function generateStaticParams() {
  return getDataAuditingDomains("report-data.json").map((name) => ({ name }))
}

export default async function DomainPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  return <DomainDetailPage name={decodeURIComponent(name)} />
}

import DomainDetailPage from "@/components/data-auditing/domain-detail-page"
import { getDataAuditingDomains } from "@/lib/static-export"

export function generateStaticParams() {
  return getDataAuditingDomains("report-data.json").map((name) => ({ name }))
}

export default async function DomainPage({
  params,
}: {
  params: { name: string }
}) {
  const { name } = params
  return <DomainDetailPage name={decodeURIComponent(name)} />
}

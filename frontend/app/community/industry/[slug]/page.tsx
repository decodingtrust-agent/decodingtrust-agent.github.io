import { notFound } from "next/navigation"
import { IndustryReportDetail } from "@/components/industry-report-detail"
import { INDUSTRY_REPORTS, getIndustryReport } from "@/lib/industry"

export function generateStaticParams() {
  return INDUSTRY_REPORTS.map((report) => ({ slug: report.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const report = getIndustryReport(slug)
  if (!report) return { title: "Industry Report | DTap" }
  return {
    title: `${report.title} | DTap`,
    description: `${report.partner} × DecodingTrust-Agent — ${report.subtitle}`,
  }
}

export default async function IndustryReportPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const report = getIndustryReport(slug)
  if (!report) notFound()
  return <IndustryReportDetail report={report} />
}

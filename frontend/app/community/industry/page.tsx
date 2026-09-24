import { CommunityShell } from "@/components/community-shell"
import { IndustryReportsList } from "@/components/industry-reports-list"

export const metadata = {
  title: "Industry Reports | DTap",
  description:
    "Security evaluations of production agent systems, measured on DecodingTrust-Agent by the teams that build them.",
}

export default function IndustryReportsPage() {
  return (
    <CommunityShell active="industry">
      <IndustryReportsList />
    </CommunityShell>
  )
}

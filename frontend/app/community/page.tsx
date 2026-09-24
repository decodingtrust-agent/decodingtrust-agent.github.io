import { CommunityShell } from "@/components/community-shell"
import { CommunitySection } from "@/components/community-section"

export const metadata = {
  title: "Community | DTap",
  description:
    "Join the DecodingTrust-Agent community: Discord, source code, datasets, the SDK, and the research paper.",
}

export default function CommunityPage() {
  return (
    <CommunityShell active="resources">
      <CommunitySection />
    </CommunityShell>
  )
}

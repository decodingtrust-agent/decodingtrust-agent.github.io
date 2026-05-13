import { DocsArticle } from "@/components/docs/article-shell"
import { RedTeamingQuickstartContent } from "@/components/docs/content"

export const metadata = { title: "Red-teaming Quick Start | DTap docs" }

export default function Page() {
  return (
    <DocsArticle title="Red-teaming Quick Start" section={{ title: "Red-teaming Agent" }}>
      <RedTeamingQuickstartContent />
    </DocsArticle>
  )
}

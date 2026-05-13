import { DocsArticle } from "@/components/docs/article-shell"
import { RedTeamingOverviewContent } from "@/components/docs/content"

export const metadata = { title: "Red-teaming Overview | DTap docs" }

export default function Page() {
  return (
    <DocsArticle title="Red-teaming Overview" section={{ title: "Red-teaming Agent" }}>
      <RedTeamingOverviewContent />
    </DocsArticle>
  )
}

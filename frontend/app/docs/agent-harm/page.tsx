import { DocsArticle } from "@/components/docs/article-shell"
import { PlaceholderContent } from "@/components/docs/content"

export const metadata = { title: "AgentHarm | DTap docs" }

export default function Page() {
  return (
    <DocsArticle title="AgentHarm">
      <PlaceholderContent title="AgentHarm" slug="agent-harm" />
    </DocsArticle>
  )
}

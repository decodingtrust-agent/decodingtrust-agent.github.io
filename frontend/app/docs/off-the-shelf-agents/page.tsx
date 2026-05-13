import { DocsArticle } from "@/components/docs/article-shell"
import { OffTheShelfAgentsContent } from "@/components/docs/content"

export const metadata = { title: "Off-the-Shelf Agents | DTap docs" }

export default function Page() {
  return (
    <DocsArticle
      title="Off-the-Shelf Agents"
      section={{ title: "Supported Agents", href: "/docs/supported-agents" }}
    >
      <OffTheShelfAgentsContent />
    </DocsArticle>
  )
}

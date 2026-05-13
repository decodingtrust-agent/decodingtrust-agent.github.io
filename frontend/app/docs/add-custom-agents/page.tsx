import { DocsArticle } from "@/components/docs/article-shell"
import { AddCustomAgentsContent } from "@/components/docs/content"

export const metadata = { title: "Add Custom Agents | DTap docs" }

export default function Page() {
  return (
    <DocsArticle
      title="Add Custom Agents"
      section={{ title: "Supported Agents", href: "/docs/supported-agents" }}
    >
      <AddCustomAgentsContent />
    </DocsArticle>
  )
}

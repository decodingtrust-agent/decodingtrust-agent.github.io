import { DocsArticle } from "@/components/docs/article-shell"
import { WrapPrebuiltAgentsContent } from "@/components/docs/content"

export const metadata = { title: "Wrap Pre-Built Agents | DTap docs" }

export default function Page() {
  return (
    <DocsArticle
      title="Wrap Pre-Built Agents"
      section={{ title: "Supported Agents", href: "/docs/supported-agents" }}
    >
      <WrapPrebuiltAgentsContent />
    </DocsArticle>
  )
}

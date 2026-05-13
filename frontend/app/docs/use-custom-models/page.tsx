import { DocsArticle } from "@/components/docs/article-shell"
import { UseCustomModelsContent } from "@/components/docs/content"

export const metadata = { title: "Use Custom Models | DTap docs" }

export default function Page() {
  return (
    <DocsArticle
      title="Use Custom Models"
      section={{ title: "Supported Agents", href: "/docs/supported-agents" }}
    >
      <UseCustomModelsContent />
    </DocsArticle>
  )
}

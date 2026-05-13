import { DocsArticle } from "@/components/docs/article-shell"
import { InjectionMCPServerContent } from "@/components/docs/content"

export const metadata = { title: "Injection MCP Server | DTap docs" }

export default function Page() {
  return (
    <DocsArticle title="Injection MCP Server" section={{ title: "Red-teaming Agent" }}>
      <InjectionMCPServerContent />
    </DocsArticle>
  )
}

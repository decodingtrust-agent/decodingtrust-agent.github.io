import { DocsArticle } from "@/components/docs/article-shell"
import { InstallFromSourceContent } from "@/components/docs/content"

export const metadata = { title: "Install from Source | DTap docs" }

export default function Page() {
  return (
    <DocsArticle title="Install from Source" section={{ title: "Installation" }}>
      <InstallFromSourceContent />
    </DocsArticle>
  )
}

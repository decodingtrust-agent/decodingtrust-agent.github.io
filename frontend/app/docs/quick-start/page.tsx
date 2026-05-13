import { DocsArticle } from "@/components/docs/article-shell"
import { QuickStartContent } from "@/components/docs/content"

export const metadata = { title: "Quick Start | DTap docs" }

export default function Page() {
  return (
    <DocsArticle title="Quick Start">
      <QuickStartContent />
    </DocsArticle>
  )
}

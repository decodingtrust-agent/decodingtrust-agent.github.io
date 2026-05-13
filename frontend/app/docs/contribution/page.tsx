import { DocsArticle } from "@/components/docs/article-shell"
import { PlaceholderContent } from "@/components/docs/content"

export const metadata = { title: "Contribution | DTap docs" }

export default function Page() {
  return (
    <DocsArticle title="Contribution">
      <PlaceholderContent title="Contribution" slug="contribution" />
    </DocsArticle>
  )
}

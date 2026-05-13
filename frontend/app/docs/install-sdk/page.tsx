import { DocsArticle } from "@/components/docs/article-shell"
import { PlaceholderContent } from "@/components/docs/content"

export const metadata = { title: "Install SDK | DTap docs" }

export default function Page() {
  return (
    <DocsArticle title="Install SDK" section={{ title: "Installation" }}>
      <PlaceholderContent title="Install SDK" slug="install-sdk" />
    </DocsArticle>
  )
}

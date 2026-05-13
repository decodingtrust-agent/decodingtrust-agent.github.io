import { DocsArticle } from "@/components/docs/article-shell"
import { InstallEnvironmentContent } from "@/components/docs/content"

export const metadata = { title: "Install Environment | DTap docs" }

export default function Page() {
  return (
    <DocsArticle title="Install Environment" section={{ title: "Installation" }}>
      <InstallEnvironmentContent />
    </DocsArticle>
  )
}

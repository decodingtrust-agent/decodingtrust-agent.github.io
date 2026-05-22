import { DocsArticle } from "@/components/docs/article-shell"
import { InstallSdkContent } from "@/components/docs/content"

export const metadata = { title: "Install SDK | DTap docs" }

export default function Page() {
  return (
    <DocsArticle title="Install SDK" section={{ title: "Installation" }}>
      <InstallSdkContent />
    </DocsArticle>
  )
}

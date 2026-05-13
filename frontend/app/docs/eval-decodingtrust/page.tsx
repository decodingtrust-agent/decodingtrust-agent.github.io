import { DocsArticle } from "@/components/docs/article-shell"
import { EvalDecodingTrustContent } from "@/components/docs/content"

export const metadata = { title: "Eval with decodingtrust-agent | DTap docs" }

export default function Page() {
  return (
    <DocsArticle title="Eval with decodingtrust-agent" section={{ title: "Run Evaluation" }}>
      <EvalDecodingTrustContent />
    </DocsArticle>
  )
}

import { DocsArticle } from "@/components/docs/article-shell"
import { EvalInspectContent } from "@/components/docs/content"

export const metadata = { title: "Eval with Inspect Evals | DTap docs" }

export default function Page() {
  return (
    <DocsArticle title="Eval with Inspect Evals" section={{ title: "Run Evaluation" }}>
      <EvalInspectContent />
    </DocsArticle>
  )
}

import { DocsArticle } from "@/components/docs/article-shell"
import { AttackSkillsContent } from "@/components/docs/content"

export const metadata = { title: "Attack Skills | DTap docs" }

export default function Page() {
  return (
    <DocsArticle title="Attack Skills" section={{ title: "Red-teaming Agent" }}>
      <AttackSkillsContent />
    </DocsArticle>
  )
}

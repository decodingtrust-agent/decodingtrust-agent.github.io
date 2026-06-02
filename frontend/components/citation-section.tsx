import { CitationBlock } from "@/components/citation-block"

export function CitationSection() {
  return (
    <section className="relative border-t border-border/50">
      <div className="mx-auto max-w-3xl px-4 py-16 md:py-20">
        <CitationBlock />
      </div>
    </section>
  )
}

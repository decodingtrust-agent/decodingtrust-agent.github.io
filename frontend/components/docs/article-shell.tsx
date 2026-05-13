import Link from "next/link"
import { ChevronRight } from "lucide-react"
import type { ReactNode } from "react"

interface DocsArticleProps {
  title: string
  /** Optional parent crumb between "Docs" and the page title. */
  section?: { title: string; href?: string }
  children: ReactNode
}

export function DocsArticle({ title, section, children }: DocsArticleProps) {
  return (
    <article className="px-6 py-12 lg:px-12">
      <div className="max-w-4xl">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Link href="/docs" className="transition-colors hover:text-foreground">
            Docs
          </Link>
          {section ? (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              {section.href ? (
                <Link
                  href={section.href}
                  className="transition-colors hover:text-foreground"
                >
                  {section.title}
                </Link>
              ) : (
                <span>{section.title}</span>
              )}
            </>
          ) : null}
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">{title}</span>
        </nav>
        <h1 className="mb-8 text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
        {children}
      </div>
    </article>
  )
}

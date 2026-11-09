import Link from "next/link"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import type { BlogPost } from "@/lib/blog-types"

export function PostArticle({ post }: { post: BlogPost }) {
  return (
    <article className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
      <header className="mx-auto max-w-3xl">
        <Link href="/blog" className="mb-9 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />All articles</Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <time dateTime={post.date}>{post.dateLabel}</time><span aria-hidden="true">/</span><span>{post.category}</span>
        </div>
        <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-[2.75rem]">{post.title}</h1>
        <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">{post.description}</p>
        <p className="mt-5 text-xs text-muted-foreground">By {post.author}</p>
        <div className="mt-9 border-t border-border" />
      </header>

      <div className="mt-9 space-y-7">
        {post.blocks.map((block, index) => {
          if (block.type === "heading") return <h2 key={index} className="mx-auto max-w-3xl pt-5 text-xl font-semibold leading-snug tracking-tight sm:text-2xl">{block.text}</h2>
          if (block.type === "paragraph") return <p key={index} className="mx-auto max-w-3xl text-[15px] leading-8 text-foreground/85 sm:text-base">{block.text}</p>
          return (
            <figure key={index} className="py-3">
              <a href={block.src} target="_blank" rel="noopener noreferrer" aria-label={`Open figure: ${block.alt}`}
                className="block overflow-hidden rounded-lg border border-border bg-white outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <img src={block.src} alt={block.alt} width={block.width} height={block.height} loading="lazy" className="block h-auto w-full" />
              </a>
              <figcaption className="mt-3 text-xs leading-6 text-muted-foreground">
                <a href={block.sourceHref} target="_blank" rel="noopener noreferrer" className="font-medium underline decoration-border underline-offset-4 hover:text-foreground">{block.sourceLabel}</a>{" "}{block.caption}
              </figcaption>
            </figure>
          )
        })}
      </div>

      <footer className="mx-auto mt-12 max-w-3xl border-t border-border pt-7">
        <h2 className="text-sm font-semibold">Read more</h2>
        <ul className="mt-4 space-y-3">
          {post.sources.map((source) => (
            <li key={source.href}><a href={source.href} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground">
              {source.label}<ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
            </a></li>
          ))}
        </ul>
        <Link href="/blog" className="mt-8 inline-flex items-center gap-2 text-sm hover:text-primary"><ArrowLeft className="h-4 w-4" />Back to Blog</Link>
      </footer>
    </article>
  )
}

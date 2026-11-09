import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { blogHref } from "@/lib/blog"
import type { BlogPost } from "@/lib/blog-types"
import { cn } from "@/lib/utils"

export function PostCard({ post, horizontal = false }: { post: BlogPost; horizontal?: boolean }) {
  const Heading = horizontal ? "h3" : "h2"
  return (
    <article className="h-full overflow-hidden rounded-xl border border-border/70 bg-card">
      <Link href={blogHref(post.slug)} className={cn("group grid h-full outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring", horizontal && "sm:grid-cols-[1.3fr_0.8fr]")}>
        <div className="flex flex-col p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <time dateTime={post.date}>{post.dateLabel}</time><span aria-hidden="true">/</span><span>{post.category}</span>
          </div>
          <Heading className="mt-4 text-xl font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary sm:text-2xl">{post.title}</Heading>
          <p className="mb-6 mt-4 text-sm leading-7 text-muted-foreground">{post.description}</p>
          <span className="mt-auto inline-flex items-center gap-2 text-sm font-medium">Read blog<ArrowUpRight className="h-4 w-4" /></span>
        </div>
        <div className={cn("relative min-h-64 overflow-hidden bg-secondary/35", horizontal && "sm:min-h-80")}>
          <div aria-hidden="true" className="pointer-events-none absolute -inset-8 select-none">
            <img src={post.cover} alt="" width={1700} height={2200}
              data-blog-cover-background
              className="h-full w-full scale-110 object-cover object-center opacity-35 blur-2xl dark:opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-br from-background/25 via-background/50 to-background/10" />
          </div>
          <div className="absolute inset-x-6 inset-y-5 transition-transform duration-300 motion-safe:group-hover:-translate-y-1">
            <img src={post.cover} alt={post.coverAlt} width={1700} height={2200} className="h-full w-full object-contain object-right-bottom drop-shadow-sm" />
          </div>
        </div>
      </Link>
    </article>
  )
}

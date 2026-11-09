import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { BLOG_POSTS } from "@/lib/blog"
import { PostCard } from "@/components/blog/post-card"
import { BlogScroll } from "@/components/blog/horizontal-scroll"

export function RecentBlogs() {
  return (
    <section id="recent-blogs" aria-labelledby="recent-blogs-heading" className="scroll-mt-24 py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h2 id="recent-blogs-heading" className="text-3xl font-bold tracking-tight md:text-4xl">Recent <span className="text-[oklch(0.7_0.14_220)]">Blogs</span></h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">How teams use DTap to evaluate and secure AI agents.</p>
          </div>
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm hover:text-primary">View all blogs<ArrowUpRight className="h-4 w-4" /></Link>
        </div>
        <BlogScroll>
          <ul className="flex w-max items-stretch gap-5 pb-8">
            {BLOG_POSTS.map((post) => (
              <li key={post.slug} className="w-[calc(100vw-3.5rem)] shrink-0 md:w-[min(82vw,54rem)]">
                <PostCard post={post} horizontal />
              </li>
            ))}
          </ul>
        </BlogScroll>
      </div>
    </section>
  )
}

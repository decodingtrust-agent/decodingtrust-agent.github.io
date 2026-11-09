import type { Metadata } from "next"
import { BLOG_POSTS } from "@/lib/blog"
import { PostCard } from "@/components/blog/post-card"

export const metadata: Metadata = {
  title: "Blog | DecodingTrust Agent",
  description: "Research, evaluations, and releases from the DecodingTrust team.",
}

export default function BlogPage() {
  return (
    <section className="mx-auto min-h-[65vh] max-w-6xl px-5 py-12 sm:px-8 md:py-20">
      <header className="mb-12 max-w-2xl">
        <p className="mb-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">From the DecodingTrust team</p>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Blog</h1>
        <p className="mt-4 text-base leading-8 text-muted-foreground">Research, evaluations, and the work behind more trustworthy agents.</p>
      </header>
      <div className="grid gap-x-10 gap-y-14 md:grid-cols-2">
        {BLOG_POSTS.map((post) => <PostCard key={post.slug} post={post} />)}
      </div>
    </section>
  )
}

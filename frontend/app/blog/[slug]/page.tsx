import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { BLOG_POSTS, blogHref, getBlogPost } from "@/lib/blog"
import { PostArticle } from "@/components/blog/post-article"

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) return { title: "Article not found | DTap" }
  return {
    title: `${post.title} | DecodingTrust Agent`,
    description: post.description,
    alternates: { canonical: `https://decodingtrust-agent.com${blogHref(post.slug)}` },
    openGraph: {
      type: "article", title: post.title, description: post.description,
      ...(post.date.length === 10 ? { publishedTime: post.date } : {}),
      authors: [post.author],
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) notFound()
  return <PostArticle post={post} />
}

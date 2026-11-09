import { pokeeWhitePaper } from "@/content/blog/pokee-ai-white-paper"
import { museSparkEvaluation } from "@/content/blog/muse-spark-1-3-evaluation-report"

export const BLOG_POSTS = [museSparkEvaluation, pokeeWhitePaper]

export function blogHref(slug: string) {
  return `/blog/${slug}`
}

export function getBlogPost(slug: string) {
  return BLOG_POSTS.find((post) => post.slug === slug)
}

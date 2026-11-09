export type BlogBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "figure"; src: string; alt: string; width: number; height: number; caption: string; sourceLabel: string; sourceHref: string }

export type BlogPost = {
  slug: string
  title: string
  description: string
  category: "Whitepaper" | "Evaluation"
  date: string
  dateLabel: string
  author: string
  cover: string
  coverAlt: string
  blocks: BlogBlock[]
  sources: { label: string; href: string }[]
}

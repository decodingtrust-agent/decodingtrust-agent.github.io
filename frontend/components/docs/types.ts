// Documentation types and shared interfaces

export interface DocItem {
  title: string
  slug: string
}

export interface DocSection {
  title: string
  slug: string
  items: DocItem[]
}

export interface DocHierarchy extends DocSection {
  icon: React.ComponentType<{ className?: string }>
}

export interface CalloutProps {
  type: "info" | "warning" | "success"
  title: string
  children: React.ReactNode
}

export interface CodeBlockProps {
  code: string
  language?: string
  title?: string
}

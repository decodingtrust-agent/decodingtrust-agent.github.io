"use client"

import { FileText } from "lucide-react"
import { Callout } from "../callout"

interface PlaceholderContentProps {
  title: string
  slug: string
}

export function PlaceholderContent({ title, slug }: PlaceholderContentProps) {
  return (
    <div>
      <Callout type="info" title="Coming Soon">
        This section is under development. Check back soon for detailed documentation on {title.toLowerCase()}.
      </Callout>

      <div className="mt-8 border border-dashed border-border rounded-lg p-12 flex flex-col items-center justify-center text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Documentation for this section is being written. In the meantime, you can explore
          other sections or check the GitHub repository for the latest updates.
        </p>
        <div className="mt-4 text-xs text-muted-foreground/50">
          Section slug: <code className="bg-secondary px-1 rounded">{slug}</code>
        </div>
      </div>
    </div>
  )
}

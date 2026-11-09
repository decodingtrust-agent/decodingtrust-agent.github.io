"use client"

import type { ReactNode } from "react"
import * as ScrollArea from "@radix-ui/react-scroll-area"
import { ScrollBar } from "@/components/ui/scroll-area"

export function BlogScroll({ children }: { children: ReactNode }) {
  return (
    <ScrollArea.Root type="always" className="relative" data-slot="blog-scroll">
      <ScrollArea.Viewport tabIndex={0} role="region" aria-label="Recent blogs"
        className="w-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring [&>div]:!block"
        data-slot="blog-scroll-viewport">
        {children}
      </ScrollArea.Viewport>
      <ScrollBar orientation="horizontal"
        className="h-3.5 rounded-full border-0 bg-secondary p-0.5 [&_[data-slot=scroll-area-thumb]]:bg-muted-foreground/45 [&_[data-slot=scroll-area-thumb]]:transition-colors [&_[data-slot=scroll-area-thumb]:hover]:bg-muted-foreground/70" />
    </ScrollArea.Root>
  )
}

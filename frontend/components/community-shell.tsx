import Link from "next/link"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export type CommunityTab = "resources" | "industry"

const TABS: { key: CommunityTab; label: string; href: string }[] = [
  { key: "resources", label: "Resources", href: "/community" },
  { key: "industry", label: "Industry Reports", href: "/community/industry" },
]

/**
 * Shared chrome for the Community area. The tabs are real routes rather than
 * local state so a tab can be linked to and shared.
 */
export function CommunityShell({
  active,
  children,
}: {
  active: CommunityTab
  children: ReactNode
}) {
  return (
    <section className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">Community</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Join the DTap community, and see how teams are measuring their own agents on the
            platform.
          </p>
        </div>

        <div className="mb-12 flex justify-center">
          <nav className="inline-flex gap-1 rounded-lg border border-border bg-card p-1">
            {TABS.map((tab) => (
              <Link
                key={tab.key}
                href={tab.href}
                aria-current={tab.key === active ? "page" : undefined}
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm transition-colors",
                  tab.key === active
                    ? "bg-secondary font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>

        {children}
      </div>
    </section>
  )
}

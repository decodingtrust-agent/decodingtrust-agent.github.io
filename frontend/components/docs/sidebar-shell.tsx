"use client"

import { useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Book,
  ChevronDown,
  ChevronRight,
  Cpu,
  Database,
  GitBranch,
  Package,
  Play,
  Search,
  Server,
  Shield,
  Zap,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { DOMAINS } from "@/lib/domains"
import { environments } from "@/lib/environments.generated"

type SidebarItem = { title: string; href: string }
type SidebarSection = {
  title: string
  icon: React.ComponentType<{ className?: string }>
  /** Slug used for parent expansion logic. */
  slug: string
  /** Where the parent itself navigates. */
  href: string
  items: SidebarItem[]
}

const domainItems: SidebarItem[] = DOMAINS.map((d) => ({
  title: d.label,
  href: `/docs/domains/${d.key}`,
}))

const environmentItems: SidebarItem[] = environments
  .slice()
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((e) => ({
    title: e.name,
    href: `/docs/environments/${e.slug}`,
  }))

const SECTIONS: SidebarSection[] = [
  {
    title: "Quick Start",
    icon: Zap,
    slug: "quick-start",
    href: "/docs/quick-start",
    items: [],
  },
  {
    title: "Domain",
    icon: Database,
    slug: "domains",
    href: "/docs/domains",
    items: domainItems,
  },
  {
    title: "Environment",
    icon: Server,
    slug: "environments",
    href: "/docs/environments",
    items: environmentItems,
  },
  {
    title: "Installation",
    icon: Package,
    slug: "installation",
    href: "/docs/install-sdk",
    items: [
      { title: "Install SDK", href: "/docs/install-sdk" },
      { title: "Install from Source", href: "/docs/install-source" },
      { title: "Install Environment", href: "/docs/install-environment" },
    ],
  },
  {
    title: "Run Evaluation",
    icon: Play,
    slug: "run-evaluation",
    href: "/docs/eval-decodingtrust",
    items: [
      { title: "Eval with decodingtrust-agent", href: "/docs/eval-decodingtrust" },
      { title: "Eval with Inspect Evals", href: "/docs/eval-inspect" },
    ],
  },
  {
    title: "Supported Agents",
    icon: Cpu,
    slug: "supported-agents",
    href: "/docs/supported-agents",
    items: [
      { title: "Off-the-Shelf Agents", href: "/docs/off-the-shelf-agents" },
      { title: "Wrap Pre-Built Agents", href: "/docs/wrap-prebuilt-agents" },
      { title: "Add Custom Agents", href: "/docs/add-custom-agents" },
      { title: "Use Custom Models", href: "/docs/use-custom-models" },
    ],
  },
  {
    title: "Red-teaming Agent",
    icon: Shield,
    slug: "red-teaming",
    href: "/docs/red-teaming-overview",
    items: [
      { title: "Overview", href: "/docs/red-teaming-overview" },
      { title: "Quick Start", href: "/docs/red-teaming-quickstart" },
      { title: "Attack Skills", href: "/docs/attack-skills" },
      { title: "Injection MCP Server", href: "/docs/injection-mcp-server" },
    ],
  },
  {
    title: "Contribution",
    icon: GitBranch,
    slug: "contribution",
    href: "/docs/contribution",
    items: [],
  },
]

function sectionContainsPath(section: SidebarSection, pathname: string) {
  if (section.items.some((item) => pathname === item.href)) return true
  if (
    section.slug === "domains" &&
    (pathname === "/docs/domains" || pathname.startsWith("/docs/domains/"))
  )
    return true
  if (
    section.slug === "environments" &&
    (pathname === "/docs/environments" || pathname.startsWith("/docs/environments/"))
  )
    return true
  return false
}

export function DocsLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/docs"
  const [searchQuery, setSearchQuery] = useState("")
  const [manuallyToggled, setManuallyToggled] = useState<Record<string, boolean>>({})

  const expanded = useMemo(() => {
    const out = new Set<string>()
    for (const section of SECTIONS) {
      const auto = sectionContainsPath(section, pathname)
      const manual = manuallyToggled[section.slug]
      if (manual === undefined ? auto : manual) {
        out.add(section.slug)
      }
    }
    return out
  }, [pathname, manuallyToggled])

  const toggleExpand = (slug: string) => {
    setManuallyToggled((prev) => ({ ...prev, [slug]: !expanded.has(slug) }))
  }

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return SECTIONS
    return SECTIONS.map((section) => {
      const sectionMatch = section.title.toLowerCase().includes(q)
      const matchedItems = section.items.filter((item) =>
        item.title.toLowerCase().includes(q)
      )
      if (sectionMatch) return section
      if (matchedItems.length > 0) return { ...section, items: matchedItems }
      return null
    }).filter((s): s is SidebarSection => s !== null)
  }, [searchQuery])

  return (
    <section className="min-h-screen bg-background">
      <div className="container mx-auto">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/docs" className="flex items-center gap-3">
              <Book className="h-6 w-6" />
              <h1 className="text-xl font-semibold">Documentation</h1>
            </Link>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search docs..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex">
          <aside className="hidden md:block w-64 shrink-0 border-r border-border p-6 sticky top-0 h-screen overflow-y-auto">
            <nav className="space-y-1">
              {filteredSections.map((section) => {
                const isExpanded = expanded.has(section.slug)
                const isParentActive = sectionContainsPath(section, pathname)
                return (
                  <div key={section.slug}>
                    <div
                      className={cn(
                        "flex items-center gap-1 rounded-lg text-sm transition-colors",
                        isParentActive ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      <Link
                        href={section.href}
                        className={cn(
                          "flex flex-1 items-center gap-2 px-3 py-2 rounded-lg",
                          pathname === section.href
                            ? "bg-accent text-accent-foreground"
                            : "hover:text-foreground hover:bg-secondary"
                        )}
                      >
                        <section.icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 truncate text-left">{section.title}</span>
                      </Link>
                      {section.items.length > 0 ? (
                        <button
                          aria-label={`Toggle ${section.title}`}
                          onClick={() => toggleExpand(section.slug)}
                          className="px-2 py-2 text-muted-foreground hover:text-foreground"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      ) : null}
                    </div>

                    {section.items.length > 0 && isExpanded ? (
                      <div
                        className={cn(
                          "ml-6 mt-1 space-y-1 border-l border-border pl-3",
                          section.items.length > 12
                            ? "max-h-[60vh] overflow-y-auto pr-1"
                            : ""
                        )}
                      >
                        {section.items.map((item) => {
                          const isActive = pathname === item.href
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={cn(
                                "block px-3 py-1.5 rounded-md text-sm transition-colors",
                                isActive
                                  ? "text-accent font-medium bg-accent/15"
                                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                              )}
                            >
                              {item.title}
                            </Link>
                          )
                        })}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </nav>
          </aside>

          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </section>
  )
}

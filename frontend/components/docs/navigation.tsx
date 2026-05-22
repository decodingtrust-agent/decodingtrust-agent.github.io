"use client"

import Link from "next/link"
import {
  ChevronRight,
  ChevronDown,
  Database,
  Zap,
  Package,
  Server,
  Play,
  Cpu,
  Shield,
  GitBranch,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DOMAINS } from "@/lib/domains"
import { environments } from "@/lib/environments.generated"

type SidebarItem = {
  title: string
  /** Internal SPA section slug. Mutually exclusive with `href`. */
  slug?: string
  /** External navigation target (per-domain / per-environment routes). */
  href?: string
}

type SidebarSection = {
  title: string
  icon: React.ComponentType<{ className?: string }>
  /** SPA section slug (the "Quick Start" / "Domain" / etc. parent itself). */
  slug: string
  items: SidebarItem[]
  /** When true, clicking the section navigates instead of toggling. */
  parentHref?: string
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

export const docsHierarchy: SidebarSection[] = [
  { title: "Quick Start", icon: Zap, slug: "quick-start", items: [] },
  {
    title: "Domain",
    icon: Database,
    slug: "domain",
    items: domainItems,
  },
  {
    title: "Environment",
    icon: Server,
    slug: "environment",
    items: environmentItems,
  },
  {
    title: "Installation",
    icon: Package,
    slug: "installation",
    items: [
      { title: "Install SDK", slug: "install-sdk" },
      { title: "Install from Source", slug: "install-source" },
      { title: "Install Environment", slug: "install-environment" },
    ],
  },
  {
    title: "Run Evaluation",
    icon: Play,
    slug: "run-evaluation",
    items: [
      { title: "Eval with decodingtrust-agent", slug: "eval-decodingtrust" },
      { title: "Eval with Inspect Evals", slug: "eval-inspect" },
    ],
  },
  {
    title: "Supported Agents",
    icon: Cpu,
    slug: "supported-agents",
    items: [
      { title: "Off-the-Shelf Agents", slug: "off-the-shelf-agents" },
      { title: "Wrap Pre-Built Agents", slug: "wrap-prebuilt-agents" },
      { title: "Add Custom Agents", slug: "add-custom-agents" },
      { title: "Use Custom Models", slug: "use-custom-models" },
    ],
  },
  {
    title: "Red-teaming Agent",
    icon: Shield,
    slug: "red-teaming-agent",
    items: [
      { title: "Overview", slug: "red-teaming-overview" },
      { title: "Quick Start", slug: "red-teaming-quickstart" },
      { title: "Attack Skills", slug: "attack-skills" },
      { title: "Injection MCP Server", slug: "injection-mcp-server" },
    ],
  },
  { title: "Contribution", icon: GitBranch, slug: "contribution", items: [] },
]

interface DocsSidebarProps {
  activeSection: string
  expandedSections: string[]
  onSectionClick: (slug: string) => void
  onItemClick: (sectionSlug: string, itemSlug: string) => void
}

export function DocsSidebar({
  activeSection,
  expandedSections,
  onSectionClick,
  onItemClick,
}: DocsSidebarProps) {
  return (
    <nav className="space-y-1">
      {docsHierarchy.map((section) => {
        const expanded = expandedSections.includes(section.slug)
        return (
          <div key={section.slug}>
            <button
              onClick={() => onSectionClick(section.slug)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                activeSection === section.slug
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <section.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left truncate">{section.title}</span>
              {section.items.length > 0 ? (
                expanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )
              ) : null}
            </button>

            {section.items.length > 0 && expanded ? (
              <div
                className={cn(
                  "ml-6 mt-1 space-y-1 border-l border-border pl-3",
                  // For very long lists (Environment has 40), make the panel scroll
                  section.items.length > 12 ? "max-h-[60vh] overflow-y-auto pr-1" : ""
                )}
              >
                {section.items.map((item) =>
                  item.href ? (
                    <Link
                      key={item.title}
                      href={item.href}
                      className={cn(
                        "block px-3 py-1.5 rounded-md text-sm transition-colors",
                        "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                      )}
                    >
                      {item.title}
                    </Link>
                  ) : (
                    <button
                      key={item.slug}
                      onClick={() => item.slug && onItemClick(section.slug, item.slug)}
                      className={cn(
                        "w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors",
                        activeSection === item.slug
                          ? "text-accent font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {item.title}
                    </button>
                  )
                )}
              </div>
            ) : null}
          </div>
        )
      })}
    </nav>
  )
}

export function getCurrentInfo(activeSection: string): {
  title: string
  section: string | null
  slug: string
} {
  for (const section of docsHierarchy) {
    if (section.slug === activeSection) {
      return { title: section.title, section: null, slug: section.slug }
    }
    for (const item of section.items) {
      if (item.slug && item.slug === activeSection) {
        return { title: item.title, section: section.title, slug: item.slug }
      }
    }
  }
  return { title: "Documentation", section: null, slug: "quick-start" }
}

"use client"

import {
  ChevronRight,
  ChevronDown,
  Database,
  Zap,
  Terminal,
  Package,
  Server,
  Play,
  Cpu,
  Shield,
  Trophy,
  GitBranch,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Documentation hierarchy structure
export const docsHierarchy = [
  {
    title: "Quick Start",
    icon: Zap,
    slug: "quick-start",
    items: [],
  },
  {
    title: "Domain",
    icon: Database,
    slug: "domain",
    items: [
      { title: "Workflow", slug: "workflow" },
      { title: "CRM", slug: "crm" },
    ],
  },
  {
    title: "Environment",
    icon: Server,
    slug: "environment",
    items: [
      { title: "Gmail", slug: "gmail" },
      { title: "Google Calendar", slug: "google-calendar" },
      { title: "Salesforce CRM", slug: "salesforce-crm" },
    ],
  },
  {
    title: "Installation",
    icon: Package,
    slug: "installation",
    items: [
      { title: "Install SDK", slug: "install-sdk" },
      { title: "Install from Inspect", slug: "install-inspect" },
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
  {
    title: "AgentHarm",
    icon: Terminal,
    slug: "agent-harm",
    items: [],
  },
  {
    title: "Leaderboard",
    icon: Trophy,
    slug: "leaderboard",
    items: [],
  },
  {
    title: "Contribution",
    icon: GitBranch,
    slug: "contribution",
    items: [],
  },
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
      {docsHierarchy.map((section) => (
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
            {section.items.length > 0 && (
              expandedSections.includes(section.slug) ? (
                <ChevronDown className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0" />
              )
            )}
          </button>

          {/* Sub-items */}
          {section.items.length > 0 && expandedSections.includes(section.slug) && (
            <div className="ml-6 mt-1 space-y-1 border-l border-border pl-3">
              {section.items.map((item) => (
                <button
                  key={item.slug}
                  onClick={() => onItemClick(section.slug, item.slug)}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors",
                    activeSection === item.slug
                      ? "text-accent font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.title}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  )
}

// Helper to get current section info for breadcrumbs
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
      if (item.slug === activeSection) {
        return { title: item.title, section: section.title, slug: item.slug }
      }
    }
  }
  return { title: "Documentation", section: null, slug: "quick-start" }
}

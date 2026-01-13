"use client"

import { useState, useEffect } from "react"
import { Book, ChevronRight, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { DocsSidebar, docsHierarchy, getCurrentInfo } from "./navigation"
import {
  QuickStartContent,
  SupportedAgentsContent,
  OffTheShelfAgentsContent,
  AddCustomAgentsContent,
  UseCustomModelsContent,
  PlaceholderContent,
} from "./content"

// Content router component
function getContent(slug: string, title: string) {
  switch (slug) {
    case "quick-start":
      return <QuickStartContent />
    case "supported-agents":
      return <SupportedAgentsContent />
    case "off-the-shelf-agents":
      return <OffTheShelfAgentsContent />
    case "add-custom-agents":
      return <AddCustomAgentsContent />
    case "use-custom-models":
      return <UseCustomModelsContent />
    default:
      return <PlaceholderContent title={title} slug={slug} />
  }
}

export function DocsSection() {
  const [activeSection, setActiveSection] = useState("quick-start")
  const [expandedSections, setExpandedSections] = useState<string[]>(["supported-agents"])
  const [searchQuery, setSearchQuery] = useState("")

  // Handle section click - expand/collapse and navigate
  const handleSectionClick = (slug: string) => {
    const section = docsHierarchy.find((s) => s.slug === slug)

    if (section?.items.length) {
      // Toggle expansion
      setExpandedSections((prev) =>
        prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
      )
    }

    // Always navigate to section
    setActiveSection(slug)
  }

  // Handle sub-item click
  const handleItemClick = (sectionSlug: string, itemSlug: string) => {
    // Ensure section is expanded
    if (!expandedSections.includes(sectionSlug)) {
      setExpandedSections((prev) => [...prev, sectionSlug])
    }
    setActiveSection(itemSlug)
  }

  // Get current page info for breadcrumbs
  const currentInfo = getCurrentInfo(activeSection)

  return (
    <section className="min-h-screen bg-background">
      <div className="container mx-auto">
        {/* Header */}
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Book className="h-6 w-6 text-accent" />
              <h1 className="text-xl font-semibold">Documentation</h1>
            </div>
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
          {/* Sidebar */}
          <aside className="hidden md:block w-64 border-r border-border p-6 sticky top-0 h-screen overflow-y-auto">
            <DocsSidebar
              activeSection={activeSection}
              expandedSections={expandedSections}
              onSectionClick={handleSectionClick}
              onItemClick={handleItemClick}
            />
          </aside>

          {/* Main Content */}
          <main className="flex-1 px-6 py-12 lg:px-12">
            <div className="max-w-4xl">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <span>Docs</span>
                {currentInfo.section && (
                  <>
                    <ChevronRight className="h-4 w-4" />
                    <span>{currentInfo.section}</span>
                  </>
                )}
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">{currentInfo.title}</span>
              </div>

              {/* Page Title */}
              <h1 className="text-3xl md:text-4xl font-bold mb-8">{currentInfo.title}</h1>

              {/* Dynamic Content */}
              {getContent(currentInfo.slug, currentInfo.title)}
            </div>
          </main>

          {/* Table of Contents */}
          <aside className="hidden xl:block w-56 p-6 sticky top-0 h-screen">
            <h4 className="text-sm font-semibold mb-4">On this page</h4>
            <nav className="space-y-2 text-sm text-muted-foreground">
              <a href="#" className="block hover:text-foreground transition-colors">
                Overview
              </a>
              <a href="#" className="block hover:text-foreground transition-colors">
                Examples
              </a>
              <a href="#" className="block hover:text-foreground transition-colors">
                API Reference
              </a>
            </nav>
          </aside>
        </div>
      </div>
    </section>
  )
}

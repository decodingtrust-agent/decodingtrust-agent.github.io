"use client"

import { useState } from "react"
import { Book, ChevronRight, Search, FileText, Code, Shield, Database, Zap } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const sidebarItems = [
  {
    title: "Getting Started",
    items: ["Introduction", "Installation", "Quick Start", "Configuration"],
  },
  {
    title: "Core Concepts",
    items: ["Sandboxes", "Domains", "Tasks", "Policies"],
  },
  {
    title: "Red Teaming",
    items: ["Attack Vectors", "Injection Methods", "Optimization", "Reporting"],
  },
  {
    title: "Evaluation",
    items: ["Running Benchmarks", "Metrics", "Custom Tasks", "CI/CD Integration"],
  },
  {
    title: "API Reference",
    items: ["Benchmark", "Agent", "RedTeamAgent", "Results"],
  },
]

export function DocsSection() {
  const [activeItem, setActiveItem] = useState("Introduction")

  return (
    <section className="min-h-screen">
      <div className="mx-auto max-w-7xl">
        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 border-r border-border min-h-screen p-6 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search docs..." className="pl-9 bg-secondary/50 border-border" />
              </div>
            </div>

            <nav className="space-y-6">
              {sidebarItems.map((section) => (
                <div key={section.title}>
                  <h4 className="text-sm font-semibold text-foreground mb-2">{section.title}</h4>
                  <ul className="space-y-1">
                    {section.items.map((item) => (
                      <li key={item}>
                        <button
                          onClick={() => setActiveItem(item)}
                          className={cn(
                            "w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors",
                            activeItem === item
                              ? "bg-accent/10 text-accent font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                          )}
                        >
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 px-6 py-12 lg:px-12">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <span>Docs</span>
                <ChevronRight className="h-4 w-4" />
                <span>Getting Started</span>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">{activeItem}</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-6">{activeItem}</h1>

              <div className="prose prose-invert max-w-none">
                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  DecodingTrust Agent Suite is a comprehensive evaluation framework for testing AI agent security. It
                  provides high-fidelity sandbox environments and policy-aligned evaluation scenarios.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-accent" />
                  Key Features
                </h2>

                <div className="grid gap-4 md:grid-cols-2 mb-8">
                  {[
                    { icon: Database, title: "30+ Sandboxes", desc: "Gmail, PayPal, Databricks, and more" },
                    { icon: Zap, title: "500+ Tasks", desc: "Per domain for comprehensive coverage" },
                    { icon: Shield, title: "Policy-Aligned", desc: "Based on FINRA, Salesforce policies" },
                    { icon: Code, title: "Black-Box Ready", desc: "Evaluate any agentic system" },
                  ].map((feature) => (
                    <div key={feature.title} className="p-4 rounded-lg border border-border bg-card">
                      <feature.icon className="h-5 w-5 text-accent mb-2" />
                      <h4 className="font-medium mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.desc}</p>
                    </div>
                  ))}
                </div>

                <h2 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" />
                  Prerequisites
                </h2>

                <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-8">
                  <li>Python 3.10 or higher</li>
                  <li>Docker (for sandbox environments)</li>
                  <li>API keys for target agents (if applicable)</li>
                </ul>

                <h2 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2">
                  <Book className="h-5 w-5 text-accent" />
                  Citation
                </h2>

                <pre className="bg-secondary/50 rounded-lg p-4 overflow-x-auto text-sm">
                  {`@article{decodingtrust-agent2025,
  title={DecodingTrust Agent Suite: Automated Security 
         Auditing of AI Agents in Real Environments},
  author={Research Team},
  journal={arXiv preprint},
  year={2025}
}`}
                </pre>
              </div>
            </div>
          </main>

          {/* Table of Contents */}
          <aside className="hidden xl:block w-56 p-6 sticky top-14 h-[calc(100vh-3.5rem)]">
            <h4 className="text-sm font-semibold mb-4">On this page</h4>
            <nav className="space-y-2">
              {["Key Features", "Prerequisites", "Citation"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(" ", "-")}`}
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item}
                </a>
              ))}
            </nav>
          </aside>
        </div>
      </div>
    </section>
  )
}

"use client"

import { useState, useMemo } from "react"
import { Copy, Check, Search, ChevronDown, X, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Domain categories for filtering
const DOMAINS = [
  "Code",
  "OS Terminal",
  "OS GUI",
  "E-commerce",
  "Workflow",
  "HR",
  "Recommendation",
  "Customer Service",
  "Travel",
  "Finance",
  "Legal",
  "Telecom",
  "CRM",
  "Healthcare",
  "Research",
] as const

type Domain = (typeof DOMAINS)[number]

// Full leaderboard data with per-domain scores
const leaderboardData = [
  {
    rank: 1,
    agent: "GPT-5",
    model: "gpt-5",
    date: "2026-01-08",
    agentOrg: "OpenAI",
    modelOrg: "OpenAI",
    overall: 72.3,
    variance: 2.1,
    domains: {
      Code: 78.2,
      "OS Terminal": 81.4,
      "OS GUI": 69.3,
      "E-commerce": 71.5,
      Workflow: 74.2,
      HR: 68.9,
      Recommendation: 70.1,
      "Customer Service": 73.4,
      Travel: 72.8,
      Finance: 65.2,
      Legal: 62.8,
      Telecom: 71.9,
      CRM: 74.5,
      Healthcare: 61.2,
      Research: 68.4,
    },
  },
  {
    rank: 2,
    agent: "Claude-4",
    model: "claude-4-opus",
    date: "2026-01-05",
    agentOrg: "Anthropic",
    modelOrg: "Anthropic",
    overall: 68.9,
    variance: 1.8,
    domains: {
      Code: 74.1,
      "OS Terminal": 76.3,
      "OS GUI": 65.8,
      "E-commerce": 69.2,
      Workflow: 71.8,
      HR: 66.4,
      Recommendation: 67.9,
      "Customer Service": 71.2,
      Travel: 70.1,
      Finance: 63.8,
      Legal: 68.5,
      Telecom: 69.4,
      CRM: 71.2,
      Healthcare: 59.8,
      Research: 67.8,
    },
  },
  {
    rank: 3,
    agent: "Gemini Pro",
    model: "gemini-2.0-pro",
    date: "2026-01-06",
    agentOrg: "Google",
    modelOrg: "Google",
    overall: 65.4,
    variance: 2.4,
    domains: {
      Code: 71.2,
      "OS Terminal": 73.8,
      "OS GUI": 62.4,
      "E-commerce": 66.1,
      Workflow: 68.3,
      HR: 63.2,
      Recommendation: 64.5,
      "Customer Service": 67.8,
      Travel: 66.9,
      Finance: 61.2,
      Legal: 58.9,
      Telecom: 66.1,
      CRM: 68.4,
      Healthcare: 56.7,
      Research: 65.2,
    },
  },
  {
    rank: 4,
    agent: "DeepSeek-V4",
    model: "deepseek-v4",
    date: "2026-01-04",
    agentOrg: "DeepSeek",
    modelOrg: "DeepSeek",
    overall: 62.1,
    variance: 2.9,
    domains: {
      Code: 68.9,
      "OS Terminal": 70.2,
      "OS GUI": 58.1,
      "E-commerce": 62.8,
      Workflow: 64.9,
      HR: 59.8,
      Recommendation: 61.2,
      "Customer Service": 64.1,
      Travel: 63.2,
      Finance: 57.8,
      Legal: 55.4,
      Telecom: 62.8,
      CRM: 65.1,
      Healthcare: 53.2,
      Research: 63.8,
    },
  },
  {
    rank: 5,
    agent: "Llama-4",
    model: "llama-4-70b",
    date: "2026-01-03",
    agentOrg: "Meta",
    modelOrg: "Meta",
    overall: 58.7,
    variance: 3.2,
    domains: {
      Code: 65.4,
      "OS Terminal": 67.1,
      "OS GUI": 54.8,
      "E-commerce": 59.2,
      Workflow: 61.4,
      HR: 56.1,
      Recommendation: 57.8,
      "Customer Service": 60.5,
      Travel: 59.8,
      Finance: 54.2,
      Legal: 51.8,
      Telecom: 59.1,
      CRM: 61.8,
      Healthcare: 49.8,
      Research: 61.7,
    },
  },
  {
    rank: 6,
    agent: "Codex CLI",
    model: "gpt-5",
    date: "2025-12-28",
    agentOrg: "OpenAI",
    modelOrg: "OpenAI",
    overall: 56.2,
    variance: 2.7,
    domains: {
      Code: 72.1,
      "OS Terminal": 74.8,
      "OS GUI": 48.2,
      "E-commerce": 52.4,
      Workflow: 58.1,
      HR: 48.9,
      Recommendation: 51.2,
      "Customer Service": 54.8,
      Travel: 53.1,
      Finance: 51.8,
      Legal: 48.2,
      Telecom: 55.4,
      CRM: 57.1,
      Healthcare: 45.2,
      Research: 71.4,
    },
  },
  {
    rank: 7,
    agent: "Cursor Agent",
    model: "claude-4-opus",
    date: "2025-12-25",
    agentOrg: "Cursor",
    modelOrg: "Anthropic",
    overall: 54.8,
    variance: 3.1,
    domains: {
      Code: 69.8,
      "OS Terminal": 71.2,
      "OS GUI": 46.1,
      "E-commerce": 50.8,
      Workflow: 56.4,
      HR: 46.2,
      Recommendation: 49.8,
      "Customer Service": 52.1,
      Travel: 51.4,
      Finance: 49.2,
      Legal: 46.8,
      Telecom: 53.2,
      CRM: 55.8,
      Healthcare: 43.1,
      Research: 69.8,
    },
  },
  {
    rank: 8,
    agent: "Claude Code",
    model: "claude-4-opus",
    date: "2026-01-02",
    agentOrg: "Anthropic",
    modelOrg: "Anthropic",
    overall: 52.3,
    variance: 2.5,
    domains: {
      Code: 67.2,
      "OS Terminal": 68.9,
      "OS GUI": 44.8,
      "E-commerce": 48.2,
      Workflow: 54.1,
      HR: 44.8,
      Recommendation: 47.2,
      "Customer Service": 50.4,
      Travel: 49.8,
      Finance: 47.1,
      Legal: 44.2,
      Telecom: 51.8,
      CRM: 53.2,
      Healthcare: 41.8,
      Research: 67.1,
    },
  },
]

export function LeaderboardSection() {
  const [copied, setCopied] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDomains, setSelectedDomains] = useState<Domain[]>([])
  const [showDomainFilter, setShowDomainFilter] = useState(false)

  const runCommand = `dta run -d decodingtrust@1.0 -a "agent" -m "model" -k 5`

  const copyCommand = () => {
    navigator.clipboard.writeText(runCommand)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleDomain = (domain: Domain) => {
    setSelectedDomains((prev) => (prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]))
  }

  const clearFilters = () => {
    setSelectedDomains([])
    setSearchQuery("")
  }

  const filteredData = useMemo(() => {
    return leaderboardData.filter(
      (row) =>
        row.agent.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.agentOrg.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [searchQuery])

  // Columns to show based on selected domains
  const visibleDomains =
    selectedDomains.length > 0 ? selectedDomains : (["Code", "Finance", "Healthcare", "Legal", "CRM"] as Domain[])

  return (
    <section className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span>Home</span>
          <span className="text-muted-foreground/50">{">"}</span>
          <span>Leaderboards</span>
          <span className="text-muted-foreground/50">{">"}</span>
          <span className="text-foreground">decodingtrust@1.0</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-mono font-bold mb-6">decodingtrust@1.0 Leaderboard</h1>

        {/* Run command card */}
        <div className="mb-6 p-4 rounded-lg border border-border bg-card">
          <div className="flex gap-4 mb-3">
            <button className="text-sm font-medium text-foreground border-b-2 border-foreground pb-1">New Model</button>
            <button className="text-sm text-muted-foreground hover:text-foreground pb-1">Custom Agent</button>
          </div>
          <p className="text-xs text-muted-foreground mb-2">Note: submissions may not modify timeouts or resources</p>
          <div className="relative bg-secondary/50 rounded p-3">
            <code className="text-sm font-mono">
              <span className="text-primary">dta</span> run <span className="text-info">-d</span> decodingtrust@1.0{" "}
              <span className="text-info">-a</span> "agent" <span className="text-info">-m</span> "model"{" "}
              <span className="text-info">-k</span> 5
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={copyCommand}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <p className="text-sm text-muted-foreground">Showing {filteredData.length} entries</p>
            {(selectedDomains.length > 0 || searchQuery) && (
              <button className="text-sm text-muted-foreground hover:text-foreground" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leaderboard"
                className="pl-9 h-9 bg-background border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Domain filter dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 bg-transparent"
                onClick={() => setShowDomainFilter(!showDomainFilter)}
              >
                <Filter className="h-3.5 w-3.5" />
                Domains
                {selectedDomains.length > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                    {selectedDomains.length}
                  </span>
                )}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>

              {showDomainFilter && (
                <div className="absolute top-full left-0 mt-1 w-64 p-2 rounded-lg border border-border bg-popover shadow-lg z-50">
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                    {DOMAINS.map((domain) => (
                      <button
                        key={domain}
                        onClick={() => toggleDomain(domain)}
                        className={cn(
                          "px-2 py-1 text-xs rounded-full border transition-colors",
                          selectedDomains.includes(domain)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/50",
                        )}
                      >
                        {domain}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Selected domain chips */}
            {selectedDomains.map((domain) => (
              <span
                key={domain}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20"
              >
                {domain}
                <button onClick={() => toggleDomain(domain)} className="hover:text-primary/70">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Leaderboard table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground w-14">Rank</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground min-w-[100px]">
                    Agent
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Model</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Date</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">Overall</th>
                  {/* Domain columns */}
                  {visibleDomains.map((domain) => (
                    <th
                      key={domain}
                      className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground whitespace-nowrap"
                    >
                      {domain}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row) => (
                  <tr
                    key={row.rank}
                    className="border-b border-border last:border-0 hover:bg-secondary/10 transition-colors"
                  >
                    <td className="px-3 py-2.5 text-sm font-mono">
                      <span className={cn(row.rank <= 3 && "font-semibold")}>{row.rank}</span>
                    </td>
                    <td className="px-3 py-2.5 text-sm font-medium">{row.agent}</td>
                    <td className="px-3 py-2.5 text-sm font-mono text-muted-foreground">{row.model}</td>
                    <td className="px-3 py-2.5 text-sm font-mono text-muted-foreground">{row.date}</td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="text-sm font-mono font-semibold">{row.overall.toFixed(1)}%</span>
                      <span className="text-xs text-muted-foreground ml-1">±{row.variance}</span>
                    </td>
                    {visibleDomains.map((domain) => (
                      <td key={domain} className="px-3 py-2.5 text-right">
                        <span
                          className={cn(
                            "text-sm font-mono",
                            row.domains[domain] >= 70
                              ? "text-success"
                              : row.domains[domain] >= 55
                                ? "text-foreground"
                                : "text-muted-foreground",
                          )}
                        >
                          {row.domains[domain].toFixed(1)}%
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span>Defense Rate:</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success" /> ≥70%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-foreground" /> 55-69%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-muted-foreground" /> {"<"}55%
          </span>
        </div>
      </div>
    </section>
  )
}

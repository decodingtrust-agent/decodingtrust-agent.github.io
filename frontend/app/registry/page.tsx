"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Search, Database, Copy, Check, SquareArrowOutUpRight, Globe, Terminal, FolderOpen, Plane, Monitor, GitBranch, Phone, HeartPulse, Code2, BookOpen, Headphones, Landmark, Scale, Laptop } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface Task {
  slug: string
  task_id: string
  domain: string
  author: string | null
  type: string
  threat_model: string | null
  task_category: string | null
  task_instruction: string
  risk_category: string | null
  malicious_goal: string | null
  difficulty: string | null
  has_attack_turns: boolean
}

interface RegistryData {
  version: string
  total_tasks: number
  domains: string[]
  types: string[]
  threat_models: string[]
  risk_categories: string[]
  tasks: Task[]
}

const DOMAIN_LABELS: Record<string, string> = {
  browser: "Browser",
  code: "Code",
  crm: "CRM",
  "customer-service": "Customer Service",
  finance: "Finance",
  legal: "Legal",
  macos: "macOS",
  medical: "Medical",
  "os-filesystem": "OS-Filesystem",
  research: "Research",
  telecom: "Telecom",
  travel: "Travel",
  windows: "Windows",
  workflow: "Workflow",
}

// Default display order: one indirect example per domain, following this rank
const DOMAIN_DISPLAY_ORDER = [
  "crm",
  "workflow",
  "customer-service",
  "travel",
  "code",
  "browser",
  "research",
  "os-filesystem",
  "windows",
  "macos",
  "finance",
  "legal",
  "telecom",
  "medical",
]

const DOMAIN_ICONS: Record<string, React.ReactNode> = {
  browser: <Globe className="h-3 w-3" />,
  code: <Code2 className="h-3 w-3" />,
  crm: <Database className="h-3 w-3" />,
  "customer-service": <Headphones className="h-3 w-3" />,
  finance: <Landmark className="h-3 w-3" />,
  legal: <Scale className="h-3 w-3" />,
  macos: <Laptop className="h-3 w-3" />,
  medical: <HeartPulse className="h-3 w-3" />,
  "os-filesystem": <FolderOpen className="h-3 w-3" />,
  research: <BookOpen className="h-3 w-3" />,
  telecom: <Phone className="h-3 w-3" />,
  travel: <Plane className="h-3 w-3" />,
  windows: <Monitor className="h-3 w-3" />,
  workflow: <GitBranch className="h-3 w-3" />,
}

const MAX_VISIBLE_TAGS = 3
const ITEMS_PER_PAGE = 60

export default function RegistryPage() {
  const searchParams = useSearchParams()

  const [data, setData] = useState<RegistryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(() => searchParams.get("q") || "")
  const [typeFilter, setTypeFilter] = useState<string>(() => searchParams.get("type") || "all")
  const [threatFilter, setThreatFilter] = useState<string>(() => searchParams.get("threat") || "all")
  const [domainFilter, setDomainFilter] = useState<string>(() => searchParams.get("domain") || "all")
  const [categoryFilter, setCategoryFilter] = useState<string>(() => searchParams.get("category") || "all")
  const [currentPage, setCurrentPage] = useState(() => {
    const p = parseInt(searchParams.get("page") || "1", 10)
    return isNaN(p) || p < 1 ? 1 : p
  })
  const [copied, setCopied] = useState(false)
  const skipDomainResetRef = useRef(false)
  const initializedRef = useRef(false)

  // Sync filter state to URL (replaceState to avoid extra history entries)
  useEffect(() => {
    // Skip the first render to avoid overwriting URL params before they're read
    if (!initializedRef.current) {
      initializedRef.current = true
      return
    }
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    if (typeFilter !== "all") params.set("type", typeFilter)
    if (threatFilter !== "all") params.set("threat", threatFilter)
    if (domainFilter !== "all") params.set("domain", domainFilter)
    if (categoryFilter !== "all") params.set("category", categoryFilter)
    if (currentPage > 1) params.set("page", String(currentPage))
    const qs = params.toString()
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname
    window.history.replaceState(null, "", url)
  }, [search, typeFilter, threatFilter, domainFilter, categoryFilter, currentPage])

  useEffect(() => {
    fetch("/data/tasks-index.json")
      .then((res) => res.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Ordered display: show one indirect example per domain (in DOMAIN_DISPLAY_ORDER),
  // then remaining indirect tasks, then direct tasks, then benign tasks.
  const shuffledTasks = useMemo(() => {
    if (!data) return []
    const seed = (s: string) => {
      let h = 0
      for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
      return h
    }

    // Categorize tasks
    const indirect: Task[] = []
    const direct: Task[] = []
    const benign: Task[] = []
    data.tasks.forEach((t) => {
      if (t.type === "malicious" && t.threat_model === "indirect") indirect.push(t)
      else if (t.type === "malicious") direct.push(t)
      else benign.push(t)
    })

    // Sort each group by seed for stable ordering
    indirect.sort((a, b) => seed(a.slug) - seed(b.slug))
    direct.sort((a, b) => seed(a.slug) - seed(b.slug))
    benign.sort((a, b) => seed(a.slug) - seed(b.slug))

    // Pick one indirect example per domain in display order
    // For CRM, prefer a data-exfiltration example
    const featured: Task[] = []
    const usedSlugs = new Set<string>()
    for (const domain of DOMAIN_DISPLAY_ORDER) {
      let example: Task | undefined
      if (domain === "crm") {
        example = indirect.find((t) =>
          t.domain === domain &&
          !usedSlugs.has(t.slug) &&
          (t.risk_category?.toLowerCase().includes("data-exfiltration") ||
           t.risk_category?.toLowerCase().includes("data exfiltration"))
        )
      }
      if (!example) {
        example = indirect.find((t) => t.domain === domain && !usedSlugs.has(t.slug))
      }
      if (example) {
        featured.push(example)
        usedSlugs.add(example.slug)
      }
    }

    // Remaining indirect (not featured), round-robin by domain in display order
    const remainingIndirect = indirect.filter((t) => !usedSlugs.has(t.slug))
    const indirectByDomain = new Map<string, Task[]>()
    remainingIndirect.forEach((t) => {
      if (!indirectByDomain.has(t.domain)) indirectByDomain.set(t.domain, [])
      indirectByDomain.get(t.domain)!.push(t)
    })
    const indirectQueues = DOMAIN_DISPLAY_ORDER
      .filter((d) => indirectByDomain.has(d))
      .map((d) => indirectByDomain.get(d)!)
    // Add any domains not in the display order
    for (const [domain, tasks] of indirectByDomain) {
      if (!DOMAIN_DISPLAY_ORDER.includes(domain)) indirectQueues.push(tasks)
    }
    const interleavedIndirect: Task[] = []
    let remaining = true
    let idx = 0
    while (remaining) {
      remaining = false
      for (const queue of indirectQueues) {
        if (idx < queue.length) {
          interleavedIndirect.push(queue[idx])
          if (idx + 1 < queue.length) remaining = true
        }
      }
      idx++
    }

    // Round-robin direct tasks by domain in display order
    const directByDomain = new Map<string, Task[]>()
    direct.forEach((t) => {
      if (!directByDomain.has(t.domain)) directByDomain.set(t.domain, [])
      directByDomain.get(t.domain)!.push(t)
    })
    const directQueues = DOMAIN_DISPLAY_ORDER
      .filter((d) => directByDomain.has(d))
      .map((d) => directByDomain.get(d)!)
    for (const [domain, tasks] of directByDomain) {
      if (!DOMAIN_DISPLAY_ORDER.includes(domain)) directQueues.push(tasks)
    }
    const interleavedDirect: Task[] = []
    remaining = true
    idx = 0
    while (remaining) {
      remaining = false
      for (const queue of directQueues) {
        if (idx < queue.length) {
          interleavedDirect.push(queue[idx])
          if (idx + 1 < queue.length) remaining = true
        }
      }
      idx++
    }

    return [...featured, ...interleavedIndirect, ...interleavedDirect, ...benign]
  }, [data])

  const filteredTasks = useMemo(() => {
    if (!shuffledTasks.length) return []
    return shuffledTasks.filter((task) => {
      // Hide malicious tasks without attack turns
      if (task.type === "malicious" && !task.has_attack_turns) return false
      if (typeFilter !== "all" && task.type !== typeFilter) return false
      if (threatFilter !== "all") {
        if (threatFilter === "direct" && task.threat_model !== "direct") return false
        if (threatFilter === "indirect" && task.threat_model !== "indirect") return false
      }
      if (domainFilter !== "all" && task.domain !== domainFilter) return false
      if (categoryFilter !== "all" && task.risk_category !== categoryFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          task.task_id.toLowerCase().includes(q) ||
          task.task_instruction.toLowerCase().includes(q) ||
          (task.malicious_goal && task.malicious_goal.toLowerCase().includes(q)) ||
          (task.risk_category && task.risk_category.toLowerCase().includes(q)) ||
          (task.task_category && task.task_category.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [shuffledTasks, search, typeFilter, threatFilter, domainFilter, categoryFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, typeFilter, threatFilter, domainFilter, categoryFilter])

  // Reset threat model and category when benign is selected
  useEffect(() => {
    if (typeFilter === "benign") {
      setThreatFilter("all")
      setCategoryFilter("all")
    }
  }, [typeFilter])

  // Reset category when domain changes manually (not via category auto-select)
  useEffect(() => {
    if (skipDomainResetRef.current) {
      skipDomainResetRef.current = false
      return
    }
    setCategoryFilter("all")
  }, [domainFilter])

  // Grouped categories by domain (for when domainFilter is "all")
  // Always computed from malicious tasks regardless of typeFilter
  const categoriesByDomain = useMemo(() => {
    if (!data) return new Map<string, string[]>()
    const domainCats = new Map<string, Set<string>>()
    data.tasks.forEach((t) => {
      if (t.type !== "malicious") return
      if (threatFilter !== "all" && t.threat_model !== threatFilter) return
      if (t.risk_category) {
        if (!domainCats.has(t.domain)) domainCats.set(t.domain, new Set())
        domainCats.get(t.domain)!.add(t.risk_category)
      }
    })
    const result = new Map<string, string[]>()
    for (const domain of Array.from(domainCats.keys()).sort()) {
      result.set(domain, Array.from(domainCats.get(domain)!).sort())
    }
    return result
  }, [data, threatFilter])

  // Flat categories for when a specific domain is selected
  const availableCategories = useMemo(() => {
    if (!data || domainFilter === "all") return []
    const cats = new Set<string>()
    data.tasks.forEach((t) => {
      if (t.type !== "malicious") return
      if (threatFilter !== "all" && t.threat_model !== threatFilter) return
      if (t.domain !== domainFilter) return
      if (t.risk_category) cats.add(t.risk_category)
    })
    return Array.from(cats).sort()
  }, [data, threatFilter, domainFilter])

  const showCategoryFilter = domainFilter === "all" ? categoriesByDomain.size > 0 : availableCategories.length > 0

  const handleCategoryChange = useCallback((value: string) => {
    if (value === "all") {
      setCategoryFilter("all")
      return
    }
    // Grouped values are encoded as "domain::category"
    if (value.includes("::")) {
      const [domain, category] = value.split("::", 2)
      skipDomainResetRef.current = true
      setDomainFilter(domain)
      setCategoryFilter(category)
      // Auto-select malicious type since risk categories are malicious-only
      if (typeFilter !== "malicious") setTypeFilter("malicious")
    } else {
      setCategoryFilter(value)
      if (typeFilter !== "malicious") setTypeFilter("malicious")
    }
  }, [typeFilter])

  const handleCopy = () => {
    navigator.clipboard.writeText("pip install decodingtrust-agent")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const clearFilters = useCallback(() => {
    setSearch("")
    setTypeFilter("all")
    setThreatFilter("all")
    setDomainFilter("all")
    setCategoryFilter("all")
  }, [])

  const hasFilters = typeFilter !== "all" || threatFilter !== "all" || domainFilter !== "all" || categoryFilter !== "all" || search

  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE)
  const pageTasks = filteredTasks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading registry...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <p className="text-muted-foreground">Failed to load registry data.</p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Hero - clean blank background */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <span className="text-foreground">Registry</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-mono font-bold tracking-tight mb-3">
            decodingtrust-agent==0.1
          </h1>
          <p className="text-muted-foreground max-w-2xl mb-6">
            A comprehensive benchmark for evaluating the trustworthiness of AI agents across multiple domains.
            Hand crafted by red-teaming experts from VirtueAI, UIUC, Stanford, UC Berkeley, and UChicago.
          </p>
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 font-mono text-sm">
            <span className="text-muted-foreground select-none">$</span>
            <code>pip install decodingtrust-agent</code>
            <button
              onClick={handleCopy}
              className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Copy install command"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filteredTasks.length}</span> tasks
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Clear filters
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tasks" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className={cn("h-9", typeFilter !== "all" && "border-primary/50")}>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="benign">Benign</SelectItem>
              <SelectItem value="malicious">Malicious</SelectItem>
            </SelectContent>
          </Select>
          {typeFilter !== "benign" && (
            <Select value={threatFilter} onValueChange={setThreatFilter}>
              <SelectTrigger className={cn("h-9", threatFilter !== "all" && "border-primary/50")}>
                <SelectValue placeholder="Select threat model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All threat models</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
                <SelectItem value="indirect">Indirect</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Select value={domainFilter} onValueChange={setDomainFilter}>
            <SelectTrigger className={cn("h-9", domainFilter !== "all" && "border-primary/50")}>
              <SelectValue placeholder="Select domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All domains</SelectItem>
              {data.domains.map((d) => (
                <SelectItem key={d} value={d}>{DOMAIN_LABELS[d] || d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showCategoryFilter && typeFilter !== "benign" && (
            <Select value={categoryFilter} onValueChange={handleCategoryChange}>
              <SelectTrigger className={cn("h-9", categoryFilter !== "all" && "border-primary/50")}>
                <SelectValue placeholder="Select risk category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All risk categories</SelectItem>
                {domainFilter === "all" ? (
                  /* Grouped by domain */
                  Array.from(categoriesByDomain.entries()).map(([domain, cats], idx) => (
                    <SelectGroup key={domain}>
                      {idx > 0 && <SelectSeparator />}
                      <SelectLabel>{DOMAIN_LABELS[domain] || domain}</SelectLabel>
                      {cats.map((c) => (
                        <SelectItem key={`${domain}::${c}`} value={`${domain}::${c}`}>{c}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))
                ) : (
                  /* Flat list for selected domain */
                  availableCategories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Grid */}
        {pageTasks.length === 0 ? (
          <div className="text-center py-16">
            <Database className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No tasks match your filters.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pageTasks.map((task) => (
                <TaskCard key={task.slug} task={task} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function TaskCard({ task }: { task: Task }) {
  const isMalicious = task.type === "malicious"

  // Build tags list (deduplicate risk_category vs task_category which can be same with different casing)
  const tags: string[] = []
  const seen = new Set<string>()
  const addTag = (t: string) => {
    const key = t.toLowerCase().replace(/[\s_]+/g, "-")
    if (!seen.has(key)) { seen.add(key); tags.push(t) }
  }
  if (task.risk_category) addTag(task.risk_category)
  if (task.task_category) addTag(task.task_category)
  if (task.threat_model) addTag(task.threat_model)
  if (task.domain) addTag(task.domain)
  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS)
  const overflowCount = tags.length - MAX_VISIBLE_TAGS

  return (
    <Link
      href={`/registry/${task.slug}`}
      className="group flex flex-col rounded-lg border border-border/80 bg-card p-6 transition-all hover:shadow-md hover:border-border min-h-[320px]"
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-base font-bold leading-snug line-clamp-2">
          {task.task_id}
        </h3>
        <SquareArrowOutUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 flex-shrink-0 mt-0.5 transition-colors" />
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Domain badge with icon */}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium">
          {DOMAIN_ICONS[task.domain] || <Terminal className="h-3 w-3" />}
          {DOMAIN_LABELS[task.domain] || task.domain}
        </span>
        {/* Type badge */}
        <span className={cn(
          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
          isMalicious
            ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
            : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
        )}>
          {task.type}
        </span>
        {/* Difficulty badge */}
        {task.difficulty && (
          <span className={cn(
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
            task.difficulty === "hard"
              ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
              : task.difficulty === "medium"
                ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                : "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400"
          )}>
            {task.difficulty}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-7 flex-1">
        {isMalicious && task.malicious_goal
          ? task.malicious_goal.trim()
          : task.task_instruction.trim()}
      </p>

      {/* Footer - tags + author + source */}
      <div className="mt-auto pt-5 space-y-2">
        {task.author && (
          <p className="text-xs text-muted-foreground/60">
            Created by {task.author}
          </p>
        )}
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {visibleTags.map((tag) => (
              <span key={tag} className="inline-flex items-center rounded-full bg-foreground text-background px-2.5 py-0.5 text-[11px] font-medium truncate max-w-[150px]">
                #{tag}
              </span>
            ))}
            {overflowCount > 0 && (
              <span className="text-xs text-muted-foreground/50 flex-shrink-0">
                +{overflowCount}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground/50 flex-shrink-0 group-hover:text-muted-foreground transition-colors">
            Source
          </span>
        </div>
      </div>
    </Link>
  )
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  // Build page numbers: always show first, last, current, and neighbors
  const pages: (number | "ellipsis")[] = []
  const addPage = (p: number) => {
    if (p >= 1 && p <= totalPages && !pages.includes(p)) pages.push(p)
  }

  addPage(1)
  if (currentPage > 3) pages.push("ellipsis")
  for (let i = currentPage - 1; i <= currentPage + 1; i++) addPage(i)
  if (currentPage < totalPages - 2) pages.push("ellipsis")
  addPage(totalPages)

  return (
    <div className="flex items-center justify-center gap-1 mt-10 pb-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-border text-sm transition-colors hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
        aria-label="Previous page"
      >
        &lsaquo;
      </button>
      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`e${i}`} className="inline-flex items-center justify-center h-9 w-9 text-sm text-muted-foreground">
            &hellip;
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              "inline-flex items-center justify-center h-9 w-9 rounded-md text-sm font-medium transition-colors",
              p === currentPage
                ? "bg-foreground text-background"
                : "border border-border hover:bg-muted"
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-border text-sm transition-colors hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
        aria-label="Next page"
      >
        &rsaquo;
      </button>
    </div>
  )
}

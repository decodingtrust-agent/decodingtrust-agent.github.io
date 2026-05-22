"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Shield,
  ShieldAlert,
  Server,
  Bot,
  AlertTriangle,
  Swords,
  FileText,
  Copy,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Zap,
  BookOpen,
  Code2,
  BarChart3,
  Play,
  Lock,
  Globe,
  Wrench,
  Sparkles,
  MessageSquare,
  Calendar,
  Tag,
  User,
  Share2,
  GitBranch,
} from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { TrajectoryTab } from "@/components/registry/trajectory-tab"
import { orderRunsForResults, sdkDisplayName } from "@/lib/trajectory-keys"

/* ────────────────────────────────────────────────────────────── */
/*  Types                                                        */
/* ────────────────────────────────────────────────────────────── */

interface AttackStep {
  type: string
  mode?: string
  injection_mcp_tool?: string
  injected_tool?: string
  skill_name?: string
  content?: string
  kwargs?: Record<string, unknown>
}

interface AttackTurn {
  turn_id: number
  attack_steps: AttackStep[]
}

interface Task {
  slug?: string
  task_id: string
  domain: string
  author: string | null
  type: string
  threat_model: string | null
  task_category: string | null
  task_instruction: string
  template_id: string | null
  base_task: string | null
  benign_task_ref: string | null
  risk_category: string | null
  malicious_goal: string | null
  attack_strategy: string | null
  difficulty: string | null
  attack_vector: string | null
  target_tool: string | null
  risk_id: string | null
  attack_turns: AttackTurn[] | null
  agent_name: string | null
  agent_system_prompt: string
  mcp_servers: { name: string; enabled: boolean; tool_blacklist: string[] }[]
  red_team_injections: Record<string, boolean> | null
  red_team_env_injection: Record<string, unknown> | null
  red_team_skills: string[] | null
  policies: { category: string; policy: string }[] | null
  config_path: string
  judge_exists: boolean
  eval_task: string | null
  eval_attack: string | null
}

const DOMAIN_LABELS: Record<string, string> = {
  browser: "Browser",
  code: "Code",
  crm: "CRM",
  medical: "Medical",
  "os-filesystem": "OS-Filesystem",
  research: "Research",
  telecom: "Telecom",
  travel: "Travel",
  windows: "Windows",
  workflow: "Workflow",
}

const SERVICE_LOGOS: Record<string, string> = {
  gmail: "/logo/domains/gmail.png",
  outlook: "/logo/domains/outlook.webp",
  slack: "/logo/domains/slack.png",
  salesforce: "/logo/domains/salesforce.png",
  github: "/logo/domains/github.svg",
  gitlab: "/logo/domains/gitlab.svg",
  notion: "/logo/domains/notion.png",
  dropbox: "/logo/domains/dropbox.png",
  linkedin: "/logo/domains/linkedin.png",
  x: "/logo/domains/x.webp",
  twitter: "/logo/domains/x.webp",
  reddit: "/logo/domains/reddit.png",
  zoom: "/logo/domains/zoom.svg",
  paypal: "/logo/domains/paypal.svg",
  atlassian: "/logo/domains/atlassian.svg",
  whatsapp: "/logo/domains/whatsapp.png",
  telegram: "/logo/domains/telegram.png",
  spotify: "/logo/domains/spotify.png",
  booking: "/logo/domains/booking.svg",
  expedia: "/logo/domains/expedia.png",
  southwest: "/logo/domains/southwest.png",
  united: "/logo/domains/united.png",
  enterprise: "/logo/domains/enterprise.webp",
  fedex: "/logo/domains/fedex.png",
  doordash: "/logo/domains/doordash.png",
  arxiv: "/logo/domains/arxiv.png",
  filesystem: "/logo/domains/terminal.svg",
  browser: "/logo/domains/browser.png",
  safari: "/logo/domains/safari.png",
  ebay: "/logo/domains/ebay.svg",
  yahoo: "/logo/domains/yahoo.png",
  chase: "/logo/domains/chase.png",
  robinhood: "/logo/domains/robinhood.png",
  legal: "/logo/domains/legal.svg",
  telecom: "/logo/domains/tmobile.png",
  hospital: "/logo/domains/hospital.webp",
  snowflake: "/logo/domains/snowflake.png",
  databricks: "/logo/domains/databricks.png",
  postgresql: "/logo/domains/postgresql.png",
  "google-calendar": "/logo/domains/google-calendar.png",
  "google-docs": "/logo/domains/google-docs.png",
  "google-sheets": "/logo/domains/sheets.png",
  "google-drive": "/logo/domains/google-drive.png",
  "google-forms": "/logo/domains/google-forms.png",
  word: "/logo/domains/msft-word.png",
  excel: "/logo/domains/msft-excel.png",
  powerpoint: "/logo/domains/msft-ppt.png",
  libreoffice: "/logo/domains/libreoffice.png",
  windows: "/logo/domains/windows-os.png",
  macos: "/logo/domains/macos.png",
  servicenow: "/logo/domains/servicenow.webp",
}

function serviceLogoFromTool(toolStr: string | undefined): string | null {
  if (!toolStr) return null
  // e.g. "gmail-injection:inject_email" → "gmail"
  // e.g. "salesforce:get_contacts" → "salesforce"
  const base = toolStr.split(":")[0].replace(/-injection$/, "").toLowerCase()
  return SERVICE_LOGOS[base] ?? null
}

/* ────────────────────────────────────────────────────────────── */
/*  Main Page                                                     */
/* ────────────────────────────────────────────────────────────── */

const TAB_VALUES = new Set(["definition", "verifier", "leaderboard", "trajectory"])

export default function TaskDetailPageClient({ slug }: { slug: string }) {
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("definition")
  const [runHint, setRunHint] = useState<{ sdk: string; model: string } | null>(null)

  // Initialise active tab from the URL hash so refresh / shared links land
  // on the right tab. Falls back to "definition".
  useEffect(() => {
    const fromHash = window.location.hash.replace(/^#/, "")
    if (TAB_VALUES.has(fromHash)) setActiveTab(fromHash)
    const onHashChange = () => {
      const v = window.location.hash.replace(/^#/, "")
      if (TAB_VALUES.has(v)) setActiveTab(v)
      else if (!v) setActiveTab("definition")
    }
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  const handleTabChange = (next: string) => {
    setActiveTab(next)
    if (typeof window === "undefined") return
    const hash = next === "definition" ? "" : `#${next}`
    // replaceState avoids polluting browser history; pushState would let
    // back-button go through tabs, but most users would find that noisy.
    history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search + hash
    )
  }

  useEffect(() => {
    fetch(`/traj-api/registry/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found")
        return res.json()
      })
      .then((d: Task) => {
        setTask(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading task...</p>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Task not found</p>
          <p className="text-sm text-muted-foreground mb-4">No task with ID &quot;{slug}&quot; was found.</p>
          <Button asChild variant="outline">
            <Link href="/benchmark">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Benchmark
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const isMalicious = task.type === "malicious"

  // Build tags for display
  const tags: string[] = []
  const tagSeen = new Set<string>()
  const addTag = (t: string) => {
    const key = t.toLowerCase().replace(/[\s_]+/g, "-")
    if (!tagSeen.has(key)) { tagSeen.add(key); tags.push(t) }
  }
  if (task.risk_category) addTag(task.risk_category)
  if (task.task_category) addTag(task.task_category)
  if (task.threat_model) addTag(task.threat_model)
  if (task.domain) addTag(task.domain)
  if (task.target_tool) addTag(task.target_tool)

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mx-auto max-w-5xl px-4 pt-8 lg:px-6">
        {/* Back link */}
        <Link href="/benchmark" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Benchmark
        </Link>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-mono font-bold tracking-tight mb-4">
          {task.task_id}
        </h1>

        {/* Metadata line */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-muted-foreground mb-4">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            February 18, 2026
          </span>
          <span className="text-border">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5" />
            <span className="font-mono">v1.0</span>
          </span>
          <span className="text-border">·</span>
          <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-foreground">
            {DOMAIN_LABELS[task.domain] || task.domain}
          </span>
          {task.difficulty && (
            <>
              <span className="text-border">·</span>
              <span className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                task.difficulty === "easy" ? "border-green-200 text-green-600 dark:border-green-800 dark:text-green-400" :
                task.difficulty === "medium" ? "border-yellow-200 text-yellow-600 dark:border-yellow-800 dark:text-yellow-400" :
                "border-red-200 text-red-600 dark:border-red-800 dark:text-red-400"
              )}>
                {task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)}
              </span>
            </>
          )}
          {task.author && (
            <>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {task.author}
              </span>
            </>
          )}
        </div>

        {/* Tags + actions row */}
        <div className="flex items-end justify-between gap-4 mb-6">
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                #{tag}
              </span>
            ))}
            {isMalicious && (
              <span className="inline-flex items-center rounded-full border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400">
                malicious
              </span>
            )}
          </div>
          {/* Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <a
              href={`https://github.com/AI-secure/DecodingTrust-Agent/blob/main/dataset/${task.config_path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <GitBranch className="h-4 w-4" />
              GitHub
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                handleCopy(window.location.href, "share")
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              {copied === "share" ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
              Share
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-b border-border mb-6" />

        {/* Description preview — only for benign tasks */}
        {!isMalicious && (
          <p className="text-base text-muted-foreground leading-relaxed mb-6 max-w-3xl line-clamp-3">
            {task.task_instruction.trim()}
          </p>
        )}

        {/* Malicious Goal — prominent, above the tab bar */}
        {isMalicious && task.malicious_goal && (
          <div className="relative group mb-6 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/15 p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">Malicious Goal</span>
            </div>
            <p className="text-base leading-relaxed text-red-900 dark:text-red-200 whitespace-pre-wrap font-medium">
              {task.malicious_goal.trim()}
            </p>
            <button
              onClick={() => handleCopy(task.malicious_goal!.trim(), "malicious_goal_header")}
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-background border border-border bg-background/80"
              aria-label="Copy malicious goal"
            >
              {copied === "malicious_goal_header" ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full justify-start bg-muted/50 h-11 p-1 rounded-xl mb-6">
            <TabsTrigger value="definition" className="gap-1.5 px-4 rounded-lg data-[state=active]:shadow">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Instruction</span>
            </TabsTrigger>
            <TabsTrigger value="verifier" className="gap-1.5 px-4 rounded-lg data-[state=active]:shadow">
              <Code2 className="h-4 w-4" />
              <span className="hidden sm:inline">Verifier</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-1.5 px-4 rounded-lg data-[state=active]:shadow">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Results</span>
            </TabsTrigger>
            <TabsTrigger value="trajectory" className="gap-1.5 px-4 rounded-lg data-[state=active]:shadow">
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">Trajectory</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="definition" className="space-y-8">
            <DefinitionTab task={task} copied={copied} onCopy={handleCopy} />
          </TabsContent>

          <TabsContent value="verifier">
            <VerifierTab task={task} copied={copied} onCopy={handleCopy} />
          </TabsContent>

          <TabsContent value="leaderboard">
            <LeaderboardTab
              task={task}
              slug={slug}
              onViewRun={(sdk, model) => {
                setRunHint({ sdk, model })
                handleTabChange("trajectory")
              }}
            />
          </TabsContent>

          <TabsContent value="trajectory">
            <TrajectoryTab task={task} slug={slug} runHint={runHint} />
          </TabsContent>
        </Tabs>

        {/* Back */}
        <div className="mt-8 pt-6 border-t border-border">
          <Button asChild variant="outline">
            <Link href="/benchmark">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Benchmark
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   Definition Tab
   ════════════════════════════════════════════════════════════════ */

function DefinitionTab({
  task,
  copied,
  onCopy,
}: {
  task: Task
  copied: string | null
  onCopy: (text: string, key: string) => void
}) {
  const [showSystemPrompt, setShowSystemPrompt] = useState(false)
  const isMalicious = task.type === "malicious"

  return (
    <>
      {/* Task Instruction */}
      {task.task_instruction.trim() && (
        <Section icon={<FileText className="h-5 w-5" />} title="Task Instruction">
          <div className="relative group">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
                {task.task_instruction.trim()}
              </pre>
            </div>
            <button
              onClick={() => onCopy(task.task_instruction.trim(), "instruction")}
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-background border border-border bg-background/80"
              aria-label="Copy instruction"
            >
              {copied === "instruction" ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
          </div>
        </Section>
      )}

      {/* Attack Trace Timeline */}
      {isMalicious && task.attack_turns && task.attack_turns.length > 0 && (
        <AttackTraceSection turns={task.attack_turns} />
      )}

      {/* Agent Configuration */}
      <Section icon={<Bot className="h-5 w-5 text-blue-500" />} title="Agent Configuration">
        <div className="space-y-4">
          {task.agent_name && (
            <MetadataGrid items={[{ label: "Agent Name", value: task.agent_name }]} />
          )}
          {task.agent_system_prompt && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  System Prompt
                </label>
                <button
                  onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showSystemPrompt ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showSystemPrompt ? "Hide" : "Show"}
                </button>
              </div>
              {showSystemPrompt && (
                <div className="relative group">
                  <div className="rounded-lg border border-border bg-muted/30 p-4 max-h-80 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-muted-foreground">
                      {task.agent_system_prompt.trim()}
                    </pre>
                  </div>
                  <button
                    onClick={() => onCopy(task.agent_system_prompt.trim(), "prompt")}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-background border border-border bg-background/80"
                  >
                    {copied === "prompt" ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                </div>
              )}
            </div>
          )}
          {task.mcp_servers.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                MCP Servers
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {task.mcp_servers.map((server, i) => {
                  const logo = SERVICE_LOGOS[server.name.toLowerCase()] ?? null
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border border-border p-3",
                        server.enabled ? "bg-card" : "bg-muted/50 opacity-60"
                      )}
                    >
                      {logo ? (
                        <Image
                          src={logo}
                          alt={server.name}
                          width={20}
                          height={20}
                          className="h-5 w-5 flex-shrink-0 object-contain"
                        />
                      ) : (
                        <Server className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium font-mono truncate">{server.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {server.enabled ? "Enabled" : "Disabled"}
                          {server.tool_blacklist.length > 0 && ` · ${server.tool_blacklist.length} blacklisted`}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Policies */}
      {task.policies && task.policies.length > 0 && (
        <Section icon={<BookOpen className="h-5 w-5 text-violet-500" />} title="Policies">
          <div className="space-y-2">
            {task.policies.map((p, i) => (
              <div key={i} className="flex gap-3 rounded-lg border border-border p-3">
                <Badge variant="outline" className="flex-shrink-0 h-fit">{p.category}</Badge>
                <p className="text-sm text-muted-foreground">{p.policy}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  )
}

/* ════════════════════════════════════════════════════════════════
   Attack Trace Section
   ════════════════════════════════════════════════════════════════ */

const STEP_TYPE_CONFIG: Record<string, {
  label: string
  icon: React.ReactNode
  accentClass: string
  headerBg: string
  cardBg: string
  cardBorder: string
  codeBg: string
  keyClass: string
}> = {
  environment: {
    label: "Environment Injection",
    icon: <Globe className="h-3.5 w-3.5" />,
    accentClass: "text-muted-foreground",
    headerBg: "bg-muted-foreground/70",
    cardBg: "bg-muted/20",
    cardBorder: "border-border",
    codeBg: "bg-muted/30",
    keyClass: "text-foreground/60",
  },
  tool: {
    label: "Tool Injection",
    icon: <Wrench className="h-3.5 w-3.5" />,
    accentClass: "text-muted-foreground",
    headerBg: "bg-muted-foreground/70",
    cardBg: "bg-muted/20",
    cardBorder: "border-border",
    codeBg: "bg-muted/30",
    keyClass: "text-foreground/60",
  },
  skill: {
    label: "Skill Injection",
    icon: <Sparkles className="h-3.5 w-3.5" />,
    accentClass: "text-muted-foreground",
    headerBg: "bg-muted-foreground/70",
    cardBg: "bg-muted/20",
    cardBorder: "border-border",
    codeBg: "bg-muted/30",
    keyClass: "text-foreground/60",
  },
  prompt: {
    label: "Prompt Injection",
    icon: <MessageSquare className="h-3.5 w-3.5" />,
    accentClass: "text-red-600 dark:text-red-400",
    headerBg: "bg-red-500",
    cardBg: "bg-red-50/40 dark:bg-red-950/15",
    cardBorder: "border-red-200 dark:border-red-900/50",
    codeBg: "bg-red-50/60 dark:bg-red-950/20",
    keyClass: "text-red-600 dark:text-red-400",
  },
}

const DEFAULT_STEP_CONFIG = {
  label: "Attack Step",
  icon: <Zap className="h-3.5 w-3.5" />,
  accentClass: "text-muted-foreground",
  headerBg: "bg-muted-foreground/70",
  cardBg: "bg-muted/20",
  cardBorder: "border-border",
  codeBg: "bg-muted/30",
  keyClass: "text-foreground/60",
}

function AttackTraceSection({ turns }: { turns: AttackTurn[] }) {
  const totalSteps = turns.reduce((acc, t) => acc + t.attack_steps.length, 0)
  const allSteps = turns.flatMap((t) => t.attack_steps)

  return (
    <section className="rounded-xl border border-red-200 dark:border-red-900/40 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-red-200/50 dark:border-red-900/30 bg-red-50/60 dark:bg-red-950/15 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15 border border-red-300/40 dark:border-red-700/40">
            <Swords className="h-4 w-4 text-red-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold leading-tight">Attack Trace</h2>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              {turns.length} {turns.length === 1 ? "turn" : "turns"} · {totalSteps} injection {totalSteps === 1 ? "step" : "steps"}
            </p>
          </div>
        </div>
        {/* Step type legend */}
        <div className="hidden sm:flex items-center gap-2">
          {Array.from(new Set(allSteps.map((s) => s.type))).map((type) => {
            const cfg = STEP_TYPE_CONFIG[type] ?? DEFAULT_STEP_CONFIG
            return (
              <span key={type} className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium", cfg.accentClass, cfg.cardBorder, cfg.cardBg)}>
                {cfg.icon}
                {cfg.label}
              </span>
            )
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5 py-5 bg-background/60">
        {turns.map((turn, turnIdx) => (
          <div key={turn.turn_id} className={cn(turnIdx > 0 && "mt-8 pt-8 border-t border-border/50")}>
            {turns.length > 1 && (
              <div className="flex items-center gap-2 mb-5">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-xs font-bold text-red-700 dark:text-red-300">
                  {turn.turn_id}
                </span>
                <span className="text-sm font-semibold text-red-700 dark:text-red-300">Turn {turn.turn_id}</span>
                <div className="flex-1 h-px bg-red-200/50 dark:bg-red-900/30" />
              </div>
            )}
            <div className="space-y-0">
              {turn.attack_steps.map((step, stepIdx) => (
                <AttackStepCard
                  key={stepIdx}
                  step={step}
                  index={stepIdx}
                  isLast={stepIdx === turn.attack_steps.length - 1}
                  globalIndex={turns.slice(0, turnIdx).reduce((a, t) => a + t.attack_steps.length, 0) + stepIdx}
                  totalGlobal={totalSteps}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function AttackStepCard({
  step,
  index,
  isLast,
  globalIndex,
  totalGlobal,
}: {
  step: AttackStep
  index: number
  isLast: boolean
  globalIndex: number
  totalGlobal: number
}) {
  const cfg = STEP_TYPE_CONFIG[step.type] ?? DEFAULT_STEP_CONFIG
  const content = step.content || ""

  // Environment logo: prefer injection_mcp_tool, fall back to injected_tool
  const envLogo = serviceLogoFromTool(step.injection_mcp_tool ?? step.injected_tool)
  const serviceName = (step.injection_mcp_tool ?? step.injected_tool ?? "")
    .split(":")[0]
    .replace(/-injection$/, "")

  return (
    <div className="flex gap-0">
      {/* Left rail: step number + vertical connector */}
      <div className="flex flex-col items-center w-10 flex-shrink-0">
        <div className={cn(
          "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background shadow-sm text-white text-xs font-bold font-mono",
          cfg.headerBg
        )}>
          {globalIndex + 1}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-border/60 my-1" />
        )}
      </div>

      {/* Card */}
      <div className={cn(
        "flex-1 rounded-xl border mb-4 overflow-hidden shadow-sm",
        cfg.cardBorder,
        isLast ? "mb-0" : "mb-5"
      )}>
        {/* Card header */}
        <div className={cn("flex items-center justify-between px-4 py-2.5", cfg.cardBg)}>
          <div className="flex items-center gap-2.5">
            {/* Environment logo or type icon */}
            {envLogo ? (
              <div className="relative flex h-7 w-7 items-center justify-center rounded-md bg-white/80 dark:bg-black/20 border border-white/60 dark:border-white/10 shadow-sm overflow-hidden">
                <Image
                  src={envLogo}
                  alt={serviceName}
                  width={20}
                  height={20}
                  className="h-5 w-5 object-contain"
                />
              </div>
            ) : (
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-md border", cfg.cardBorder, cfg.cardBg)}>
                <span className={cfg.accentClass}>{cfg.icon}</span>
              </div>
            )}
            <div>
              <span className={cn("text-sm font-semibold", cfg.accentClass)}>{cfg.label}</span>
              {serviceName && (
                <span className="ml-2 text-xs text-muted-foreground font-mono opacity-70">{serviceName}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {step.mode && (
              <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 font-mono", cfg.accentClass, cfg.cardBorder)}>
                {step.mode}
              </Badge>
            )}
            <span className="text-[10px] text-muted-foreground/50 font-mono tabular-nums">
              {globalIndex + 1}/{totalGlobal}
            </span>
          </div>
        </div>

        {/* Card body */}
        <div className="px-4 py-3 space-y-3 bg-background/70 dark:bg-background/40">
          {/* Key metadata as pill row */}
          <div className="flex flex-wrap gap-2">
            {step.injection_mcp_tool && (
              <div className="flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1 text-[11px]">
                <span className="text-muted-foreground font-medium">Injection point</span>
                <span className="h-3 w-px bg-border" />
                <code className="font-mono text-foreground/80">{step.injection_mcp_tool}</code>
              </div>
            )}
            {step.injected_tool && (
              <div className="flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1 text-[11px]">
                <span className="text-muted-foreground font-medium">Target tool</span>
                <span className="h-3 w-px bg-border" />
                <code className="font-mono text-foreground/80">{step.injected_tool}</code>
              </div>
            )}
            {step.skill_name && (
              <div className="flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1 text-[11px]">
                <span className="text-muted-foreground font-medium">Skill</span>
                <span className="h-3 w-px bg-border" />
                <code className="font-mono text-foreground/80">{step.skill_name}</code>
              </div>
            )}
          </div>

          {/* Parameters */}
          {step.kwargs && Object.keys(step.kwargs).length > 0 && (
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Parameters</p>
              <div className={cn("rounded-lg border border-border/50 p-3 font-mono text-xs space-y-1", cfg.codeBg)}>
                {Object.entries(step.kwargs).map(([key, value]) => {
                  const strVal = (typeof value === "string" ? value : JSON.stringify(value)).trim()
                  const isLongVal = strVal.length > 120
                  return (
                    <div key={key} className="flex gap-2">
                      <span className={cn("flex-shrink-0 font-semibold", cfg.keyClass)}>{key}:</span>
                      <span className="text-foreground/70 break-all">
                        {isLongVal ? strVal.slice(0, 120) + "…" : strVal}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Injected content — always fully visible */}
          {content && (
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Injected Content</p>
              <div className={cn("rounded-lg border border-border/50 p-3", cfg.codeBg)}>
                <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-words text-foreground/80">{content.trim()}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   Verifier Tab
   ════════════════════════════════════════════════════════════════ */

function VerifierTab({
  task,
  copied,
  onCopy,
}: {
  task: Task
  copied: string | null
  onCopy: (text: string, key: string) => void
}) {
  if (!task.judge_exists) {
    return (
      <div className="text-center py-16">
        <Code2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground font-medium mb-1">No verifier found</p>
        <p className="text-sm text-muted-foreground/70">This task does not have a judge.py file.</p>
      </div>
    )
  }

  const isMalicious = task.type === "malicious"

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          The verifier functions below are extracted from the <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">judge.py</code> file
          co-located with this task&apos;s config. They are used to programmatically evaluate agent behavior.
        </p>
      </div>

      {task.eval_task && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">eval_task()</h3>
                <p className="text-xs text-muted-foreground">Task completion verifier</p>
              </div>
            </div>
            <button
              onClick={() => onCopy(task.eval_task!, "eval_task")}
              className="p-1.5 rounded-md hover:bg-muted border border-transparent hover:border-border transition-colors"
              aria-label="Copy eval_task code"
            >
              {copied === "eval_task" ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
          </div>
          <CodeBlock code={task.eval_task} />
        </div>
      )}

      {isMalicious && task.eval_attack && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">eval_attack()</h3>
                <p className="text-xs text-muted-foreground">Attack success verifier</p>
              </div>
            </div>
            <button
              onClick={() => onCopy(task.eval_attack!, "eval_attack")}
              className="p-1.5 rounded-md hover:bg-muted border border-transparent hover:border-border transition-colors"
              aria-label="Copy eval_attack code"
            >
              {copied === "eval_attack" ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
          </div>
          <CodeBlock code={task.eval_attack} />
        </div>
      )}

      {!task.eval_task && !task.eval_attack && (
        <div className="text-center py-12">
          <Code2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Verifier file exists but no eval functions could be extracted.</p>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   Leaderboard Tab
   ════════════════════════════════════════════════════════════════ */

interface LeaderboardRun {
  run_id?: number
  sdk: string
  model: string
  ts: string
  trajectory: string
  judge: string
  attack_success?: boolean | null
  task_success?: boolean | null
}

interface LeaderboardEntry {
  key: string
  trajectory: string
  judge: string
  runs: LeaderboardRun[]
}

interface ForTaskLeaderboardResponse {
  slug: string
  no_attack: LeaderboardEntry | null
  under_attack: LeaderboardEntry | null
}

const SDK_LOGO_PATHS: Record<string, string> = {
  openaisdk: "/logo/framework-openai-agents.svg",
  googleadk: "/logo/framework-google-adk.png",
  claudesdk: "/logo/framework-claude-code.svg",
  openclaw: "/logo/openclaw.svg",
}

function sdkLogoPath(sdk: string): string {
  return SDK_LOGO_PATHS[sdk] ?? ""
}

function ResultBadge({
  isMalicious,
  attackSuccess,
  taskSuccess,
}: {
  isMalicious: boolean
  attackSuccess?: boolean | null
  taskSuccess?: boolean | null
}) {
  if (isMalicious) {
    if (attackSuccess === null || attackSuccess === undefined) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          No result
        </span>
      )
    }
    return attackSuccess ? (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:text-red-300">
        Attacked ✓
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
        Defended ✗
      </span>
    )
  } else {
    if (taskSuccess === null || taskSuccess === undefined) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          No result
        </span>
      )
    }
    return taskSuccess ? (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
        Completed ✓
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:text-red-300">
        Failed ✗
      </span>
    )
  }
}

function RunRow({
  run,
  isMalicious,
  onViewRun,
}: {
  run: LeaderboardRun
  isMalicious: boolean
  onViewRun: (sdk: string, model: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onViewRun(run.sdk, run.model)}
      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors group"
    >
      {sdkLogoPath(run.sdk) ? (
        <Image
          src={sdkLogoPath(run.sdk)}
          alt={sdkDisplayName(run.sdk)}
          width={20}
          height={20}
          className="h-5 w-5 flex-shrink-0 rounded object-contain"
        />
      ) : (
        <span className="h-5 w-5 flex-shrink-0 rounded-full bg-muted-foreground/30" aria-hidden />
      )}
      <span className="flex-1 min-w-0 text-sm">
        <span className="font-medium">{sdkDisplayName(run.sdk)}</span>
        <span className="text-muted-foreground mx-1.5">·</span>
        <span className="font-mono text-muted-foreground">{run.model}</span>
      </span>
      <ResultBadge
        isMalicious={isMalicious}
        attackSuccess={run.attack_success}
        taskSuccess={run.task_success}
      />
      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
    </button>
  )
}

function LeaderboardTab({
  task,
  slug,
  onViewRun,
}: {
  task: Task
  slug: string
  onViewRun: (sdk: string, model: string) => void
}) {
  const isMalicious = task.type === "malicious"
  const [data, setData] = useState<ForTaskLeaderboardResponse | null>(null)
  const [fetchErr, setFetchErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/traj-api/trajectories/for-task?slug=${encodeURIComponent(slug)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`http ${r.status}`)
        return r.json()
      })
      .then((j: ForTaskLeaderboardResponse) => {
        if (!cancelled) {
          setData(j)
          setFetchErr(null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(null)
          setFetchErr("unreachable")
        }
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  const activeRuns = useMemo(() => {
    if (!data) return []
    const entry = isMalicious ? data.under_attack : data.no_attack
    if (!entry) return []
    return orderRunsForResults(entry.runs ?? [], isMalicious)
  }, [data, isMalicious])

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">
            {isMalicious ? "Attack Success Rate (ASR)" : "Task Completion Rate"}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {isMalicious
            ? "Measures how often the agent is tricked into performing the malicious action. Lower ASR indicates a safer, more robust agent."
            : "Measures how often the agent successfully completes the assigned task. Higher completion rate indicates a more capable agent."}
        </p>
      </div>

      {fetchErr && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Trajectory API unreachable. Check that the trajectory service is running.
        </div>
      )}

      {!fetchErr && data && activeRuns.length === 0 && (
        <div className="rounded-xl border border-border bg-muted/10 px-4 py-10 text-center">
          <Lock className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No trajectories found</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            No runs have been indexed for this task yet.
          </p>
        </div>
      )}

      {activeRuns.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
          {activeRuns.map((run) => (
            <RunRow
              key={`${run.sdk}::${run.model}`}
              run={run}
              isMalicious={isMalicious}
              onViewRun={onViewRun}
            />
          ))}
        </div>
      )}

      {!data && !fetchErr && (
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="h-2.5 w-2.5 rounded-full bg-muted/50 animate-pulse" />
              <div className="flex-1 h-4 w-48 bg-muted/50 rounded animate-pulse" />
              <div className="h-5 w-20 bg-muted/50 rounded-full animate-pulse" />
              <div className="h-4 w-4 bg-muted/30 rounded animate-pulse" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   Shared Components
   ════════════════════════════════════════════════════════════════ */

function highlightPython(code: string): React.ReactNode[] {
  const lines = code.split('\n')
  return lines.map((line, lineIndex) => {
    const tokens: React.ReactNode[] = []
    let remaining = line
    let keyIndex = 0

    while (remaining.length > 0) {
      // Comments
      const commentMatch = remaining.match(/^(#.*)/)
      if (commentMatch) {
        tokens.push(<span key={keyIndex++} className="text-zinc-500 italic">{commentMatch[0]}</span>)
        remaining = remaining.slice(commentMatch[0].length)
        continue
      }

      // Triple-quoted strings
      const tripleMatch = remaining.match(/^("""[\s\S]*?"""|'''[\s\S]*?''')/)
      if (tripleMatch) {
        tokens.push(<span key={keyIndex++} className="text-green-400">{tripleMatch[0]}</span>)
        remaining = remaining.slice(tripleMatch[0].length)
        continue
      }

      // Strings
      const stringMatch = remaining.match(/^(["'])(?:(?!\1)[^\\]|\\.)*?\1/)
      if (stringMatch) {
        tokens.push(<span key={keyIndex++} className="text-green-400">{stringMatch[0]}</span>)
        remaining = remaining.slice(stringMatch[0].length)
        continue
      }

      // Decorators
      const decoratorMatch = remaining.match(/^(@[a-zA-Z_][a-zA-Z0-9_.]*)/)
      if (decoratorMatch) {
        tokens.push(<span key={keyIndex++} className="text-yellow-300">{decoratorMatch[0]}</span>)
        remaining = remaining.slice(decoratorMatch[0].length)
        continue
      }

      // Keywords
      const keywordMatch = remaining.match(
        /^(from|import|class|def|async|await|return|if|else|elif|for|while|try|except|finally|with|as|in|not|and|or|is|pass|break|continue|raise|yield|lambda|assert|global|nonlocal|del)\b/
      )
      if (keywordMatch) {
        tokens.push(<span key={keyIndex++} className="text-purple-400 font-medium">{keywordMatch[0]}</span>)
        remaining = remaining.slice(keywordMatch[0].length)
        continue
      }

      // Built-in constants
      const constMatch = remaining.match(/^(True|False|None|self|cls)\b/)
      if (constMatch) {
        tokens.push(<span key={keyIndex++} className="text-orange-400">{constMatch[0]}</span>)
        remaining = remaining.slice(constMatch[0].length)
        continue
      }

      // Built-in functions/types
      const builtinMatch = remaining.match(
        /^(print|len|range|str|int|float|bool|list|dict|set|tuple|type|isinstance|hasattr|getattr|setattr|super|open|enumerate|zip|map|filter|sorted|reversed|any|all|min|max|sum|abs|round|input|format|repr|id|hex|bin|oct|chr|ord|staticmethod|classmethod|property)\b/
      )
      if (builtinMatch) {
        tokens.push(<span key={keyIndex++} className="text-cyan-400">{builtinMatch[0]}</span>)
        remaining = remaining.slice(builtinMatch[0].length)
        continue
      }

      // Function calls
      const funcMatch = remaining.match(/^([a-zA-Z_][a-zA-Z0-9_]*)(\()/)
      if (funcMatch) {
        tokens.push(<span key={keyIndex++} className="text-blue-400">{funcMatch[1]}</span>)
        tokens.push(<span key={keyIndex++}>(</span>)
        remaining = remaining.slice(funcMatch[0].length)
        continue
      }

      // Class names (PascalCase)
      const classMatch = remaining.match(/^([A-Z][a-zA-Z0-9_]*)\b/)
      if (classMatch) {
        tokens.push(<span key={keyIndex++} className="text-amber-300">{classMatch[0]}</span>)
        remaining = remaining.slice(classMatch[0].length)
        continue
      }

      // Numbers
      const numberMatch = remaining.match(/^(\d+\.?\d*([eE][+-]?\d+)?)/)
      if (numberMatch) {
        tokens.push(<span key={keyIndex++} className="text-orange-400">{numberMatch[0]}</span>)
        remaining = remaining.slice(numberMatch[0].length)
        continue
      }

      // Operators
      const operatorMatch = remaining.match(/^(===|!==|==|!=|<=|>=|=>|->|\+=|-=|\*=|\/=|&&|\|\||[+\-*/%=<>!&|^~:])/)
      if (operatorMatch) {
        tokens.push(<span key={keyIndex++} className="text-rose-400">{operatorMatch[0]}</span>)
        remaining = remaining.slice(operatorMatch[0].length)
        continue
      }

      // Default character
      tokens.push(<span key={keyIndex++}>{remaining[0]}</span>)
      remaining = remaining.slice(1)
    }

    return (
      <span key={lineIndex}>
        {tokens}
        {lineIndex < lines.length - 1 ? '\n' : ''}
      </span>
    )
  })
}

function CodeBlock({ code, title = "judge.py" }: { code: string; title?: string }) {
  const highlighted = useMemo(() => highlightPython(code), [code])

  return (
    <div className="rounded-lg border border-border bg-[#1e1e2e] dark:bg-[#0d0d14] overflow-hidden">
      <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[11px] text-white/30 font-mono ml-2">{title}</span>
      </div>
      <div className="overflow-x-auto p-4 max-h-[500px] overflow-y-auto">
        <pre className="text-sm font-mono leading-relaxed text-gray-300">
          <code>{highlighted}</code>
        </pre>
      </div>
    </div>
  )
}

function Section({
  icon,
  title,
  children,
  variant = "default",
  titleClassName,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  variant?: "default" | "danger"
  titleClassName?: string
}) {
  return (
    <section className={cn(
      "rounded-xl border p-6",
      variant === "danger"
        ? "border-red-200 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/10"
        : "border-border bg-card"
    )}>
      <div className="flex items-center gap-2 mb-5">
        {icon}
        <h2 className={cn("text-lg font-semibold", titleClassName)}>{title}</h2>
      </div>
      {children}
    </section>
  )
}

function MetadataGrid({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.label}</p>
          <p className="text-sm font-medium font-mono">{item.value}</p>
        </div>
      ))}
    </div>
  )
}

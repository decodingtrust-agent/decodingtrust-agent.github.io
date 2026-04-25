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
  ChevronDown,
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { TrajectoryTab } from "@/components/registry/trajectory-tab"

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

/* ────────────────────────────────────────────────────────────── */
/*  Main Page                                                     */
/* ────────────────────────────────────────────────────────────── */

export default function TaskDetailPageClient({ slug }: { slug: string }) {
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/data/tasks/${slug}.json`)
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
            <Link href="/registry">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Registry
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
        <Link href="/registry" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
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

        {/* Description preview */}
        <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-3xl line-clamp-3">
          {isMalicious && task.malicious_goal
            ? task.malicious_goal.trim()
            : task.task_instruction.trim()}
        </p>

        <Tabs defaultValue="definition" className="w-full">
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
            <LeaderboardTab task={task} />
          </TabsContent>

          <TabsContent value="trajectory">
            <TrajectoryTab task={task} slug={slug} />
          </TabsContent>
        </Tabs>

        {/* Back */}
        <div className="mt-8 pt-6 border-t border-border">
          <Button asChild variant="outline">
            <Link href="/registry">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Registry
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

      {/* Malicious Goal */}
      {isMalicious && task.malicious_goal && (
        <Section icon={<AlertTriangle className="h-5 w-5 text-red-500" />} title="Malicious Goal" titleClassName="text-red-600 dark:text-red-400">
          <div className="relative group">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
                {task.malicious_goal.trim()}
              </pre>
            </div>
            <button
              onClick={() => onCopy(task.malicious_goal!.trim(), "malicious_goal")}
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-background border border-border bg-background/80"
              aria-label="Copy malicious goal"
            >
              {copied === "malicious_goal" ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
          </div>
          {(task.attack_strategy || task.attack_vector) && (
            <div className="space-y-4 mt-4">
              {task.attack_strategy && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                    Attack Strategy
                  </label>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{task.attack_strategy.trim()}</p>
                  </div>
                </div>
              )}
              {task.attack_vector && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                    Attack Vector
                  </label>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{task.attack_vector.trim()}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </Section>
      )}

      {/* Attack Trace Timeline */}
      {isMalicious && task.attack_turns && task.attack_turns.length > 0 && (
        <AttackTraceSection turns={task.attack_turns} />
      )}

      {/* Red Teaming Agent */}
      {isMalicious && task.red_team_injections && (
        <Section icon={<Swords className="h-5 w-5 text-orange-500" />} title="Red Teaming Agent">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                Available Injections
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(task.red_team_injections).map(([key, enabled]) => (
                  <span
                    key={key}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                      enabled
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", enabled ? "bg-red-500" : "bg-muted-foreground/30")} />
                    {key}
                  </span>
                ))}
              </div>
            </div>
            {task.red_team_env_injection && Object.keys(task.red_team_env_injection).length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Environment Injection Config
                </label>
                <div className="rounded-lg border border-border bg-muted/30 p-4 font-mono text-xs">
                  {Object.entries(task.red_team_env_injection).map(([key, value]) => (
                    <div key={key} className="flex gap-2 py-0.5">
                      <span className="text-orange-600 dark:text-orange-400">{key}:</span>
                      <span className="text-muted-foreground">
                        {Array.isArray(value) ? value.join(", ") : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {task.red_team_skills && task.red_team_skills.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Attack Skills
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {task.red_team_skills.map((skill) => (
                    <code key={skill} className="rounded bg-muted px-2 py-0.5 text-xs">{skill}</code>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
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
                {task.mcp_servers.map((server, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border border-border p-3",
                      server.enabled ? "bg-card" : "bg-muted/50 opacity-60"
                    )}
                  >
                    <Server className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium font-mono truncate">{server.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {server.enabled ? "Enabled" : "Disabled"}
                        {server.tool_blacklist.length > 0 && ` · ${server.tool_blacklist.length} blacklisted`}
                      </p>
                    </div>
                  </div>
                ))}
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
  color: string
  bg: string
  border: string
}> = {
  environment: {
    label: "Environment Injection",
    icon: <Globe className="h-4 w-4" />,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-900/50",
  },
  tool: {
    label: "Tool Injection",
    icon: <Wrench className="h-4 w-4" />,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-900/50",
  },
  skill: {
    label: "Skill Injection",
    icon: <Sparkles className="h-4 w-4" />,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-900/50",
  },
  prompt: {
    label: "Prompt Injection",
    icon: <MessageSquare className="h-4 w-4" />,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-900/50",
  },
}

const DEFAULT_STEP_CONFIG = {
  label: "Attack Step",
  icon: <Zap className="h-4 w-4" />,
  color: "text-muted-foreground",
  bg: "bg-muted/30",
  border: "border-border",
}

function AttackTraceSection({ turns }: { turns: AttackTurn[] }) {
  const totalSteps = turns.reduce((acc, t) => acc + t.attack_steps.length, 0)

  return (
    <section className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/10 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-red-200/50 dark:border-red-900/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-red-500" />
          <h2 className="text-lg font-semibold">Attack Trace</h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{turns.length} {turns.length === 1 ? "turn" : "turns"}</span>
          <span className="h-3 w-px bg-border" />
          <span>{totalSteps} {totalSteps === 1 ? "step" : "steps"}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-6 py-5">
        {turns.map((turn, turnIdx) => (
          <div key={turn.turn_id} className={cn(turnIdx > 0 && "mt-6 pt-6 border-t border-red-200/40 dark:border-red-900/20")}>
            {turns.length > 1 && (
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-100 dark:bg-red-900/40 text-xs font-bold text-red-700 dark:text-red-300">
                  {turn.turn_id}
                </span>
                <span className="text-sm font-medium text-red-700 dark:text-red-300">Turn {turn.turn_id}</span>
              </div>
            )}

            <div className="space-y-3">
              {turn.attack_steps.map((step, stepIdx) => (
                <AttackStepCard key={stepIdx} step={step} index={stepIdx} isLast={stepIdx === turn.attack_steps.length - 1} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function AttackStepCard({ step, index, isLast }: { step: AttackStep; index: number; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const config = STEP_TYPE_CONFIG[step.type] || DEFAULT_STEP_CONFIG
  const content = step.content || ""
  const isLong = content.length > 200

  return (
    <div className="flex gap-3">
      {/* Timeline connector */}
      <div className="flex flex-col items-center flex-shrink-0 pt-1">
        <div className={cn("h-7 w-7 rounded-full flex items-center justify-center", config.bg, config.border, "border")}>
          <span className={cn("text-xs font-mono font-bold", config.color)}>{index + 1}</span>
        </div>
        {!isLast && <div className="w-px flex-1 bg-red-200/50 dark:bg-red-900/30 mt-1" />}
      </div>

      {/* Card */}
      <div className={cn("flex-1 rounded-lg border p-4 mb-0", config.border, config.bg)}>
        {/* Header row */}
        <div className="flex items-center gap-2 mb-2">
          <span className={config.color}>{config.icon}</span>
          <span className={cn("text-sm font-semibold", config.color)}>{config.label}</span>
          {step.mode && (
            <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5", config.color, config.border)}>
              {step.mode}
            </Badge>
          )}
        </div>

        {/* Metadata */}
        <div className="space-y-1.5 text-xs">
          {step.injection_mcp_tool && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium min-w-[80px]">Injection Point</span>
              <code className="rounded bg-background/60 dark:bg-background/20 px-1.5 py-0.5 font-mono">{step.injection_mcp_tool}</code>
            </div>
          )}
          {step.injected_tool && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium min-w-[80px]">Target Tool</span>
              <code className="rounded bg-background/60 dark:bg-background/20 px-1.5 py-0.5 font-mono">{step.injected_tool}</code>
            </div>
          )}
          {step.skill_name && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium min-w-[80px]">Skill Name</span>
              <code className="rounded bg-background/60 dark:bg-background/20 px-1.5 py-0.5 font-mono">{step.skill_name}</code>
            </div>
          )}
          {step.kwargs && Object.keys(step.kwargs).length > 0 && (
            <div className="mt-2">
              <span className="text-muted-foreground font-medium block mb-1">Parameters</span>
              <div className="rounded-md bg-background/60 dark:bg-background/20 p-2.5 font-mono space-y-0.5">
                {Object.entries(step.kwargs).map(([key, value]) => {
                  const strVal = typeof value === "string" ? value : JSON.stringify(value)
                  const isLongVal = strVal.length > 100
                  return (
                    <div key={key}>
                      <span className={config.color}>{key}: </span>
                      <span className="text-foreground/70">
                        {isLongVal ? strVal.slice(0, 100) + "..." : strVal}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {content && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground font-medium">Injected Content</span>
              {isLong && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {expanded ? "Collapse" : "Expand"}
                  <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
                </button>
              )}
            </div>
            <div className={cn(
              "rounded-md bg-background/60 dark:bg-background/20 p-3 text-xs font-mono leading-relaxed overflow-hidden transition-all",
              !expanded && isLong && "max-h-[120px]"
            )}>
              <pre className="whitespace-pre-wrap break-words">{content}</pre>
            </div>
            {!expanded && isLong && (
              <div className="h-8 -mt-8 relative bg-gradient-to-t from-background/60 dark:from-background/20 to-transparent rounded-b-md pointer-events-none" />
            )}
          </div>
        )}
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

function LeaderboardTab({ task }: { task: Task }) {
  const isMalicious = task.type === "malicious"

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

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rank</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Model</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  {isMalicious ? "ASR %" : "Completion %"}
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Runs</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((rank) => (
                <tr key={rank} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 text-muted-foreground/40 font-mono">{rank}</td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-32 bg-muted/50 rounded animate-pulse" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="h-4 w-12 bg-muted/50 rounded animate-pulse ml-auto" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="h-4 w-8 bg-muted/50 rounded animate-pulse ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center py-8">
        <Lock className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-sm font-medium text-muted-foreground mb-1">Leaderboard coming soon</p>
        <p className="text-xs text-muted-foreground/70 max-w-sm mx-auto">
          Per-task leaderboard data will be available once evaluation results are published.
          Visit the <Link href="/leaderboard" className="underline underline-offset-2 hover:text-foreground transition-colors">main leaderboard</Link> for aggregate scores.
        </p>
      </div>
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

"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Shield,
  ShieldAlert,
  Lock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  User,
  Wrench,
  Bot,
  Clock,
  Activity,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type TrajectoryManifest,
  type TrajectoryManifestEntry,
  type TrajectoryRun,
  benignTaskKey,
  noAttackKey,
  resolveManifestKey,
  underAttackKey,
} from "@/lib/trajectory-keys"

const EXCLUDED_TRAJECTORY_URL_FRAGMENTS = ["/openaisdk/gpt-5.1/"]

function isExcludedTrajectoryUrl(url: string | undefined): boolean {
  if (!url) return false
  return EXCLUDED_TRAJECTORY_URL_FRAGMENTS.some((fragment) => url.includes(fragment))
}

function pruneEntry(e: TrajectoryManifestEntry): TrajectoryManifestEntry | null {
  const runs = (e.runs ?? []).filter(
    (r) => !isExcludedTrajectoryUrl(r.trajectory) && !isExcludedTrajectoryUrl(r.judge)
  )
  if ((e.runs ?? []).length > 0 && runs.length === 0) return null
  // Re-pick fallback trajectory/judge from filtered runs when needed.
  const fallback = runs[0]
  const trajectory = isExcludedTrajectoryUrl(e.trajectory) ? fallback?.trajectory : e.trajectory
  const judge = isExcludedTrajectoryUrl(e.judge) ? fallback?.judge : e.judge
  if (!trajectory || !judge) return null
  return { ...e, trajectory, judge, runs }
}

function pruneManifestEntries(manifest: TrajectoryManifest): TrajectoryManifest {
  const filtered: typeof manifest.entries = {}
  for (const [key, value] of Object.entries(manifest.entries)) {
    const next = pruneEntry(value)
    if (next) filtered[key] = next
  }
  return {
    ...manifest,
    entryCount: Object.keys(filtered).length,
    entries: filtered,
  }
}

interface Task {
  type: string
  domain: string
  config_path: string
  base_task: string | null
  task_instruction?: string
  malicious_goal?: string | null
}

interface TrajectoryStep {
  role?: string
  action?: string | null
  step_id?: number
  metadata?: {
    tool_name?: string
    server?: string
    tool_params?: unknown
    message?: string
    [k: string]: unknown
  }
  state?: unknown
  content?: string
}

interface TaskInfo {
  task_id?: string
  original_instruction?: string
  malicious_instruction?: string
  domain?: string
  risk_category?: string | null
}

interface TrajInfo {
  success?: boolean | null
  step_count?: number
  actions_count?: number
  tool_count?: number
  user_turn?: number
  duration?: number
  timestamp?: string
  agent_final_response?: string
  metadata?: Record<string, unknown>
}

interface JudgeResult {
  task_success?: boolean | null
  task_message?: string
  task_metadata?: Record<string, unknown>
  attack_success?: boolean | null
  attack_message?: string
  attack_metadata?: Record<string, unknown>
  error?: string | null
}

interface TrajectoryFile {
  task_info?: TaskInfo
  traj_info?: TrajInfo
  trajectory?: TrajectoryStep[]
}

export function TrajectoryTab({ task, slug }: { task: Task; slug: string }) {
  const isMalicious = task.type === "malicious"
  const [activeView, setActiveView] = useState<"no_attack" | "under_attack">(
    isMalicious ? "under_attack" : "no_attack"
  )
  const [manifest, setManifest] = useState<TrajectoryManifest | null>(null)
  const [manifestErr, setManifestErr] = useState<string | null>(null)
  const [activeRunIdx, setActiveRunIdx] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/data/trajectory-manifest.json")
      .then((r) => {
        if (!r.ok) throw new Error("manifest not found")
        return r.json()
      })
      .then((m: TrajectoryManifest) => {
        if (!cancelled) {
          setManifest(pruneManifestEntries(m))
          setManifestErr(null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setManifest(null)
          setManifestErr("missing")
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Reset run selection on view switch.
  useEffect(() => {
    setActiveRunIdx(null)
  }, [activeView])

  const manifestKeys = useMemo(() => {
    if (!manifest) return []
    return [
      ...Object.keys(manifest.entries),
      ...Object.keys(manifest.aliases ?? {}),
    ]
  }, [manifest])

  const resolveKey = useCallback(
    (view: "no_attack" | "under_attack"): string | null => {
      if (!manifest?.entries) return null
      const raw = !isMalicious
        ? benignTaskKey(task)
        : view === "under_attack"
          ? underAttackKey(task)
          : noAttackKey(task, manifestKeys)
      if (!raw) return null
      return resolveManifestKey(manifest, raw) ?? raw
    },
    [isMalicious, manifest, manifestKeys, task]
  )

  const activeKey = resolveKey(activeView)
  const activeEntry = activeKey ? manifest?.entries[activeKey] ?? null : null
  const runs: TrajectoryRun[] = useMemo(() => {
    if (!activeEntry) return []
    if (activeEntry.runs && activeEntry.runs.length) return activeEntry.runs
    // Fallback: synthesize a single run from legacy entry.
    return [
      {
        sdk: extractSdkFromUrl(activeEntry.trajectory),
        model: extractModelFromUrl(activeEntry.trajectory),
        ts: extractTsFromUrl(activeEntry.trajectory),
        trajectory: activeEntry.trajectory,
        judge: activeEntry.judge,
      },
    ]
  }, [activeEntry])

  const noAttackAvailable = isMalicious && resolveKey("no_attack") !== null

  return (
    <div className="space-y-6">
      {isMalicious && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveView("no_attack")}
            disabled={!noAttackAvailable}
            title={!noAttackAvailable ? "No baseline trajectory indexed for this task" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all",
              !noAttackAvailable && "opacity-40 cursor-not-allowed",
              activeView === "no_attack"
                ? "border-foreground/20 bg-card shadow-sm"
                : "border-border bg-transparent text-muted-foreground hover:text-foreground hover:border-foreground/10"
            )}
          >
            <Shield className="h-4 w-4" />
            No Attack
          </button>
          <button
            type="button"
            onClick={() => setActiveView("under_attack")}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all",
              activeView === "under_attack"
                ? "border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10 shadow-sm text-red-700 dark:text-red-300"
                : "border-border bg-transparent text-muted-foreground hover:text-foreground hover:border-foreground/10"
            )}
          >
            <ShieldAlert className="h-4 w-4" />
            Under Attack
          </button>
        </div>
      )}

      {manifestErr && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Trajectory manifest is missing. Add files under{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">public/data/trajectories/</code> and run{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run trajectories:manifest</code>.
        </div>
      )}

      {manifest && !manifestErr && manifest.entryCount === 0 && (
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
          <Lock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="font-medium text-foreground mb-1">No trajectories indexed</p>
        </div>
      )}

      {manifest && (manifest.entryCount ?? 0) > 0 && activeKey && !manifest.entries[activeKey] && (
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">No trajectory for this task</p>
          <p className="text-xs max-w-md mx-auto">
            Key <span className="font-mono text-foreground/80">{activeKey}</span> is not in the manifest
            {slug ? ` (page: ${slug})` : ""}.
          </p>
        </div>
      )}

      {isMalicious && task.malicious_goal && activeView === "under_attack" && (
        <div className="rounded-xl border border-red-300/60 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/20">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-red-300/60 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs font-semibold uppercase tracking-wider">
            <AlertTriangle className="h-3.5 w-3.5" />
            Malicious goal
          </div>
          <p className="px-4 py-3 text-sm text-red-900/80 dark:text-red-100/80 leading-relaxed whitespace-pre-wrap">
            {task.malicious_goal.trim()}
          </p>
        </div>
      )}

      {/* Two-pane: list runs first, then drill into one run */}
      {activeEntry && activeRunIdx === null && (
        <RunList runs={runs} onSelect={(i) => setActiveRunIdx(i)} showAttack={isMalicious && activeView === "under_attack"} />
      )}

      {activeEntry && activeRunIdx !== null && runs[activeRunIdx] && (
        <RunDetail
          run={runs[activeRunIdx]}
          task={task}
          showAttack={isMalicious && activeView === "under_attack"}
          onBack={() => setActiveRunIdx(null)}
        />
      )}
    </div>
  )
}

/* ============================================================
   Run list — agent + model thumbnails
   ============================================================ */

function RunList({
  runs,
  onSelect,
  showAttack,
}: {
  runs: TrajectoryRun[]
  onSelect: (idx: number) => void
  showAttack: boolean
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="text-xs uppercase tracking-[0.16em] font-semibold text-muted-foreground">
          {runs.length} run{runs.length === 1 ? "" : "s"} indexed · pick an agent + model
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {runs.map((r, i) => (
          <RunCard key={`${r.sdk}-${r.model}-${r.ts}-${i}`} run={r} showAttack={showAttack} onClick={() => onSelect(i)} />
        ))}
      </ul>
    </div>
  )
}

function RunCard({ run, showAttack, onClick }: { run: TrajectoryRun; showAttack: boolean; onClick: () => void }) {
  const [judge, setJudge] = useState<JudgeResult | null>(null)
  const [info, setInfo] = useState<TrajInfo | null>(null)
  const [, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      fetch(run.judge).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(run.trajectory)
        .then((r) => (r.ok ? r.json() : null))
        .then((j: TrajectoryFile | null) => j?.traj_info ?? null)
        .catch(() => null),
    ]).then(([j, ti]) => {
      if (cancelled) return
      setJudge((j as JudgeResult) ?? null)
      setInfo(ti)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [run.judge, run.trajectory])

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="group w-full text-left rounded-xl border border-border bg-card hover:border-foreground/20 hover:shadow-sm transition-all p-4 space-y-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
              <SdkDot sdk={run.sdk} />
              {prettySdk(run.sdk)}
            </div>
            <div className="mt-1 font-mono text-sm font-medium truncate">{prettyModel(run.model)}</div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground transition-colors shrink-0" />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {typeof judge?.task_success === "boolean" && (
            <Badge variant={judge.task_success ? "ok" : "fail"}>
              {judge.task_success ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              Task {judge.task_success ? "ok" : "failed"}
            </Badge>
          )}
          {showAttack && typeof judge?.attack_success === "boolean" && (
            <Badge variant={judge.attack_success ? "fail" : "ok"}>
              <AlertTriangle className="h-3 w-3" />
              Attack {judge.attack_success ? "succeeded" : "blocked"}
            </Badge>
          )}
          {info?.step_count != null && (
            <Badge variant="muted">
              <Activity className="h-3 w-3" />
              {info.step_count} steps
            </Badge>
          )}
          {info?.duration != null && (
            <Badge variant="muted">
              <Clock className="h-3 w-3" />
              {formatDuration(info.duration)}
            </Badge>
          )}
        </div>

        {run.ts && (
          <p className="text-[11px] text-muted-foreground/70 font-mono">{prettyTs(run.ts)}</p>
        )}
      </button>
    </li>
  )
}

/* ============================================================
   Run detail — full trajectory + judge
   ============================================================ */

function RunDetail({
  run,
  task,
  showAttack,
  onBack,
}: {
  run: TrajectoryRun
  task: Task
  showAttack: boolean
  onBack: () => void
}) {
  const [data, setData] = useState<TrajectoryFile | null>(null)
  const [judge, setJudge] = useState<JudgeResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setErr(null)
    Promise.all([
      fetch(run.trajectory).then((r) => {
        if (!r.ok) throw new Error(`trajectory ${r.status}`)
        return r.json() as Promise<TrajectoryFile>
      }),
      fetch(run.judge).then((r) => {
        if (!r.ok) throw new Error(`judge ${r.status}`)
        return r.json() as Promise<JudgeResult>
      }),
    ])
      .then(([t, j]) => {
        if (cancelled) return
        setData(t)
        setJudge(j)
        setLoading(false)
      })
      .catch((e: Error) => {
        if (cancelled) return
        setErr(e.message)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [run.trajectory, run.judge])

  const steps = data?.trajectory ?? []
  const hasUserStep = steps.some((s) => s.role === "user")
  const fallbackUserText =
    data?.task_info?.original_instruction ?? task.task_instruction ?? ""

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          All runs
        </button>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2 text-sm">
          <SdkDot sdk={run.sdk} />
          <span className="text-muted-foreground">{prettySdk(run.sdk)}</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="font-mono font-medium">{prettyModel(run.model)}</span>
        </div>
        {run.ts && <span className="text-xs font-mono text-muted-foreground/70">{prettyTs(run.ts)}</span>}
      </div>

      {err && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/5 px-4 py-3 flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Could not load trajectory ({err}).</span>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex gap-4 items-start">
              <div className="h-6 w-6 rounded-full bg-muted/60 animate-pulse" />
              <div className="flex-1 rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="h-3 w-24 bg-muted/50 rounded animate-pulse" />
                <div className="h-4 w-72 bg-muted/40 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && judge && (
        <JudgeCard judge={judge} showAttack={showAttack} />
      )}

      {!loading && data && (
        <TimelineView
          steps={steps}
          fallbackUserText={!hasUserStep ? fallbackUserText : ""}
          finalResponse={data.traj_info?.agent_final_response}
        />
      )}
    </div>
  )
}

/* ============================================================
   Judge card — pretty UI, no raw JSON
   ============================================================ */

function JudgeCard({ judge, showAttack }: { judge: JudgeResult; showAttack: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Judge result
        </span>
        <div className="ml-auto flex flex-wrap gap-1.5">
          {typeof judge.task_success === "boolean" && (
            <Badge variant={judge.task_success ? "ok" : "fail"}>
              {judge.task_success ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              Task {judge.task_success ? "success" : "failed"}
            </Badge>
          )}
          {showAttack && typeof judge.attack_success === "boolean" && (
            <Badge variant={judge.attack_success ? "fail" : "ok"}>
              <AlertTriangle className="h-3.5 w-3.5" />
              Attack {judge.attack_success ? "succeeded" : "blocked"}
            </Badge>
          )}
        </div>
      </div>
      <div className="divide-y divide-border">
        <JudgeSection title="Task" message={judge.task_message} metadata={judge.task_metadata} />
        {showAttack && (
          <JudgeSection title="Attack" message={judge.attack_message} metadata={judge.attack_metadata} />
        )}
        {judge.error && (
          <div className="px-4 py-3 text-sm text-red-700 dark:text-red-300">
            <span className="font-medium">Error:</span> {judge.error}
          </div>
        )}
      </div>
    </div>
  )
}

function JudgeSection({
  title,
  message,
  metadata,
}: {
  title: string
  message?: string
  metadata?: Record<string, unknown>
}) {
  const hasMeta = metadata && Object.keys(metadata).length > 0
  if (!message && !hasMeta) return null
  return (
    <div className="px-4 py-3 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      {message && (
        <p className="text-sm leading-relaxed">
          {message}
        </p>
      )}
      {hasMeta && <KeyValueGrid data={metadata!} />}
    </div>
  )
}

/* ============================================================
   Timeline UI
   ============================================================ */

interface TimelineItem {
  agent: TrajectoryStep
  tool?: TrajectoryStep
  index: number
}

function TimelineView({
  steps,
  fallbackUserText,
  finalResponse,
}: {
  steps: TrajectoryStep[]
  fallbackUserText: string
  finalResponse?: string
}) {
  const items: TimelineItem[] = []
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i]
    if (s.role === "tool") {
      items.push({ agent: s, index: i })
      continue
    }
    const next = steps[i + 1]
    const isToolCall = s.role === "agent" && Boolean(s.metadata?.tool_name || s.action)
    if (isToolCall && next && next.role === "tool") {
      items.push({ agent: s, tool: next, index: i })
      i++
    } else {
      items.push({ agent: s, index: i })
    }
  }

  let agentCounter = 0
  return (
    <ol className="relative space-y-4">
      <span aria-hidden className="absolute left-3 top-2 bottom-2 w-px bg-border" />

      {fallbackUserText && (
        <SyntheticUserStep text={fallbackUserText} />
      )}

      {items.map((item) => {
        const isAgent = item.agent.role === "agent"
        const isUser = item.agent.role === "user"
        const isTool = item.agent.role === "tool"
        const isToolCall = isAgent && Boolean(item.tool || item.agent.metadata?.tool_name)
        const isAgentResponse = isAgent && !isToolCall
        if (isToolCall) agentCounter++

        const label = isUser
          ? "USER"
          : isTool
            ? "TOOL"
            : isToolCall
              ? `AGENT #${agentCounter}`
              : "AGENT RESPONSE"
        const Icon = isUser ? User : isTool ? Wrench : Bot

        return (
          <li key={item.index} className="relative pl-8">
            <span
              className={cn(
                "absolute left-0 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-background",
                isUser && "border-blue-500/60",
                isTool && "border-amber-500/60",
                isAgent && "border-violet-500/60"
              )}
            >
              <Icon
                className={cn(
                  "h-3.5 w-3.5",
                  isUser && "text-blue-600 dark:text-blue-400",
                  isTool && "text-amber-600 dark:text-amber-400",
                  isAgent && "text-violet-600 dark:text-violet-400"
                )}
              />
            </span>
            <div className="space-y-2">
              <div
                className={cn(
                  "text-[11px] font-semibold tracking-[0.14em]",
                  isUser && "text-blue-600 dark:text-blue-400",
                  isTool && "text-amber-600 dark:text-amber-400",
                  isAgent && "text-violet-600 dark:text-violet-400"
                )}
              >
                {label}
                {isAgentResponse && (
                  <span className="ml-2 text-muted-foreground/60 font-normal tracking-normal">
                    step {item.agent.step_id ?? item.index}
                  </span>
                )}
              </div>
              {isUser ? (
                <UserMessageCard step={item.agent} />
              ) : isToolCall ? (
                <ToolCallCard agent={item.agent} tool={item.tool} />
              ) : isTool ? (
                <ToolResultCard step={item.agent} />
              ) : (
                <AgentMessageCard step={item.agent} />
              )}
            </div>
          </li>
        )
      })}

      {finalResponse && (
        <li className="relative pl-8">
          <span className="absolute left-0 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-emerald-500/60 bg-background">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          </span>
          <div className="space-y-2">
            <div className="text-[11px] font-semibold tracking-[0.14em] text-emerald-600 dark:text-emerald-400">
              FINAL RESPONSE
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words">
              {finalResponse}
            </div>
          </div>
        </li>
      )}
    </ol>
  )
}

function SyntheticUserStep({ text }: { text: string }) {
  return (
    <li className="relative pl-8">
      <span className="absolute left-0 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-blue-500/60 bg-background">
        <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
      </span>
      <div className="space-y-2">
        <div className="text-[11px] font-semibold tracking-[0.14em] text-blue-600 dark:text-blue-400">USER</div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words">
          {text}
        </div>
      </div>
    </li>
  )
}

function UserMessageCard({ step }: { step: TrajectoryStep }) {
  const text =
    extractStringState(step.state) ?? (step.metadata?.message as string | undefined) ?? step.content ?? ""
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words">
      {text || <span className="text-muted-foreground italic">(no message)</span>}
    </div>
  )
}

function ToolCallCard({ agent, tool }: { agent: TrajectoryStep; tool?: TrajectoryStep }) {
  const toolName = (agent.metadata?.tool_name as string) || extractToolNameFromAction(agent.action) || "tool"
  const server = (agent.metadata?.server as string) || ""
  const params = agent.metadata?.tool_params as unknown
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-2">
        {server && <ServerBadge server={server} />}
        <span className="font-mono text-sm font-medium break-all">{toolName}</span>
      </div>
      {hasParams(params) && (
        <div className="px-4 py-3 border-b border-border">
          <KeyValueGrid data={params as Record<string, unknown>} compact />
        </div>
      )}
      {tool ? (
        <Disclosure label="Tool result" defaultOpen={false}>
          <ToolResultBody step={tool} />
        </Disclosure>
      ) : (
        <div className="px-4 py-2 text-xs text-muted-foreground/70 italic border-t border-border">
          No tool result captured.
        </div>
      )}
    </div>
  )
}

function ToolResultCard({ step }: { step: TrajectoryStep }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-2">
        {step.metadata?.server ? <ServerBadge server={step.metadata.server as string} /> : null}
        <span className="font-mono text-sm">{(step.metadata?.tool_name as string) || "tool result"}</span>
      </div>
      <div className="p-4">
        <ToolResultBody step={step} />
      </div>
    </div>
  )
}

function AgentMessageCard({ step }: { step: TrajectoryStep }) {
  const text = (step.metadata?.message as string) || step.content || step.action || ""
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words">
      {text || <span className="text-muted-foreground italic">(no message)</span>}
    </div>
  )
}

function Disclosure({
  label,
  defaultOpen,
  children,
}: {
  label: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  return (
    <details className="border-t border-border group" open={defaultOpen}>
      <summary className="list-none cursor-pointer px-4 py-2.5 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors">
        <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
        {label}
      </summary>
      <div className="px-4 pb-4 pt-1">{children}</div>
    </details>
  )
}

function ToolResultBody({ step }: { step: TrajectoryStep }) {
  const raw = (step as TrajectoryStep & { state?: unknown }).state
  if (raw === undefined || raw === null) {
    return <p className="text-xs text-muted-foreground italic">(no payload)</p>
  }
  return <RichValue value={raw} />
}

/* ============================================================
   Pretty value renderer — used for tool results, judge metadata, params
   ============================================================ */

function RichValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null) return <span className="text-muted-foreground italic">null</span>
  if (typeof value === "string") return <RichString text={value} />
  if (typeof value === "number" || typeof value === "boolean") {
    return <span className="font-mono text-sm">{String(value)}</span>
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-xs text-muted-foreground italic">[]</span>
    const allPrimitive = value.every(
      (v) => typeof v === "string" || typeof v === "number" || typeof v === "boolean"
    )
    if (allPrimitive) {
      return (
        <ul className="flex flex-wrap gap-1.5">
          {(value as Array<string | number | boolean>).map((v, i) => (
            <li
              key={i}
              className="inline-flex rounded-md border border-border bg-muted/30 px-2 py-0.5 font-mono text-[11px] text-foreground/80"
            >
              {String(v)}
            </li>
          ))}
        </ul>
      )
    }
    return (
      <div className="space-y-2">
        {(value as unknown[]).map((v, i) => (
          <div
            key={i}
            className="rounded-lg border border-border/60 bg-muted/15 px-3 py-2 text-sm"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              #{i}
            </div>
            <RichValue value={v} depth={depth + 1} />
          </div>
        ))}
      </div>
    )
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>
    // Special case: customer_service "ok/blocked/data/trace" envelope.
    if ("data" in obj && ("ok" in obj || "trace" in obj || "blocked" in obj)) {
      return <EnvelopeView env={obj} depth={depth} />
    }
    // Special case: tool_reference list passthrough.
    if (obj.type === "tool_reference" && typeof obj.tool_name === "string") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-xs">
          <Wrench className="h-3 w-3 text-amber-500" />
          {obj.tool_name as string}
        </span>
      )
    }
    return <KeyValueGrid data={obj} />
  }

  return <span className="font-mono text-sm">{String(value)}</span>
}

function EnvelopeView({ env, depth }: { env: Record<string, unknown>; depth: number }) {
  const ok = env.ok as boolean | undefined
  const blocked = env.blocked as boolean | undefined
  const reasons = (env.reasons as unknown[]) || []
  const data = env.data
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {ok != null && (
          <Badge variant={ok ? "ok" : "fail"}>
            {ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {ok ? "ok" : "not ok"}
          </Badge>
        )}
        {blocked != null && blocked && (
          <Badge variant="fail">
            <Lock className="h-3 w-3" />
            blocked
          </Badge>
        )}
        {Array.isArray(reasons) && reasons.length > 0 && (
          <Badge variant="muted">{reasons.length} reason{reasons.length === 1 ? "" : "s"}</Badge>
        )}
      </div>
      {data !== undefined && data !== null && <RichValue value={data} depth={depth + 1} />}
    </div>
  )
}

function KeyValueGrid({
  data,
  compact,
}: {
  data: Record<string, unknown>
  compact?: boolean
}) {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined)
  if (!entries.length) {
    return <p className="text-xs text-muted-foreground italic">(empty)</p>
  }
  return (
    <dl
      className={cn(
        "grid gap-x-4 gap-y-2",
        compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-[max-content_1fr]"
      )}
    >
      {entries.map(([k, v]) => (
        <div
          key={k}
          className={cn(
            "min-w-0",
            !compact && "contents"
          )}
        >
          <dt
            className={cn(
              "font-mono text-[11px] uppercase tracking-wider text-muted-foreground self-start",
              compact && "mb-1"
            )}
          >
            {k}
          </dt>
          <dd className="min-w-0 break-words text-sm">
            <RichValue value={v} />
          </dd>
        </div>
      ))}
    </dl>
  )
}

function RichString({ text }: { text: string }) {
  // Try to parse JSON-looking strings into structured view.
  const trimmed = text.trim()
  if (
    trimmed.length > 1 &&
    ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]")))
  ) {
    try {
      const parsed = JSON.parse(trimmed)
      return (
        <div className="rounded-lg border border-border/60 bg-muted/15 p-3">
          <RichValue value={parsed} />
        </div>
      )
    } catch {
      // fall through
    }
  }
  // Long text → collapse with details.
  if (text.length > 480) {
    return (
      <details className="group">
        <summary className="list-none cursor-pointer text-sm leading-relaxed whitespace-pre-wrap break-words">
          <span className="text-foreground/90">{text.slice(0, 360)}</span>
          <span className="text-muted-foreground">…</span>
          <span className="ml-2 inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground">
            <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" /> show all
          </span>
        </summary>
        <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap break-words">{text}</p>
      </details>
    )
  }
  return <span className="text-sm leading-relaxed whitespace-pre-wrap break-words">{text}</span>
}

/* ============================================================
   Misc UI primitives
   ============================================================ */

function Badge({ variant, children }: { variant: "ok" | "fail" | "muted"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        variant === "ok" &&
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        variant === "fail" && "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
        variant === "muted" && "border-border bg-muted/40 text-muted-foreground"
      )}
    >
      {children}
    </span>
  )
}

function ServerBadge({ server }: { server: string }) {
  const norm = server.toLowerCase()
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          norm.includes("gmail") && "bg-red-500",
          norm.includes("slack") && "bg-fuchsia-500",
          norm.includes("browser") && "bg-blue-500",
          norm.includes("customer") && "bg-emerald-500",
          norm.includes("calendar") && "bg-orange-500",
          !norm && "bg-muted-foreground/40"
        )}
      />
      {server || "tool"}
    </span>
  )
}

function SdkDot({ sdk }: { sdk: string }) {
  const cls = sdkColor(sdk)
  return <span className={cn("h-2 w-2 rounded-full", cls)} />
}

function sdkColor(sdk: string): string {
  if (sdk === "openaisdk") return "bg-emerald-500"
  if (sdk === "googleadk") return "bg-blue-500"
  if (sdk === "claudesdk") return "bg-amber-500"
  if (sdk === "openclaw") return "bg-fuchsia-500"
  return "bg-muted-foreground/40"
}

function prettySdk(sdk: string): string {
  switch (sdk) {
    case "openaisdk":
      return "OpenAI Agents SDK"
    case "googleadk":
      return "Google ADK"
    case "claudesdk":
      return "Claude SDK"
    case "openclaw":
      return "Open Claw"
    default:
      return sdk || "Unknown SDK"
  }
}

function prettyModel(model: string): string {
  if (!model) return "—"
  return model
    .replace(/^litellm_/, "")
    .replace(/^together_ai_/, "")
    .replace(/^openai_/, "")
    .replace(/^vertex_ai_/, "")
}

function prettyTs(ts: string): string {
  // 20260330_170807 → 2026-03-30 17:08:07
  const m = ts.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})$/)
  if (!m) return ts
  return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}`
}

function formatDuration(seconds: number): string {
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds - m * 60)
  return `${m}m ${s}s`
}

/* ============================================================
   helpers
   ============================================================ */

function extractToolNameFromAction(action?: string | null): string | null {
  if (!action) return null
  const m = action.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\(/)
  return m ? m[1] : null
}

function hasParams(params: unknown): boolean {
  if (params == null) return false
  if (typeof params !== "object") return false
  return Object.keys(params as Record<string, unknown>).length > 0
}

function extractStringState(state: unknown): string | null {
  if (typeof state === "string") return state
  return null
}

function extractSdkFromUrl(url: string): string {
  const m = url.match(/\/(openaisdk|googleadk|claudesdk|openclaw)\//)
  return m ? m[1] : ""
}

function extractModelFromUrl(url: string): string {
  const m = url.match(/\/(?:openaisdk|googleadk|claudesdk|openclaw)\/([^/]+)\//)
  return m ? m[1] : ""
}

function extractTsFromUrl(url: string): string {
  const m = url.match(/(\d{8}_\d{6})\.json$/)
  return m ? m[1] : ""
}

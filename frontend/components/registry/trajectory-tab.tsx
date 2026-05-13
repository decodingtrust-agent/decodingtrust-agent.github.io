"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Shield,
  ShieldAlert,
  Lock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  User,
  Wrench,
  Bot,
  Clock,
  Activity,
  Sparkles,
  Scale,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { type TrajectoryRun } from "@/lib/trajectory-keys"
import { useStoredString } from "@/lib/use-stored-state"

interface TrajectoryEntry {
  key: string
  trajectory: string
  judge: string
  runs: TrajectoryRun[]
}

interface ForTaskResponse {
  slug: string
  no_attack: TrajectoryEntry | null
  under_attack: TrajectoryEntry | null
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

export function TrajectoryTab({
  task,
  slug,
  runHint,
}: {
  task: Task
  slug: string
  runHint?: { sdk: string; model: string } | null
}) {
  const isMalicious = task.type === "malicious"
  const [storedView, setStoredView] = useStoredString(
    "dt:traj:view",
    isMalicious ? "under_attack" : "no_attack"
  )
  const activeView: "no_attack" | "under_attack" =
    storedView === "no_attack" || storedView === "under_attack"
      ? storedView
      : isMalicious
        ? "under_attack"
        : "no_attack"
  const setActiveView = (v: "no_attack" | "under_attack") => setStoredView(v)
  const [data, setData] = useState<ForTaskResponse | null>(null)
  const [fetchErr, setFetchErr] = useState<string | null>(null)
  const [selectedRunIdx, setSelectedRunIdx] = useState<number>(0)
  // Sticky cross-task preferences for the dropdowns. First-time visitors
  // land on OpenClaw + gpt-5.2 by default; subsequent picks override.
  const [preferredSdk, setPreferredSdk] = useStoredString("dt:traj:sdk", "openclaw")
  const [preferredModel, setPreferredModel] = useStoredString(
    "dt:traj:model",
    "openai_gpt-5.2"
  )

  useEffect(() => {
    if (!runHint) return
    setPreferredSdk(runHint.sdk)
    setPreferredModel(runHint.model)
  }, [runHint])

  useEffect(() => {
    let cancelled = false
    fetch(`/traj-api/trajectories/for-task?slug=${encodeURIComponent(slug)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`http ${r.status}`)
        return r.json()
      })
      .then((j: ForTaskResponse) => {
        if (!cancelled) {
          setData(j)
          setFetchErr(null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(null)
          setFetchErr("missing")
        }
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  const activeEntry: TrajectoryEntry | null = data
    ? activeView === "under_attack"
      ? data.under_attack
      : data.no_attack
    : null
  const runs: TrajectoryRun[] = activeEntry?.runs ?? []

  // When the dataset / view changes, prefer a run matching the user's last
  // (sdk, model) selection, then sdk-only, then index 0. Trial index itself
  // is task-specific and resets.
  useEffect(() => {
    if (runs.length === 0) {
      setSelectedRunIdx(0)
      return
    }
    let idx = -1
    if (preferredSdk && preferredModel) {
      idx = runs.findIndex(
        (r) => r.sdk === preferredSdk && r.model === preferredModel
      )
    }
    if (idx < 0 && preferredSdk) {
      idx = runs.findIndex((r) => r.sdk === preferredSdk)
    }
    setSelectedRunIdx(idx >= 0 ? idx : 0)
    // Only re-run when the underlying data or view changes — not on every
    // preference write, since user picks already update the index directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, data])

  const selectedRun: TrajectoryRun | null =
    runs[Math.min(selectedRunIdx, runs.length - 1)] ?? null

  const noAttackAvailable = isMalicious && Boolean(data?.no_attack)
  const hasAnyTrajectory = Boolean(data?.no_attack || data?.under_attack)

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
                ? "border-foreground/30 bg-card shadow-sm"
                : "border-border bg-card/50 text-muted-foreground hover:text-foreground hover:bg-card hover:border-foreground/20"
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
                ? "border-red-300 dark:border-red-700 bg-red-50/70 dark:bg-red-950/30 shadow-sm text-red-700 dark:text-red-300"
                : "border-border bg-card/50 text-muted-foreground hover:text-foreground hover:bg-card hover:border-foreground/20"
            )}
          >
            <ShieldAlert className="h-4 w-4" />
            Under Attack
          </button>
        </div>
      )}

      {fetchErr && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Trajectory API unreachable. Check that the trajectory service is running.
        </div>
      )}

      {data && !fetchErr && !hasAnyTrajectory && (
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
          <Lock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="font-medium text-foreground mb-1">No trajectories indexed for this task</p>
        </div>
      )}

      {data && hasAnyTrajectory && !activeEntry && (
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">No trajectory for this view</p>
          <p className="text-xs max-w-md mx-auto">
            {activeView === "no_attack"
              ? "No baseline (no-attack) trajectory is indexed for this task."
              : "No under-attack trajectory is indexed for this task."}
            {slug ? ` (page: ${slug})` : ""}
          </p>
        </div>
      )}

      {activeEntry && runs.length > 0 && (
        <RunPicker
          runs={runs}
          selectedIdx={Math.min(selectedRunIdx, runs.length - 1)}
          onSelect={(idx) => {
            setSelectedRunIdx(idx)
            const r = runs[idx]
            if (r) {
              setPreferredSdk(r.sdk)
              setPreferredModel(r.model)
            }
          }}
          showAttack={isMalicious && activeView === "under_attack"}
        />
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

      {selectedRun && (
        <RunDetail
          run={selectedRun}
          task={task}
          showAttack={isMalicious && activeView === "under_attack"}
        />
      )}
    </div>
  )
}

/* ============================================================
   Run picker — three dropdowns (framework / model / trial)
   ============================================================ */

function RunPicker({
  runs,
  selectedIdx,
  onSelect,
  showAttack,
}: {
  runs: TrajectoryRun[]
  selectedIdx: number
  onSelect: (idx: number) => void
  showAttack: boolean
}) {
  // Pre-fetch judge results for every run so trial labels can show pass/fail.
  // Keyed by judge URL — that's already unique per run.
  const [judges, setJudges] = useState<Record<string, JudgeResult | null>>({})

  useEffect(() => {
    let cancelled = false
    setJudges({})
    Promise.all(
      runs.map((r) =>
        fetch(r.judge)
          .then((res) => (res.ok ? (res.json() as Promise<JudgeResult>) : null))
          .catch(() => null)
          .then((j) => [r.judge, j] as const)
      )
    ).then((entries) => {
      if (cancelled) return
      setJudges(Object.fromEntries(entries))
    })
    return () => {
      cancelled = true
    }
  }, [runs])

  const selected = runs[selectedIdx] ?? runs[0]

  // Group runs by sdk → model → list of trial indices (into the runs array).
  const sdks = useMemo(() => {
    const seen = new Set<string>()
    const order: string[] = []
    for (const r of runs) {
      if (!seen.has(r.sdk)) {
        seen.add(r.sdk)
        order.push(r.sdk)
      }
    }
    return order
  }, [runs])

  const modelsForSdk = useMemo(() => {
    const seen = new Set<string>()
    const order: string[] = []
    for (const r of runs) {
      if (r.sdk !== selected.sdk) continue
      if (!seen.has(r.model)) {
        seen.add(r.model)
        order.push(r.model)
      }
    }
    return order
  }, [runs, selected.sdk])

  const trialIndicesForSelection = useMemo(() => {
    const out: number[] = []
    runs.forEach((r, i) => {
      if (r.sdk === selected.sdk && r.model === selected.model) out.push(i)
    })
    return out
  }, [runs, selected.sdk, selected.model])

  const selectedTrialOrdinal = trialIndicesForSelection.indexOf(selectedIdx)

  function handleSdkChange(sdk: string) {
    const next = runs.findIndex((r) => r.sdk === sdk)
    if (next >= 0) onSelect(next)
  }

  function handleModelChange(model: string) {
    const next = runs.findIndex((r) => r.sdk === selected.sdk && r.model === model)
    if (next >= 0) onSelect(next)
  }

  function trialLabel(runIdx: number, ordinal: number): string {
    const run = runs[runIdx]
    const judge = judges[run.judge]
    const passLabel =
      judge === undefined
        ? "…"
        : judge === null
          ? "?"
          : showAttack
            ? judge.attack_success
              ? "Attack succeeded"
              : "Attack blocked"
            : judge.task_success
              ? "Pass"
              : "Fail"
    return `Trial ${ordinal + 1} — ${passLabel}`
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2 max-w-3xl">
        <div className="space-y-1.5 flex-[1_1_200px]">
          <Label htmlFor="traj-sdk">Agent framework</Label>
          <Select value={selected.sdk} onValueChange={handleSdkChange}>
            <SelectTrigger id="traj-sdk" className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sdks.map((s) => (
                <SelectItem key={s} value={s}>
                  <span className="flex items-center gap-2">
                    <FrameworkLogo sdk={s} className="h-4 w-4 shrink-0" />
                    {prettySdk(s)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 flex-[1_1_160px]">
          <Label htmlFor="traj-model">Model</Label>
          <Select value={selected.model} onValueChange={handleModelChange}>
            <SelectTrigger id="traj-model" className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {modelsForSdk.map((m) => (
                <SelectItem key={m} value={m}>
                  <span className="flex items-center gap-2">
                    <ModelLogo model={m} className="h-4 w-4 shrink-0" />
                    <span className="font-mono text-sm">{prettyModel(m)}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 flex-[1_1_140px]">
          <Label htmlFor="traj-trial">Trial</Label>
          <Select
            value={String(selectedIdx)}
            onValueChange={(v) => onSelect(Number(v))}
            disabled={trialIndicesForSelection.length <= 1}
          >
            <SelectTrigger id="traj-trial" className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {trialIndicesForSelection.map((idx, ord) => (
                <SelectItem key={idx} value={String(idx)}>
                  {trialLabel(idx, ord)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {trialIndicesForSelection.length > 1 && (
        <p className="text-xs text-muted-foreground">
          Trial {selectedTrialOrdinal + 1} of {trialIndicesForSelection.length} for this model
        </p>
      )}
    </div>
  )
}

/* ============================================================
   Run detail — full trajectory + judge
   ============================================================ */

function RunDetail({
  run,
  task,
  showAttack,
}: {
  run: TrajectoryRun
  task: Task
  showAttack: boolean
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
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        {data?.traj_info?.step_count != null && (
          <span className="inline-flex items-center gap-1">
            <Activity className="h-3 w-3" /> {data.traj_info.step_count} steps
          </span>
        )}
        {data?.traj_info?.duration != null && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {formatDuration(data.traj_info.duration)}
          </span>
        )}
        {run.ts && (
          <span className="ml-auto font-mono text-muted-foreground/70">{prettyTs(run.ts)}</span>
        )}
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
              <div className="flex-1 rounded-lg border border-border bg-card p-4 space-y-2">
                <div className="h-3 w-24 bg-muted/50 rounded animate-pulse" />
                <div className="h-4 w-72 bg-muted/40 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && data && (
        <TimelineView
          steps={steps}
          fallbackUserText={!hasUserStep ? fallbackUserText : ""}
          finalResponse={data.traj_info?.agent_final_response}
        />
      )}

      {!loading && judge && <JudgePanel judge={judge} showAttack={showAttack} />}
    </div>
  )
}

/* ============================================================
   Judge panel — sits at the bottom, collapsible
   ============================================================ */

function JudgePanel({ judge, showAttack }: { judge: JudgeResult; showAttack: boolean }) {
  const [open, setOpen] = useState(true)
  const hasTask = Boolean(judge.task_message) || Boolean(judge.task_metadata && Object.keys(judge.task_metadata).length)
  const hasAttack =
    showAttack &&
    (Boolean(judge.attack_message) || Boolean(judge.attack_metadata && Object.keys(judge.attack_metadata).length))

  return (
    <section className="rounded-2xl border border-border bg-card overflow-hidden">
      <header className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-border">
        <Scale className="h-4 w-4 text-amber-500/90 shrink-0" />
        <h3 className="text-sm font-semibold tracking-tight">Judge Result</h3>
        <div className="flex flex-wrap gap-1.5">
          {typeof judge.task_success === "boolean" && (
            <PillBadge tone={judge.task_success ? "ok" : "fail"}>
              Task: {judge.task_success ? "Success" : "Failed"}
            </PillBadge>
          )}
          {showAttack && typeof judge.attack_success === "boolean" && (
            <PillBadge tone={judge.attack_success ? "ok" : "fail"}>
              Attack: {judge.attack_success ? "Success" : "Blocked"}
            </PillBadge>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {open ? "Hide" : "Show"}
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform", !open && "-rotate-90")}
          />
        </button>
      </header>

      {open && (
        <div
          className={cn(
            "grid divide-y md:divide-y-0 md:divide-x divide-border",
            hasAttack ? "md:grid-cols-2" : "md:grid-cols-1"
          )}
        >
          {hasTask && (
            <JudgeColumn title="Task" message={judge.task_message} metadata={judge.task_metadata} />
          )}
          {hasAttack && (
            <JudgeColumn
              title="Attack"
              message={judge.attack_message}
              metadata={judge.attack_metadata}
            />
          )}
          {judge.error && (
            <div className="col-span-full px-5 py-3 text-sm text-red-700 dark:text-red-300">
              <span className="font-semibold">Error:</span> {judge.error}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function JudgeColumn({
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
    <div className="px-5 py-4 space-y-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      {message && (
        <p className="text-sm leading-relaxed text-foreground/90">{message}</p>
      )}
      {hasMeta && <KeyValueGrid data={metadata!} compact />}
    </div>
  )
}

function PillBadge({
  tone,
  children,
}: {
  tone: "ok" | "fail"
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium border",
        tone === "ok"
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "ok" ? "bg-emerald-500" : "bg-red-500"
        )}
      />
      {children}
    </span>
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
  const inlineParams = formatInlineParams(params)
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="px-3.5 py-2.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        {server && <ServerBadge server={server} />}
        <span className="font-mono text-sm font-medium break-all">{toolName}</span>
        {inlineParams && (
          <span className="font-mono text-xs text-muted-foreground break-all">
            {inlineParams}
          </span>
        )}
      </div>
      {tool ? (
        <Disclosure label="Tool result">
          <ToolResultBody step={tool} />
        </Disclosure>
      ) : (
        hasParams(params) && (
          <Disclosure label="Parameters">
            <KeyValueGrid data={params as Record<string, unknown>} compact />
          </Disclosure>
        )
      )}
    </div>
  )
}

function ToolResultCard({ step }: { step: TrajectoryStep }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="px-3.5 py-2.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        {step.metadata?.server ? <ServerBadge server={step.metadata.server as string} /> : null}
        <span className="font-mono text-sm">{(step.metadata?.tool_name as string) || "tool result"}</span>
      </div>
      <Disclosure label="Tool result">
        <ToolResultBody step={step} />
      </Disclosure>
    </div>
  )
}

/** Format simple-shaped tool params as `(k=v, k2=v2)` for inline display.
 * Returns null when params are empty, deeply nested, or otherwise too noisy
 * to inline; the full payload is still available behind the disclosure. */
function formatInlineParams(params: unknown): string | null {
  if (!params || typeof params !== "object" || Array.isArray(params)) return null
  const entries = Object.entries(params as Record<string, unknown>)
  if (entries.length === 0) return null
  const parts: string[] = []
  for (const [k, v] of entries) {
    if (v == null) {
      parts.push(`${k}=null`)
      continue
    }
    if (typeof v === "string") {
      const s = v.length > 32 ? `${v.slice(0, 29)}…` : v
      parts.push(`${k}=${s}`)
      continue
    }
    if (typeof v === "number" || typeof v === "boolean") {
      parts.push(`${k}=${v}`)
      continue
    }
    // Nested → can't inline cleanly; skip the entire summary.
    return null
  }
  const joined = parts.join(", ")
  return joined.length > 200 ? null : `(${joined})`
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
    <details className="group border-t border-border/70" open={defaultOpen}>
      <summary className="list-none cursor-pointer px-3.5 py-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase text-muted-foreground/80 hover:text-foreground transition-colors">
        <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
        {label}
      </summary>
      <div className="px-3.5 pb-3.5 pt-1.5">{children}</div>
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
  if (value === null) return <span className="text-xs text-muted-foreground italic">null</span>
  if (typeof value === "string") return <RichString text={value} />
  if (typeof value === "number" || typeof value === "boolean") {
    return <span className="font-mono text-xs">{String(value)}</span>
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
              className="inline-flex rounded border border-border bg-muted/30 px-1.5 py-0.5 font-mono text-[10px] text-foreground/80"
            >
              {String(v)}
            </li>
          ))}
        </ul>
      )
    }
    // Array of objects: numbered items with a left rail, no nested card —
    // keeps the column alignment of the surrounding KeyValueGrid intact.
    return (
      <ol className="space-y-2">
        {(value as unknown[]).map((v, i) => (
          <li
            key={i}
            className="grid grid-cols-[1.75rem_1fr] items-baseline gap-x-2 border-l border-border/60 pl-3"
          >
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
              #{i}
            </span>
            <div className="min-w-0">
              <RichValue value={v} depth={depth + 1} />
            </div>
          </li>
        ))}
      </ol>
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
        <span className="inline-flex items-center gap-1.5 rounded border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[11px]">
          <Wrench className="h-3 w-3 text-amber-500" />
          {obj.tool_name as string}
        </span>
      )
    }
    return <KeyValueGrid data={obj} />
  }

  return <span className="font-mono text-xs">{String(value)}</span>
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
        "grid gap-x-3 gap-y-1.5 text-xs",
        // A predictable two-column grid keeps keys aligned across nesting
        // levels. Keys clamp between 4rem (small payloads) and 9rem (long
        // identifiers). `sm:` only — at narrow widths fall back to stacked.
        compact
          ? "grid-cols-1"
          : "grid-cols-1 sm:grid-cols-[minmax(4rem,9rem)_1fr]"
      )}
    >
      {entries.map(([k, v]) => (
        <div
          key={k}
          className={cn("min-w-0", !compact && "contents")}
        >
          <dt
            className={cn(
              "font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground/80 self-start pt-0.5 truncate",
              compact && "mb-1"
            )}
            title={k}
          >
            {k}
          </dt>
          <dd className="min-w-0 break-words">
            <RichValue value={v} />
          </dd>
        </div>
      ))}
    </dl>
  )
}

function RichString({ text }: { text: string }) {
  // Try to parse JSON / Python-repr strings into a structured view.
  const parsed = tryParseLooseJson(text)
  if (parsed !== undefined) {
    return (
      <div className="rounded border border-border/60 bg-muted/15 p-2.5">
        <RichValue value={parsed} />
      </div>
    )
  }
  // Long text → collapse with details, preserving newlines.
  if (text.length > 480) {
    return (
      <details className="group">
        <summary className="list-none cursor-pointer text-xs leading-relaxed whitespace-pre-wrap break-words font-mono">
          <span className="text-foreground/90">{text.slice(0, 360)}</span>
          <span className="text-muted-foreground">…</span>
          <span className="ml-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-sans text-muted-foreground hover:text-foreground">
            <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" /> show all
          </span>
        </summary>
        <pre className="mt-2 text-xs leading-relaxed whitespace-pre-wrap break-words font-mono text-foreground/85">{text}</pre>
      </details>
    )
  }
  // Multi-line short text → preformatted block; otherwise inline.
  if (text.includes("\n")) {
    return (
      <pre className="text-xs leading-relaxed whitespace-pre-wrap break-words font-mono text-foreground/85">
        {text}
      </pre>
    )
  }
  return <span className="text-xs leading-relaxed whitespace-pre-wrap break-words">{text}</span>
}

/** Try to parse a string as JSON, falling back to a best-effort
 *  Python-repr conversion (single-quoted dicts, True/False/None). Returns
 *  `undefined` if the string isn't structured data. */
function tryParseLooseJson(text: string): unknown {
  const t = text.trim()
  if (t.length < 2) return undefined
  const first = t[0]
  const last = t[t.length - 1]
  const looksObjectish =
    (first === "{" && last === "}") || (first === "[" && last === "]")
  if (!looksObjectish) return undefined

  try {
    return JSON.parse(t)
  } catch {
    /* try Python-repr below */
  }

  // Python-repr → JSON: convert single-quoted strings, True/False/None.
  // Walk char-by-char so we don't mangle quotes inside string values.
  try {
    let out = ""
    let i = 0
    while (i < t.length) {
      const c = t[i]
      if (c === '"') {
        // copy double-quoted segment verbatim, honoring escapes
        out += c
        i++
        while (i < t.length) {
          const ch = t[i]
          out += ch
          if (ch === "\\" && i + 1 < t.length) {
            out += t[i + 1]
            i += 2
            continue
          }
          i++
          if (ch === '"') break
        }
        continue
      }
      if (c === "'") {
        // single-quoted Python string → double-quoted JSON string
        out += '"'
        i++
        while (i < t.length) {
          const ch = t[i]
          if (ch === "\\" && i + 1 < t.length) {
            const next = t[i + 1]
            // JSON has no \'; inside our new "-string the apostrophe is plain.
            if (next === "'") out += "'"
            else out += ch + next
            i += 2
            continue
          }
          if (ch === "'") {
            out += '"'
            i++
            break
          }
          if (ch === '"') {
            // escape unescaped double quote inside Python single-quoted string
            out += '\\"'
            i++
            continue
          }
          out += ch
          i++
        }
        continue
      }
      // Word substitutions: True/False/None at word boundaries.
      if (c === "T" && t.startsWith("True", i) && !isWordChar(t[i + 4])) {
        out += "true"
        i += 4
        continue
      }
      if (c === "F" && t.startsWith("False", i) && !isWordChar(t[i + 5])) {
        out += "false"
        i += 5
        continue
      }
      if (c === "N" && t.startsWith("None", i) && !isWordChar(t[i + 4])) {
        out += "null"
        i += 4
        continue
      }
      out += c
      i++
    }
    return JSON.parse(out)
  } catch {
    return undefined
  }
}

function isWordChar(c: string | undefined): boolean {
  return c !== undefined && /[A-Za-z0-9_]/.test(c)
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
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2 py-1 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
      <ServerLogo server={server} className="h-4 w-4 shrink-0" />
      {server || "tool"}
    </span>
  )
}

/** Map a tool-step `server` field onto one of the brand logos under
 *  /public/logo/domains/. Mirrors the curated list in domains-section.tsx
 *  so the trajectory viewer reuses the same assets the homepage shows. */
function logoPathForServer(server: string): string | null {
  const norm = (server || "").toLowerCase().replace(/[\s_-]/g, "")
  // Order matters: more specific patterns first.
  const map: Array<[RegExp, string]> = [
    [/googlecalendar|gcalendar/, "google-calendar.png"],
    [/googledocs?|gdocs?/, "google-docs.png"],
    [/googledrive|gdrive/, "google-drive.png"],
    [/googleforms|gforms/, "google-forms.png"],
    [/googlesheets?|gsheets?/, "sheets.png"],
    [/googlebigquery|bigquery/, "google-bigquery.svg"],
    [/microsoftword|msword|^word$/, "msft-word.png"],
    [/microsoftexcel|msexcel|^excel$/, "msft-excel.png"],
    [/microsoftpowerpoint|mspowerpoint|^powerpoint$|^ppt$/, "msft-ppt.png"],
    [/libreoffice/, "libreoffice.png"],
    [/^outlook/, "outlook.webp"],
    [/gmail|^email$|^mail$/, "gmail.png"],
    [/slack/, "slack.png"],
    [/paypal/, "paypal.svg"],
    [/^zoom/, "zoom.svg"],
    [/atlassian|jira|confluence/, "atlassian.svg"],
    [/whatsapp/, "whatsapp.png"],
    [/telegram/, "telegram.png"],
    [/linkedin/, "linkedin.png"],
    [/^reddit/, "reddit.png"],
    [/spotify/, "spotify.png"],
    [/^x$|twitter/, "x.webp"],
    [/notion/, "notion.png"],
    [/dropbox/, "dropbox.png"],
    [/salesforce|crm/, "salesforce.png"],
    [/servicenow|customerservice|customersupport/, "servicenow.webp"],
    [/booking/, "booking.svg"],
    [/expedia/, "expedia.png"],
    [/southwest/, "southwest.png"],
    [/united/, "united.png"],
    [/enterprise/, "enterprise.webp"],
    [/fedex/, "fedex.png"],
    [/doordash/, "doordash.png"],
    [/github/, "github.svg"],
    [/gitlab/, "gitlab.svg"],
    [/safari/, "safari.png"],
    [/ebay/, "ebay.svg"],
    [/^browser$|^web$/, "browser.png"],
    [/arxiv/, "arxiv.png"],
    [/filesystem|terminal|^os$/, "terminal.svg"],
    [/yahoo/, "yahoo.png"],
    [/chase/, "chase.png"],
    [/robinhood/, "robinhood.png"],
    [/^legal$|harvey/, "legal.svg"],
    [/telecom|tmobile/, "tmobile.png"],
    [/hospital|medical|clinic/, "hospital.webp"],
    [/snowflake/, "snowflake.png"],
    [/databricks/, "databricks.png"],
    [/postgres/, "postgresql.png"],
    [/^macos$|^mac$/, "macos.png"],
    [/^windows/, "windows-os.png"],
    [/openclaw/, "openclaw.png"],
  ]
  for (const [re, file] of map) {
    if (re.test(norm)) return `/logo/domains/${file}`
  }
  return null
}

function ServerLogo({ server, className }: { server: string; className?: string }) {
  const path = logoPathForServer(server)
  return <BrandImage path={path} className={className} />
}

function FrameworkLogo({ sdk, className }: { sdk: string; className?: string }) {
  const map: Record<string, string> = {
    openaisdk: "/logo/framework-openai-agents.svg",
    googleadk: "/logo/framework-google-adk.png",
    claudesdk: "/logo/framework-claude-code.svg",
    openclaw: "/logo/openclaw.svg",
  }
  return <BrandImage path={map[sdk] ?? null} className={className} />
}

function ModelLogo({ model, className }: { model: string; className?: string }) {
  const norm = (model || "").toLowerCase()
  let path: string | null = null
  if (norm.includes("claude") || norm.includes("anthropic")) {
    path = "/logo/claude.svg"
  } else if (norm.includes("gemini")) {
    path = "/logo/gemini.svg"
  } else if (norm.includes("deepseek")) {
    path = "/logo/deepseek.png"
  } else if (
    norm.includes("gpt") ||
    norm.includes("openai") ||
    norm.includes("o1") ||
    norm.includes("o3") ||
    norm.includes("o4") ||
    norm.includes("oss")
  ) {
    // Use the same OpenAI mark as the framework dropdown so the visual
    // language stays consistent (white-circle background works on both
    // light and dark themes).
    path = "/logo/framework-openai-agents.svg"
  }
  return <BrandImage path={path} className={className} />
}

function BrandImage({ path, className }: { path: string | null; className?: string }) {
  if (path) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={path}
        alt=""
        aria-hidden
        className={cn("object-contain", className)}
        loading="lazy"
      />
    )
  }
  return (
    <span
      className={cn("inline-block rounded-full bg-muted-foreground/40", className)}
      aria-hidden
    />
  )
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
      return "OpenClaw"
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
    .replace(/^anthropic_/, "")
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


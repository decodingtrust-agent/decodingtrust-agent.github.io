"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Swords,
  Play,
  Square,
  Settings2,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  X,
  FileJson,
  Maximize2,
  Minimize2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AttackTimelineView } from "@/components/attack-timeline"
import { RedTeamingResult } from "@/types/attack-trajectory"
import { mockAttackData } from "@/lib/mock-attack-data"
import { useApiKeys } from "@/contexts/api-keys-context"

// Types for configuration
interface AttackConfig {
  // Task specification
  domain: string
  category: string
  taskId: string
  threatModel: "indirect" | "direct"

  // Model configuration
  agentModel: string
  victimModel: string
  victimArch: string
  judgeModel: string

  // Attack settings
  maxIterations: number
  victimTemperature: number
  victimMaxTurns: number

  // Injection settings
  promptInjection: boolean
  toolInjection: boolean
  environmentInjection: boolean

  // Multi-turn (direct threat model only)
  multiTurnEnabled: boolean
  maxTurnsPerSession: number
}

type AttackStatus = "idle" | "running" | "viewing"

// Default configuration based on red_team_runner.py
const defaultConfig: AttackConfig = {
  domain: "crm",
  category: "data-exfiltration",
  taskId: "1",
  threatModel: "indirect",
  agentModel: "gpt-4.1",
  victimModel: "gpt-4-turbo-2024-04-09",
  victimArch: "openaisdk",
  judgeModel: "gpt-4o",
  maxIterations: 3,
  victimTemperature: 0.1,
  victimMaxTurns: 50,
  promptInjection: true,
  toolInjection: true,
  environmentInjection: true,
  multiTurnEnabled: false,
  maxTurnsPerSession: 5,
}

export function RedTeamingTab() {
  const [config, setConfig] = useState<AttackConfig>(defaultConfig)
  const [configExpanded, setConfigExpanded] = useState(true)
  const [attackStatus, setAttackStatus] = useState<AttackStatus>("idle")
  const { apiKeys } = useApiKeys()

  // For the timeline view
  const [trajectoryData, setTrajectoryData] = useState<RedTeamingResult | null>(null)
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false)

  // Scroll container ref and auto-scroll logic
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [userHasScrolled, setUserHasScrolled] = useState(false)

  // Auto-scroll to bottom when data loads (unless user has manually scrolled)
  useEffect(() => {
    if (trajectoryData && scrollContainerRef.current && !userHasScrolled) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [trajectoryData, userHasScrolled])

  // Reset scroll state when starting new attack
  useEffect(() => {
    if (attackStatus === "running") {
      setUserHasScrolled(false)
    }
  }, [attackStatus])

  // Handle user scroll - detect if user scrolled up
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
      // If user scrolls more than 100px from bottom, consider it manual scroll
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      if (!isNearBottom) {
        setUserHasScrolled(true)
      } else {
        setUserHasScrolled(false)
      }
    }
  }, [])

  const handleStartAttack = async () => {
    setAttackStatus("running")
    setConfigExpanded(false)

    // TODO: Replace with actual API call to red-teaming service
    // The API call would include the config and API keys:
    // const response = await fetch('/api/red-teaming/start', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     config,
    //     apiKeys: {
    //       openai: apiKeys.openai,
    //       anthropic: apiKeys.anthropic,
    //       gemini: apiKeys.gemini,
    //     }
    //   })
    // })

    // Simulate loading delay then show mock data
    setTimeout(() => {
      setTrajectoryData(mockAttackData)
      setAttackStatus("viewing")
    }, 1500)
  }

  const handleStopAttack = () => {
    setAttackStatus("idle")
    setTrajectoryData(null)
    setConfigExpanded(true)
  }

  const handleCloseViewer = () => {
    setTrajectoryData(null)
    setAttackStatus("idle")
    setConfigExpanded(true)
  }

  const updateConfig = (updates: Partial<AttackConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <button
          onClick={() => setConfigExpanded(!configExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Settings2 className="h-5 w-5 text-primary" />
            <span className="font-semibold">Attack Configuration</span>
          </div>
          {configExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {configExpanded && (
          <div className="border-t border-border p-6 space-y-6">
            {/* Task Selection */}
            <div>
              <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1</span>
                Task Selection
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Domain</label>
                  <input
                    type="text"
                    value={config.domain}
                    onChange={(e) => updateConfig({ domain: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Category</label>
                  <input
                    type="text"
                    value={config.category}
                    onChange={(e) => updateConfig({ category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Task ID</label>
                  <input
                    type="text"
                    value={config.taskId}
                    onChange={(e) => updateConfig({ taskId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Threat Model</label>
                  <select
                    value={config.threatModel}
                    onChange={(e) => updateConfig({ threatModel: e.target.value as "indirect" | "direct" })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="indirect">Indirect (Suffix Injection)</option>
                    <option value="direct">Direct (Full Prompt Control)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Model Configuration */}
            <div>
              <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
                Model Configuration
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Attacker Model</label>
                  <select
                    value={config.agentModel}
                    onChange={(e) => updateConfig({ agentModel: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="gpt-4.1">gpt-4.1</option>
                    <option value="gpt-4o">gpt-4o</option>
                    <option value="gpt-4o-mini">gpt-4o-mini</option>
                    <option value="claude-3-opus">claude-3-opus</option>
                    <option value="claude-3-sonnet">claude-3-sonnet</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Victim Model</label>
                  <select
                    value={config.victimModel}
                    onChange={(e) => updateConfig({ victimModel: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="gpt-4-turbo-2024-04-09">gpt-4-turbo</option>
                    <option value="gpt-4o">gpt-4o</option>
                    <option value="gpt-4o-mini">gpt-4o-mini</option>
                    <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                    <option value="claude-3-opus">claude-3-opus</option>
                    <option value="claude-3-sonnet">claude-3-sonnet</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Victim Architecture</label>
                  <select
                    value={config.victimArch}
                    onChange={(e) => updateConfig({ victimArch: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="openaisdk">OpenAI SDK</option>
                    <option value="pocketflow">PocketFlow</option>
                    <option value="langchain">LangChain</option>
                    <option value="googleadk">Google ADK</option>
                    <option value="claudesdk">Claude SDK</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Judge Model</label>
                  <select
                    value={config.judgeModel}
                    onChange={(e) => updateConfig({ judgeModel: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="gpt-4o">gpt-4o</option>
                    <option value="gpt-4o-mini">gpt-4o-mini</option>
                    <option value="gpt-4.1">gpt-4.1</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Injection Configuration */}
            <div>
              <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">3</span>
                Injection Types
              </h3>
              <div className="flex flex-wrap gap-3">
                <label className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all",
                  config.promptInjection
                    ? "border-red-500 bg-red-500/10"
                    : "border-border hover:border-red-500/50"
                )}>
                  <input
                    type="checkbox"
                    checked={config.promptInjection}
                    onChange={(e) => updateConfig({ promptInjection: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={cn(
                    "h-4 w-4 rounded border-2 flex items-center justify-center",
                    config.promptInjection ? "border-red-500 bg-red-500" : "border-muted-foreground"
                  )}>
                    {config.promptInjection && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </div>
                  <div>
                    <span className="font-medium text-sm">Prompt Injection</span>
                    <p className="text-xs text-muted-foreground">Append malicious suffix</p>
                  </div>
                </label>

                <label className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all",
                  config.toolInjection
                    ? "border-orange-500 bg-orange-500/10"
                    : "border-border hover:border-orange-500/50"
                )}>
                  <input
                    type="checkbox"
                    checked={config.toolInjection}
                    onChange={(e) => updateConfig({ toolInjection: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={cn(
                    "h-4 w-4 rounded border-2 flex items-center justify-center",
                    config.toolInjection ? "border-orange-500 bg-orange-500" : "border-muted-foreground"
                  )}>
                    {config.toolInjection && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </div>
                  <div>
                    <span className="font-medium text-sm">Tool Injection</span>
                    <p className="text-xs text-muted-foreground">Modify tool descriptions</p>
                  </div>
                </label>

                <label className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all",
                  config.environmentInjection
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "border-border hover:border-cyan-500/50"
                )}>
                  <input
                    type="checkbox"
                    checked={config.environmentInjection}
                    onChange={(e) => updateConfig({ environmentInjection: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={cn(
                    "h-4 w-4 rounded border-2 flex items-center justify-center",
                    config.environmentInjection ? "border-cyan-500 bg-cyan-500" : "border-muted-foreground"
                  )}>
                    {config.environmentInjection && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </div>
                  <div>
                    <span className="font-medium text-sm">Environment Injection</span>
                    <p className="text-xs text-muted-foreground">Insert fake data</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Attack Settings */}
            <div>
              <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">4</span>
                Attack Settings
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Max Iterations</label>
                  <input
                    type="number"
                    value={config.maxIterations}
                    onChange={(e) => updateConfig({ maxIterations: parseInt(e.target.value) || 10 })}
                    min={1}
                    max={50}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Victim Temperature</label>
                  <input
                    type="number"
                    value={config.victimTemperature}
                    onChange={(e) => updateConfig({ victimTemperature: parseFloat(e.target.value) || 0.1 })}
                    min={0}
                    max={2}
                    step={0.1}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Victim Max Turns</label>
                  <input
                    type="number"
                    value={config.victimMaxTurns}
                    onChange={(e) => updateConfig({ victimMaxTurns: parseInt(e.target.value) || 50 })}
                    min={1}
                    max={100}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                {config.threatModel === "direct" && (
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">Max Turns/Session</label>
                    <input
                      type="number"
                      value={config.maxTurnsPerSession}
                      onChange={(e) => updateConfig({ maxTurnsPerSession: parseInt(e.target.value) || 5 })}
                      min={1}
                      max={20}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end items-center pt-4 border-t border-border">
              {attackStatus === "running" ? (
                <Button onClick={handleStopAttack} variant="destructive" className="gap-2">
                  <Square className="h-4 w-4" />
                  Stop Attack
                </Button>
              ) : (
                <Button onClick={handleStartAttack} className="gap-2">
                  <Play className="h-4 w-4" />
                  Start Attack
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar - Running State */}
      {attackStatus === "running" && (
        <div className="rounded-lg p-4 flex items-center justify-between bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            <span className="text-blue-500 font-medium">Attack in progress...</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              Initializing red-teaming agent...
            </span>
          </div>
        </div>
      )}

      {/* Timeline View - When viewing attack data */}
      {attackStatus === "viewing" && trajectoryData && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Header with expand and close buttons */}
          <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileJson className="h-5 w-5 text-primary" />
              <span className="font-semibold">Red-Teaming Trajectory</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                {isTimelineExpanded ? (
                  <>
                    <Minimize2 className="h-4 w-4" />
                    Collapse
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4" />
                    Expand
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseViewer}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>
          </div>

          {/* Timeline Content */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className={cn(
              "overflow-y-auto scroll-smooth",
              isTimelineExpanded
                ? "" // No height constraint when expanded - content determines height
                : "h-[calc(100vh-200px)] min-h-[700px]"
            )}
          >
            <AttackTimelineView data={trajectoryData} />
          </div>
        </div>
      )}

      {/* Empty State */}
      {attackStatus === "idle" && (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
          <Swords className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Ready to Launch Attack</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Configure your attack parameters above and click &quot;Start Attack&quot; to begin
            the automated red-teaming process against your target agent.
          </p>
        </div>
      )}
    </div>
  )
}

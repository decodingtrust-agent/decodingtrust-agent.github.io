"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { VictimStep } from "@/types/attack-trajectory"
import {
  ChevronDown,
  ChevronUp,
  Target,
  MessageSquare,
  Wrench,
  User,
  Bot,
  ArrowRight,
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"

interface VictimStepCardProps {
  step: VictimStep
}

export function VictimStepCard({ step }: VictimStepCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showTrajectory, setShowTrajectory] = useState(false)

  // Count tool calls in trajectory
  const toolCalls = step.metadata.victim_trajectory.filter(
    (t) => t.role === "agent" && t.action && !t.action.includes("List MCP Tools")
  )
  const actualToolCalls = toolCalls.filter(
    (t) => t.metadata?.tool_name && t.metadata.tool_name !== "List MCP Tools"
  )

  return (
    <div
      className={cn(
        "rounded-xl border-2 overflow-hidden transition-all duration-200 hover:shadow-lg",
        "border-blue-500/30",
        "bg-gradient-to-bl from-card to-card/50"
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 bg-blue-500/10">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-blue-500/20">
          <Target className="h-4 w-4 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Step {step.step_id}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge
              variant="outline"
              className="text-xs font-semibold gap-1 text-blue-500 bg-blue-500/10 border-blue-500/30"
            >
              <MessageSquare className="h-3 w-3" />
              Victim Response
            </Badge>
            {actualToolCalls.length > 0 && (
              <Badge
                variant="outline"
                className="text-xs text-purple-500 bg-purple-500/10 border-purple-500/30"
              >
                <Wrench className="h-3 w-3 mr-1" />
                {actualToolCalls.length} tool call{actualToolCalls.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-3">
        {/* Query sent to victim */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-medium text-yellow-600">
            <User className="h-3 w-3" />
            Query Received
          </div>
          <div className="bg-yellow-500/5 rounded-lg p-3 border border-yellow-500/20">
            <p className="text-sm whitespace-pre-wrap">{step.metadata.query}</p>
          </div>
        </div>

        {/* Victim's final response */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-medium text-blue-500">
              <Bot className="h-3 w-3" />
              Final Response
            </div>
            <div className="bg-blue-500/5 rounded-lg p-3 border border-blue-500/20">
              <p
                className={cn(
                  "text-sm whitespace-pre-wrap",
                  !isExpanded && "line-clamp-4"
                )}
              >
                {step.state}
              </p>
            </div>
          </div>

          {step.state.length > 300 && (
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2">
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Show full response
                </>
              )}
            </CollapsibleTrigger>
          )}
        </Collapsible>

        {/* Expandable Tool Trajectory */}
        {step.metadata.victim_trajectory.length > 0 && (
          <Collapsible open={showTrajectory} onOpenChange={setShowTrajectory}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <Wrench className="h-3.5 w-3.5 text-purple-500" />
                  <span>Internal Agent Trajectory</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {step.metadata.victim_trajectory.length} steps
                  </Badge>
                </div>
                {showTrajectory ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="mt-3 space-y-2 pl-2 border-l-2 border-purple-500/20">
                {step.metadata.victim_trajectory.map((trajStep, idx) => (
                  <TrajectoryStepItem key={idx} step={trajStep} />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  )
}

// Sub-component for trajectory steps
function TrajectoryStepItem({
  step,
}: {
  step: VictimStep["metadata"]["victim_trajectory"][0]
}) {
  const [isOpen, setIsOpen] = useState(false)

  const roleStyles = {
    agent: {
      icon: <Bot className="h-3 w-3" />,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    tool: {
      icon: <Wrench className="h-3 w-3" />,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    user: {
      icon: <User className="h-3 w-3" />,
      color: "text-yellow-600",
      bg: "bg-yellow-500/10",
    },
  }

  const style = roleStyles[step.role] || roleStyles.agent
  const hasState = step.state !== undefined
  const hasToolParams = step.role === "agent" && step.metadata?.tool_params
  const hasMessage = step.role === "agent" && step.metadata?.message
  const hasExpandableContent = hasState || hasToolParams || hasMessage

  // Format state for display
  const formatState = (state: unknown): string => {
    if (typeof state === "string") return state
    if (Array.isArray(state)) return state.join(", ")
    return JSON.stringify(state, null, 2)
  }

  // Get display action - shorter version for header
  const getDisplayAction = (): string | null => {
    if (!step.action) return null
    if (step.metadata?.tool_name) {
      return step.metadata.tool_name
    }
    // Truncate long action strings
    if (step.action.length > 50) {
      return step.action.substring(0, 47) + "..."
    }
    return step.action
  }

  return (
    <div className="rounded-lg border border-border bg-card/50 overflow-hidden">
      <button
        onClick={() => hasExpandableContent && setIsOpen(!isOpen)}
        className={cn(
          "w-full px-3 py-2 flex items-center gap-2 text-left",
          hasExpandableContent && "hover:bg-muted/50 cursor-pointer"
        )}
      >
        <div
          className={cn(
            "h-5 w-5 rounded flex items-center justify-center shrink-0",
            style.bg
          )}
        >
          <span className={style.color}>{style.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">
              #{step.step_id}
            </span>
            <span className={cn("text-xs font-medium capitalize", style.color)}>
              {step.role}
            </span>
            {getDisplayAction() && (
              <>
                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-xs font-mono truncate">{getDisplayAction()}</span>
              </>
            )}
          </div>
        </div>
        {hasExpandableContent && (
          <ChevronDown
            className={cn(
              "h-3 w-3 text-muted-foreground transition-transform shrink-0",
              isOpen && "rotate-180"
            )}
          />
        )}
      </button>

      {isOpen && hasExpandableContent && (
        <div className="px-3 pb-2 pt-1 border-t border-border space-y-2">
          {/* For agent steps: show tool params as input */}
          {step.role === "agent" && hasToolParams && (
            <div>
              <div className="text-[10px] font-medium text-purple-500 mb-1 flex items-center gap-1">
                <ArrowRight className="h-2.5 w-2.5" />
                Tool Input
              </div>
              <pre className="text-[10px] font-mono bg-purple-500/5 border border-purple-500/20 rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                {JSON.stringify(step.metadata?.tool_params, null, 2)}
              </pre>
            </div>
          )}

          {/* For tool steps: show tool output */}
          {step.role === "tool" && hasState && (
            <div>
              <div className="text-[10px] font-medium text-green-500 mb-1 flex items-center gap-1">
                <ArrowRight className="h-2.5 w-2.5" />
                Tool Output
              </div>
              <pre className="text-[10px] font-mono bg-green-500/5 border border-green-500/20 rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                {formatState(step.state)}
              </pre>
            </div>
          )}

          {/* For user steps: show the state/message */}
          {step.role === "user" && hasState && (
            <div>
              <div className="text-[10px] font-medium text-yellow-600 mb-1 flex items-center gap-1">
                <ArrowRight className="h-2.5 w-2.5" />
                User Message
              </div>
              <pre className="text-[10px] font-mono bg-yellow-500/5 border border-yellow-500/20 rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                {formatState(step.state)}
              </pre>
            </div>
          )}

          {/* For agent steps without tool_params but with state (like send_message_to_user) */}
          {step.role === "agent" && !hasToolParams && step.metadata?.message && (
            <div>
              <div className="text-[10px] font-medium text-purple-500 mb-1 flex items-center gap-1">
                <ArrowRight className="h-2.5 w-2.5" />
                Message Content
              </div>
              <pre className="text-[10px] font-mono bg-purple-500/5 border border-purple-500/20 rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                {step.metadata.message}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

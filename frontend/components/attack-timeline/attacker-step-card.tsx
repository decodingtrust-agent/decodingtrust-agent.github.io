"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { AttackerStep, getActionDisplayInfo } from "@/types/attack-trajectory"
import {
  ChevronDown,
  ChevronUp,
  Bot,
  Sparkles,
  Syringe,
  Mail,
  Wrench,
  FileText,
  Send,
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"

interface AttackerStepCardProps {
  step: AttackerStep
  stepIndex: number
  totalSteps: number
}

const actionIcons: Record<string, React.ReactNode> = {
  load_skill: <Sparkles className="h-3.5 w-3.5" />,
  execute_skill: <Wrench className="h-3.5 w-3.5" />,
  inject_env: <Mail className="h-3.5 w-3.5" />,
  inject_tool: <Syringe className="h-3.5 w-3.5" />,
  inject_prompt: <FileText className="h-3.5 w-3.5" />,
  query_victim: <Send className="h-3.5 w-3.5" />,
}

export function AttackerStepCard({
  step,
  stepIndex,
  totalSteps,
}: AttackerStepCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const actionInfo = getActionDisplayInfo(step.action)

  // Determine what content to show
  const hasSkillContent = step.action === "load_skill" && step.metadata?.skill_content
  const hasEmailContent = step.action === "inject_env" && step.metadata?.tool_params
  const hasInjectionContent = step.action === "inject_tool" && step.metadata?.content

  const hasExpandableContent = hasSkillContent || hasEmailContent || hasInjectionContent || step.reasoning.length > 200

  return (
    <div
      className={cn(
        "rounded-xl border-2 overflow-hidden transition-all duration-200 hover:shadow-lg",
        actionInfo.borderColor,
        "bg-gradient-to-br from-card to-card/50"
      )}
    >
      {/* Header */}
      <div className={cn("px-4 py-3 flex items-center gap-3", actionInfo.bgColor)}>
        <div
          className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center",
            "bg-red-500/20"
          )}
        >
          <Bot className="h-4 w-4 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Step {step.step_id}
            </span>
            {totalSteps > 1 && (
              <span className="text-xs text-muted-foreground/60">
                ({stepIndex}/{totalSteps})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-semibold gap-1",
                actionInfo.color,
                actionInfo.bgColor,
                actionInfo.borderColor
              )}
            >
              {actionIcons[step.action]}
              {actionInfo.label}
            </Badge>
            {step.metadata?.success !== undefined && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  step.metadata.success
                    ? "bg-green-500/10 text-green-600 border-green-500/30"
                    : "bg-red-500/10 text-red-600 border-red-500/30"
                )}
              >
                {step.metadata.success ? "Success" : "Failed"}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-3">
        {/* Reasoning - truncated unless expanded */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="space-y-2">
            <p
              className={cn(
                "text-sm text-muted-foreground leading-relaxed",
                !isExpanded && "line-clamp-3"
              )}
            >
              {step.reasoning}
            </p>

            {hasExpandableContent && (
              <CollapsibleContent className="space-y-3">
                {/* Skill Content */}
                {hasSkillContent && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-purple-500">
                      <Sparkles className="h-3 w-3" />
                      Loaded Skill: {step.metadata?.skill_name}
                    </div>
                    <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap border border-border">
                      {step.metadata?.skill_content}
                    </pre>
                  </div>
                )}

                {/* Email Injection Content */}
                {hasEmailContent && step.metadata?.tool_params && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-cyan-500">
                      <Mail className="h-3 w-3" />
                      Injected Email
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 border border-border space-y-2 text-xs">
                      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                        <span className="text-muted-foreground">From:</span>
                        <span className="font-mono">{step.metadata.tool_params.from_email}</span>
                        <span className="text-muted-foreground">To:</span>
                        <span className="font-mono">{step.metadata.tool_params.to_email}</span>
                        <span className="text-muted-foreground">Subject:</span>
                        <span className="font-semibold">{step.metadata.tool_params.subject}</span>
                      </div>
                      <div className="pt-2 border-t border-border">
                        <p className="whitespace-pre-wrap">{step.metadata.tool_params.body}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tool Injection Content */}
                {hasInjectionContent && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-orange-500">
                      <Syringe className="h-3 w-3" />
                      Tool Injection ({step.metadata?.server_name} / {step.metadata?.tool_name})
                      <Badge variant="outline" className="text-[10px] ml-auto">
                        {step.metadata?.injection_type}
                      </Badge>
                    </div>
                    <pre className="text-xs bg-orange-500/5 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap border border-orange-500/20 text-orange-700 dark:text-orange-300">
                      {step.metadata?.content}
                    </pre>
                  </div>
                )}
              </CollapsibleContent>
            )}

            {hasExpandableContent && (
              <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    Show more details
                  </>
                )}
              </CollapsibleTrigger>
            )}
          </div>
        </Collapsible>
      </div>
    </div>
  )
}

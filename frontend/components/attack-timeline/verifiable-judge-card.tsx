"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { VerifiableJudgeStep } from "@/types/attack-trajectory"
import {
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Target,
  ShieldAlert,
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface VerifiableJudgeCardProps {
  step: VerifiableJudgeStep
}

export function VerifiableJudgeCard({ step }: VerifiableJudgeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const taskSuccess = step.state.original_task_success
  const attackSuccess = step.state.attack_success

  // Determine overall status color
  const getOverallStatus = () => {
    if (attackSuccess) return "success" // Green - attack succeeded
    if (taskSuccess) return "partial" // Amber - task worked but attack failed
    return "failure" // Red - everything failed
  }

  const status = getOverallStatus()

  const statusColors = {
    success: {
      border: "border-green-500/30",
      bg: "bg-gradient-to-r from-green-500/5 via-card to-green-500/5",
      headerBg: "bg-green-500/10",
      icon: "bg-green-500/20",
      iconColor: "text-green-500",
    },
    partial: {
      border: "border-amber-500/30",
      bg: "bg-gradient-to-r from-amber-500/5 via-card to-amber-500/5",
      headerBg: "bg-amber-500/10",
      icon: "bg-amber-500/20",
      iconColor: "text-amber-500",
    },
    failure: {
      border: "border-red-500/30",
      bg: "bg-gradient-to-r from-red-500/5 via-card to-red-500/5",
      headerBg: "bg-red-500/10",
      icon: "bg-red-500/20",
      iconColor: "text-red-500",
    },
  }

  const colors = statusColors[status]

  return (
    <div
      className={cn(
        "rounded-xl border-2 overflow-hidden transition-all duration-200",
        colors.border,
        colors.bg
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "px-4 py-3 flex items-center justify-between",
          colors.headerBg
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center",
              colors.icon
            )}
          >
            <ClipboardCheck className={cn("h-5 w-5", colors.iconColor)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Step {step.step_id}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                Verifiable Judge
              </span>
            </div>
            <div className="text-sm font-medium text-foreground mt-0.5">
              Programmatic Verification
            </div>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1.5",
              taskSuccess
                ? "bg-green-500/20 text-green-600 dark:text-green-400"
                : "bg-red-500/20 text-red-600 dark:text-red-400"
            )}
          >
            <Target className="h-3 w-3" />
            Task: {taskSuccess ? "Pass" : "Fail"}
          </div>
          <div
            className={cn(
              "px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1.5",
              attackSuccess
                ? "bg-green-500/20 text-green-600 dark:text-green-400"
                : "bg-red-500/20 text-red-600 dark:text-red-400"
            )}
          >
            <ShieldAlert className="h-3 w-3" />
            Attack: {attackSuccess ? "Pass" : "Fail"}
          </div>
        </div>
      </div>

      {/* Content - Evaluation Details */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="px-4 py-3 space-y-3">
          {/* Task Evaluation */}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0",
                step.metadata.task_evaluation.success
                  ? "bg-green-500/20"
                  : "bg-red-500/20"
              )}
            >
              {step.metadata.task_evaluation.success ? (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Task Evaluation
              </div>
              <p className="text-sm text-foreground">
                {step.metadata.task_evaluation.message}
              </p>
            </div>
          </div>

          {/* Attack Evaluation */}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0",
                step.metadata.attack_evaluation.success
                  ? "bg-green-500/20"
                  : "bg-red-500/20"
              )}
            >
              {step.metadata.attack_evaluation.success ? (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Attack Evaluation
              </div>
              <p className="text-sm text-foreground">
                {step.metadata.attack_evaluation.message}
              </p>
              {step.metadata.attack_evaluation.pii_found &&
                step.metadata.attack_evaluation.pii_found.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {step.metadata.attack_evaluation.pii_found.map(
                      (pii, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-600 dark:text-red-400 font-mono"
                        >
                          {pii}
                        </span>
                      )
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Expandable Details */}
        <CollapsibleContent>
          <div className="px-4 pb-3 pt-0">
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Evaluation Details
              </div>
              <div className="grid grid-cols-2 gap-4">
                {step.metadata.task_evaluation.details && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Task Details
                    </div>
                    <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap">
                      {JSON.stringify(
                        step.metadata.task_evaluation.details,
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
                {step.metadata.attack_evaluation.details && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Attack Details
                    </div>
                    <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap">
                      {JSON.stringify(
                        step.metadata.attack_evaluation.details,
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CollapsibleContent>

        {/* Expand/Collapse Toggle */}
        {(step.metadata.task_evaluation.details ||
          step.metadata.attack_evaluation.details) && (
          <div className="px-4 pb-3">
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Show details
                </>
              )}
            </CollapsibleTrigger>
          </div>
        )}
      </Collapsible>
    </div>
  )
}

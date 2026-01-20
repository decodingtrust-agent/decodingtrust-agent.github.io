"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { JudgeStep } from "@/types/attack-trajectory"
import {
  ChevronDown,
  ChevronUp,
  Scale,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface JudgeStepCardProps {
  step: JudgeStep
}

export function JudgeStepCard({ step }: JudgeStepCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const success = step.state

  // Parse the reasoning to separate verifiable judge from LLM feedback
  const reasoning = step.metadata.reasoning
  const verifiableMatch = reasoning.match(/\[Verifiable judge: ([^\]]+)\]/)
  // Use split approach instead of /s flag for cross-line matching
  const llmFeedbackMarker = "[LLM feedback]: "
  const llmFeedbackIndex = reasoning.indexOf(llmFeedbackMarker)

  const verifiableResult = verifiableMatch ? verifiableMatch[1] : null
  const llmFeedback = llmFeedbackIndex !== -1
    ? reasoning.slice(llmFeedbackIndex + llmFeedbackMarker.length).trim()
    : reasoning

  return (
    <div
      className={cn(
        "rounded-xl border-2 overflow-hidden transition-all duration-200",
        success
          ? "border-green-500/30 bg-gradient-to-r from-green-500/5 via-card to-green-500/5"
          : "border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-card to-amber-500/5"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "px-4 py-3 flex items-center justify-between",
          success ? "bg-green-500/10" : "bg-amber-500/10"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center",
              success ? "bg-green-500/20" : "bg-amber-500/20"
            )}
          >
            <Scale
              className={cn(
                "h-5 w-5",
                success ? "text-green-500" : "text-amber-500"
              )}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Step {step.step_id}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs font-medium text-amber-600">
                Judge Evaluation
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {success ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="font-semibold text-green-500">
                    Attack Succeeded
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold text-amber-500">
                    Attack Blocked
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Verifiable result badge */}
        {verifiableResult && (
          <div
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-mono",
              success
                ? "bg-green-500/20 text-green-600 dark:text-green-400"
                : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
            )}
          >
            {verifiableResult}
          </div>
        )}
      </div>

      {/* Content */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p
              className={cn(
                "text-sm text-muted-foreground leading-relaxed",
                !isExpanded && "line-clamp-2"
              )}
            >
              {llmFeedback}
            </p>
          </div>
        </div>

        {llmFeedback.length > 200 && (
          <div className="px-4 pb-3">
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Read full evaluation
                </>
              )}
            </CollapsibleTrigger>
          </div>
        )}
      </Collapsible>
    </div>
  )
}

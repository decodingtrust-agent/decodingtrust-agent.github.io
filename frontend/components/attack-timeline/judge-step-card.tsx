"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { JudgeStep, JudgeFeedbackStep } from "@/types/attack-trajectory"
import {
  ChevronDown,
  ChevronUp,
  MessageSquare,
  XCircle,
  Lightbulb,
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface JudgeStepCardProps {
  step: JudgeStep | JudgeFeedbackStep
}

// Parse reasoning into sections (Failure Analysis and Improvement Suggestion)
function parseReasoning(reasoning: string): {
  failureAnalysis: string | null
  improvementSuggestion: string | null
  plainText: string | null
} {
  const failureMatch = reasoning.match(/\*\*Failure Analysis:\*\*\s*([\s\S]*?)(?=\*\*Improvement Suggestion:\*\*|$)/)
  const improvementMatch = reasoning.match(/\*\*Improvement Suggestion:\*\*\s*([\s\S]*)/)

  if (failureMatch || improvementMatch) {
    return {
      failureAnalysis: failureMatch ? failureMatch[1].trim() : null,
      improvementSuggestion: improvementMatch ? improvementMatch[1].trim() : null,
      plainText: null,
    }
  }

  // No structured format, return as plain text
  return {
    failureAnalysis: null,
    improvementSuggestion: null,
    plainText: reasoning,
  }
}

export function JudgeStepCard({ step }: JudgeStepCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const reasoning = step.metadata.reasoning
  const parsed = parseReasoning(reasoning)
  const hasStructuredContent = parsed.failureAnalysis || parsed.improvementSuggestion

  return (
    <div
      className={cn(
        "rounded-xl border-2 overflow-hidden transition-all duration-200",
        "border-orange-500/30 bg-gradient-to-r from-orange-500/5 via-card to-orange-500/5"
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between bg-orange-500/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full flex items-center justify-center bg-orange-500/20">
            <MessageSquare className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Step {step.step_id}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                Judge Feedback
              </span>
            </div>
            <div className="text-sm font-medium text-foreground mt-0.5">
              Feedback Judge Reasoning
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div className="px-2 py-1 rounded-md text-xs font-medium bg-orange-500/20 text-orange-600 dark:text-orange-400">
          Attack Analysis
        </div>
      </div>

      {/* Content */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="px-4 py-3 space-y-3">
          {hasStructuredContent ? (
            <>
              {/* Failure Analysis Section */}
              {parsed.failureAnalysis && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                      Failure Analysis
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-sm text-muted-foreground leading-relaxed pl-6",
                      !isExpanded && "line-clamp-2"
                    )}
                  >
                    {parsed.failureAnalysis}
                  </p>
                </div>
              )}

              {/* Improvement Suggestion Section */}
              {parsed.improvementSuggestion && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0" />
                    <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                      Improvement Suggestion
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-sm text-muted-foreground leading-relaxed pl-6",
                      !isExpanded && "line-clamp-2"
                    )}
                  >
                    {parsed.improvementSuggestion}
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Plain text fallback for legacy/unstructured reasoning */
            <p
              className={cn(
                "text-sm text-muted-foreground leading-relaxed",
                !isExpanded && "line-clamp-3"
              )}
            >
              {parsed.plainText}
            </p>
          )}
        </div>

        {reasoning.length > 200 && (
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
                  Read full analysis
                </>
              )}
            </CollapsibleTrigger>
          </div>
        )}
      </Collapsible>
    </div>
  )
}

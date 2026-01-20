"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  TaskInfo,
  AttackConfigFromJSON,
  AttackResultSummary,
} from "@/types/attack-trajectory"
import {
  ChevronDown,
  ChevronUp,
  Target,
  Shield,
  Bot,
  Scale,
  Cpu,
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"

interface TaskInfoHeaderProps {
  taskInfo: TaskInfo
  attackConfig: AttackConfigFromJSON
  attackResult: AttackResultSummary
}

export function TaskInfoHeader({
  taskInfo,
  attackConfig,
}: TaskInfoHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border-b border-border bg-card/50">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger className="w-full">
          <div className="px-4 py-3 flex items-center justify-between hover:bg-secondary/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">
                    Task #{taskInfo.task_id}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-xs capitalize bg-primary/5"
                  >
                    {taskInfo.domain}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs capitalize",
                      taskInfo.threat_model === "indirect"
                        ? "bg-orange-500/10 text-orange-600 border-orange-500/30"
                        : "bg-red-500/10 text-red-600 border-red-500/30"
                    )}
                  >
                    {taskInfo.threat_model} threat
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {taskInfo.risk_category.replace(/-/g, " ")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {isExpanded ? "Hide" : "Show"} details
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 space-y-4 border-t border-border bg-muted/30">
            {/* Original Task */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Cpu className="h-3.5 w-3.5" />
                Original Task
              </div>
              <p className="text-sm bg-background rounded-lg p-3 border border-border">
                {taskInfo.original_task}
              </p>
            </div>

            {/* Malicious Goal */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-medium text-red-500">
                <Shield className="h-3.5 w-3.5" />
                Malicious Goal (Hidden from Victim)
              </div>
              <p className="text-sm bg-red-500/5 rounded-lg p-3 border border-red-500/20 text-red-600 dark:text-red-400">
                {taskInfo.malicious_goal}
              </p>
            </div>

            {/* Model Configuration */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg bg-background border border-border p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Bot className="h-3 w-3 text-red-500" />
                  Attacker
                </div>
                <p className="text-sm font-mono font-medium truncate">
                  {attackConfig.agent_model}
                </p>
              </div>
              <div className="rounded-lg bg-background border border-border p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Target className="h-3 w-3 text-blue-500" />
                  Victim
                </div>
                <p className="text-sm font-mono font-medium truncate">
                  {attackConfig.victim_model}
                </p>
              </div>
              <div className="rounded-lg bg-background border border-border p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Cpu className="h-3 w-3 text-purple-500" />
                  Architecture
                </div>
                <p className="text-sm font-mono font-medium truncate">
                  {attackConfig.victim_arch}
                </p>
              </div>
              <div className="rounded-lg bg-background border border-border p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Scale className="h-3 w-3 text-amber-500" />
                  Judge
                </div>
                <p className="text-sm font-mono font-medium truncate">
                  {attackConfig.judge_model}
                </p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

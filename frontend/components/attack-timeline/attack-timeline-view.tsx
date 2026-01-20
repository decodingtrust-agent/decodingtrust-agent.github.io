"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import {
  RedTeamingResult,
  parseTrajectoryToIterations,
} from "@/types/attack-trajectory"
import { TaskInfoHeader } from "./task-info-header"
import { IterationBlock } from "./iteration-block"
import { Swords, CheckCircle2, XCircle, Clock, Zap } from "lucide-react"

interface AttackTimelineViewProps {
  data: RedTeamingResult
  className?: string
}

export function AttackTimelineView({ data, className }: AttackTimelineViewProps) {
  // Parse trajectory into grouped iterations
  const iterations = useMemo(
    () => parseTrajectoryToIterations(data.attack_trajectory),
    [data.attack_trajectory]
  )

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Task Info Header */}
      <TaskInfoHeader
        taskInfo={data.task_info}
        attackConfig={data.attack_config}
        attackResult={data.attack_result}
      />

      {/* Result Summary Banner */}
      <div
        className={cn(
          "mx-4 mt-4 rounded-lg border p-4 flex items-center justify-between",
          data.attack_result.success
            ? "bg-green-500/10 border-green-500/30"
            : "bg-amber-500/10 border-amber-500/30"
        )}
      >
        <div className="flex items-center gap-3">
          {data.attack_result.success ? (
            <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-amber-500" />
            </div>
          )}
          <div>
            <p
              className={cn(
                "font-semibold",
                data.attack_result.success ? "text-green-500" : "text-amber-500"
              )}
            >
              {data.attack_result.success
                ? "Attack Successful"
                : "Attack Defended"}
            </p>
            <p className="text-sm text-muted-foreground">
              {iterations.length} iteration{iterations.length !== 1 ? "s" : ""}{" "}
              completed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{data.attack_result.duration.toFixed(1)}s</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span>{data.attack_trajectory.length} steps</span>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="mt-4 px-4 pb-8">
        {/* Timeline container with center line */}
        <div className="relative">
          {/* Center timeline line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2 z-0" />

          {/* Iterations */}
          <div className="relative z-10 space-y-8">
            {iterations.map((iteration, index) => (
              <IterationBlock
                key={iteration.iterationNumber}
                iteration={iteration}
                isLast={index === iterations.length - 1}
              />
            ))}
          </div>
        </div>

        {/* End marker */}
        <div className="flex justify-center mt-8">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border">
            <Swords className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              End of Attack Trajectory
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { AttackIteration } from "@/types/attack-trajectory"
import { AttackerStepCard } from "./attacker-step-card"
import { VictimStepCard } from "./victim-step-card"
import { JudgeStepCard } from "./judge-step-card"
import { VerifiableJudgeCard } from "./verifiable-judge-card"
import { Swords, ArrowDown } from "lucide-react"

interface IterationBlockProps {
  iteration: AttackIteration
  isLast: boolean
}

export function IterationBlock({ iteration, isLast }: IterationBlockProps) {
  // Determine if we have any judge to show
  const hasVerifiableJudge = !!iteration.verifiableJudgeStep
  const hasJudgeFeedback = !!iteration.judgeFeedbackStep
  const hasLegacyJudge = !!iteration.judgeStep

  return (
    <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Iteration Header */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 shadow-sm">
          <Swords className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary">
            Iteration {iteration.iterationNumber}
          </span>
        </div>
      </div>

      {/* Attacker Steps - LEFT SIDE */}
      <div className="space-y-4 mb-6">
        {iteration.attackerSteps.map((step, index) => (
          <div
            key={step.step_id}
            className="flex items-start gap-4 animate-in fade-in slide-in-from-left-4 duration-300"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Left Card */}
            <div className="w-[calc(50%-1.5rem)] flex justify-end">
              <div className="w-full max-w-md">
                <AttackerStepCard
                  step={step}
                  stepIndex={index + 1}
                  totalSteps={iteration.attackerSteps.length}
                />
              </div>
            </div>

            {/* Center Timeline Connector */}
            <div className="flex flex-col items-center shrink-0 w-6">
              <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-background shadow-lg ring-4 ring-red-500/20" />
              {index < iteration.attackerSteps.length - 1 && (
                <div className="w-0.5 h-8 bg-gradient-to-b from-red-500/50 to-red-500/20 mt-1" />
              )}
            </div>

            {/* Right Spacer (blank during attacker turn) */}
            <div className="w-[calc(50%-1.5rem)] flex items-center justify-start">
              <div className="flex items-center gap-2 text-xs text-muted-foreground/50 italic pl-4">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/20 animate-pulse" />
                <span>Victim waiting...</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Flow Arrow */}
      {iteration.victimStep && (
        <div className="flex justify-center mb-4">
          <div className="flex flex-col items-center">
            <div className="w-px h-4 bg-gradient-to-b from-red-500/30 to-blue-500/30" />
            <ArrowDown className="h-4 w-4 text-muted-foreground/50" />
          </div>
        </div>
      )}

      {/* Victim Response - RIGHT SIDE */}
      {iteration.victimStep && (
        <div
          className="flex items-start gap-4 mb-6 animate-in fade-in slide-in-from-right-4 duration-300"
          style={{ animationDelay: `${iteration.attackerSteps.length * 100 + 200}ms` }}
        >
          {/* Left Spacer (blank during victim turn) */}
          <div className="w-[calc(50%-1.5rem)] flex items-center justify-end">
            <div className="flex items-center gap-2 text-xs text-muted-foreground/50 italic pr-4">
              <span>Attack delivered</span>
              <div className="w-2 h-2 rounded-full bg-red-500/30" />
            </div>
          </div>

          {/* Center Timeline Connector */}
          <div className="flex flex-col items-center shrink-0 w-6">
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-background shadow-lg ring-4 ring-blue-500/20" />
          </div>

          {/* Right Card */}
          <div className="w-[calc(50%-1.5rem)]">
            <div className="w-full max-w-md">
              <VictimStepCard step={iteration.victimStep} />
            </div>
          </div>
        </div>
      )}

      {/* Flow Arrow to Verifiable Judge */}
      {(hasVerifiableJudge || hasLegacyJudge) && (
        <div className="flex justify-center mb-4">
          <div className="flex flex-col items-center">
            <div className="w-px h-4 bg-gradient-to-b from-blue-500/30 to-purple-500/30" />
            <ArrowDown className="h-4 w-4 text-muted-foreground/50" />
          </div>
        </div>
      )}

      {/* Verifiable Judge - CENTER/FULL WIDTH */}
      {hasVerifiableJudge && (
        <div
          className="flex justify-center mb-4 animate-in fade-in zoom-in-95 duration-300"
          style={{ animationDelay: `${iteration.attackerSteps.length * 100 + 400}ms` }}
        >
          <div className="w-full max-w-2xl px-8">
            <div className="flex items-start gap-4">
              <div className="w-[calc(50%-1.5rem)]" />
              <div className="flex flex-col items-center shrink-0 w-6 pt-3">
                <div className="w-5 h-5 rounded-full bg-purple-500 border-2 border-background shadow-lg ring-4 ring-purple-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>
              <div className="w-[calc(50%-1.5rem)]" />
            </div>
            <div className="mt-3 -mx-4">
              <VerifiableJudgeCard step={iteration.verifiableJudgeStep!} />
            </div>
          </div>
        </div>
      )}

      {/* Flow Arrow to Judge Feedback (only shown if attack failed and feedback exists) */}
      {hasJudgeFeedback && (
        <div className="flex justify-center mb-4">
          <div className="flex flex-col items-center">
            <div className="w-px h-4 bg-gradient-to-b from-purple-500/30 to-orange-500/30" />
            <ArrowDown className="h-4 w-4 text-muted-foreground/50" />
          </div>
        </div>
      )}

      {/* Judge Feedback - CENTER/FULL WIDTH (only if attack failed) */}
      {hasJudgeFeedback && (
        <div
          className="flex justify-center mb-4 animate-in fade-in zoom-in-95 duration-300"
          style={{ animationDelay: `${iteration.attackerSteps.length * 100 + 500}ms` }}
        >
          <div className="w-full max-w-2xl px-8">
            <div className="flex items-start gap-4">
              <div className="w-[calc(50%-1.5rem)]" />
              <div className="flex flex-col items-center shrink-0 w-6 pt-3">
                <div className="w-5 h-5 rounded-full bg-orange-500 border-2 border-background shadow-lg ring-4 ring-orange-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>
              <div className="w-[calc(50%-1.5rem)]" />
            </div>
            <div className="mt-3 -mx-4">
              <JudgeStepCard step={iteration.judgeFeedbackStep!} />
            </div>
          </div>
        </div>
      )}

      {/* Legacy Judge Evaluation (for backwards compatibility) */}
      {hasLegacyJudge && !hasVerifiableJudge && (
        <div
          className="flex justify-center mb-4 animate-in fade-in zoom-in-95 duration-300"
          style={{ animationDelay: `${iteration.attackerSteps.length * 100 + 400}ms` }}
        >
          <div className="w-full max-w-2xl px-8">
            <div className="flex items-start gap-4">
              <div className="w-[calc(50%-1.5rem)]" />
              <div className="flex flex-col items-center shrink-0 w-6 pt-3">
                <div className="w-5 h-5 rounded-full bg-amber-500 border-2 border-background shadow-lg ring-4 ring-amber-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>
              <div className="w-[calc(50%-1.5rem)]" />
            </div>
            <div className="mt-3 -mx-4">
              <JudgeStepCard step={iteration.judgeStep!} />
            </div>
          </div>
        </div>
      )}

      {/* Iteration Separator */}
      {!isLast && (
        <div className="flex justify-center mt-8 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-border" />
            <div className="w-2 h-2 rounded-full bg-border" />
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-border" />
          </div>
        </div>
      )}
    </div>
  )
}

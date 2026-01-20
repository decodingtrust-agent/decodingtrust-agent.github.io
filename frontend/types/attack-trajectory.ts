/**
 * TypeScript interfaces for Red-Teaming Attack Trajectory JSON data
 * Based on the output format from DecodingTrust-Agent red_teaming_agent
 */

// ============================================================================
// Task and Configuration Types
// ============================================================================

export interface TaskInfo {
  task_id: string
  domain: string
  risk_category: string
  threat_model: "indirect" | "direct"
  original_task: string
  malicious_goal: string
}

export interface AttackConfigFromJSON {
  agent_model: string
  victim_model: string
  victim_arch: string
  judge_model: string
  max_attack_iterations: number
}

export interface AttackResultSummary {
  success: boolean
  duration: number
  timestamp: string
  successful_attack_sequence: string[]
}

// ============================================================================
// Victim Trajectory Types (nested inside victim steps)
// ============================================================================

export interface VictimTrajectoryStep {
  step_id: number
  role: "agent" | "tool" | "user"
  action?: string
  state?: unknown // Can be string, array, or object depending on context
  metadata?: {
    tool_name?: string
    tool_params?: Record<string, unknown>
    server?: string
    message?: string
  }
}

// ============================================================================
// Main Attack Trajectory Step Types
// ============================================================================

// Base interface for all trajectory steps
interface BaseTrajectoryStep {
  step_id: number
}

// Attacker step
export interface AttackerStep extends BaseTrajectoryStep {
  role: "attacker"
  reasoning: string
  action: "load_skill" | "inject_env" | "inject_tool" | "inject_prompt" | "execute_skill" | "query_victim"
  metadata: {
    // For load_skill action
    skill_loaded?: boolean
    skill_name?: string
    skill_content?: string
    // For inject_env action
    success?: boolean
    tool_name?: string
    tool_params?: {
      from_email?: string
      to_email?: string
      subject?: string
      body?: string
      cc?: string | null
    }
    result?: string
    // For inject_tool action
    server_name?: string
    content?: string
    injection_type?: "suffix" | "prefix" | "replace"
  }
}

// Victim step
export interface VictimStep extends BaseTrajectoryStep {
  role: "victim"
  state: string // Final response from victim
  metadata: {
    query: string
    victim_trajectory: VictimTrajectoryStep[]
  }
}

// Verifiable Judge step (programmatic verification of task and attack success)
export interface VerifiableJudgeStep extends BaseTrajectoryStep {
  role: "verifiable_judge"
  state: {
    original_task_success: boolean
    attack_success: boolean
  }
  metadata: {
    task_evaluation: {
      success: boolean
      message: string
      details?: Record<string, unknown>
    }
    attack_evaluation: {
      success: boolean
      message: string
      pii_found?: string[]
      details?: Record<string, unknown>
    }
  }
}

// Judge Feedback step (LLM-based reasoning, only called if attack fails)
export interface JudgeFeedbackStep extends BaseTrajectoryStep {
  role: "judge_feedback"
  state: boolean // overall assessment
  metadata: {
    reasoning: string
  }
}

// Legacy Judge step (for backwards compatibility)
export interface JudgeStep extends BaseTrajectoryStep {
  role: "judge"
  state: boolean // true = attack succeeded, false = attack failed
  metadata: {
    reasoning: string
  }
}

// Union type for all trajectory steps
export type TrajectoryStep = AttackerStep | VictimStep | VerifiableJudgeStep | JudgeFeedbackStep | JudgeStep

// Type guards
export function isAttackerStep(step: TrajectoryStep): step is AttackerStep {
  return step.role === "attacker"
}

export function isVictimStep(step: TrajectoryStep): step is VictimStep {
  return step.role === "victim"
}

export function isVerifiableJudgeStep(step: TrajectoryStep): step is VerifiableJudgeStep {
  return step.role === "verifiable_judge"
}

export function isJudgeFeedbackStep(step: TrajectoryStep): step is JudgeFeedbackStep {
  return step.role === "judge_feedback"
}

export function isJudgeStep(step: TrajectoryStep): step is JudgeStep {
  return step.role === "judge"
}

// Check if step is any judge type
export function isAnyJudgeStep(step: TrajectoryStep): step is VerifiableJudgeStep | JudgeFeedbackStep | JudgeStep {
  return step.role === "verifiable_judge" || step.role === "judge_feedback" || step.role === "judge"
}

// ============================================================================
// Main JSON Structure
// ============================================================================

export interface RedTeamingResult {
  task_info: TaskInfo
  attack_config: AttackConfigFromJSON
  attack_result: AttackResultSummary
  attack_trajectory: TrajectoryStep[]
}

// ============================================================================
// UI-Specific Types for Timeline Visualization
// ============================================================================

/**
 * Represents a single "iteration" or "round" of the attack
 * Groups together: attacker actions → victim response → verifiable judge → judge feedback
 */
export interface AttackIteration {
  iterationNumber: number
  attackerSteps: AttackerStep[]
  victimStep?: VictimStep
  verifiableJudgeStep?: VerifiableJudgeStep
  judgeFeedbackStep?: JudgeFeedbackStep
  // Legacy support for old format
  judgeStep?: JudgeStep
}

/**
 * Parse the flat trajectory array into grouped iterations for UI display
 */
export function parseTrajectoryToIterations(trajectory: TrajectoryStep[]): AttackIteration[] {
  const iterations: AttackIteration[] = []
  let currentIteration: AttackIteration | null = null
  let iterationCount = 0

  for (const step of trajectory) {
    if (isAttackerStep(step)) {
      // If we don't have a current iteration, or we're starting fresh after judge feedback or verifiable judge with attack success
      const iterationComplete = currentIteration && (
        currentIteration.judgeFeedbackStep ||
        currentIteration.judgeStep ||
        (currentIteration.verifiableJudgeStep && currentIteration.verifiableJudgeStep.state.attack_success)
      )
      if (!currentIteration || iterationComplete) {
        iterationCount++
        currentIteration = {
          iterationNumber: iterationCount,
          attackerSteps: [],
        }
        iterations.push(currentIteration)
      }
      currentIteration.attackerSteps.push(step)
    } else if (isVictimStep(step)) {
      if (currentIteration) {
        currentIteration.victimStep = step
      }
    } else if (isVerifiableJudgeStep(step)) {
      if (currentIteration) {
        currentIteration.verifiableJudgeStep = step
      }
    } else if (isJudgeFeedbackStep(step)) {
      if (currentIteration) {
        currentIteration.judgeFeedbackStep = step
      }
    } else if (isJudgeStep(step)) {
      // Legacy support
      if (currentIteration) {
        currentIteration.judgeStep = step
      }
    }
  }

  return iterations
}

/**
 * Get action display info (color, icon name, label)
 */
export function getActionDisplayInfo(action: string): {
  color: string
  bgColor: string
  borderColor: string
  label: string
} {
  const actionMap: Record<string, { color: string; bgColor: string; borderColor: string; label: string }> = {
    load_skill: {
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
      label: "Load Skill",
    },
    execute_skill: {
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
      borderColor: "border-violet-500/30",
      label: "Execute Skill",
    },
    inject_env: {
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/30",
      label: "Environment Injection",
    },
    inject_tool: {
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
      label: "Tool Injection",
    },
    inject_prompt: {
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      label: "Prompt Injection",
    },
    query_victim: {
      color: "text-yellow-600",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
      label: "Query Victim",
    },
  }

  return (
    actionMap[action] || {
      color: "text-gray-500",
      bgColor: "bg-gray-500/10",
      borderColor: "border-gray-500/30",
      label: action.replace(/_/g, " "),
    }
  )
}

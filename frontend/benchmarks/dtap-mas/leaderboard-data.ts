export const RESULT_DENOMINATOR = 20

export const MAS_RESULT_DOMAINS = [
  {
    key: "personal",
    label: "Personal",
    categories: [
      "PII Disclosure", "Credential Compromise", "Financial Loss", "Reputational Damage",
      "Harassment", "Delegated Privilege Escalation", "Unauthorized Commitment", "Data Destruction",
    ],
  },
  {
    key: "coding",
    label: "Coding",
    categories: [
      "Confidential Data Leak", "Credential Compromise", "Access Privilege Escalation", "Persistent Unauthorized Access",
      "Security Control Weakening", "Malicious Code Execution", "Software Supply-Chain Compromise", "Destructive Action",
    ],
  },
] as const

export type MasResultDomain = (typeof MAS_RESULT_DOMAINS)[number]["key"]

export interface MasResult {
  id: string
  framework: string
  model: string
  a2a?: boolean
  personal: readonly number[]
  coding: readonly number[]
}

// Numerators transcribed from the supplied result tables; every displayed cell uses denominator 20.
export const MAS_RESULTS: readonly MasResult[] = [
  { id: "openclaw-sol", framework: "OpenClaw", model: "GPT-6.1-Sol",
    personal: [11, 7, 4, 14, 12, 16, 16, 4], coding: [7, 12, 13, 11, 4, 5, 5, 7] },
  { id: "openclaw-sol-a2a", framework: "OpenClaw", model: "GPT-6.1-Sol", a2a: true,
    personal: [7, 5, 4, 10, 6, 5, 10, 5], coding: [4, 8, 10, 11, 2, 4, 5, 6] },
  { id: "openclaw-opus", framework: "OpenClaw", model: "Opus-5.5",
    personal: [8, 5, 3, 14, 12, 16, 16, 3], coding: [4, 2, 5, 14, 3, 7, 3, 8] },
  { id: "hermes-sol", framework: "Hermes", model: "GPT-6.1-Sol",
    personal: [11, 8, 5, 16, 14, 13, 16, 5], coding: [7, 12, 13, 11, 3, 5, 5, 7] },
  { id: "hermes-sol-a2a", framework: "Hermes", model: "GPT-6.1-Sol", a2a: true,
    personal: [11, 7, 4, 14, 12, 16, 16, 4], coding: [5, 10, 11, 8, 3, 4, 3, 6] },
  { id: "hermes-opus", framework: "Hermes", model: "Opus-5.5",
    personal: [8, 5, 3, 14, 12, 16, 16, 3], coding: [4, 2, 5, 14, 2, 7, 4, 8] },
  { id: "grok-sol", framework: "Grok Bot SDK", model: "GPT-6.1-Sol",
    personal: [13, 11, 7, 12, 13, 10, 13, 6], coding: [7, 13, 12, 12, 5, 5, 5, 7] },
  { id: "grok-opus", framework: "Grok Bot SDK", model: "Opus-5.5",
    personal: [10, 9, 4, 11, 12, 13, 14, 3], coding: [6, 4, 4, 13, 3, 5, 3, 5] },
]

export function resultScores(result: MasResult, domain: MasResultDomain) {
  return result[domain].map((successes) => (successes * 100) / RESULT_DENOMINATOR)
}

export function resultAverage(result: MasResult, domain: MasResultDomain) {
  const scores = resultScores(result, domain)
  return scores.reduce((total, value) => total + value, 0) / scores.length
}

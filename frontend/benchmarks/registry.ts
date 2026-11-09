export const MAS_ROOT = "/benchmarks/dtap-mas"
export const MAS_VERSION = "1.0"
export const MAS_TAGLINE = "Multi-Agent Indirect Prompt Injection Rating"

export const BENCHMARKS = [
  {
    id: "dtap",
    name: "DTap-Bench",
    version: "1.0",
    scope: "Robustness",
    tagline: "First Agent Robustness Benchmark",
    description: "The first agent robustness benchmark, evaluating security and utility across realistic environments.",
    href: "/benchmark",
    leaderboardHref: "/leaderboard",
    links: [
      { label: "Explore tasks", href: "/benchmark" },
      { label: "Leaderboard", href: "/leaderboard" },
      { label: "Documentation", href: "/docs" },
    ],
  },
  {
    id: "dtap-mas",
    name: "DTap-MAS",
    version: MAS_VERSION,
    scope: "Indirect attacks",
    tagline: MAS_TAGLINE,
    description: `${MAS_TAGLINE}. Explore how attacks spread through collaborating agents, each acting for a different person on shared services.`,
    href: MAS_ROOT,
    leaderboardHref: "/leaderboard/dtap-mas",
    links: [
      { label: "Explore tasks", href: MAS_ROOT },
      { label: "Leaderboard", href: "/leaderboard/dtap-mas" },
    ],
  },
] as const

export const UPCOMING_BENCHMARKS = [
  {
    id: "agent-ci-scope",
    name: "AgentCIScope",
    tagline: "Agent Contextual Privacy Evaluation",
    scope: "Contextual privacy",
  },
  {
    id: "gateway-bench",
    name: "GatewayBench",
    tagline: "First Agent Gateway Benchmark Robust Evaluation Benchmark",
    scope: "Agent gateways",
  },
  {
    id: "agent-insider",
    name: "AgentInsider",
    tagline: "First Multi-Principal Insider Robustness Evaluation",
    scope: "Direct attacks",
  },
] as const

export function isBenchmarkPath(pathname: string | null) {
  return Boolean(pathname && (
    pathname === "/benchmarks" || pathname.startsWith("/benchmarks/") ||
    pathname === "/benchmark" || pathname.startsWith("/benchmark/")
  ))
}

import type { Metadata } from "next"
import { LeaderboardSection } from "@/benchmarks/dtap/components/leaderboard"

export const metadata: Metadata = { title: "DTap-Bench Leaderboard | DecodingTrust Agent" }

export default function LeaderboardPage() {
  return <LeaderboardSection />
}

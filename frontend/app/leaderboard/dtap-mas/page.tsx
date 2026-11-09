import type { Metadata } from "next"
import { MasLeaderboard } from "@/benchmarks/dtap-mas/leaderboard"

export const metadata: Metadata = { title: "DTap-MAS Leaderboard | DecodingTrust Agent" }

export default function MasLeaderboardPage() {
  return <MasLeaderboard />
}

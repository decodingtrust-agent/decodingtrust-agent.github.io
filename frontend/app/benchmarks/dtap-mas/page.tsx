import type { Metadata } from "next"
import { Suspense } from "react"
import { MasExplorer } from "@/benchmarks/dtap-mas/explorer"

export const metadata: Metadata = {
  title: "DTap-MAS | DecodingTrust Agent",
  description: "Explore multi-user, multi-principal agent red-teaming tasks, networks and trajectories.",
}

export default function MasPage() {
  return <Suspense fallback={<p className="p-8 text-muted-foreground">Loading DTap-MAS…</p>}><MasExplorer view="tasks" /></Suspense>
}

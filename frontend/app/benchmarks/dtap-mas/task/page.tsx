import type { Metadata } from "next"
import { Suspense } from "react"
import { MasExplorer } from "@/benchmarks/dtap-mas/explorer"

export const metadata: Metadata = { title: "Task Explorer · DTap-MAS | DecodingTrust Agent" }

export default function MasTaskPage() {
  return <Suspense fallback={<p className="p-8 text-muted-foreground">Loading task…</p>}><MasExplorer view="task" /></Suspense>
}

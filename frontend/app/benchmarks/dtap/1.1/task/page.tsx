import type { Metadata } from "next"
import { Suspense } from "react"
import { DtapVersionTask } from "@/benchmarks/dtap/version-task"

export const metadata: Metadata = { title: "DTap-Bench 1.1 | DecodingTrust Agent" }

export default function DtapTaskPage() {
  return <Suspense fallback={<p className="p-8 text-muted-foreground">Loading task…</p>}><DtapVersionTask /></Suspense>
}

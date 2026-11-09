import type { Metadata } from "next"
import { Suspense } from "react"
import { MasExplorer } from "@/benchmarks/dtap-mas/explorer"

export const metadata: Metadata = { title: "Worlds · DTap-MAS | DecodingTrust Agent" }

export default function MasWorldsPage() {
  return <Suspense fallback={<p className="p-8 text-muted-foreground">Loading worlds…</p>}><MasExplorer view="worlds" /></Suspense>
}

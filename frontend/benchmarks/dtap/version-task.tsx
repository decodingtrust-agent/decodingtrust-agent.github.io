"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import TaskDetailPageClient from "./components/task-detail-page-client"

export function DtapVersionTask() {
  const slug = useSearchParams().get("slug") || ""
  if (!slug) return <p className="p-8 text-muted-foreground">Choose a task from <Link href="/benchmark?version=1.1" className="underline">DTap-Bench 1.1</Link>.</p>
  return <TaskDetailPageClient key={slug} slug={slug} version="1.1" />
}

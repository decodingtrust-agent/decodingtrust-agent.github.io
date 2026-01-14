"use client"

import { AlertTriangle, Info, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface CalloutProps {
  type: "info" | "warning" | "success"
  title: string
  children: React.ReactNode
}

export function Callout({ type, title, children }: CalloutProps) {
  const styles = {
    info: {
      container: "border-blue-400 bg-blue-50 dark:bg-blue-950/30",
      icon: "text-blue-500",
      title: "text-blue-700 dark:text-blue-400",
    },
    warning: {
      container: "border-orange-400 bg-orange-50 dark:bg-orange-950/30",
      icon: "text-orange-500",
      title: "text-orange-700 dark:text-orange-400",
    },
    success: {
      container: "border-green-400 bg-green-50 dark:bg-green-950/30",
      icon: "text-green-500",
      title: "text-green-700 dark:text-green-400",
    },
  }

  const icons = {
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle,
  }

  const Icon = icons[type]

  return (
    <div
      className={cn(
        "border-l-4 rounded-r-lg p-4 my-4",
        styles[type].container
      )}
    >
      <div className={cn("flex items-center gap-2 font-semibold mb-1", styles[type].title)}>
        <Icon className={cn("h-4 w-4", styles[type].icon)} />
        {title}
      </div>
      <div className="text-sm text-zinc-600 dark:text-zinc-300 pl-6">
        {children}
      </div>
    </div>
  )
}

"use client"

import { AlertTriangle, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface CalloutProps {
  type: "info" | "warning" | "success"
  title: string
  children: React.ReactNode
}

export function Callout({ type, title, children }: CalloutProps) {
  const styles = {
    info: "border-accent/30 bg-accent/5 text-accent",
    warning: "border-yellow-500/30 bg-yellow-500/5 text-yellow-500",
    success: "border-green-500/30 bg-green-500/5 text-green-500",
  }

  const icons = {
    info: null,
    warning: <AlertTriangle className="h-4 w-4" />,
    success: <CheckCircle className="h-4 w-4" />,
  }

  return (
    <div className={cn("border rounded-lg p-4 my-4", styles[type])}>
      <div className="flex items-center gap-2 font-medium mb-2">
        {icons[type]}
        {title}
      </div>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  )
}

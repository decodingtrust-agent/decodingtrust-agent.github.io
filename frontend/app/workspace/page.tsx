"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Shield, Target, Swords, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { BlueTeamTab } from "@/components/workspace/blue-team-tab"
import { EvaluateAttacksTab } from "@/components/workspace/evaluate-attacks-tab"
import { RedTeamingTab } from "@/components/workspace/red-teaming-tab"

type WorkspaceTab = "blue-team" | "evaluate-attacks" | "red-teaming"

const tabs = [
  {
    id: "blue-team" as const,
    label: "Blue-Team Your Agents",
    icon: Shield,
    description: "Defend and harden your AI agents against attacks",
  },
  {
    id: "evaluate-attacks" as const,
    label: "Evaluate Your Attacks",
    icon: Target,
    description: "Test and measure the effectiveness of your attack strategies",
  },
  {
    id: "red-teaming" as const,
    label: "Red-Teaming Agent",
    icon: Swords,
    description: "Launch automated red-teaming attacks against target agents",
  },
]

export default function WorkspacePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("red-teaming")

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show auth required message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please sign in to access the workspace.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="border-b border-border bg-background/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 lg:px-6 py-6">
          <h1 className="text-2xl font-bold mb-2">Workspace</h1>
          <p className="text-muted-foreground">
            Comprehensive tools for AI agent security testing and evaluation
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border bg-background/30">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-6">
        {activeTab === "blue-team" && <BlueTeamTab />}
        {activeTab === "evaluate-attacks" && <EvaluateAttacksTab />}
        {activeTab === "red-teaming" && <RedTeamingTab />}
      </div>
    </div>
  )
}

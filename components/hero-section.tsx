"use client"

import { ArrowRight, FileText, Play, Shield, AlertTriangle, Scan } from "lucide-react"
import { Button } from "@/components/ui/button"

type TabType = "home" | "quickstart" | "docs" | "leaderboard" | "competition" | "community" | "about"

interface HeroSectionProps {
  onNavigate: (tab: TabType) => void
}

export function HeroSection({ onNavigate }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl px-4 py-16 md:py-24 lg:py-32 relative">
        {/* Announcement banner */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-xs font-medium">v1.0 Released</span>
            <span className="h-3 w-px bg-border" />
            <span className="text-xs text-muted-foreground">Read the announcement</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4 text-balance">
            <span className="block text-foreground">DecodingTrust Agent Suite</span>
            <span className="block text-lg md:text-xl lg:text-2xl font-medium text-muted-foreground mt-2">
              Automated Security Auditing of AI Agents in Real Environments
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-base text-muted-foreground leading-relaxed">
            A comprehensive, policy-based unified platform for agent red teaming with{" "}
            <span className="text-foreground font-medium">30+ sandbox environments</span>,{" "}
            <span className="text-foreground font-medium">15+ domains</span>, and{" "}
            <span className="text-foreground font-medium">500+ tasks</span> per domain.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <Button
            size="lg"
            className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90"
            onClick={() => onNavigate("quickstart")}
          >
            <Play className="mr-2 h-4 w-4" />
            Get Started
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto bg-transparent border-foreground/20 hover:bg-foreground/5"
            onClick={() => onNavigate("docs")}
          >
            <FileText className="mr-2 h-4 w-4" />
            Documentation
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto">
          {[
            { icon: Shield, value: "30+", label: "Sandbox Environments" },
            { icon: AlertTriangle, value: "500+", label: "Attack Scenarios" },
            { icon: Scan, value: "15+", label: "Policy Domains" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center p-3 rounded-lg bg-card border border-border">
              <stat.icon className="h-4 w-4 text-primary mb-1.5" />
              <span className="text-xl md:text-2xl font-bold">{stat.value}</span>
              <span className="text-[10px] text-muted-foreground text-center">{stat.label}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          A research collaboration • Paper available on{" "}
          <a href="#" className="text-primary hover:underline">
            arXiv
          </a>
        </p>
      </div>
    </section>
  )
}

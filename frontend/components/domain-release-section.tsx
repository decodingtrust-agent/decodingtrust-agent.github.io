"use client"

import { useEffect, useState } from "react"
import {
  Landmark,
  Heart,
  ShoppingCart,
  Mail,
  CreditCard,
  Cloud,
  Database,
  FileSpreadsheet,
  MessageSquare,
  Calendar,
  Briefcase,
  Truck,
  GraduationCap,
  Building2,
  Globe,
  Rocket,
  Clock,
  Sparkles,
  CheckCircle2,
  Lock,
  type LucideIcon,
} from "lucide-react"

interface DomainRelease {
  icon: LucideIcon
  name: string
  day: number
  description: string
  status: "released" | "today" | "upcoming"
}

const domainReleases: DomainRelease[] = [
  { icon: Landmark, name: "Finance", day: 1, description: "FINRA compliance & trading scenarios", status: "upcoming" },
  { icon: Heart, name: "Healthcare", day: 2, description: "HIPAA & patient data protection", status: "upcoming" },
  { icon: ShoppingCart, name: "E-commerce", day: 3, description: "PCI-DSS & transaction security", status: "upcoming" },
  { icon: Mail, name: "Email", day: 4, description: "CAN-SPAM & phishing detection", status: "upcoming" },
  { icon: CreditCard, name: "Payments", day: 5, description: "Payment fraud & PCI compliance", status: "upcoming" },
  { icon: Cloud, name: "Cloud Infra", day: 6, description: "SOC2 & infrastructure security", status: "upcoming" },
  { icon: Database, name: "Data Platforms", day: 7, description: "GDPR & data governance", status: "upcoming" },
  { icon: FileSpreadsheet, name: "Productivity", day: 8, description: "Enterprise security policies", status: "upcoming" },
  { icon: Briefcase, name: "HR Systems", day: 9, description: "Employment & PII protection", status: "upcoming" },
  { icon: Rocket, name: "Full Platform & Technical Report", day: 10, description: "Complete benchmark release", status: "upcoming" },
]

// Release schedule: Starting Feb 1, 2026, one domain per day for 10 days
// Day 1 (Feb 1): Finance, Day 2 (Feb 2): Healthcare, ... Day 10 (Feb 10): Full Platform & Technical Report
const RELEASE_START_DATE = new Date("2026-02-01T00:00:00Z")

function getTimeUntilRelease() {
  const now = new Date()
  const fullReleaseDate = new Date(RELEASE_START_DATE)
  fullReleaseDate.setDate(fullReleaseDate.getDate() + 10)

  const diff = fullReleaseDate.getTime() - now.getTime()

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds }
}

function getCurrentDay() {
  const now = new Date()
  const diff = now.getTime() - RELEASE_START_DATE.getTime()
  const daysPassed = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1
  return Math.max(0, Math.min(daysPassed, 10))
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-card border border-border flex items-center justify-center text-2xl md:text-3xl font-bold tabular-nums countdown-flip">
          {value.toString().padStart(2, "0")}
        </div>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      </div>
      <span className="text-[10px] md:text-xs text-muted-foreground mt-2 uppercase tracking-wider">{label}</span>
    </div>
  )
}

export function DomainReleaseSection() {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilRelease())
  const [currentDay, setCurrentDay] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCurrentDay(getCurrentDay())

    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilRelease())
      setCurrentDay(getCurrentDay())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Determine status based on current day
  const getStatus = (day: number): "released" | "today" | "upcoming" => {
    if (day < currentDay) return "released"
    if (day === currentDay) return "today"
    return "upcoming"
  }

  if (!mounted) {
    return null // Prevent hydration mismatch
  }

  return (
    <section className="border-t border-border/50 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-20 md:py-28 relative">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 mb-6">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">DecodingTrust-Agent Suite Release</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="gradient-text">10 Days Release Count Down</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We&apos;re unveiling the DecodingTrust Agent Suite one domain at a time.
            Follow along as we release comprehensive security benchmarks for each policy domain.
          </p>
        </div>

        {/* Countdown timer */}
        <div className="flex flex-col items-center mb-16">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Full Platform Release In</span>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <CountdownUnit value={timeLeft.days} label="Days" />
            <span className="text-2xl md:text-3xl font-bold text-muted-foreground/50 mt-[-20px]">:</span>
            <CountdownUnit value={timeLeft.hours} label="Hours" />
            <span className="text-2xl md:text-3xl font-bold text-muted-foreground/50 mt-[-20px]">:</span>
            <CountdownUnit value={timeLeft.minutes} label="Minutes" />
            <span className="text-2xl md:text-3xl font-bold text-muted-foreground/50 mt-[-20px]">:</span>
            <CountdownUnit value={timeLeft.seconds} label="Seconds" />
          </div>
        </div>

        {/* Release timeline */}
        <div className="relative">
          {/* Progress line - only show when releases have started */}
          {currentDay > 0 && (
            <>
              <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-border -translate-y-1/2 hidden md:block" />
              <div
                className="absolute left-0 top-1/2 h-0.5 bg-gradient-to-r from-primary to-accent -translate-y-1/2 hidden md:block transition-all duration-1000"
                style={{ width: `${Math.max(0, (currentDay - 1) / 9 * 100)}%` }}
              />
            </>
          )}

          {/* Domain cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3 md:gap-2">
            {domainReleases.map((domain, index) => {
              const status = getStatus(domain.day)

              return (
                <div
                  key={domain.name}
                  className={`
                    relative flex flex-col items-center p-3 md:p-4 rounded-xl border transition-all duration-300
                    ${status === "released"
                      ? "border-success/30 bg-success/5 hover:border-success/50"
                      : status === "today"
                      ? "border-primary bg-primary/10 hover:bg-primary/15 ring-2 ring-primary/20 ring-offset-2 ring-offset-background release-pulse"
                      : "border-border/50 bg-card/30 hover:border-border hover:bg-card/50"
                    }
                  `}
                >
                  {/* Day badge */}
                  <div className={`
                    absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold
                    ${status === "released"
                      ? "bg-success text-success-foreground"
                      : status === "today"
                      ? "bg-primary text-primary-foreground animate-pulse"
                      : "bg-secondary text-muted-foreground"
                    }
                  `}>
                    Feb {domain.day}
                  </div>

                  {/* Icon */}
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center mb-2 mt-2 transition-colors
                    ${status === "released"
                      ? "bg-success/20"
                      : status === "today"
                      ? "bg-primary/20"
                      : "bg-secondary"
                    }
                  `}>
                    {status === "released" ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : status === "today" ? (
                      <domain.icon className="h-5 w-5 text-primary animate-bounce" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </div>

                  {/* Domain name */}
                  <h3 className={`
                    text-xs font-medium text-center leading-tight
                    ${status === "upcoming" ? "text-muted-foreground" : "text-foreground"}
                  `}>
                    {domain.name}
                  </h3>

                  {/* Status indicator */}
                  <span className={`
                    mt-1 text-[9px] font-medium
                    ${status === "released"
                      ? "text-success"
                      : status === "today"
                      ? "text-primary"
                      : "text-muted-foreground/50"
                    }
                  `}>
                    {status === "released" ? "Released" : status === "today" ? "Live Now!" : "Coming Soon"}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-2xl border border-border/50 bg-card/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Stay Updated</p>
                <p className="text-sm text-muted-foreground">Get notified when new domains are released</p>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href="https://github.com/decodingtrust-agent"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
              >
                Watch on GitHub
              </a>
              <a
                href="https://discord.gg/decodingtrust"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-secondary transition-colors"
              >
                Join Discord
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

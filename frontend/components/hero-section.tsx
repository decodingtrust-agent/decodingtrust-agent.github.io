"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, FileText, Play, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { loadBenchmarkDataset, type BenchmarkDataset } from "@/lib/benchmark"

type WallShot = {
  name: string
  domain: string
  src: string
}

const wallShots: WallShot[] = [
  { name: "PayPal", domain: "Workflow", src: "/env-showcase/paypal-1.png" },
  { name: "Trade Desk", domain: "Finance", src: "/env-showcase/ui_trade.png" },
  { name: "E-commerce Home", domain: "Browser", src: "/env-showcase/ecommerce-home.png" },
  { name: "CRM Leads", domain: "CRM", src: "/env-showcase/leads_page.png" },
  { name: "Windows Desktop", domain: "Desktop OS", src: "/env-showcase/windows-screenshot.png" },
  { name: "Case Details", domain: "Customer Service", src: "/env-showcase/ui_case_details.png" },
  { name: "Slack", domain: "Workflow", src: "/env-showcase/slack-1.png" },
  { name: "Calendar", domain: "Workflow", src: "/env-showcase/calendar-2.png" },
  { name: "Google Sheets", domain: "Workflow", src: "/env-showcase/googlesheets-2.png" },
  { name: "Zoom", domain: "Workflow", src: "/env-showcase/zoom-2.png" },
  { name: "Google Drive", domain: "Workflow", src: "/env-showcase/googledrive-1.png" },
  { name: "Atlassian Jira", domain: "Workflow", src: "/env-showcase/atlassian-4.png" },
  { name: "Google Form", domain: "Workflow", src: "/env-showcase/googleform-1.png" },
  { name: "Gmail", domain: "Workflow", src: "/env-showcase/gmail-1.png" },
  { name: "Portfolio", domain: "Finance", src: "/env-showcase/ui_portfolio.png" },
  { name: "Markets", domain: "Finance", src: "/env-showcase/ui_markets.png" },
  { name: "News Feed", domain: "Finance", src: "/env-showcase/ui_news.png" },
  { name: "Create Lead", domain: "CRM", src: "/env-showcase/create_page.png" },
  { name: "ServiceNow", domain: "Customer Service", src: "/env-showcase/servicenow-store-credit-ff-attack.png" },
  { name: "Case Queue", domain: "Customer Service", src: "/env-showcase/ui_case_list.png" },
  { name: "Cases Dashboard", domain: "Customer Service", src: "/env-showcase/ui_cases.png" },
  { name: "Review Page", domain: "Browser", src: "/env-showcase/ecommerce-review.png" },
  { name: "Account Center", domain: "Browser", src: "/env-showcase/ecommerce-account.png" },
  { name: "macOS Desktop", domain: "Desktop OS", src: "/env-showcase/macos_screenshot.png" },
  { name: "VM Desktop", domain: "Desktop OS", src: "/env-showcase/vm_desktop.png" },
  { name: "Arxiv", domain: "Research", src: "/env-showcase/arxiv_DT.png" },
]

const WALL_ROW_COUNT = 4
const wallRows = Array.from({ length: WALL_ROW_COUNT }, (_, rowIndex) =>
  wallShots.filter((_, shotIndex) => shotIndex % WALL_ROW_COUNT === rowIndex),
)

export function HeroSection() {
  const [dataset, setDataset] = useState<BenchmarkDataset | null>(null)

  useEffect(() => {
    loadBenchmarkDataset()
      .then((data) => setDataset(data))
      .catch(() => setDataset(null))
  }, [])

  const benchmarkCounts = useMemo(() => {
    if (!dataset) {
      return {
        domains: "13",
        frameworks: "4",
        models: "7",
      }
    }

    return {
      domains: String(dataset.domains.length),
      frameworks: String(dataset.frameworks.length),
      models: String(dataset.models.length),
    }
  }, [dataset])

  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Layer 1: soft aurora ambience */}
      <div className="absolute inset-0 aurora-bg" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[oklch(0.3_0.1_220/0.12)] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[oklch(0.25_0.08_230/0.08)] rounded-full blur-[100px]" />
      </div>

      {/* Layer 2: flowing screenshot wall (ambient / pointer-events-none) */}
      <div className="hero-wall-mask pointer-events-none absolute inset-0 opacity-55">
        <div className="relative flex h-full flex-col justify-start gap-3 pt-5 md:pt-8">
          {wallRows.map((row, rowIndex) => (
            <div key={rowIndex} className="env-wall-row">
              <div
                className={`env-wall-track ${rowIndex % 2 === 1 ? "env-wall-track-reverse" : ""}`}
                style={{ animationDuration: `${60 + rowIndex * 8}s` }}
              >
                {[...row, ...row, ...row].map((shot, shotIndex) => (
                  <div
                    key={`${shot.name}-${shotIndex}`}
                    className="env-wall-tile red-glow-tile relative block overflow-hidden rounded-xl bg-card/90 ring-1 ring-red-500/25"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={shot.src}
                        alt=""
                        fill
                        sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 28vw, (min-width: 640px) 40vw, 60vw"
                        className="env-showcase-image object-cover object-top"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Layer 3: red-team ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-1/2 h-2/3 w-2/5 -translate-y-1/2 bg-[radial-gradient(ellipse_at_left_center,rgba(239,68,68,0.14),transparent_65%)] blur-3xl" />
        <div className="absolute right-0 top-1/2 h-2/3 w-2/5 -translate-y-1/2 bg-[radial-gradient(ellipse_at_right_center,rgba(220,38,38,0.12),transparent_65%)] blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(239,68,68,0.08),transparent_70%)]" />
      </div>

      {/* Layer 4: top fade under the header so the wall melts into the nav area */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background to-transparent" />
      {/* Layer 5: bottom fade into the next section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-background" />

      <div className="mx-auto max-w-5xl px-4 py-20 md:py-28 lg:py-36 relative z-10 -translate-y-16 md:-translate-y-24">
        {/* Announcement banner */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-sm px-5 py-2 shadow-lg shadow-primary/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-sm font-medium text-primary">v1.0 Released</span>
            <span className="h-4 w-px bg-primary/30" />
            <span className="text-sm text-muted-foreground">Read the announcement</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary" />
          </div>
        </div>

        <div className="text-center mb-10">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/dt-agent-logo.png"
              alt="DT-Agent Logo"
              width={160}
              height={160}
              className="drop-shadow-2xl"
              priority
            />
          </div>

          {/* Title matching logo colors: white "Decoding" + blue "Trust" + blue "Agent Platform" */}
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-8">
            <span className="text-foreground">Decoding</span>
            <span className="text-[oklch(0.7_0.14_220)]">Trust </span>
            <span className="text-[oklch(0.7_0.14_220)]">Agent Platform</span>
          </h1>

          <p className="text-xl md:text-2xl lg:text-3xl font-medium text-muted-foreground mb-4 leading-relaxed">
            A Real-World Simulation Platform for<br className="hidden md:block" />
            Advanced Red-Teaming of AI Agents
          </p>

          <p className="mx-auto text-base md:text-lg text-muted-foreground/80 leading-relaxed mt-6 md:whitespace-nowrap">
            The first dynamic red-teaming framework against AI Agents across{" "}
            <span className="text-foreground font-medium">{benchmarkCounts.domains} domains</span> and{" "}
            <span className="text-foreground font-medium">30 sandboxed environments</span>.
          </p>
          <p className="mx-auto text-base md:text-lg text-muted-foreground/80 leading-relaxed mt-3 md:whitespace-nowrap">
            Covering Diverse{" "}
            <span className="text-[oklch(0.7_0.14_220)] font-semibold">Indirect Injections</span>{" "}
            in Environments, Tools, Skills, and{" "}
            <span className="text-[oklch(0.7_0.14_220)] font-semibold">Direct Prompt Injections</span>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <Button
            size="lg"
            className="w-full sm:w-auto h-12 px-8 text-base bg-[oklch(0.7_0.14_220)] text-white hover:bg-[oklch(0.65_0.14_220)] shadow-lg shadow-[oklch(0.5_0.14_220/0.3)]"
            asChild
          >
            <Link href="/quickstart">
              <Play className="mr-2 h-5 w-5" />
              Get Started
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto h-12 px-8 text-base bg-transparent border-[oklch(0.7_0.14_220/0.3)] hover:bg-[oklch(0.7_0.14_220/0.1)] hover:border-[oklch(0.7_0.14_220/0.5)]"
            asChild
          >
            <Link href="/docs">
              <FileText className="mr-2 h-5 w-5" />
              Documentation
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto h-12 px-8 text-base bg-transparent border-[oklch(0.7_0.14_220/0.3)] hover:bg-[oklch(0.7_0.14_220/0.1)] hover:border-[oklch(0.7_0.14_220/0.5)]"
            asChild
          >
            <Link href="/registry">
              <Database className="mr-2 h-5 w-5" />
              Data Registry
            </Link>
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          A research collaboration • Paper available on{" "}
          <a href="#" className="text-[oklch(0.7_0.14_220)] hover:underline font-medium">
            arXiv
          </a>
        </p>
      </div>
    </section>
  )
}

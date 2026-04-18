"use client"

import type { CSSProperties } from "react"
import { useEffect, useState } from "react"
import Image from "next/image"
import {
  Building2,
  Heart,
  ShoppingCart,
  Database,
  Mail,
  CreditCard,
  Cloud,
  FileSpreadsheet,
  MessageSquare,
  Calendar,
  Briefcase,
  Truck,
  GraduationCap,
  Landmark,
  Globe,
  Sparkles,
} from "lucide-react"

const domains = [
  { icon: Landmark, name: "Finance", policy: "FINRA", envs: 4 },
  { icon: Heart, name: "Healthcare", policy: "HIPAA", envs: 3 },
  { icon: ShoppingCart, name: "E-commerce", policy: "PCI-DSS", envs: 3 },
  { icon: Mail, name: "Email", policy: "CAN-SPAM", envs: 2 },
  { icon: CreditCard, name: "Payments", policy: "PCI", envs: 3 },
  { icon: Cloud, name: "Cloud Infra", policy: "SOC2", envs: 4 },
  { icon: Database, name: "Data Platforms", policy: "GDPR", envs: 3 },
  { icon: FileSpreadsheet, name: "Productivity", policy: "Enterprise", envs: 2 },
  { icon: MessageSquare, name: "Communication", policy: "Internal", envs: 2 },
  { icon: Calendar, name: "Scheduling", policy: "Privacy", envs: 1 },
  { icon: Briefcase, name: "HR Systems", policy: "Employment", envs: 2 },
  { icon: Truck, name: "Logistics", policy: "Supply Chain", envs: 2 },
  { icon: GraduationCap, name: "Education", policy: "FERPA", envs: 2 },
  { icon: Building2, name: "Enterprise", policy: "Salesforce", envs: 3 },
  { icon: Globe, name: "Web Services", policy: "ToS", envs: 2 },
]

type ShowcaseShot = {
  name: string
  src: string
}

type DomainShowcase = {
  domain: string
  policy: string
  summary: string
  glowClass: string
  cardClass?: string
  shots: ShowcaseShot[]
}

type FlowingFeatureShot = ShowcaseShot & {
  domain: string
  accentClass: string
}

type PreviewShot = ShowcaseShot & {
  domain: string
}

const flowingFeatureShowcases: FlowingFeatureShot[] = [
  {
    name: "PayPal",
    domain: "Workflow",
    src: "/env-showcase/paypal-1.png",
    accentClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.72_0.15_235/0.2),transparent_58%),radial-gradient(circle_at_bottom_right,oklch(0.66_0.15_280/0.14),transparent_52%)]",
  },
  {
    name: "Trade Desk",
    domain: "Finance",
    src: "/env-showcase/ui_trade.png",
    accentClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.74_0.14_220/0.22),transparent_56%),radial-gradient(circle_at_bottom_right,oklch(0.7_0.12_190/0.12),transparent_50%)]",
  },
  {
    name: "E-commerce Home",
    domain: "Browser",
    src: "/env-showcase/ecommerce-home.png",
    accentClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.76_0.16_65/0.18),transparent_56%),radial-gradient(circle_at_bottom_right,oklch(0.72_0.13_25/0.12),transparent_52%)]",
  },
  {
    name: "CRM Leads",
    domain: "CRM",
    src: "/env-showcase/leads_page.png",
    accentClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.72_0.13_235/0.18),transparent_56%),radial-gradient(circle_at_bottom_right,oklch(0.68_0.12_270/0.12),transparent_52%)]",
  },
  {
    name: "Windows Desktop",
    domain: "Desktop OS",
    src: "/env-showcase/windows-screenshot.png",
    accentClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.72_0.14_255/0.18),transparent_56%),radial-gradient(circle_at_bottom_right,oklch(0.68_0.12_215/0.12),transparent_52%)]",
  },
  {
    name: "Case Details",
    domain: "Customer Service",
    src: "/env-showcase/ui_case_details.png",
    accentClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.74_0.12_165/0.18),transparent_56%),radial-gradient(circle_at_bottom_right,oklch(0.69_0.12_205/0.12),transparent_52%)]",
  },
  {
    name: "Slack",
    domain: "Workflow",
    src: "/env-showcase/slack-1.png",
    accentClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.72_0.17_300/0.18),transparent_56%),radial-gradient(circle_at_bottom_right,oklch(0.72_0.16_185/0.12),transparent_50%)]",
  },
  {
    name: "Calendar",
    domain: "Workflow",
    src: "/env-showcase/calendar-2.png",
    accentClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.75_0.15_240/0.18),transparent_56%),radial-gradient(circle_at_bottom_right,oklch(0.7_0.14_200/0.12),transparent_50%)]",
  },
  {
    name: "Google Sheets",
    domain: "Workflow",
    src: "/env-showcase/googlesheets-2.png",
    accentClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.72_0.15_150/0.18),transparent_56%),radial-gradient(circle_at_bottom_right,oklch(0.7_0.12_190/0.12),transparent_50%)]",
  },
  {
    name: "Zoom",
    domain: "Workflow",
    src: "/env-showcase/zoom-2.png",
    accentClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.74_0.15_230/0.18),transparent_56%),radial-gradient(circle_at_bottom_right,oklch(0.7_0.13_210/0.12),transparent_50%)]",
  },
  {
    name: "Google Drive",
    domain: "Workflow",
    src: "/env-showcase/googledrive-1.png",
    accentClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.72_0.15_150/0.18),transparent_56%),radial-gradient(circle_at_bottom_right,oklch(0.76_0.14_75/0.12),transparent_50%)]",
  },
  {
    name: "Atlassian Jira",
    domain: "Workflow",
    src: "/env-showcase/atlassian-4.png",
    accentClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.74_0.14_235/0.18),transparent_56%),radial-gradient(circle_at_bottom_right,oklch(0.68_0.12_260/0.12),transparent_50%)]",
  },
  {
    name: "Google Form",
    domain: "Workflow",
    src: "/env-showcase/googleform-1.png",
    accentClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.76_0.15_35/0.18),transparent_56%),radial-gradient(circle_at_bottom_right,oklch(0.72_0.12_15/0.12),transparent_50%)]",
  },
  {
    name: "Gmail",
    domain: "Workflow",
    src: "/env-showcase/gmail-1.png",
    accentClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.76_0.13_20/0.16),transparent_56%),radial-gradient(circle_at_bottom_right,oklch(0.72_0.14_220/0.12),transparent_50%)]",
  },
  {
    name: "Portfolio",
    domain: "Finance",
    src: "/env-showcase/ui_portfolio.png",
    accentClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.73_0.14_235/0.18),transparent_56%),radial-gradient(circle_at_bottom_right,oklch(0.69_0.13_175/0.12),transparent_50%)]",
  },
  {
    name: "Markets",
    domain: "Finance",
    src: "/env-showcase/ui_markets.png",
    accentClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.74_0.15_220/0.18),transparent_56%),radial-gradient(circle_at_bottom_right,oklch(0.68_0.13_185/0.12),transparent_50%)]",
  },
  {
    name: "Create Lead",
    domain: "CRM",
    src: "/env-showcase/create_page.png",
    accentClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.72_0.13_225/0.18),transparent_56%),radial-gradient(circle_at_bottom_right,oklch(0.68_0.12_270/0.12),transparent_50%)]",
  },
  {
    name: "ServiceNow",
    domain: "Customer Service",
    src: "/env-showcase/servicenow-store-credit-ff-attack.png",
    accentClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.73_0.12_170/0.18),transparent_56%),radial-gradient(circle_at_bottom_right,oklch(0.69_0.12_210/0.12),transparent_50%)]",
  },
  {
    name: "Review Page",
    domain: "Browser",
    src: "/env-showcase/ecommerce-review.png",
    accentClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.76_0.16_60/0.18),transparent_56%),radial-gradient(circle_at_bottom_right,oklch(0.72_0.14_30/0.12),transparent_50%)]",
  },
  {
    name: "Account Center",
    domain: "Browser",
    src: "/env-showcase/ecommerce-account.png",
    accentClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.75_0.16_55/0.18),transparent_56%),radial-gradient(circle_at_bottom_right,oklch(0.7_0.13_28/0.12),transparent_50%)]",
  },
  {
    name: "macOS Desktop",
    domain: "Desktop OS",
    src: "/env-showcase/macos_screenshot.png",
    accentClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.72_0.14_260/0.18),transparent_56%),radial-gradient(circle_at_bottom_right,oklch(0.68_0.12_205/0.12),transparent_50%)]",
  },
  {
    name: "Arxiv",
    domain: "Research",
    src: "/env-showcase/arxiv_DT.png",
    accentClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.73_0.14_190/0.18),transparent_56%),radial-gradient(circle_at_bottom_right,oklch(0.69_0.12_145/0.12),transparent_50%)]",
  },
] as const

const flowingFeatureColumns = [0, 1, 2].map((columnIndex) =>
  flowingFeatureShowcases.filter((_, index) => index % 3 === columnIndex),
)

const featuredSandboxEnvironments = [
  "Gmail",
  "Google Calendar",
  "PayPal",
  "Zoom",
  "Slack",
  "Databricks",
  "Snowflake",
  "Salesforce",
  "Google Form",
  "Ebay",
  "TravelSuite",
  "ServiceNow",
  "Atlassian Jira",
  "Recommendation System",
  "OrangeHRM",
  "Arxiv",
  "Windows OS",
  "Mac OS",
  "Microsoft 365",
  "Filesystem",
  "Terminal",
  "Hospital EHR",
  "SMS Messager",
] as const

const domainShowcases: DomainShowcase[] = [
  {
    domain: "Workflow",
    policy: "Environment interfaces only",
    summary:
      "Operational sandboxes spanning payments, communication, scheduling, forms, spreadsheets, and file workflows.",
    glowClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.76_0.16_220/0.16),transparent_44%),radial-gradient(circle_at_bottom_right,oklch(0.66_0.16_280/0.12),transparent_46%)]",
    cardClass: "lg:col-span-2",
    shots: [
      { name: "PayPal", src: "/env-showcase/paypal-1.png" },
      { name: "Slack", src: "/env-showcase/slack-1.png" },
      { name: "Calendar", src: "/env-showcase/calendar-2.png" },
      { name: "Google Sheets", src: "/env-showcase/googlesheets-2.png" },
    ],
  },
  {
    domain: "Finance",
    policy: "FINRA-aligned trading surfaces",
    summary: "Trading, portfolio, market data, and finance news views drawn from the benchmark finance environment.",
    glowClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.74_0.15_235/0.16),transparent_46%),radial-gradient(circle_at_bottom_right,oklch(0.7_0.14_190/0.1),transparent_42%)]",
    shots: [
      { name: "Trade Desk", src: "/env-showcase/ui_trade.png" },
      { name: "Portfolio", src: "/env-showcase/ui_portfolio.png" },
      { name: "Markets", src: "/env-showcase/ui_markets.png" },
      { name: "News Feed", src: "/env-showcase/ui_news.png" },
    ],
  },
  {
    domain: "CRM",
    policy: "Enterprise customer workflows",
    summary: "Lead management and record creation surfaces from the CRM evaluation environments.",
    glowClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.7_0.14_220/0.14),transparent_44%),radial-gradient(circle_at_bottom_right,oklch(0.66_0.13_255/0.08),transparent_44%)]",
    shots: [
      { name: "Create Lead", src: "/env-showcase/create_page.png" },
      { name: "Leads Board", src: "/env-showcase/leads_page.png" },
    ],
  },
  {
    domain: "Customer Service",
    policy: "Case-management interfaces",
    summary: "Case queues, detailed case views, and service operations interfaces used in support-style evaluations.",
    glowClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.74_0.12_165/0.15),transparent_42%),radial-gradient(circle_at_bottom_right,oklch(0.7_0.13_210/0.1),transparent_46%)]",
    cardClass: "lg:col-span-2",
    shots: [
      { name: "Case Details", src: "/env-showcase/ui_case_details.png" },
      { name: "Case Queue", src: "/env-showcase/ui_case_list.png" },
      { name: "Cases Dashboard", src: "/env-showcase/ui_cases.png" },
      { name: "ServiceNow", src: "/env-showcase/servicenow-store-credit-ff-attack.png" },
    ],
  },
  {
    domain: "Browser",
    policy: "Interactive e-commerce pages",
    summary: "Shopping and account-management pages used for browser-native evaluation scenarios.",
    glowClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.74_0.16_65/0.16),transparent_44%),radial-gradient(circle_at_bottom_right,oklch(0.72_0.14_30/0.1),transparent_46%)]",
    shots: [
      { name: "E-commerce Home", src: "/env-showcase/ecommerce-home.png" },
      { name: "Review Page", src: "/env-showcase/ecommerce-review.png" },
      { name: "Account Center", src: "/env-showcase/ecommerce-account.png" },
    ],
  },
  {
    domain: "Desktop OS",
    policy: "Windows and macOS task surfaces",
    summary: "Desktop operating-system environments spanning Windows, macOS, and virtualized workstation views.",
    glowClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.72_0.14_260/0.15),transparent_46%),radial-gradient(circle_at_bottom_right,oklch(0.66_0.13_210/0.1),transparent_46%)]",
    shots: [
      { name: "Windows Desktop", src: "/env-showcase/windows-screenshot.png" },
      { name: "macOS Desktop", src: "/env-showcase/macos_screenshot.png" },
      { name: "VM Desktop", src: "/env-showcase/vm_desktop.png" },
    ],
  },
  {
    domain: "Research",
    policy: "Scholarly browsing surface",
    summary: "A research-focused environment represented here by the benchmark Arxiv interface.",
    glowClass:
      "bg-[radial-gradient(circle_at_top_left,oklch(0.72_0.14_190/0.14),transparent_44%),radial-gradient(circle_at_bottom_right,oklch(0.69_0.12_145/0.08),transparent_44%)]",
    shots: [{ name: "Arxiv", src: "/env-showcase/arxiv_DT.png" }],
  },
]

const coveredShowcaseDomains = domainShowcases.map((group) => group.domain)
const groupedScreenshotCount = domainShowcases.reduce((count, group) => count + group.shots.length, 0)

function getAtlasShotClass(index: number, total: number) {
  if (total === 1) {
    return "sm:col-span-2 aspect-[16/10]"
  }

  if (total === 2) {
    return "aspect-[16/10]"
  }

  if (total === 3 && index === 0) {
    return "sm:col-span-2 aspect-[16/10]"
  }

  return "aspect-[16/10]"
}

export function DomainsSection() {
  const [spotlightIndex, setSpotlightIndex] = useState(0)
  const [previewShot, setPreviewShot] = useState<PreviewShot | null>(null)
  const spotlightShot = flowingFeatureShowcases[spotlightIndex]

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSpotlightIndex((currentIndex) => (currentIndex + 1) % flowingFeatureShowcases.length)
    }, 2600)

    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (!previewShot) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewShot(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [previewShot])

  return (
    <>
      <section className="border-t border-border/50">
      <div className="mx-auto max-w-7xl px-4 py-20 md:py-28">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Spanning 15+ Real-World Domains</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Each domain includes policy-aligned evaluation scenarios based on actual regulatory and compliance
            requirements.
          </p>
        </div>

        <div className="relative">
          {/* Gradient masks for scroll indication */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
            {domains.map((domain) => (
              <div
                key={domain.name}
                className="flex-shrink-0 snap-start w-48 p-4 rounded-xl border border-border/50 bg-card/50 hover:border-primary/30 hover:bg-card transition-all group"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary mb-3 group-hover:bg-primary/10 transition-colors">
                  <domain.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-medium text-sm mb-1">{domain.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-primary/80 bg-primary/10 px-2 py-0.5 rounded">
                    {domain.policy}
                  </span>
                  <span className="text-xs text-muted-foreground">{domain.envs} envs</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-stretch">
          <div className="relative overflow-hidden rounded-[28px] border border-border/50 bg-card/40 p-6 md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,oklch(0.72_0.13_220/0.12),transparent_42%),radial-gradient(circle_at_bottom_right,oklch(0.62_0.14_260/0.08),transparent_44%)]" />
            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Featured Sandbox Environments
              </div>

              <h3 className="max-w-xl text-2xl font-semibold tracking-tight md:text-3xl">
                A flowing wall of real product interfaces
              </h3>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                Real evaluations happen inside realistic product surfaces, not toy mocks. The highlight wall and atlas
                below are grouped by domain and intentionally curated to show environment interfaces rather than result
                plots or attack outcome figures.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {coveredShowcaseDomains.map((domain) => (
                  <span
                    key={domain}
                    className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary"
                  >
                    {domain} screenshots
                  </span>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "15+", value: "Domains" },
                  { label: "Compliance", value: "Policy aligned" },
                  { label: "Multi-app", value: "Cross-tool flows" },
                ].map((item) => (
                  <div
                    key={item.value}
                    className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 backdrop-blur-sm"
                  >
                    <div className="text-lg font-semibold text-foreground">{item.label}</div>
                    <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {featuredSandboxEnvironments.map((env) => (
                  <span
                    key={env}
                    className="rounded-full border border-border/60 bg-secondary/[0.55] px-3 py-1.5 text-sm text-secondary-foreground backdrop-blur-sm"
                  >
                    {env}
                  </span>
                ))}
                <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm text-primary">
                  + more
                </span>
              </div>
            </div>
          </div>

          <div className="env-showcase-stage relative min-h-[500px] overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(160deg,oklch(0.11_0.025_248),oklch(0.08_0.018_245))] p-4 sm:min-h-[560px] md:p-5">
            <div className="env-showcase-grid absolute inset-0 opacity-40" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,oklch(0.76_0.16_220/0.22),transparent_35%),radial-gradient(circle_at_82%_18%,oklch(0.68_0.16_280/0.18),transparent_28%),radial-gradient(circle_at_50%_100%,oklch(0.68_0.14_180/0.14),transparent_42%)]" />
            <div className="absolute left-5 top-5 rounded-full border border-white/[0.12] bg-black/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70 backdrop-blur-md">
              Flowing cross-domain environment wall
            </div>
            <div className="absolute bottom-5 left-5 rounded-full border border-white/[0.12] bg-white/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70 backdrop-blur-md">
              {flowingFeatureShowcases.length} interfaces • auto-rotating spotlight
            </div>
            <div className="pointer-events-none absolute inset-x-6 top-16 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <div className="pointer-events-none absolute inset-x-8 bottom-20 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="pointer-events-none absolute inset-x-[18%] top-[18%] bottom-[16%] z-[1]">
              <div className={`env-spotlight-aura absolute inset-0 opacity-80 ${spotlightShot.accentClass}`} />
            </div>
            <div className="absolute inset-0 grid grid-cols-3 gap-3 px-3 py-16 sm:gap-4 sm:px-4">
              {flowingFeatureColumns.map((column, columnIndex) => (
                <div key={columnIndex} className="env-flow-column">
                  <div
                    className={`env-flow-track ${columnIndex % 2 === 1 ? "env-flow-track-reverse" : ""}`}
                    style={{ animationDuration: `${30 + columnIndex * 5}s` }}
                  >
                    {[...column, ...column].map((shot, shotIndex) => (
                      <div
                        key={`${shot.domain}-${shot.name}-${shotIndex}`}
                        className="env-flow-card"
                        style={{ "--env-flow-tilt": `${shotIndex % 2 === 0 ? -1.2 : 1.2}deg` } as CSSProperties}
                      >
                        <button
                          type="button"
                          onClick={() => setPreviewShot({ name: shot.name, domain: shot.domain, src: shot.src })}
                          className="group relative block w-full overflow-hidden rounded-[22px] border border-white/[0.12] bg-black/20 text-left shadow-[0_24px_80px_-46px_rgba(15,23,42,0.9)] backdrop-blur-md"
                          aria-label={`Open ${shot.domain} screenshot ${shot.name}`}
                        >
                          <div className={`absolute inset-0 opacity-80 ${shot.accentClass}`} />
                          <div className="relative aspect-[16/10] overflow-hidden">
                            <Image
                              src={shot.src}
                              alt={`${shot.domain} environment screenshot: ${shot.name}`}
                              fill
                              sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 24vw, 28vw"
                              className="env-showcase-image object-cover object-top"
                            />
                          </div>
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent px-3 pb-3 pt-8 text-white">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">
                              {shot.domain}
                            </div>
                            <div className="mt-1 text-sm font-medium">{shot.name}</div>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_8%,rgba(2,6,23,0.14)_36%,rgba(2,6,23,0.74)_72%,rgba(2,6,23,0.94)_100%)]" />

            <div className="absolute inset-x-4 top-1/2 z-10 -translate-y-1/2 sm:left-1/2 sm:max-w-[420px] sm:-translate-x-1/2">
              <div className="env-spotlight-shell rounded-[28px] border border-white/[0.14] bg-black/35 p-3 backdrop-blur-xl sm:p-4">
                <div key={`${spotlightShot.domain}-${spotlightShot.name}-${spotlightIndex}`} className="env-spotlight-animate">
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewShot({ name: spotlightShot.name, domain: spotlightShot.domain, src: spotlightShot.src })
                    }
                    className="group relative block w-full overflow-hidden rounded-[24px] border border-white/[0.12] bg-white/[0.06] text-left shadow-[0_28px_90px_-46px_rgba(15,23,42,0.95)]"
                    aria-label={`Open spotlight screenshot ${spotlightShot.name}`}
                  >
                    <div className={`absolute inset-0 opacity-90 ${spotlightShot.accentClass}`} />
                    <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-white/[0.14] bg-black/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/90 backdrop-blur-md">
                      <span>{spotlightShot.domain}</span>
                      <span className="text-white/35">/</span>
                      <span className="text-white/[0.68]">Now rotating</span>
                    </div>

                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={spotlightShot.src}
                        alt={`${spotlightShot.domain} spotlight screenshot: ${spotlightShot.name}`}
                        fill
                        sizes="(min-width: 1280px) 28vw, (min-width: 1024px) 34vw, 82vw"
                        className="env-showcase-image object-cover object-top"
                      />
                    </div>

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/38 to-transparent px-4 pb-4 pt-12 text-white">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/65">
                        Featured Sandbox Environments
                      </div>
                      <div className="mt-1 text-xl font-semibold tracking-tight">{spotlightShot.name}</div>
                      <p className="mt-1 text-sm text-white/68">
                        The wall keeps flowing while the spotlight cycles across real benchmark interfaces.
                      </p>
                    </div>
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2">
                  {flowingFeatureShowcases.map((shot, index) => {
                    const isActive = spotlightIndex === index
                    return (
                      <span
                        key={shot.name}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          isActive ? "w-6 bg-white" : "w-1.5 bg-white/28"
                        }`}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-6 overflow-hidden rounded-[30px] border border-border/50 bg-card/[0.35] p-4 sm:p-5 md:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,oklch(0.74_0.12_220/0.08),transparent_36%),radial-gradient(circle_at_bottom_right,oklch(0.68_0.12_280/0.08),transparent_40%)]" />

          <div className="relative mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Domain Screenshot Atlas
              </div>
              <h4 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">
                Grouped by domain, curated for actual environment interfaces
              </h4>
              <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
                Only product surfaces and sandbox UIs are shown here. Result charts, attack outcomes, and appendix
                figures are intentionally excluded so the homepage reads like a product atlas instead of a paper figure
                dump.
              </p>
            </div>
            <div className="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              {groupedScreenshotCount} grouped screenshots
            </div>
          </div>

          <div className="relative grid gap-5 lg:grid-cols-2">
            {domainShowcases.map((group) => (
              <div
                key={group.domain}
                className={`group relative overflow-hidden rounded-[28px] border border-border/60 bg-background/75 p-5 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.45)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 ${group.cardClass ?? ""}`}
              >
                <div className={`absolute inset-0 opacity-90 ${group.glowClass}`} />
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.07] to-transparent" />

                <div className="relative">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="max-w-2xl">
                      <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        {group.policy}
                      </div>
                      <h5 className="mt-3 text-2xl font-semibold tracking-tight">{group.domain}</h5>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{group.summary}</p>
                    </div>

                    <div className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {group.shots.length} screenshots
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {group.shots.map((shot, index) => (
                      <button
                        type="button"
                        onClick={() => setPreviewShot({ name: shot.name, domain: group.domain, src: shot.src })}
                        key={shot.name}
                        className={`group/shot relative overflow-hidden rounded-[22px] border border-border/60 bg-card/80 text-left shadow-[0_20px_60px_-40px_rgba(15,23,42,0.55)] ${getAtlasShotClass(index, group.shots.length)}`}
                        aria-label={`Open ${group.domain} screenshot ${shot.name}`}
                      >
                        <div className="relative h-full min-h-[160px] overflow-hidden">
                          <Image
                            src={shot.src}
                            alt={`${group.domain} environment screenshot: ${shot.name}`}
                            fill
                            sizes="(min-width: 1280px) 30vw, (min-width: 1024px) 42vw, (min-width: 640px) 44vw, 92vw"
                            className="env-showcase-image object-cover object-top"
                          />
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-4 pb-4 pt-10 text-white">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/65">
                            {group.domain}
                          </div>
                          <div className="mt-1 text-sm font-medium">{shot.name}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </section>

      {previewShot ? (
        <div
          className="env-preview-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          onClick={() => setPreviewShot(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${previewShot.domain} screenshot preview`}
        >
          <div
            className="env-preview-panel relative w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/[0.14] bg-[oklch(0.09_0.015_250/0.94)] shadow-[0_40px_120px_-60px_rgba(15,23,42,1)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] px-5 py-4 text-white">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
                  {previewShot.domain}
                </div>
                <div className="mt-1 text-lg font-semibold tracking-tight">{previewShot.name}</div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewShot(null)}
                className="rounded-full border border-white/[0.12] bg-white/[0.06] px-3 py-1.5 text-sm font-medium text-white/85 transition hover:bg-white/[0.12]"
              >
                Close
              </button>
            </div>

            <div className="relative aspect-[16/9] w-full bg-black">
              <Image
                src={previewShot.src}
                alt={`${previewShot.domain} preview ${previewShot.name}`}
                fill
                sizes="90vw"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

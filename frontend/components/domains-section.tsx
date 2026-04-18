"use client"

import type { CSSProperties } from "react"
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

const featuredEnvironmentShots = [
  {
    name: "PayPal",
    category: "Workflow",
    src: "/env-showcase/paypal-1.png",
    layoutClass: "left-[4%] top-[8%] w-[48%] sm:w-[42%]",
    shadowClass: "shadow-[0_30px_90px_-42px_rgba(37,99,235,0.85)]",
    rotate: "-7deg",
    offsetY: "0px",
    floatY: "20px",
    delay: "0s",
    duration: "13s",
  },
  {
    name: "Trade Desk",
    category: "Finance",
    src: "/env-showcase/ui_trade.png",
    layoutClass: "right-[6%] top-[5%] w-[38%] sm:w-[32%]",
    shadowClass: "shadow-[0_30px_90px_-42px_rgba(14,165,233,0.8)]",
    rotate: "7deg",
    offsetY: "8px",
    floatY: "16px",
    delay: "1.5s",
    duration: "12s",
  },
  {
    name: "E-commerce Home",
    category: "Browser",
    src: "/env-showcase/ecommerce-home.png",
    layoutClass: "left-[26%] top-[35%] w-[52%] sm:w-[48%]",
    shadowClass: "shadow-[0_30px_90px_-42px_rgba(249,115,22,0.8)]",
    rotate: "-2deg",
    offsetY: "0px",
    floatY: "24px",
    delay: "0.8s",
    duration: "15s",
  },
  {
    name: "CRM Leads",
    category: "CRM",
    src: "/env-showcase/leads_page.png",
    layoutClass: "left-[8%] bottom-[8%] w-[40%] sm:w-[34%]",
    shadowClass: "shadow-[0_30px_90px_-42px_rgba(59,130,246,0.75)]",
    rotate: "-10deg",
    offsetY: "0px",
    floatY: "18px",
    delay: "2.4s",
    duration: "14s",
  },
  {
    name: "Windows Desktop",
    category: "Desktop OS",
    src: "/env-showcase/windows-screenshot.png",
    layoutClass: "right-[14%] bottom-[17%] hidden w-[28%] sm:block",
    shadowClass: "shadow-[0_30px_90px_-42px_rgba(99,102,241,0.75)]",
    rotate: "9deg",
    offsetY: "10px",
    floatY: "22px",
    delay: "3.1s",
    duration: "16s",
  },
  {
    name: "Case Details",
    category: "Customer Service",
    src: "/env-showcase/ui_case_details.png",
    layoutClass: "right-[3%] bottom-[4%] hidden w-[34%] md:block",
    shadowClass: "shadow-[0_30px_90px_-42px_rgba(16,185,129,0.75)]",
    rotate: "4deg",
    offsetY: "0px",
    floatY: "14px",
    delay: "1.2s",
    duration: "11s",
  },
] as const

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

function getShowcaseStyle(rotate: string, offsetY: string, floatY: string, delay: string, duration: string): CSSProperties {
  return {
    "--card-rotate": rotate,
    "--card-offset-y": offsetY,
    "--card-float-y": floatY,
    animationDelay: delay,
    animationDuration: duration,
  } as CSSProperties
}

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
  return (
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
                Floating previews of the environments agents actually operate in
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

          <div className="env-showcase-stage relative min-h-[420px] overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(160deg,oklch(0.11_0.025_248),oklch(0.08_0.018_245))] p-4 sm:min-h-[500px] md:p-5">
            <div className="env-showcase-grid absolute inset-0 opacity-40" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,oklch(0.76_0.16_220/0.22),transparent_35%),radial-gradient(circle_at_82%_18%,oklch(0.68_0.16_280/0.18),transparent_28%),radial-gradient(circle_at_50%_100%,oklch(0.68_0.14_180/0.14),transparent_42%)]" />
            <div className="absolute left-5 top-5 rounded-full border border-white/[0.12] bg-black/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70 backdrop-blur-md">
              Curated cross-domain highlights
            </div>
            <div className="absolute bottom-5 left-5 rounded-full border border-white/[0.12] bg-white/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70 backdrop-blur-md">
              {domainShowcases.length} grouped domains • environment-only curation
            </div>
            <div className="pointer-events-none absolute inset-x-6 top-16 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <div className="pointer-events-none absolute inset-x-8 bottom-20 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {featuredEnvironmentShots.map((shot) => (
              <div
                key={shot.name}
                className={`env-showcase-card absolute ${shot.layoutClass}`}
                style={getShowcaseStyle(shot.rotate, shot.offsetY, shot.floatY, shot.delay, shot.duration)}
              >
                <div
                  className={`group relative overflow-hidden rounded-[24px] border border-white/[0.12] bg-white/[0.06] backdrop-blur-md ${shot.shadowClass}`}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),transparent_36%,rgba(3,7,18,0.28))]" />
                  <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/30 via-black/10 to-transparent" />
                  <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-black/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/90 backdrop-blur-md">
                    <span>{shot.name}</span>
                    <span className="text-white/35">/</span>
                    <span className="text-white/[0.65]">{shot.category}</span>
                  </div>

                  <div className="relative aspect-[16/9]">
                    <Image
                      src={shot.src}
                      alt={`${shot.name} sandbox screenshot`}
                      fill
                      sizes="(min-width: 1280px) 26vw, (min-width: 1024px) 32vw, (min-width: 640px) 42vw, 74vw"
                      className="env-showcase-image object-cover object-top"
                    />
                  </div>
                </div>
              </div>
            ))}
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
                      <div
                        key={shot.name}
                        className={`group/shot relative overflow-hidden rounded-[22px] border border-border/60 bg-card/80 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.55)] ${getAtlasShotClass(index, group.shots.length)}`}
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
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

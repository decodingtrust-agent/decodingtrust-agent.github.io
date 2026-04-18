"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Stethoscope, type LucideIcon } from "lucide-react"

type Domain = {
  name: string
  policy: string
  envs: number
  reps: string[]
  logo?: string
  fallbackIcon?: LucideIcon
  accent: string
}

const domains: Domain[] = [
  {
    name: "Workflow",
    policy: "Enterprise ToS",
    envs: 9,
    reps: ["Gmail", "Slack", "Zoom"],
    logo: "/logo/domains/gmail.png",
    accent: "from-red-500/20 to-rose-500/10",
  },
  {
    name: "CRM",
    policy: "Salesforce AUP",
    envs: 1,
    reps: ["Salesforce"],
    logo: "/logo/domains/salesforce.png",
    accent: "from-sky-500/25 to-blue-500/15",
  },
  {
    name: "Customer Service",
    policy: "Support SLA",
    envs: 1,
    reps: ["ServiceNow"],
    logo: "/logo/domains/servicenow.webp",
    accent: "from-emerald-500/25 to-green-500/15",
  },
  {
    name: "Travel",
    policy: "Consumer Protection",
    envs: 1,
    reps: ["Booking"],
    logo: "/logo/domains/booking.svg",
    accent: "from-blue-500/25 to-indigo-500/15",
  },
  {
    name: "Code",
    policy: "Secure SDLC",
    envs: 2,
    reps: ["GitHub", "Cursor"],
    logo: "/logo/domains/github.svg",
    accent: "from-zinc-500/25 to-slate-500/15",
  },
  {
    name: "Browser",
    policy: "Web Standards",
    envs: 2,
    reps: ["eBay", "Amazon"],
    logo: "/logo/domains/brave.png",
    accent: "from-orange-500/25 to-amber-500/15",
  },
  {
    name: "Research",
    policy: "Academic Integrity",
    envs: 1,
    reps: ["arXiv"],
    logo: "/logo/domains/arxiv.png",
    accent: "from-rose-500/25 to-red-500/15",
  },
  {
    name: "OS-Filesystem",
    policy: "Least Privilege",
    envs: 1,
    reps: ["Filesystem"],
    logo: "/logo/domains/terminal.svg",
    accent: "from-stone-500/25 to-neutral-500/15",
  },
  {
    name: "Windows",
    policy: "Endpoint Security",
    envs: 1,
    reps: ["Windows 11"],
    logo: "/logo/domains/windows-os.png",
    accent: "from-cyan-500/25 to-sky-500/15",
  },
  {
    name: "macOS",
    policy: "Endpoint Security",
    envs: 1,
    reps: ["macOS"],
    logo: "/logo/domains/macos.png",
    accent: "from-neutral-500/25 to-zinc-500/15",
  },
  {
    name: "Finance",
    policy: "FINRA",
    envs: 1,
    reps: ["Yahoo Finance"],
    logo: "/logo/domains/yahoo.png",
    accent: "from-violet-500/25 to-purple-500/15",
  },
  {
    name: "Legal",
    policy: "Legal Compliance",
    envs: 1,
    reps: ["Legal"],
    logo: "/logo/domains/legal.svg",
    accent: "from-amber-500/25 to-yellow-500/15",
  },
  {
    name: "Telecom",
    policy: "FCC / CPNI",
    envs: 1,
    reps: ["T-Mobile"],
    logo: "/logo/domains/tmobile.png",
    accent: "from-pink-500/25 to-fuchsia-500/15",
  },
  {
    name: "Medical Service",
    policy: "HIPAA",
    envs: 1,
    reps: ["Hospital Client"],
    fallbackIcon: Stethoscope,
    accent: "from-teal-500/25 to-emerald-500/15",
  },
]

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

const WALL_ROW_COUNT = 3
const wallRows = Array.from({ length: WALL_ROW_COUNT }, (_, rowIndex) =>
  wallShots.filter((_, shotIndex) => shotIndex % WALL_ROW_COUNT === rowIndex),
)

export function DomainsSection() {
  const [previewShot, setPreviewShot] = useState<WallShot | null>(null)

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
      <section className="relative">
        <div className="pointer-events-none absolute inset-x-[8%] top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-28">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Spanning 14 Real-World Domains</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Each domain includes policy-aligned evaluation scenarios based on actual regulatory and compliance
              requirements.
            </p>
          </div>

          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {domains.map((domain) => {
              const FallbackIcon = domain.fallbackIcon
              return (
                <div
                  key={domain.name}
                  className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_50px_-30px_rgba(15,23,42,0.45)]"
                >
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${domain.accent} opacity-40 transition-opacity duration-300 group-hover:opacity-80`}
                  />
                  <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/[0.04] blur-2xl transition-opacity duration-300 group-hover:bg-white/[0.08]" />

                  <div className="relative flex items-start gap-3">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-white p-2 shadow-sm ring-1 ring-black/[0.03]">
                      {domain.logo ? (
                        <Image
                          src={domain.logo}
                          alt={`${domain.name} logo`}
                          width={40}
                          height={40}
                          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : FallbackIcon ? (
                        <FallbackIcon className="h-6 w-6 text-primary/90" />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-foreground">{domain.name}</h3>
                      <div className="mt-1 inline-flex rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary/90">
                        {domain.policy}
                      </div>
                    </div>
                  </div>

                  <div className="relative mt-3 border-t border-border/40 pt-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap gap-1">
                        {domain.reps.slice(0, 2).map((rep) => (
                          <span
                            key={rep}
                            className="truncate rounded-md border border-border/50 bg-background/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {rep}
                          </span>
                        ))}
                      </div>
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-primary/80">
                        {domain.envs} envs
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="relative mt-12 overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(160deg,oklch(0.11_0.025_248),oklch(0.08_0.018_245))]">
            <div className="env-showcase-grid absolute inset-0 opacity-30" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,oklch(0.76_0.16_220/0.14),transparent_42%),radial-gradient(circle_at_bottom_right,oklch(0.68_0.16_280/0.10),transparent_46%)]" />

            <div className="relative flex items-center justify-between px-4 pt-3 pb-1">
              <span className="rounded-full border border-white/[0.12] bg-black/30 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70 backdrop-blur-md">
                Featured Sandbox Environments
              </span>
              <span className="rounded-full border border-white/[0.12] bg-white/[0.08] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70 backdrop-blur-md">
                {wallShots.length} interfaces
              </span>
            </div>

            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[oklch(0.09_0.02_248)]/60 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[oklch(0.09_0.02_248)]/60 to-transparent" />

            <div className="relative flex flex-col gap-2 py-3">
              {wallRows.map((row, rowIndex) => (
                <div key={rowIndex} className="env-wall-row">
                  <div
                    className={`env-wall-track ${rowIndex % 2 === 1 ? "env-wall-track-reverse" : ""}`}
                    style={{ animationDuration: `${60 + rowIndex * 8}s` }}
                  >
                    {[...row, ...row, ...row].map((shot, shotIndex) => (
                      <button
                        key={`${shot.name}-${shotIndex}`}
                        type="button"
                        onClick={() => setPreviewShot(shot)}
                        className="env-wall-tile group relative block overflow-hidden rounded-lg border border-white/[0.1] bg-black/30 text-left shadow-[0_16px_60px_-38px_rgba(15,23,42,0.9)] backdrop-blur-md"
                        aria-label={`Open ${shot.domain} screenshot ${shot.name}`}
                      >
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <Image
                            src={shot.src}
                            alt={`${shot.domain} environment screenshot: ${shot.name}`}
                            fill
                            sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 28vw, (min-width: 640px) 40vw, 60vw"
                            className="env-showcase-image object-cover object-top"
                          />
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent px-3 pb-2.5 pt-7 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/65">
                            {shot.domain}
                          </div>
                          <div className="mt-0.5 text-xs font-medium">{shot.name}</div>
                        </div>
                      </button>
                    ))}
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

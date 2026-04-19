"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

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

export function RedTeamWall() {
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
      <section className="relative -mt-24 overflow-hidden pb-16 pt-4">
        {/* Ambient red-team glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[140%] w-[120%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.14),transparent_55%)] blur-3xl" />
          <div className="absolute left-0 top-1/2 h-[80%] w-[40%] -translate-y-1/2 bg-[radial-gradient(ellipse_at_left_center,rgba(220,38,38,0.12),transparent_70%)] blur-3xl" />
          <div className="absolute right-0 top-1/2 h-[80%] w-[40%] -translate-y-1/2 bg-[radial-gradient(ellipse_at_right_center,rgba(185,28,28,0.10),transparent_70%)] blur-3xl" />
        </div>

        {/* Edge fades so the wall blends into the page */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-40 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-40 bg-gradient-to-l from-background via-background/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-background to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-background to-transparent" />

        <div className="relative flex flex-col gap-3">
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
                    className="env-wall-tile red-glow-tile group relative block overflow-hidden rounded-xl bg-card/90 text-left ring-1 ring-red-500/25 transition-all duration-300 hover:ring-red-500/60"
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
                    <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent px-3 pb-2.5 pt-7 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-red-300/90">
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

        {/* Red-team pill */}
        <div className="pointer-events-none relative mt-8 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-red-600 backdrop-blur-md dark:text-red-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
            </span>
            Live Red-Team Sandboxes · {wallShots.length} Interfaces
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

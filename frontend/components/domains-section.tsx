import Image from "next/image"
import { Database, GitBranch, ShoppingBag, Stethoscope, type LucideIcon } from "lucide-react"

type EnvItem = {
  name: string
  domain: string
  logo?: string
  fallbackIcon?: LucideIcon
}

const environments: EnvItem[] = [
  { name: "Gmail", domain: "Workflow", logo: "/logo/domains/gmail.png" },
  { name: "Google Calendar", domain: "Workflow", logo: "/logo/domains/google-calendar.png" },
  { name: "Google Docs", domain: "Workflow", logo: "/logo/domains/google-docs.png" },
  { name: "Google Sheets", domain: "Workflow", logo: "/logo/domains/sheets.png" },
  { name: "Google Drive", domain: "Workflow", logo: "/logo/domains/google-drive.png" },
  { name: "Google Forms", domain: "Workflow", logo: "/logo/domains/google-forms.png" },
  { name: "Slack", domain: "Workflow", logo: "/logo/domains/slack.png" },
  { name: "PayPal", domain: "Workflow", logo: "/logo/domains/paypal.svg" },
  { name: "Zoom", domain: "Workflow", logo: "/logo/domains/zoom.svg" },
  { name: "Atlassian", domain: "Workflow", logo: "/logo/domains/atlassian.svg" },
  { name: "WhatsApp", domain: "Workflow", logo: "/logo/domains/whatsapp.png" },
  { name: "Telegram", domain: "Workflow", logo: "/logo/domains/telegram.png" },
  { name: "Salesforce", domain: "CRM", logo: "/logo/domains/salesforce.png" },
  { name: "ServiceNow", domain: "Customer Service", logo: "/logo/domains/servicenow.webp" },
  { name: "Travel Booking", domain: "Travel", logo: "/logo/domains/booking.svg" },
  { name: "GitHub", domain: "Code", logo: "/logo/domains/github.svg" },
  { name: "GitLab", domain: "Code", fallbackIcon: GitBranch },
  { name: "Browser", domain: "Browser", logo: "/logo/domains/browser.png" },
  { name: "eBay", domain: "Browser", fallbackIcon: ShoppingBag },
  { name: "arXiv", domain: "Research", logo: "/logo/domains/arxiv.png" },
  { name: "Filesystem", domain: "OS-Filesystem", logo: "/logo/domains/terminal.svg" },
  { name: "Windows", domain: "Windows", logo: "/logo/domains/windows-os.png" },
  { name: "macOS", domain: "macOS", logo: "/logo/domains/macos.png" },
  { name: "Yahoo Finance", domain: "Finance", logo: "/logo/domains/yahoo.png" },
  { name: "Legal", domain: "Legal", logo: "/logo/domains/legal.svg" },
  { name: "Telecom", domain: "Telecom", logo: "/logo/domains/tmobile.png" },
  { name: "Hospital Client", domain: "Medical Service", fallbackIcon: Stethoscope },
  { name: "Snowflake", domain: "Data Platform", logo: "/logo/domains/snowflake.png" },
  { name: "Databricks", domain: "Data Platform", fallbackIcon: Database },
  { name: "PostgreSQL", domain: "Data Platform", fallbackIcon: Database },
]

export function DomainsSection() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-4 pt-4 md:pt-8 pb-20 md:pb-28">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Comprehensive Evaluation across 30 Sandboxed Environments
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Each environment is policy-aligned and spans real-world regulatory and operational constraints across
            our 14 supported domains.
          </p>
        </div>

        <div className="grid gap-x-6 gap-y-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {environments.map((env) => {
            const FallbackIcon = env.fallbackIcon
            return (
              <div
                key={env.name}
                className="group relative flex items-center gap-3.5 rounded-lg px-2 py-2.5 transition-colors duration-200 hover:bg-foreground/[0.03] dark:hover:bg-foreground/[0.04]"
              >
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
                  {env.logo ? (
                    <Image
                      src={env.logo}
                      alt={`${env.name} logo`}
                      width={44}
                      height={44}
                      className="h-11 w-11 object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : FallbackIcon ? (
                    <FallbackIcon className="h-7 w-7 text-muted-foreground" />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-foreground leading-tight">{env.name}</h3>
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground/70">{env.domain}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

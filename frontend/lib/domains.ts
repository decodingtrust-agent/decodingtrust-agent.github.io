export type DomainMeta = {
  /** Site key, matches `benchmark-data.json` domains. */
  key: string
  label: string
  shortLabel: string
  /** One-line summary for index/cards. */
  blurb: string
  /** Long-form description for the domain page. */
  description: string
  /** Tailwind classes for the gradient on the hero card. */
  accent: string
}

export const DOMAINS: DomainMeta[] = [
  {
    key: "workflow",
    label: "Workflow",
    shortLabel: "Workflow",
    blurb: "Productivity, communication and finance workflow apps.",
    description:
      "Workflow environments cover the everyday productivity surface area where agents read untrusted content and act on behalf of users — email, calendars, docs, chat, social, payments, and more.",
    accent: "from-cyan-500/30 via-sky-500/20 to-transparent",
  },
  {
    key: "crm",
    label: "CRM",
    shortLabel: "CRM",
    blurb: "Salesforce-style customer relationship management.",
    description:
      "A simulated Salesforce CRM workspace evaluating whether agents can manage leads, accounts, and opportunities without leaking PII or executing destructive updates from poisoned record content.",
    accent: "from-emerald-500/30 via-teal-500/20 to-transparent",
  },
  {
    key: "customer-service",
    label: "Customer Service",
    shortLabel: "CS",
    blurb: "ServiceNow-style customer-support case workflows.",
    description:
      "ServiceNow-style customer-service workspace that exercises support workflows: ticket triage, refunds, escalations, and PII handling — under both direct prompt injection and case-content injection.",
    accent: "from-blue-500/30 via-indigo-500/20 to-transparent",
  },
  {
    key: "travel",
    label: "Travel",
    shortLabel: "Travel",
    blurb: "Hotel, flight and rental booking flows.",
    description:
      "Travel-booking environments (Booking.com, Expedia, United, Southwest, Enterprise) where agents must complete realistic itineraries while resisting payment-, address-, and itinerary-targeted attacks.",
    accent: "from-amber-500/30 via-orange-500/20 to-transparent",
  },
  {
    key: "coding",
    label: "Coding",
    shortLabel: "Code",
    blurb: "GitHub, GitLab and terminal-driven engineering tasks.",
    description:
      "Source-control and terminal environments where agents review code, manage branches, and run commands — with adversaries hiding instructions inside diffs, issues, and CI output.",
    accent: "from-purple-500/30 via-fuchsia-500/20 to-transparent",
  },
  {
    key: "browser",
    label: "Browser",
    shortLabel: "Browser",
    blurb: "E-commerce browsing, search and checkout.",
    description:
      "A simulated e-commerce browser surface with product listings, reviews, and account flows — testing whether agents respect user intent against malicious reviews, banners, and storefront pages.",
    accent: "from-pink-500/30 via-rose-500/20 to-transparent",
  },
  {
    key: "research",
    label: "Research",
    shortLabel: "Research",
    blurb: "arXiv-driven literature research and exfil tasks.",
    description:
      "Research workflows over an arXiv-style literature corpus, evaluating whether agents stay aligned with the user goal under prompt injections planted in abstracts, comments, and citations.",
    accent: "from-violet-500/30 via-purple-500/20 to-transparent",
  },
  {
    key: "os-filesystem",
    label: "OS-Filesystem",
    shortLabel: "OS-FS",
    blurb: "Shell-driven file-system operations.",
    description:
      "Filesystem and shell environment for evaluating destructive command execution, path-traversal abuse, and data-exfiltration risks under adversarial directory contents.",
    accent: "from-slate-500/30 via-zinc-500/20 to-transparent",
  },
  {
    key: "windows",
    label: "Windows",
    shortLabel: "Windows",
    blurb: "Windows desktop GUI agent benchmark.",
    description:
      "Image-grounded Windows desktop environment that targets full-OS agentic behavior: launching apps, manipulating windows, and clicking through dialogs — including image-based prompt injection.",
    accent: "from-blue-500/30 via-cyan-500/20 to-transparent",
  },
  {
    key: "macos",
    label: "macOS",
    shortLabel: "macOS",
    blurb: "macOS desktop GUI agent benchmark.",
    description:
      "Image-grounded macOS desktop environment counterpart to Windows, exercising click-driven workflows over native applications under both pop-up and screenshot-borne injections.",
    accent: "from-gray-500/30 via-slate-500/20 to-transparent",
  },
  {
    key: "finance",
    label: "Finance",
    shortLabel: "Finance",
    blurb: "Yahoo Finance, Chase, Robinhood agent flows.",
    description:
      "Finance-domain environments (Yahoo Finance, Chase banking, Robinhood) where agents must reason about market data, place trades, and move funds without falling for adversarial news, alerts, or transfer requests.",
    accent: "from-green-500/30 via-emerald-500/20 to-transparent",
  },
  {
    key: "legal",
    label: "Legal",
    shortLabel: "Legal",
    blurb: "Harvey-style legal review and document drafting.",
    description:
      "Legal-domain agent tasks over contracts, statutes, and case files — testing whether agents preserve client privilege and resist instructions hidden inside document text or counsel notes.",
    accent: "from-indigo-500/30 via-sky-500/20 to-transparent",
  },
  {
    key: "telecom",
    label: "Telecom",
    shortLabel: "Telecom",
    blurb: "Telecom customer-account workflows.",
    description:
      "Telecom carrier environment for plan changes, billing inquiries, and SIM operations — with adversaries hiding directives in messages, status alerts, and account notes.",
    accent: "from-pink-500/30 via-fuchsia-500/20 to-transparent",
  },
  {
    key: "medical",
    label: "Medical",
    shortLabel: "Medical",
    blurb: "Hospital client medical-service workflows.",
    description:
      "Hospital client environment exercising scheduling, intake, prescription review, and chart access — evaluating whether agents protect PHI under realistic clinical content injections.",
    accent: "from-red-500/30 via-rose-500/20 to-transparent",
  },
]

export const DOMAIN_BY_KEY: Record<string, DomainMeta> = Object.fromEntries(
  DOMAINS.map((d) => [d.key, d])
)

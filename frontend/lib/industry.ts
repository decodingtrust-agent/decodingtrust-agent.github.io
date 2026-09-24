// Industry reports: third-party evaluations and joint security studies that run
// on DTap. Each entry is one published report. Add new collaborations here —
// the /industry page and the homepage highlight both render straight off this
// list, so no component needs to change when a report is added.

export interface IndustryMetric {
  label: string
  value: string
  rank: string
  hint: string
  /** "safe" = lower is better (ASR), "capable" = higher is better (BSR). */
  direction: "safe" | "capable"
  /** Highlight this metric as the report's headline number. */
  headline?: boolean
}

export interface IndustryDomainRow {
  domain: string
  directAsr: number
  directRank: number
  indirectAsr: number
  indirectRank: number
  bsr: number
  bsrRank: number
  /** GUI-driven domain (guest OS in QEMU rather than a Linux container). */
  gui?: boolean
  /** Number of systems sharing this rank, when the cell is a tie (>= 2). */
  indirectTie?: number
  bsrTie?: number
}

export interface IndustryReport {
  slug: string
  title: string
  subtitle: string
  partner: string
  partnerUrl: string
  /** Partner brand mark under public/. */
  partnerLogo: string
  /** Short monogram, shown only if the logo file is missing. */
  partnerMonogram: string
  system: string
  authors: { name: string; affiliation: string }[]
  date: string
  pdfPath: string
  /** Rendered first page of the PDF, used as the card thumbnail. */
  thumbnail: string
  /** Title-through-abstract crop of page one, for wide feature slots. */
  heroImage: string
  pages: number
  abstract: string
  /** Short pitch used on the homepage highlight — one sentence. */
  blurb: string
  scope: string
  metrics: IndustryMetric[]
  domains: IndustryDomainRow[]
  findings: string[]
  /**
   * The report's own stated limits. Not rendered on the detail page right now —
   * the PDF carries them, and the leaderboard marks the harness difference with
   * a dagger. Kept here so the page can surface them again without re-reading
   * the paper.
   */
  caveats: string[]
  bibtex: string
}

export const POKEE_ISAAC_REPORT: IndustryReport = {
  slug: "pokee-ai-enterprise-agent-security",
  title: "Enterprise Agent and Model Security",
  subtitle:
    "Threat Landscape, Hardened Architecture, and Measured Results for Pokee-Isaac 28B v0.1 on DecodingTrust-Agent",
  partner: "Pokee AI",
  partnerUrl: "https://pokee.ai/",
  partnerLogo: "/logo/pokee.png",
  partnerMonogram: "P",
  system: "Pokee-Isaac 28B v0.1",
  authors: [
    { name: "Christopher Wu", affiliation: "Pokee AI" },
    { name: "Zhaorun Chen", affiliation: "University of Chicago" },
    { name: "Michael Cai", affiliation: "Pokee AI" },
    { name: "Bo Li", affiliation: "UIUC" },
    { name: "Zheqing Zhu", affiliation: "Pokee AI" },
  ],
  date: "September 2026",
  pdfPath: "/papers/pokee-ai-dtap-security-whitepaper.pdf",
  thumbnail: "/papers/pokee-ai-dtap-security-whitepaper-page1.png",
  heroImage: "/papers/pokee-ai-dtap-security-whitepaper-hero.png",
  pages: 36,
  abstract:
    "AI agents turn language-model outputs into actions with persistent effects on enterprise systems, so their security is a property of the whole execution stack, not of the model alone. This report maps the agent attack surface — model and planner, tools and skills, retrieval and memory, external environments, and serving infrastructure — analyzes a vendor-neutral reference architecture for enterprise agent deployment, identifies eight vulnerability classes that conventional application-security tooling is not built to find, and proposes a hardened architecture of eight security modules. It then evaluates Pokee-Isaac 28B v0.1 as a complete agent system on DecodingTrust-Agent across all 14 domains and 6,651 judged tasks.",
  blurb:
    "Pokee AI evaluated Pokee-Isaac 28B v0.1 as a complete agent system across all 14 DTap domains and 6,651 judged tasks — the first industry security report built on the platform.",
  scope: "All 14 domains · 6,651 judged tasks · 11-system field",
  metrics: [
    {
      label: "Indirect ASR",
      value: "7.4",
      rank: "#1 of 11",
      hint: "Lower = safer",
      direction: "safe",
      headline: true,
    },
    {
      label: "Direct ASR",
      value: "28.1",
      rank: "#4 of 11",
      hint: "Lower = safer",
      direction: "safe",
    },
    {
      label: "BSR",
      value: "81.4",
      rank: "#7 of 11",
      hint: "Higher = more capable",
      direction: "capable",
    },
  ],
  domains: [
    { domain: "Browser", directAsr: 24.7, directRank: 8, indirectAsr: 2.4, indirectRank: 3, bsr: 94.1, bsrRank: 5 },
    { domain: "Coding", directAsr: 52.9, directRank: 5, indirectAsr: 3.6, indirectRank: 1, bsr: 97.9, bsrRank: 8 },
    { domain: "CRM", directAsr: 32.2, directRank: 4, indirectAsr: 5.3, indirectRank: 2, bsr: 82.4, bsrRank: 4, bsrTie: 3 },
    { domain: "Customer Service", directAsr: 25.0, directRank: 3, indirectAsr: 8.9, indirectRank: 3, bsr: 94.4, bsrRank: 1 },
    { domain: "Finance", directAsr: 5.0, directRank: 3, indirectAsr: 2.0, indirectRank: 3, bsr: 96.0, bsrRank: 5 },
    { domain: "Legal", directAsr: 18.5, directRank: 1, indirectAsr: 13.0, indirectRank: 3, bsr: 85.5, bsrRank: 9 },
    { domain: "macOS", directAsr: 8.0, directRank: 2, indirectAsr: 0.0, indirectRank: 1, bsr: 56.7, bsrRank: 9, gui: true, indirectTie: 2 },
    { domain: "Medical", directAsr: 49.3, directRank: 3, indirectAsr: 31.1, indirectRank: 4, bsr: 57.9, bsrRank: 9 },
    { domain: "OS-Filesystem", directAsr: 28.0, directRank: 5, indirectAsr: 2.5, indirectRank: 2, bsr: 63.0, bsrRank: 8 },
    { domain: "Research", directAsr: 48.7, directRank: 6, indirectAsr: 1.6, indirectRank: 4, bsr: 100.0, bsrRank: 1, bsrTie: 4 },
    { domain: "Telecom", directAsr: 34.8, directRank: 5, indirectAsr: 3.0, indirectRank: 1, bsr: 79.2, bsrRank: 3 },
    { domain: "Travel", directAsr: 11.4, directRank: 4, indirectAsr: 13.3, indirectRank: 4, bsr: 94.6, bsrRank: 4 },
    { domain: "Windows", directAsr: 19.9, directRank: 2, indirectAsr: 4.5, indirectRank: 2, bsr: 54.8, bsrRank: 11, gui: true },
    { domain: "Workflow", directAsr: 35.3, directRank: 5, indirectAsr: 12.6, indirectRank: 3, bsr: 82.6, bsrRank: 6 },
  ],
  findings: [
    "No system in the 11-agent field Pareto-dominates Pokee-Isaac 28B v0.1: holding the lowest indirect ASR outright means every other agent must concede that axis to gain elsewhere.",
    "Three best-in-class cells — coding-indirect (3.6), telecom-indirect (3.0) and legal-direct (18.5) — plus the field's best benign capability on customer service (BSR 94.4), and a top-3 placement on 17 of the 28 domain/axis ASR pairs.",
    "The privacy-leak family, the canonical indirect-injection target, is fully defended on the vector it probes: 0/40 on indirect and 2/40 on direct.",
    "In a controlled head-to-head against five further models run under the same DTap installation and the same judge, it is best of six on every column (Direct 30.5, Indirect 8.3, Combined 18.7, BSR 85.6).",
    "It reaches that standing at 28B parameters, in a field where every other entry is a frontier-scale lab model or a hardened agent framework built on one.",
  ],
  caveats: [
    "The capability confound: an agent that completes fewer benign tasks also completes fewer attacks, so ASR must be read relative to utility. The report applies this in both directions — an indirect ASR of 8.3 on a BSR of 85.6 is not a 'does less' artifact, but the strong os-filesystem indirect number (2.5) sits on 63% capability and should not be over-credited.",
    "Harness difference: the five models in the controlled comparison run in DTap's stock runner, while Pokee-Isaac 28B v0.1 runs in its own agent scaffold. Every delta is therefore a system-level delta, not a model-level one. Its coding path in particular runs MCP-only, with native shell and file tools disabled.",
    "The indirect numbers are a guards-inactive measurement: the harness's injection guards match native tool names while DTap attacks arrive over MCP, so they abstain throughout. MCP-semantic matching is the named, unshipped fix.",
    "Single run, no error bars — per-domain ASR gaps within roughly ±3 points should be treated as noise. Browser carries only 34 benign tasks and macOS only 30, so those BSR figures should not be quoted precisely.",
    "Medical is the one genuine weak spot, with no confound available to excuse it: Direct 49.3, Indirect 31.1 at BSR 57.9.",
  ],
  bibtex: `@techreport{wu2026enterprise,
  title={Enterprise Agent and Model Security: Threat Landscape, Hardened
         Architecture, and Measured Results for Pokee-Isaac 28B v0.1 on
         DecodingTrust-Agent},
  author={Wu, Christopher and Chen, Zhaorun and Cai, Michael and
          Li, Bo and Zhu, Zheqing},
  institution={Pokee AI and University of Chicago and UIUC},
  year={2026},
}`,
}

export const INDUSTRY_REPORTS: IndustryReport[] = [POKEE_ISAAC_REPORT]

/** The report promoted on the homepage and in the announcement banner. */
export const FEATURED_REPORT = POKEE_ISAAC_REPORT

export function getIndustryReport(slug: string): IndustryReport | undefined {
  return INDUSTRY_REPORTS.find((report) => report.slug === slug)
}

/** Canonical URL for a report's detail page. */
export function industryReportHref(slug: string): string {
  return `/community/industry/${slug}`
}

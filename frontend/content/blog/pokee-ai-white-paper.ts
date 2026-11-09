import type { BlogPost } from "@/lib/blog-types"

export const pokeeWhitePaper: BlogPost = {
  slug: "pokee-ai-white-paper",
  title: "Pokee AI Benchmarks Enterprise Agent Security with DTap",
  description: "Pokee AI uses DTap to measure prompt-injection resistance, direct misuse, and useful task completion in a complete agent system.",
  category: "Whitepaper",
  date: "2026-09",
  dateLabel: "September 2026",
  author: "DecodingTrust Team",
  cover: "/blog/pokee-ai/cover.png",
  coverAlt: "Original first page of Pokee AI’s Enterprise Agent and Model Security white paper",
  blocks: [
    {
      type: "paragraph",
      text: "DTap puts attack resistance and useful task completion on the same evaluation footing. Pokee AI uses it to assess Pokee-Isaac 28B v0.1 as a complete agent system across 14 domains, covering direct misuse and indirect prompt injection.",
    },
    {
      type: "paragraph",
      text: "That is an important distinction for enterprise adoption. An agent operates with a particular model, scaffold, set of connectors, and permissions. Teams need to understand how those pieces behave together when a user asks for legitimate work and when an attacker tries to redirect it. DTap provides the shared environments and outcome checks needed to study that behavior as a system.",
    },
    { type: "heading", text: "A common testbed for comparing agent systems" },
    {
      type: "paragraph",
      text: "The white paper includes a controlled comparison across 12 Linux domains, with the same judge. Pokee-Isaac records 8.3% indirect attack success, 30.5% direct attack success, and 85.6% benign task success. It runs in its own scaffold, while the five comparison models use the stock runner; these are system-level measurements.",
    },
    {
      type: "figure", src: "/blog/pokee-ai/table-8.png", width: 1138, height: 344,
      alt: "The original six-system comparison table from Pokee’s white paper, showing direct ASR, indirect ASR, combined ASR, benign task success, and serving routes.",
      caption: "Macro-average over the same 12 Linux domains and judge, sorted by combined ASR (lower is safer). Pokee-Isaac uses its own scaffold.",
      sourceLabel: "Table 8.", sourceHref: "/papers/pokee-ai-dtap-security-whitepaper.pdf#page=24",
    },
    {
      type: "paragraph",
      text: "Reporting benign task success alongside attack success makes the comparison useful to a deployment team. A system that refuses more work can look safer without serving its users better. The paper’s DTap evaluation keeps both measurements visible, so readers can examine whether a security result comes with a change in practical capability.",
    },
    { type: "heading", text: "Following the complete agent stack" },
    {
      type: "paragraph",
      text: "The paper’s reference architecture shows why an agent needs end-to-end testing. A decision can travel through planning, memory, tools, retrieval, and enterprise systems before its effects become visible. Testing a prompt alone misses much of that path.",
    },
    {
      type: "figure", src: "/blog/pokee-ai/figure-1.png", width: 1125, height: 855,
      alt: "Pokee’s original enterprise agent architecture, showing client surfaces, the agent harness, tools, retrieval, serving, and systems of record.",
      caption: "Today’s enterprise agent stack, drawn without security modules. Solid arrows are the request path; dashed arrows are telemetry.",
      sourceLabel: "Figure 1.", sourceHref: "/papers/pokee-ai-dtap-security-whitepaper.pdf#page=7",
    },
    { type: "heading", text: "Turning evaluation into concrete security work" },
    {
      type: "paragraph",
      text: "The hardened architecture adds eight security modules around those boundaries. For teams using DTap, the follow-up questions are practical: which boundary did an attack cross, what action occurred, and does a mitigation preserve the user’s legitimate task? The complete trajectory and resulting state give developers something concrete to investigate.",
    },
    {
      type: "figure", src: "/blog/pokee-ai/figure-2.png", width: 1097, height: 1516,
      alt: "Pokee’s original hardened architecture, with eight security modules added to the same enterprise agent stack.",
      caption: "The same architecture with security modules baked in. Green blocks are added; grey blocks are unchanged from Figure 1.",
      sourceLabel: "Figure 2.", sourceHref: "/papers/pokee-ai-dtap-security-whitepaper.pdf#page=12",
    },
    { type: "heading", text: "A practical role for DTap in enterprise evaluation" },
    {
      type: "paragraph",
      text: "Pokee AI’s study illustrates how DTap can support an enterprise security assessment: define the permitted task, introduce a direct request or an indirect injection, and examine what the agent actually does. The resulting traces and outcome checks make the assessment concrete enough to inform engineering work, rather than ending at a leaderboard position.",
    },
    {
      type: "paragraph",
      text: "The same evaluation pattern is relevant when teams compare models, adjust a tool interface, or add a new security control. Retaining the tested configuration and reading attack success together with benign utility helps them explain a change in behavior. The white paper is one published example of DTap being used to connect agent security research with the decisions involved in building enterprise systems.",
    },
  ],
  sources: [
    { label: "Pokee AI’s original article", href: "https://pokee.ai/security/agent-security" },
    { label: "Enterprise Agent and Model Security — full white paper", href: "/papers/pokee-ai-dtap-security-whitepaper.pdf" },
    { label: "DTap platform paper", href: "https://arxiv.org/abs/2605.04808" },
    { label: "Start evaluating agents with DTap", href: "/quickstart" },
  ],
}

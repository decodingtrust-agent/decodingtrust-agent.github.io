import type { BlogPost } from "@/lib/blog-types"

const report = "https://research.meta.ai/static/muse-spark-1-3-evaluation-report"

export const museSparkEvaluation: BlogPost = {
  slug: "muse-spark-1-3-evaluation-report",
  title: "Meta Uses DTap to Red-Team Muse Spark 1.3",
  description: "DTap provides realistic environments and adaptive attacks for Meta’s tool-use and browser-use safety evaluations.",
  category: "Evaluation",
  date: "2026-10-23",
  dateLabel: "October 23, 2026",
  author: "DecodingTrust Team",
  cover: "/blog/muse-spark-1-3/cover.png",
  coverAlt: "Original first page of Meta’s Muse Spark 1.3 Evaluation Report",
  blocks: [
    {
      type: "paragraph",
      text: "Meta uses DecodingTrust-Agent in its Muse Spark 1.3 safety evaluation to test whether agents can be redirected while using tools and browsers. DTap brings the target environments and adaptive red-teaming into the same evaluation workflow.",
    },
    {
      type: "paragraph",
      text: "For an agent team, a release decision needs evidence about the actions a system can take. A convincing answer in a chat window is only part of that picture. Once an assistant can read an inbox, edit a document, or operate a browser, testing needs to follow the interaction through to its effects in the environment.",
    },
    { type: "heading", text: "One platform, two threat models" },
    {
      type: "paragraph",
      text: "DTap-Red searches for both harmful requests and instructions hidden in external content. Meta adapts DTap’s tool interfaces to the API and Muse harnesses, evaluating both configurations against adaptive attacks.",
    },
    { type: "heading", text: "Testing direct misuse with DTap" },
    {
      type: "paragraph",
      text: "On the DTap direct-misuse evaluation, Meta reports 5.6% attack success for the API configuration and 10.0% for Muse.",
    },
    {
      type: "figure", src: "/blog/muse-spark-1-3/figure-25.png", width: 1250, height: 769,
      alt: "Meta’s original DTap direct-misuse chart, including model comparisons and error bars.",
      caption: "DTap Direct Misuse Benchmark. We report the Attack Success Rate (ASR).",
      sourceLabel: "Figure 25.", sourceHref: `${report}#page=61`,
    },
    { type: "heading", text: "Testing prompt injection with DTap" },
    {
      type: "paragraph",
      text: "DTap also tests attacks delivered through tools and environments during legitimate tasks. Both Muse configurations report 4.0% tool-use ASR; browser-use ASR is 17.5% for API and 10.0% for Muse.",
    },
    {
      type: "figure", src: "/blog/muse-spark-1-3/figure-29.png", width: 1250, height: 769,
      alt: "Meta’s original DTap prompt-injection chart with browser-use and tool-use results, legend, and error bars.",
      caption: "DTap Prompt Injection Benchmark. Attack success (pass@1) across the tool-use and browser-use subsets.",
      sourceLabel: "Figure 29.", sourceHref: `${report}#page=66`,
    },
    { type: "heading", text: "From model testing to industry workflows" },
    {
      type: "paragraph",
      text: "DTap combines realistic task environments, an autonomous attacker, and verifiable outcomes. Its simulated services cover familiar workflows in products such as Google Workspace, PayPal, and Slack. This gives engineering teams a place to test an agent’s interactions with external information and tools, while keeping the task and the security goal explicit.",
    },
    {
      type: "paragraph",
      text: "Meta’s assessment and Pokee AI’s enterprise security study show two complementary industry applications: evaluating a frontier agent configuration and comparing an enterprise agent system. Across both, the practical question is what happens when an agent is given tools, access, and an attacker-controlled input. DTap supplies a common setting for investigating that question.",
    },
    { type: "heading", text: "Evidence teams can act on" },
    {
      type: "paragraph",
      text: "For a team reviewing a new model, tool integration, or agent scaffold, the useful output is a connection between the attempted attack, the resulting tool actions, and the task outcome. That context helps developers decide which boundary to inspect and what to test again after a mitigation. It also keeps a security score connected to the system that produced it.",
    },
    {
      type: "paragraph",
      text: "For evaluators, the workflow is reusable: put an agent in a realistic task, adapt an attack, and inspect the resulting actions. DTap makes that workflow available across models and agent configurations, with outcomes that can be examined and retested.",
    },
  ],
  sources: [
    { label: "Meta’s original evaluation — Section 3.2", href: `${report}#page=59` },
    { label: "DTap platform paper", href: "https://arxiv.org/abs/2605.04808" },
    { label: "How Pokee AI evaluates enterprise agents with DTap", href: "/blog/pokee-ai-white-paper" },
    { label: "Start evaluating agents with DTap", href: "/quickstart" },
  ],
}

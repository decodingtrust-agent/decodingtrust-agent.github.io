import Link from "next/link"
import {
  ArrowRight,
  Book,
  Database,
  Server,
  Zap,
  Shield,
  Cpu,
  Play,
  Package,
} from "lucide-react"

import { DocsArticle } from "@/components/docs/article-shell"
import { DOMAINS } from "@/lib/domains"
import { environments } from "@/lib/environments.generated"

export const metadata = {
  title: "Documentation | DTap",
  description:
    "Quick start, environments, domains, supported agents, and red-teaming guides for the DecodingTrust-Agent Platform.",
}

const TOP_LINKS = [
  { title: "Quick Start", href: "/docs/quick-start", desc: "Run your first benchmark in 5 minutes.", icon: Zap },
  { title: "Install from Source", href: "/docs/install-source", desc: "Clone, set up the venv, install editable.", icon: Package },
  { title: "Eval with decodingtrust-agent", href: "/docs/eval-decodingtrust", desc: "Run a JSONL of tasks across 14 domains.", icon: Play },
  { title: "Off-the-Shelf Agents", href: "/docs/off-the-shelf-agents", desc: "OpenAI, Claude, Google, LangChain, OpenClaw.", icon: Cpu },
  { title: "Red-teaming Overview", href: "/docs/red-teaming-overview", desc: "Adversarial loop, attack skills, judges.", icon: Shield },
]

export default function DocsLandingPage() {
  const totalEnvs = environments.length
  return (
    <DocsArticle title="DecodingTrust-Agent Platform documentation">
      <p className="mb-10 text-base text-muted-foreground md:text-lg">
        DTap is a full-stack simulation world for AI agent red-teaming, simulating{" "}
        <strong className="text-foreground">50+ realistic environments</strong>{" "}
        across <strong className="text-foreground">{DOMAINS.length} high-stakes domains</strong>{" "}
        with diverse attack injection interfaces to enable scalable, reproducible, and
        transferable evaluation of agent security under realistic multi-surface attacks.
      </p>

      <div className="mb-12 grid gap-4 md:grid-cols-2">
        {TOP_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 p-4 transition-all hover:border-primary/40 hover:shadow-md"
          >
            <link.icon className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{link.title}</h3>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{link.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold tracking-tight">Browse by domain</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {DOMAINS.map((d) => {
            const envCount = environments.filter((e) => e.domainKey === d.key).length
            return (
              <Link
                key={d.key}
                href={`/docs/domains/${d.key}`}
                className="group flex items-center justify-between rounded-lg border border-border/60 bg-card/60 px-3 py-2.5 text-sm transition-colors hover:bg-secondary/40"
              >
                <span className="font-medium">{d.label}</span>
                <span className="text-xs text-muted-foreground">
                  {envCount}
                  <ArrowRight className="ml-1.5 inline-block h-3 w-3 -translate-y-px transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold tracking-tight">Browse environments</h2>
          </div>
          <Link
            href="/docs/environments"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            See all {totalEnvs} →
          </Link>
        </div>
        <p className="text-muted-foreground">
          Each environment ships intro prose, GUI screenshots, MCP tool inventory, and
          policy-aligned attack categories. Open the <strong>Environment</strong>{" "}
          section in the sidebar.
        </p>
      </section>
    </DocsArticle>
  )
}

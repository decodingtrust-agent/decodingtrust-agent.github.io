import { Shield, Target, Zap, Lock, FileSearch, Bot } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "High-Fidelity Sandboxes",
    description:
      "30+ realistic environments including Gmail, PayPal, Databricks across finance, healthcare, and e-commerce.",
    highlight: "30+ environments",
  },
  {
    icon: Target,
    title: "Policy-Aligned Evaluation",
    description:
      "Risks derived from domain-specific policies like FINRA in Finance and Salesforce AI Use Policy for regulatory compliance.",
    highlight: "Real policies",
  },
  {
    icon: Bot,
    title: "Autonomous Red-Team Agent",
    description:
      "First autonomous agent that iteratively optimizes attack vectors and injection locations to uncover vulnerabilities.",
    highlight: "Novel approach",
  },
  {
    icon: Lock,
    title: "Black-Box Evaluation",
    description:
      "Unified protocol supporting evaluation of any agentic system including Claude Code, Cursor, and custom agents.",
    highlight: "Universal",
  },
  {
    icon: FileSearch,
    title: "Comprehensive Task Coverage",
    description:
      "Over 500 benign and malicious tasks per domain ensuring thorough security evaluation across attack surfaces.",
    highlight: "500+ tasks",
  },
  {
    icon: Zap,
    title: "Scalable Discovery",
    description:
      "Efficiently discover diverse, policy-aligned attack vectors with high success rates through automated optimization.",
    highlight: "High ASR",
  },
]

export function FeaturesSection() {
  return (
    <section className="border-t border-border/50 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-20 md:py-28 relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-4">
            <Shield className="h-3 w-3" />
            Core Capabilities
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Comprehensive Security Evaluation</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Built for researchers and practitioners to rigorously test AI agent security across real-world regulatory
            scenarios.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group relative p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:bg-card/80 transition-all duration-300 ${
                index === 0 ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
                    {feature.highlight}
                  </span>
                </div>

                <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

"use client"

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

        <div className="mt-12 p-6 rounded-2xl border border-border/50 bg-card/30">
          <h3 className="text-sm font-semibold mb-4 text-muted-foreground">Featured Sandbox Environments</h3>
          <div className="flex flex-wrap gap-2">
            {[
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
            ].map((env) => (
              <span key={env} className="px-3 py-1.5 text-sm rounded-lg bg-secondary/50 border border-border/50">
                {env}
              </span>
            ))}
            <span className="px-3 py-1.5 text-sm rounded-lg bg-primary/10 border border-primary/20 text-primary">
              + more
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

"use client"

import { Copy, Check, AlertTriangle, Terminal, Package, Database, ArrowRight, X } from "lucide-react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

// Environment definitions with metadata
const ENVIRONMENTS = {
  "Enterprise Software": [
    { id: "salesforce", name: "Salesforce", package: "dta-salesforce" },
    { id: "servicenow", name: "ServiceNow", package: "dta-servicenow" },
    { id: "jira", name: "Atlassian Jira", package: "dta-jira" },
    { id: "databricks", name: "Databricks", package: "dta-databricks" },
    { id: "snowflake", name: "Snowflake", package: "dta-snowflake" },
    { id: "orangehrm", name: "OrangeHRM", package: "dta-orangehrm" },
  ],
  Communication: [
    { id: "gmail", name: "Gmail", package: "dta-gmail" },
    { id: "gcalendar", name: "Google Calendar", package: "dta-gcalendar" },
    { id: "zoom", name: "Zoom", package: "dta-zoom" },
    { id: "slack", name: "Slack", package: "dta-slack" },
    { id: "sms", name: "SMS Sender", package: "dta-sms" },
  ],
  "Finance & Commerce": [
    { id: "paypal", name: "PayPal", package: "dta-paypal" },
    { id: "booking", name: "Booking.com", package: "dta-booking" },
  ],
  "OS & Development": [
    { id: "windows", name: "Windows OS", package: "dta-windows" },
    { id: "macos", name: "MacOS", package: "dta-macos" },
    { id: "filesystem", name: "OS Filesystem", package: "dta-filesystem" },
    { id: "browser", name: "Browser", package: "dta-browser" },
    { id: "code", name: "Code Repos", package: "dta-code" },
  ],
  Specialized: [
    { id: "hospital", name: "Hospital", package: "dta-hospital" },
    { id: "arxiv", name: "Arxiv Website", package: "dta-arxiv" },
    { id: "recommendation", name: "Product Catalog", package: "dta-recommendation" },
  ],
} as const

type EnvironmentId = (typeof ENVIRONMENTS)[keyof typeof ENVIRONMENTS][number]["id"]

// Domain definitions
const DOMAINS = [
  { id: "code", name: "Code", envs: ["code", "browser"] },
  { id: "os-terminal", name: "OS Terminal", envs: ["windows", "macos", "filesystem"] },
  { id: "os-gui", name: "OS GUI", envs: ["windows", "macos", "browser"] },
  { id: "ecommerce", name: "E-commerce", envs: ["paypal", "booking"] },
  { id: "workflow", name: "Workflow", envs: ["jira", "slack", "gcalendar"] },
  { id: "hr", name: "HR", envs: ["orangehrm", "servicenow"] },
  { id: "recommendation", name: "Recommendation", envs: ["recommendation"] },
  { id: "customer-service", name: "Customer Service", envs: ["servicenow", "salesforce"] },
  { id: "travel", name: "Travel", envs: ["booking", "gcalendar"] },
  { id: "finance", name: "Finance", envs: ["paypal", "databricks", "snowflake"] },
  { id: "legal", name: "Legal", envs: ["salesforce", "servicenow"] },
  { id: "telecom", name: "Telecom", envs: ["sms", "slack", "zoom"] },
  { id: "crm", name: "CRM", envs: ["salesforce", "servicenow"] },
  { id: "healthcare", name: "Healthcare", envs: ["hospital"] },
  { id: "research", name: "Research", envs: ["arxiv", "databricks"] },
] as const

export function QuickstartSection() {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null)
  const [selectedEnvs, setSelectedEnvs] = useState<EnvironmentId[]>([])
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [activeMode, setActiveMode] = useState<"environment" | "domain">("environment")

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(id)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const toggleEnv = (envId: EnvironmentId) => {
    setSelectedEnvs((prev) => (prev.includes(envId) ? prev.filter((e) => e !== envId) : [...prev, envId]))
  }

  const toggleDomain = (domainId: string) => {
    setSelectedDomains((prev) => (prev.includes(domainId) ? prev.filter((d) => d !== domainId) : [...prev, domainId]))
  }

  const selectAll = () => {
    const allEnvs = Object.values(ENVIRONMENTS)
      .flat()
      .map((e) => e.id)
    setSelectedEnvs(allEnvs as EnvironmentId[])
  }

  const clearSelection = () => {
    setSelectedEnvs([])
    setSelectedDomains([])
  }

  // Generate install command based on selection
  const installCommand = useMemo(() => {
    if (selectedEnvs.length === 0) {
      return "pip install decodingtrust-agent"
    }
    if (selectedEnvs.length === Object.values(ENVIRONMENTS).flat().length) {
      return "pip install decodingtrust-agent[all]"
    }
    const packages = selectedEnvs
      .map((envId) => {
        const env = Object.values(ENVIRONMENTS)
          .flat()
          .find((e) => e.id === envId)
        return env?.package
      })
      .filter(Boolean)
    return `pip install decodingtrust-agent[${packages.join(",")}]`
  }, [selectedEnvs])

  // Generate dataset download command
  const datasetCommand = useMemo(() => {
    if (selectedEnvs.length === 0) {
      return "dta download --dataset all"
    }
    return `dta download --dataset ${selectedEnvs.join(",")}`
  }, [selectedEnvs])

  // Generate run command
  const runCommand = useMemo(() => {
    if (selectedEnvs.length === 0) {
      return `dta run --all-envs --agent "your-agent" --model "gpt-5"`
    }
    return `dta run --envs ${selectedEnvs.join(",")} --agent "your-agent" --model "gpt-5"`
  }, [selectedEnvs])

  return (
    <section className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-4">
            <Terminal className="h-3 w-3" />
            Getting Started
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-3">Quickstart Guide</h1>
          <p className="text-muted-foreground">
            Select environments or domains to generate custom installation and run commands.
          </p>
        </div>

        <Alert className="mb-6 border-warning/30 bg-warning/5">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Beta Notice</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            The API is under active development. Please pin your version for production use.
          </AlertDescription>
        </Alert>

        {/* Selection mode tabs */}
        <div className="mb-6">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveMode("environment")}
              className={cn(
                "px-4 py-2 text-sm rounded-lg transition-colors",
                activeMode === "environment"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              By Environment
            </button>
            <button
              onClick={() => setActiveMode("domain")}
              className={cn(
                "px-4 py-2 text-sm rounded-lg transition-colors",
                activeMode === "domain"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              By Domain
            </button>
          </div>

          {/* Environment selection */}
          {activeMode === "environment" && (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Select Environments</h3>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="text-xs text-primary hover:underline">
                    Select all
                  </button>
                  <span className="text-muted-foreground">|</span>
                  <button onClick={clearSelection} className="text-xs text-muted-foreground hover:text-foreground">
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(ENVIRONMENTS).map(([category, envs]) => (
                  <div key={category}>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {envs.map((env) => (
                        <button
                          key={env.id}
                          onClick={() => toggleEnv(env.id as EnvironmentId)}
                          className={cn(
                            "px-3 py-1.5 text-xs rounded-md border transition-all",
                            selectedEnvs.includes(env.id as EnvironmentId)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
                          )}
                        >
                          {env.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Domain selection */}
          {activeMode === "domain" && (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Select Domains</h3>
                <button onClick={clearSelection} className="text-xs text-muted-foreground hover:text-foreground">
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {DOMAINS.map((domain) => (
                  <button
                    key={domain.id}
                    onClick={() => toggleDomain(domain.id)}
                    className={cn(
                      "px-3 py-1.5 text-xs rounded-md border transition-all",
                      selectedDomains.includes(domain.id)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
                    )}
                  >
                    {domain.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selected items display */}
        {selectedEnvs.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            {selectedEnvs.map((envId) => {
              const env = Object.values(ENVIRONMENTS)
                .flat()
                .find((e) => e.id === envId)
              return (
                <span
                  key={envId}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary border border-primary/20"
                >
                  {env?.name}
                  <button onClick={() => toggleEnv(envId)} className="hover:text-primary/70">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )
            })}
          </div>
        )}

        {/* Generated commands */}
        <div className="space-y-4">
          {/* Install command */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Installation</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => copyToClipboard(installCommand, "install")}
              >
                {copiedIndex === "install" ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <pre className="p-3 overflow-x-auto">
              <code className="text-sm font-mono">{installCommand}</code>
            </pre>
          </div>

          {/* Dataset download command */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Download Dataset</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => copyToClipboard(datasetCommand, "dataset")}
              >
                {copiedIndex === "dataset" ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <pre className="p-3 overflow-x-auto">
              <code className="text-sm font-mono">{datasetCommand}</code>
            </pre>
          </div>

          {/* Run command */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Run Evaluation</span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => copyToClipboard(runCommand, "run")}>
                {copiedIndex === "run" ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <pre className="p-3 overflow-x-auto">
              <code className="text-sm font-mono">{runCommand}</code>
            </pre>
          </div>

          {/* Python API example */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Python API</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() =>
                  copyToClipboard(
                    `from decodingtrust_agent import Benchmark, Agent

# Initialize with selected environments
benchmark = Benchmark(environments=${JSON.stringify(selectedEnvs.length > 0 ? selectedEnvs : ["all"])})

# Load your agent
agent = Agent.from_config("your-agent-config.yaml")

# Run evaluation
results = benchmark.evaluate(agent)
print(results.summary())`,
                    "python",
                  )
                }
              >
                {copiedIndex === "python" ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <pre className="p-3 overflow-x-auto">
              <code className="text-sm font-mono text-foreground">
                {`from decodingtrust_agent import Benchmark, Agent

# Initialize with selected environments
benchmark = Benchmark(environments=${JSON.stringify(selectedEnvs.length > 0 ? selectedEnvs : ["all"])})

# Load your agent
agent = Agent.from_config("your-agent-config.yaml")

# Run evaluation
results = benchmark.evaluate(agent)
print(results.summary())`}
              </code>
            </pre>
          </div>
        </div>

        {/* Next steps */}
        <div className="mt-8 p-4 rounded-lg border border-border bg-card/50">
          <h3 className="text-sm font-semibold mb-3">Next Steps</h3>
          <ul className="space-y-2">
            {[
              "Read the full documentation for advanced configuration",
              "Explore example notebooks for common use cases",
              "Join our Discord community for support",
              "Check out the leaderboard to see how agents compare",
            ].map((item, idx) => (
              <li key={idx}>
                <a
                  href="#"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowRight className="h-3.5 w-3.5 text-primary" />
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

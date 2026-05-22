"use client"

import { Copy, Check, Terminal, Package, Database, ArrowRight, KeyRound } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const INSTALL_CMD = "pip install decodingtrust-agent-sdk"

const API_KEY_CMD = `# Export the key(s) for the providers you'll evaluate against
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...
export GOOGLE_API_KEY=...`

const DATASET_CMD = `# Pull the dataset/ folder from HuggingFace (~216 MB)
hf download AI-Secure/DecodingTrust-Agent-Platform \\
  --repo-type dataset \\
  --local-dir dataset`

const RUN_CMD = `dtap eval \\
  --task-list benchmark/crm/benign.jsonl \\
  --agent-type openaisdk \\
  --model gpt-4o \\
  --max-parallel 4`

export function QuickstartSection() {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(id)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

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
            Install the SDK, set your provider key, pull the benchmark dataset, and run an
            evaluation. Docker sandboxes are pulled on demand by the first task that needs them.
          </p>
        </div>

        <div className="space-y-4">
          <CommandBlock
            icon={<Package className="h-4 w-4 text-primary" />}
            title="1. Install the SDK"
            subtitle="Includes the dtap CLI and every supported agent framework"
            command={INSTALL_CMD}
            copyKey="install"
            copiedIndex={copiedIndex}
            onCopy={copyToClipboard}
          />

          <CommandBlock
            icon={<KeyRound className="h-4 w-4 text-primary" />}
            title="2. Set provider API keys"
            subtitle="Only the providers you'll actually use are required"
            command={API_KEY_CMD}
            copyKey="apikey"
            copiedIndex={copiedIndex}
            onCopy={copyToClipboard}
          />

          <CommandBlock
            icon={<Database className="h-4 w-4 text-primary" />}
            title="3. Download the dataset from HuggingFace"
            subtitle="Per-task config.yaml / judge.py / setup.sh files used by the evaluator"
            command={DATASET_CMD}
            copyKey="dataset"
            copiedIndex={copiedIndex}
            onCopy={copyToClipboard}
          />

          <CommandBlock
            icon={<Terminal className="h-4 w-4 text-primary" />}
            title="4. Run an evaluation"
            subtitle="Single benign CRM task on the OpenAI Agents SDK backbone"
            command={RUN_CMD}
            copyKey="run"
            copiedIndex={copiedIndex}
            onCopy={copyToClipboard}
          />

        </div>

        <div className="mt-8 p-4 rounded-lg border border-border bg-card/50">
          <h3 className="text-sm font-semibold mb-3">Next Steps</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href="/docs/install-sdk"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowRight className="h-3.5 w-3.5 text-primary" />
                Full SDK installation guide
              </a>
            </li>
            <li>
              <a
                href="/docs/eval-decodingtrust"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowRight className="h-3.5 w-3.5 text-primary" />
                <code className="font-mono">dtap eval</code> reference and flag-by-flag walkthrough
              </a>
            </li>
            <li>
              <a
                href="/docs/wrap-prebuilt-agents"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowRight className="h-3.5 w-3.5 text-primary" />
                Wrap your own agent with <code className="font-mono">build_agent</code>
              </a>
            </li>
            <li>
              <a
                href="/docs/install-environment"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowRight className="h-3.5 w-3.5 text-primary" />
                Per-environment Docker setup (advanced)
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}

interface CommandBlockProps {
  icon: React.ReactNode
  title: string
  subtitle?: string
  command: string
  copyKey: string
  copiedIndex: string | null
  onCopy: (text: string, id: string) => void
}

function CommandBlock({ icon, title, subtitle, command, copyKey, copiedIndex, onCopy }: CommandBlockProps) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{title}</div>
            {subtitle ? <div className="text-xs text-muted-foreground truncate">{subtitle}</div> : null}
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-7 px-2 shrink-0" onClick={() => onCopy(command, copyKey)}>
          {copiedIndex === copyKey ? (
            <Check className="h-3.5 w-3.5 text-success" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      <pre className="p-3 overflow-x-auto">
        <code className="text-sm font-mono whitespace-pre">{command}</code>
      </pre>
    </div>
  )
}

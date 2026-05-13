"use client"

import { GitBranch, Terminal, Package, KeyRound } from "lucide-react"
import { CodeBlock } from "../code-block"
import { Callout } from "../callout"

export function InstallFromSourceContent() {
  return (
    <div>
      <p className="text-lg text-muted-foreground leading-relaxed mb-8">
        Clone the DecodingTrust-Agent Platform repository and install it in editable mode.
        This is the recommended setup for contributors and anyone running evaluations end
        to end (agents + judges + dataset).
      </p>

      <Callout type="info" title="Prerequisites">
        Python 3.10+, <code>git</code>, Docker (for the per-domain sandbox containers), and
        an API key for at least one model provider.
      </Callout>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-accent" />
          Step 1 — Clone the repository
        </h2>
        <CodeBlock
          code={`git clone https://github.com/AI-secure/DecodingTrust-Agent.git
cd DecodingTrust-Agent`}
          language="bash"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-accent" />
          Step 2 — Install Python dependencies
        </h2>
        <p className="text-muted-foreground mb-3">
          The repo ships with both <code>requirements.txt</code> and a <code>pyproject.toml</code>.
          We recommend a fresh virtual environment, then editable install so changes you
          make to <code>agent/</code>, <code>dt_arena/</code>, and <code>dt_arms/</code> are
          picked up live.
        </p>
        <CodeBlock
          code={`python3 -m venv .venv
source .venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
pip install -e .`}
          language="bash"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Terminal className="h-5 w-5 text-accent" />
          Step 3 — Optional framework SDKs
        </h2>
        <p className="text-muted-foreground mb-3">
          The base install gives you OpenAI Agents SDK, Claude Agent SDK, Google ADK,
          LangChain, and PocketFlow wrappers. OpenClaw is optional and requires the
          OpenClaw CLI:
        </p>
        <CodeBlock
          code={`# OpenClaw CLI (only needed for the OpenClaw agent wrapper)
npm install -g openclaw
openclaw models auth paste-token --provider openai`}
          language="bash"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-accent" />
          Step 4 — Configure API keys
        </h2>
        <p className="text-muted-foreground mb-3">
          Create a <code>.env</code> at the repo root with the keys for whichever
          providers you plan to use:
        </p>
        <CodeBlock
          code={`# .env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...

# Optional: pin a port range for parallel evaluation
DT_PORT_RANGE=10000-12000`}
          language="bash"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Step 5 — Sanity check</h2>
        <p className="text-muted-foreground mb-3">
          Run the OpenAI SDK example agent against a single benign CRM task. This pulls
          one Salesforce sandbox container and exits in ~2 minutes.
        </p>
        <CodeBlock
          code={`python agent/openaisdk/example.py \\
  --config dataset/crm/benign/1/config.yaml \\
  --model gpt-4o`}
          language="bash"
        />
        <p className="text-muted-foreground mt-3">
          You should see a trajectory file written to{" "}
          <code>results/openaisdk/crm/benign/1/&lt;timestamp&gt;.json</code>.
        </p>
      </div>

      <Callout type="success" title="Next">
        Continue to <strong>Install Environment</strong> to bring up the per-domain Docker
        sandboxes you'll evaluate against, or jump to{" "}
        <strong>Eval with decodingtrust-agent</strong> to run a full task list.
      </Callout>
    </div>
  )
}

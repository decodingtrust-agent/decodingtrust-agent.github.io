"use client"

import { Package, KeyRound, Database, Terminal, CheckCircle2 } from "lucide-react"
import { CodeBlock } from "../code-block"
import { Callout } from "../callout"

export function InstallSdkContent() {
  return (
    <div>
      <p className="text-lg text-muted-foreground leading-relaxed mb-8">
        The fastest way to use DTap is via the <code>decodingtrust-agent-sdk</code> package on
        PyPI. It ships the <code>dtap</code> CLI, every supported agent framework backend, and the
        benchmark task lists. The per-task dataset and the Docker sandboxes are fetched
        on demand.
      </p>

      <Callout type="info" title="Prerequisites">
        Python 3.10+, <code>pip</code>, Docker Engine 24+ with the <code>compose</code> plugin (for
        the per-task sandbox containers), and an API key for at least one model provider (OpenAI,
        Anthropic, or Google).
      </Callout>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-accent" />
          Step 1 — pip install
        </h2>
        <p className="text-muted-foreground mb-3">
          A virtual environment is strongly recommended. The base install pulls every agent
          framework — the package is light enough that there's no reason to split it.
        </p>
        <CodeBlock
          code={`python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip

pip install decodingtrust-agent-sdk`}
          language="bash"
        />
        <p className="text-muted-foreground mt-3 text-sm">
          If you only want a single framework's deps, the optional extras{" "}
          <code>[openai]</code>, <code>[claude]</code>, <code>[google]</code>,{" "}
          <code>[langchain]</code>, <code>[pocketflow]</code>, and <code>[all]</code> are also
          defined.
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-accent" />
          Step 2 — Configure provider keys
        </h2>
        <p className="text-muted-foreground mb-3">
          Export the key(s) for the providers you plan to use. Only the providers you actually
          invoke are required:
        </p>
        <CodeBlock
          code={`export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...
export GOOGLE_API_KEY=...`}
          language="bash"
        />
        <p className="text-muted-foreground mt-3 text-sm">
          The SDK also reads <code>.env</code> files via <code>python-dotenv</code>, so dropping
          these in a <code>.env</code> at your working directory works as well.
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-accent" />
          Step 3 — Download the dataset
        </h2>
        <p className="text-muted-foreground mb-3">
          The per-task <code>config.yaml</code> / <code>judge.py</code> / <code>setup.sh</code>{" "}
          files that the evaluator consumes live on HuggingFace at{" "}
          <a
            href="https://huggingface.co/datasets/AI-Secure/DecodingTrust-Agent-Platform"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            AI-Secure/DecodingTrust-Agent-Platform
          </a>
          . Pull them into a <code>dataset/</code> folder next to where you'll run{" "}
          <code>dtap</code>:
        </p>
        <CodeBlock
          code={`# Install the HuggingFace CLI if you don't have it
pip install -U huggingface_hub

# Download the dataset/ folder (~216 MB)
hf download AI-Secure/DecodingTrust-Agent-Platform \\
  --repo-type dataset \\
  --local-dir dataset`}
          language="bash"
        />
        <p className="text-muted-foreground mt-3 text-sm">
          Alternatively, use the Python API for programmatic downloads:
        </p>
        <CodeBlock
          code={`from huggingface_hub import snapshot_download

snapshot_download(
    "AI-Secure/DecodingTrust-Agent-Platform",
    repo_type="dataset",
    local_dir="dataset",
)`}
          language="python"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-accent" />
          Step 4 — Verify the install
        </h2>
        <p className="text-muted-foreground mb-3">
          The package installs the <code>dtap</code> console script. Use the introspection
          subcommands to confirm everything is wired up:
        </p>
        <CodeBlock
          code={`# Show CLI help
dtap --help

# List the 14 benchmark domains and their task counts
dtap info domain

# List the Docker environments defined in dt_arena/config/env.yaml
dtap info env

# List the agent backends and which pip extra each one needs
dtap agent list`}
          language="bash"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Terminal className="h-5 w-5 text-accent" />
          Step 5 — Run your first evaluation
        </h2>
        <p className="text-muted-foreground mb-3">
          A single benign CRM task with the OpenAI Agents SDK backbone — Docker pulls the
          Salesforce sandbox on first run, finishes in a couple of minutes:
        </p>
        <CodeBlock
          code={`dtap eval \\
  --task-list benchmark/crm/benign.jsonl \\
  --agent-type openaisdk \\
  --model gpt-4o \\
  --max-parallel 4`}
          language="bash"
        />
        <p className="text-muted-foreground mt-3 text-sm">
          Results land under{" "}
          <code>results/benchmark/&lt;agent_type&gt;/&lt;model&gt;/&lt;domain&gt;/&lt;type&gt;/&lt;task_id&gt;/</code>{" "}
          (override the root with <code>EVAL_RESULTS_ROOT</code>).
        </p>
      </div>

      <Callout type="success" title="Working from source instead?">
        If you want to modify agent wrappers, hooks, or per-task config, install from source
        instead — see <strong>Install from Source</strong> for the editable-mode setup.
      </Callout>
    </div>
  )
}

"use client"

import { Play, FileJson, Settings, Activity } from "lucide-react"
import { CodeBlock } from "../code-block"
import { Callout } from "../callout"

export function EvalDecodingTrustContent() {
  return (
    <div>
      <p className="text-lg text-muted-foreground leading-relaxed mb-8">
        <code>eval/evaluation.py</code> is the canonical entrypoint: it consumes a JSONL
        list of tasks, brings up the per-task Docker sandboxes, runs your chosen agent
        framework against each task, calls the per-task <code>judge.py</code>, and writes
        a standardized trajectory + summary stats. Use this for full benchmark runs.
      </p>

      <Callout type="info" title="What you'll need">
        A working install (see <strong>Install from Source</strong>), Docker up, and a
        provider API key in <code>.env</code>. The first run of a domain pulls its sandbox
        images, which can take a few minutes.
      </Callout>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileJson className="h-5 w-5 text-accent" />
          Step 1 — Build your task file
        </h2>
        <p className="text-muted-foreground mb-3">
          Tasks are described in a JSONL file. The runner uses{" "}
          <code>{`{domain, type, task_id}`}</code> for benign tasks and adds{" "}
          <code>threat_model</code> + <code>risk_category</code> for malicious tasks. The
          path under <code>dataset/</code> is derived from those fields.
        </p>
        <CodeBlock
          code={`# tasks.jsonl
{"domain": "crm", "type": "benign", "task_id": 1}
{"domain": "crm", "type": "benign", "task_id": 2}
{"domain": "crm", "type": "malicious", "threat_model": "indirect", "risk_category": "data-exfiltration", "task_id": 3}
{"domain": "workflow", "type": "malicious", "threat_model": "direct", "risk_category": "manipulative-use", "task_id": 12}`}
          language="json"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Play className="h-5 w-5 text-accent" />
          Step 2 — Run the evaluation
        </h2>
        <CodeBlock
          code={`# Single-process baseline
python eval/evaluation.py \\
  --task-file tasks.jsonl \\
  --agent-type openaisdk \\
  --model gpt-4o \\
  --api-key "$OPENAI_API_KEY"

# Parallel — N tasks at once, dynamic ports for the sandboxes
python eval/evaluation.py \\
  --task-file tasks.jsonl \\
  --agent-type openaisdk \\
  --model gpt-4o \\
  --max-parallel 4 \\
  --port-range 10000-12000`}
          language="bash"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-accent" />
          Common CLI flags
        </h2>
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Flag</th>
                <th className="px-4 py-3 text-left font-medium">Default</th>
                <th className="px-4 py-3 text-left font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-2 font-mono text-xs">--task-file</td>
                <td className="px-4 py-2">required</td>
                <td className="px-4 py-2">JSONL of tasks to evaluate.</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">--agent-type</td>
                <td className="px-4 py-2">openaisdk</td>
                <td className="px-4 py-2">
                  One of <code>openaisdk</code>, <code>claudesdk</code>,{" "}
                  <code>googleadk</code>, <code>langchain</code>, <code>pocketflow</code>,{" "}
                  <code>openclaw</code>.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">--model</td>
                <td className="px-4 py-2">gpt-4o</td>
                <td className="px-4 py-2">Model identifier passed to the chosen wrapper.</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">--max-parallel</td>
                <td className="px-4 py-2">1</td>
                <td className="px-4 py-2">Concurrent task subprocesses.</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">--port-range</td>
                <td className="px-4 py-2">--</td>
                <td className="px-4 py-2">
                  E.g. <code>10000-12000</code>. Required for{" "}
                  <code>--max-parallel &gt; 1</code>.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">--domain</td>
                <td className="px-4 py-2">--</td>
                <td className="px-4 py-2">Filter the task file to a single domain.</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">--skip-setup</td>
                <td className="px-4 py-2">false</td>
                <td className="px-4 py-2">Skip per-task <code>setup.sh</code> (dev only).</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">--skip-mcp</td>
                <td className="px-4 py-2">false</td>
                <td className="px-4 py-2">Skip MCP server startup (mock/CLI tests).</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Single-task quick path</h2>
        <p className="text-muted-foreground mb-3">
          When iterating on a single task you can call the runner directly and skip the
          parent JSONL:
        </p>
        <CodeBlock
          code={`python eval/task_runner.py \\
  --task-dir dataset/crm/benign/4 \\
  --agent-type openaisdk \\
  --model gpt-4o`}
          language="bash"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-accent" />
          Output layout
        </h2>
        <p className="text-muted-foreground mb-3">
          Results land under <code>$EVAL_RESULTS_ROOT/benchmark/&lt;agent&gt;/&lt;dataset_path&gt;/</code>{" "}
          (default root is <code>./results</code>):
        </p>
        <CodeBlock
          code={`results/
└── openaisdk/
    └── crm/benign/4/
        ├── traces/
        │   └── traces_20261018_143052.jsonl       # Raw provider trace
        ├── 20261018_143052.json                    # Standardized trajectory
        └── judge_result.json                       # task_success / attack_success`}
          language="bash"
        />
      </div>

      <Callout type="success" title="Where this connects">
        The trajectories produced here are the same format published on the leaderboard,
        so you can drop them straight into the data-auditing UI. For attack runs use the
        red-teaming agent from the <strong>Red-teaming Agent</strong> section instead —
        it actively searches for working attacks rather than running a fixed task list.
      </Callout>
    </div>
  )
}

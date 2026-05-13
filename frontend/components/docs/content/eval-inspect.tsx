"use client"

import { Beaker, Workflow } from "lucide-react"
import { CodeBlock } from "../code-block"
import { Callout } from "../callout"

export function EvalInspectContent() {
  return (
    <div>
      <p className="text-lg text-muted-foreground leading-relaxed mb-8">
        DTap can be wrapped as an{" "}
        <a
          href="https://inspect.aisi.org.uk/"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4 hover:text-foreground"
        >
          inspect-ai
        </a>{" "}
        task so you can score it alongside the rest of your evaluation suite. The integration
        is intentionally thin — DTap owns the sandbox, the agent, and the judge; inspect-ai
        owns the run loop, sample registry, and aggregate scoring.
      </p>

      <Callout type="info" title="When this fits">
        Use this path when your team already runs a unified inspect-ai harness (e.g. for
        AISI / UK AI Safety evals, MathArena, or AgentHarm) and wants DTap as another task.
        For standalone DTap runs, the native runner from{" "}
        <strong>Eval with decodingtrust-agent</strong> is the simpler choice.
      </Callout>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Beaker className="h-5 w-5 text-accent" />
          Step 1 — Install inspect-ai
        </h2>
        <CodeBlock
          code={`pip install inspect-ai inspect-evals
# Verify
inspect --version`}
          language="bash"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Workflow className="h-5 w-5 text-accent" />
          Step 2 — Bridge the dataset
        </h2>
        <p className="text-muted-foreground mb-3">
          Convert DTap's JSONL task file into an inspect-ai <code>Sample</code> dataset.
          Each sample carries the task instruction as the input and the task directory as
          metadata so the solver can pick up <code>config.yaml</code>:
        </p>
        <CodeBlock
          code={`# dtap_inspect.py
from pathlib import Path
import json, yaml

from inspect_ai import Task, task
from inspect_ai.dataset import Sample, MemoryDataset
from inspect_ai.scorer import scorer, Score, accuracy
from inspect_ai.solver import solver, TaskState, Generate

REPO_ROOT = Path(__file__).resolve().parent

def _task_dir(spec: dict) -> Path:
    if spec["type"] == "benign":
        return REPO_ROOT / f"dataset/{spec['domain']}/benign/{spec['task_id']}"
    return (
        REPO_ROOT
        / f"dataset/{spec['domain']}/malicious/{spec['threat_model']}/{spec['risk_category']}/{spec['task_id']}"
    )

def _load_dataset(task_file: str) -> MemoryDataset:
    samples = []
    for line in Path(task_file).read_text().splitlines():
        spec = json.loads(line)
        td = _task_dir(spec)
        cfg = yaml.safe_load((td / "config.yaml").read_text())
        instruction = cfg["agent"]["instruction"]
        samples.append(
            Sample(
                input=instruction,
                metadata={"task_dir": str(td), "spec": spec},
                target="success",
            )
        )
    return MemoryDataset(samples)`}
          language="python"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Step 3 — Wrap the agent + judge</h2>
        <p className="text-muted-foreground mb-3">
          Re-use DTap's existing agent factory (<code>build_agent</code>) and judge
          loader. The solver runs the DTap agent inside the sandbox; the scorer calls
          DTap's per-task <code>judge.py</code>:
        </p>
        <CodeBlock
          code={`import asyncio, importlib.util

from dt_arena.src.types.agent import AgentConfig, RuntimeConfig
from agent.openaisdk import OpenAISDKAgent

@solver
def dtap_solver(model: str = "gpt-4o", max_turns: int = 100):
    async def solve(state: TaskState, generate: Generate) -> TaskState:
        td = Path(state.metadata["task_dir"])
        agent_cfg = AgentConfig.from_yaml(str(td / "config.yaml"))
        runtime_cfg = RuntimeConfig(
            model=model, temperature=0.1, max_turns=max_turns,
            output_dir=str(REPO_ROOT / "results/inspect"),
        )
        async with OpenAISDKAgent(agent_cfg, runtime_cfg) as agent:
            result = await agent.run(state.input, metadata={"task_id": td.name})
        state.output = result.final_output
        state.metadata["trajectory"] = result.trajectory
        return state
    return solve

@scorer(metrics=[accuracy()])
def dtap_judge():
    async def score(state: TaskState, target):
        td = Path(state.metadata["task_dir"])
        spec = importlib.util.spec_from_file_location("judge", td / "judge.py")
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        ok = bool(mod.task_success())
        attack = bool(getattr(mod, "attack_success", lambda: False)())
        return Score(
            value="C" if ok and not attack else "I",
            answer="task_success" if ok else "task_failure",
            metadata={"task_success": ok, "attack_success": attack},
        )
    return score`}
          language="python"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Step 4 — Declare the inspect-ai task</h2>
        <CodeBlock
          code={`@task
def dtap(task_file: str = "tasks.jsonl", model: str = "gpt-4o") -> Task:
    return Task(
        dataset=_load_dataset(task_file),
        solver=dtap_solver(model=model),
        scorer=dtap_judge(),
    )

# Run with the inspect CLI
#   inspect eval dtap_inspect.py:dtap -T task_file=tasks.jsonl -T model=gpt-4o`}
          language="python"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Step 5 — Run it</h2>
        <CodeBlock
          code={`inspect eval dtap_inspect.py:dtap \\
  -T task_file=tasks.jsonl \\
  -T model=gpt-4o \\
  --log-dir logs/dtap`}
          language="bash"
        />
        <p className="text-muted-foreground mt-3">
          Inspect's log viewer (<code>inspect view</code>) will show the per-sample state
          transcripts; the DTap trajectory is available under{" "}
          <code>state.metadata.trajectory</code> and gets written to{" "}
          <code>results/inspect/...</code> as well.
        </p>
      </div>

      <Callout type="warning" title="Sandbox isolation">
        Inspect's built-in sandboxing assumes containers it manages. DTap brings its own
        Docker stacks per task, so don't combine the inspect <code>--sandbox</code> flag
        with this solver — let DTap manage the lifecycle and have inspect orchestrate the
        sample loop only.
      </Callout>
    </div>
  )
}

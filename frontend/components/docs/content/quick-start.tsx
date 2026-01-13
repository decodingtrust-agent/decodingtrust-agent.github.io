"use client"

import { Zap, Terminal, Play, CheckCircle } from "lucide-react"
import { CodeBlock } from "../code-block"
import { Callout } from "../callout"

export function QuickStartContent() {
  return (
    <div>
      <p className="text-lg text-muted-foreground leading-relaxed mb-8">
        Get started with DecodingTrust Agent Suite in under 5 minutes. This guide will help you set up
        the evaluation framework and run your first benchmark.
      </p>

      <Callout type="info" title="Prerequisites">
        Python 3.10+, pip, and an API key for your preferred LLM provider (OpenAI, Anthropic, Google, etc.)
      </Callout>

      {/* Step 1 */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Terminal className="h-5 w-5 text-accent" />
          Step 1: Installation
        </h2>

        <CodeBlock
          code={`# Clone the repository
git clone https://github.com/decodingtrust-agent/dt-arena.git
cd dt-arena

# Install dependencies
pip install -e .

# Or install from PyPI
pip install decodingtrust-agent`}
          language="bash"
        />
      </div>

      {/* Step 2 */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-accent" />
          Step 2: Configure Environment
        </h2>

        <CodeBlock
          code={`# Create .env file with your API keys
cat > .env << 'EOF'
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
GOOGLE_API_KEY=your-google-key
EOF`}
          language="bash"
        />
      </div>

      {/* Step 3 */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Play className="h-5 w-5 text-accent" />
          Step 3: Run Your First Evaluation
        </h2>

        <CodeBlock
          code={`from dt_arena import evaluate
from dt_arena.agents import OpenAIAgent

# Create an agent
agent = OpenAIAgent(model="gpt-4o", temperature=0.1)

# Run evaluation on CRM domain
results = await evaluate(
    agent=agent,
    domain="crm",
    scenarios=["malicious"],
    output_dir="./results"
)

print(f"Safety score: {results.safety_score:.2%}")
print(f"Tasks completed: {results.tasks_completed}/{results.total_tasks}")`}
          language="python"
        />
      </div>

      {/* What's Next */}
      <div className="mt-8 border border-accent/30 rounded-lg p-6 bg-accent/5">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-accent" />
          What's Next?
        </h2>

        <ul className="space-y-3 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">1.</span>
            <span>
              <strong className="text-foreground">Explore Supported Agents</strong> - Learn how to use
              different agent frameworks or wrap your existing agents
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">2.</span>
            <span>
              <strong className="text-foreground">Understand Domains</strong> - Explore CRM, Workflow,
              and other evaluation domains
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">3.</span>
            <span>
              <strong className="text-foreground">Run Red-teaming</strong> - Test your agent against
              adversarial scenarios with AgentScanner
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">4.</span>
            <span>
              <strong className="text-foreground">Compare on Leaderboard</strong> - See how your agent
              performs against others
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}

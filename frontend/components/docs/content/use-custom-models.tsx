"use client"

import { Cpu, Server, Settings, Zap } from "lucide-react"
import { CodeBlock } from "../code-block"
import { Callout } from "../callout"

export function UseCustomModelsContent() {
  return (
    <div>
      <p className="text-lg text-muted-foreground leading-relaxed mb-8">
        Want to use a different LLM provider, local model, or custom endpoint? Configure our existing
        agent wrappers to use your custom model while keeping all the evaluation infrastructure.
      </p>

      <Callout type="info" title="Flexibility">
        Our agent wrappers accept model configuration through <code className="bg-secondary px-1 rounded">RuntimeConfig</code>.
        You can specify any model string supported by the underlying SDK.
      </Callout>

      {/* OpenAI-Compatible Endpoints */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Server className="h-5 w-5 text-accent" />
          OpenAI-Compatible Endpoints
        </h2>

        <p className="text-muted-foreground mb-4">
          Use any OpenAI-compatible API (vLLM, Ollama, Together AI, Groq, etc.) with our OpenAI SDK agent:
        </p>

        <CodeBlock
          code={`import os
from agent.openaisdk import OpenAISDKAgent
from dt_arena.src.types.agent import AgentConfig, RuntimeConfig

# Set custom base URL for OpenAI-compatible endpoint
os.environ["OPENAI_BASE_URL"] = "http://localhost:8000/v1"  # vLLM
# Or: "http://localhost:11434/v1"  # Ollama
# Or: "https://api.together.xyz/v1"  # Together AI
# Or: "https://api.groq.com/openai/v1"  # Groq

agent_config = AgentConfig.from_yaml("dataset/crm/benign/1/config.yaml")
runtime_config = RuntimeConfig(
    model="meta-llama/Llama-3.1-70B-Instruct",  # Your model name
    temperature=0.1,
    max_turns=100,
    output_dir="./results"
)

agent = OpenAISDKAgent(agent_config, runtime_config)
await agent.initialize()

result = await agent.run("List all contacts")
await agent.cleanup()`}
          language="python"
        />
      </div>

      {/* Local Models with Ollama */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Cpu className="h-5 w-5 text-accent" />
          Local Models with Ollama
        </h2>

        <CodeBlock
          code={`# First, start Ollama with your model
# ollama run llama3.1:70b

import os
from agent.openaisdk import OpenAISDKAgent
from dt_arena.src.types.agent import AgentConfig, RuntimeConfig

os.environ["OPENAI_BASE_URL"] = "http://localhost:11434/v1"
os.environ["OPENAI_API_KEY"] = "ollama"  # Ollama doesn't need a real key

runtime_config = RuntimeConfig(
    model="llama3.1:70b",
    temperature=0.1,
    max_turns=100,
    output_dir="./results"
)

agent = OpenAISDKAgent(
    AgentConfig.from_yaml("dataset/crm/malicious/1/config.yaml"),
    runtime_config
)
await agent.initialize()

result = await agent.run("Search for leads named John")
await agent.cleanup()`}
          language="python"
        />
      </div>

      {/* vLLM Deployment */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-accent" />
          High-Performance with vLLM
        </h2>

        <CodeBlock
          code={`# Start vLLM server
# python -m vllm.entrypoints.openai.api_server \\
#     --model meta-llama/Llama-3.1-70B-Instruct \\
#     --port 8000 \\
#     --tensor-parallel-size 4

import os
from agent.openaisdk import OpenAISDKAgent
from dt_arena.src.types.agent import AgentConfig, RuntimeConfig

os.environ["OPENAI_BASE_URL"] = "http://localhost:8000/v1"
os.environ["OPENAI_API_KEY"] = "dummy"  # vLLM doesn't validate keys

runtime_config = RuntimeConfig(
    model="meta-llama/Llama-3.1-70B-Instruct",
    temperature=0.1,
    max_turns=200,
    output_dir="./results"
)

agent = OpenAISDKAgent(
    AgentConfig.from_yaml("dataset/workflow/benign/1/config.yaml"),
    runtime_config
)
await agent.initialize()

result = await agent.run("Draft an email to sales team")
await agent.cleanup()`}
          language="python"
        />
      </div>

      {/* Anthropic Claude Variants */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-accent" />
          Claude Model Variants
        </h2>

        <p className="text-muted-foreground mb-4">
          Use different Claude models with our Claude SDK agent:
        </p>

        <CodeBlock
          code={`from agent.claudesdk import ClaudeSDKAgent
from dt_arena.src.types.agent import AgentConfig, RuntimeConfig

# Available Claude models
models = [
    "claude-opus-4-20250514",      # Most capable
    "claude-sonnet-4-20250514",    # Balanced
    "claude-3-5-haiku-20241022",   # Fast and efficient
]

runtime_config = RuntimeConfig(
    model="claude-opus-4-20250514",  # Choose your model
    temperature=0.1,
    max_turns=100,
    output_dir="./results"
)

agent = ClaudeSDKAgent(
    AgentConfig.from_yaml("dataset/crm/malicious/2/config.yaml"),
    runtime_config
)
await agent.initialize()

result = await agent.run("Update lead status to qualified")
await agent.cleanup()`}
          language="python"
        />
      </div>

      {/* Google Gemini Variants */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-accent" />
          Gemini Model Variants
        </h2>

        <CodeBlock
          code={`from agent.googleadk import GoogleADKAgent
from dt_arena.src.types.agent import AgentConfig, RuntimeConfig

# Available Gemini models
models = [
    "gemini-2.0-flash-exp",        # Latest experimental
    "gemini-1.5-pro",              # Production-ready
    "gemini-1.5-flash",            # Fast inference
]

runtime_config = RuntimeConfig(
    model="gemini-2.0-flash-exp",
    temperature=0.1,
    max_turns=150,
    output_dir="./results"
)

agent = GoogleADKAgent(
    AgentConfig.from_yaml("dataset/workflow/benign/2/config.yaml"),
    runtime_config
)
await agent.initialize()

result = await agent.run("Schedule a meeting for Friday")
await agent.cleanup()`}
          language="python"
        />
      </div>

      {/* Model Configuration Reference */}
      <div className="mt-8 border border-border rounded-lg overflow-hidden">
        <div className="bg-secondary px-4 py-3 border-b border-border">
          <h3 className="font-medium">Model Configuration Reference</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-secondary/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Provider</th>
              <th className="px-4 py-3 text-left font-medium">Environment Variable</th>
              <th className="px-4 py-3 text-left font-medium">Example Models</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <td className="px-4 py-3">OpenAI</td>
              <td className="px-4 py-3"><code>OPENAI_API_KEY</code></td>
              <td className="px-4 py-3">gpt-4o, gpt-4o-mini, o1-preview</td>
            </tr>
            <tr>
              <td className="px-4 py-3">Anthropic</td>
              <td className="px-4 py-3"><code>ANTHROPIC_API_KEY</code></td>
              <td className="px-4 py-3">claude-opus-4, claude-sonnet-4</td>
            </tr>
            <tr>
              <td className="px-4 py-3">Google</td>
              <td className="px-4 py-3"><code>GOOGLE_API_KEY</code></td>
              <td className="px-4 py-3">gemini-2.0-flash, gemini-1.5-pro</td>
            </tr>
            <tr>
              <td className="px-4 py-3">Together AI</td>
              <td className="px-4 py-3"><code>OPENAI_BASE_URL</code> + <code>OPENAI_API_KEY</code></td>
              <td className="px-4 py-3">meta-llama/Llama-3.1-70B</td>
            </tr>
            <tr>
              <td className="px-4 py-3">Groq</td>
              <td className="px-4 py-3"><code>OPENAI_BASE_URL</code> + <code>GROQ_API_KEY</code></td>
              <td className="px-4 py-3">llama-3.1-70b-versatile</td>
            </tr>
            <tr>
              <td className="px-4 py-3">Local (Ollama)</td>
              <td className="px-4 py-3"><code>OPENAI_BASE_URL</code></td>
              <td className="px-4 py-3">llama3.1:70b, mixtral:8x7b</td>
            </tr>
            <tr>
              <td className="px-4 py-3">Local (vLLM)</td>
              <td className="px-4 py-3"><code>OPENAI_BASE_URL</code></td>
              <td className="px-4 py-3">Any HuggingFace model</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tips */}
      <div className="mt-8 border border-accent/30 rounded-lg p-6 bg-accent/5">
        <h3 className="font-semibold mb-3 text-accent">Tips for Custom Models</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">1.</span>
            <span>Ensure your model supports function/tool calling for MCP tool integration</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">2.</span>
            <span>For local models, allocate sufficient GPU memory for tool-heavy tasks</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">3.</span>
            <span>Test with benign scenarios first before running adversarial evaluations</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">4.</span>
            <span>Monitor token usage - some evaluations can be token-intensive</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

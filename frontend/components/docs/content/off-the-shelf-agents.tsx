"use client"

import { Box, Layers, Server, Code, Package } from "lucide-react"
import { CodeBlock } from "../code-block"
import { Callout } from "../callout"

export function OffTheShelfAgentsContent() {
  return (
    <div>
      <p className="text-lg text-muted-foreground leading-relaxed mb-8">
        Build agents from scratch using our framework wrappers. Each wrapper provides a standardized interface
        with automatic MCP server management, trajectory tracking, and multi-turn conversation support.
      </p>

      <Callout type="info" title="When to Use This">
        Choose this approach when starting a new project and you want to build an agent specifically
        for evaluation with DecodingTrust. You get full control over agent configuration and automatic
        integration with our evaluation pipeline.
      </Callout>

      {/* Basic Pattern */}
      <div className="mt-8 mb-8">
        <h2 className="text-xl font-semibold mb-4">Basic Usage Pattern</h2>

        <p className="text-muted-foreground mb-4">
          All agents follow the same pattern: load configuration, create runtime settings, and run with async context manager.
        </p>

        <CodeBlock
          code={`import asyncio
from dt_arena.src.types.agent import AgentConfig, RuntimeConfig
from agent.openaisdk import OpenAISDKAgent

async def main():
    # 1. Load agent configuration from YAML
    agent_config = AgentConfig.from_yaml("dataset/crm/benign/1/config.yaml")

    # 2. Create runtime configuration
    runtime_config = RuntimeConfig(
        model="gpt-4o",
        temperature=0.1,
        max_turns=10,
        output_dir="./results"
    )

    # 3. Create and run agent with async context manager
    agent = OpenAISDKAgent(agent_config, runtime_config)

    async with agent:  # Handles initialize() and cleanup() automatically
        result = await agent.run(
            "List all leads in the CRM",
            metadata={"task_id": "task-001", "domain": "crm"}
        )

        print(f"Output: {result.final_output}")
        print(f"Turns: {result.turn_count}")
        print(f"Trace ID: {result.trace_id}")

asyncio.run(main())`}
          language="python"
        />
      </div>

      {/* Configuration YAML */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Configuration File (YAML)</h2>

        <p className="text-muted-foreground mb-4">
          Agent configuration is defined in YAML files. The MCP servers are automatically resolved from the global <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">mcp.yaml</code> registry.
        </p>

        <CodeBlock
          code={`# config.yaml
Task:
  task_id: crm-001
  domain: crm
  task_instruction: |
    List all leads and their contact information.

Agent:
  name: "CRM_Assistant"
  system_prompt: |
    You are a helpful CRM assistant with access to Salesforce.
    Help users manage their leads, contacts, and accounts.
  mcp_servers:
    - name: "salesforce"
      enabled: true
    - name: "gmail"
      enabled: true

Runtime:  # Optional - can be overridden via CLI or code
  model: gpt-4o
  temperature: 0.1
  max_turns: 10`}
          language="yaml"
        />
      </div>

      {/* CLI Usage */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Command Line Usage</h2>

        <p className="text-muted-foreground mb-4">
          Each agent provides an example script that can be run from the command line:
        </p>

        <CodeBlock
          code={`# OpenAI SDK Agent
python agent/openaisdk/example.py \\
  --config dataset/crm/benign/1/config.yaml \\
  --model gpt-4o \\
  --temperature 0.1 \\
  --max-turns 10 \\
  --output-dir ./results

# Claude SDK Agent
python agent/claudesdk/example.py \\
  --config dataset/crm/benign/1/config.yaml \\
  --model claude-sonnet-4-20250514

# Google ADK Agent
python agent/googleadk/example.py \\
  --config dataset/crm/benign/1/config.yaml \\
  --model gemini-2.0-flash

# LangChain Agent
python agent/langchain/example.py \\
  --config dataset/crm/benign/1/config.yaml \\
  --model gpt-4o

# PocketFlow Agent
python agent/pocketflow/example.py \\
  --config dataset/crm/benign/1/config.yaml`}
          language="bash"
        />
      </div>

      {/* OpenAI SDK */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Box className="h-5 w-5" />
          OpenAI Agents SDK
        </h2>

        <p className="text-muted-foreground mb-4">
          Uses the official OpenAI Python SDK with built-in tracing support.
        </p>

        <CodeBlock
          code={`from agent.openaisdk import OpenAISDKAgent
from dt_arena.src.types.agent import AgentConfig, RuntimeConfig

agent_config = AgentConfig.from_yaml("config.yaml")
runtime_config = RuntimeConfig(
    model="gpt-4o",
    temperature=0.1,
    max_turns=200,
    output_dir="./results"
)

agent = OpenAISDKAgent(agent_config, runtime_config)

async with agent:
    result = await agent.run(
        "List all leads in the CRM",
        metadata={"task_id": "test-001", "domain": "crm"}
    )
    print(result.final_output)`}
          language="python"
        />
      </div>

      {/* Claude SDK */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Claude SDK (Anthropic)
        </h2>

        <p className="text-muted-foreground mb-4">
          Uses Anthropic's Claude API with tool use capabilities.
        </p>

        <CodeBlock
          code={`from agent.claudesdk import ClaudeSDKAgent
from dt_arena.src.types.agent import AgentConfig, RuntimeConfig

agent_config = AgentConfig.from_yaml("config.yaml")
runtime_config = RuntimeConfig(
    model="claude-sonnet-4-20250514",
    temperature=0.1,
    max_turns=100,
    output_dir="./results"
)

agent = ClaudeSDKAgent(agent_config, runtime_config)

async with agent:
    result = await agent.run(
        "Schedule a meeting for next Tuesday",
        metadata={"task_id": "test-002", "domain": "workflow"}
    )`}
          language="python"
        />
      </div>

      {/* Google ADK */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Server className="h-5 w-5" />
          Google ADK (Gemini)
        </h2>

        <p className="text-muted-foreground mb-4">
          Uses Google's Agent Development Kit with LlmAgent and Runner pattern.
        </p>

        <CodeBlock
          code={`from agent.googleadk import GoogleADKAgent
from dt_arena.src.types.agent import AgentConfig, RuntimeConfig

agent_config = AgentConfig.from_yaml("config.yaml")
runtime_config = RuntimeConfig(
    model="gemini-2.0-flash",
    temperature=0.1,
    max_turns=150,
    output_dir="./results"
)

agent = GoogleADKAgent(agent_config, runtime_config)

async with agent:
    result = await agent.run(
        "Find all contacts from Acme Corp",
        metadata={"task_id": "test-003", "domain": "crm"}
    )`}
          language="python"
        />
      </div>

      {/* LangChain */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Code className="h-5 w-5" />
          LangChain
        </h2>

        <p className="text-muted-foreground mb-4">
          Uses LangChain with FastMCP integration. Auto-detects provider from model name.
        </p>

        <CodeBlock
          code={`from agent.langchain import LangChainAgent
from dt_arena.src.types.agent import AgentConfig, RuntimeConfig

agent_config = AgentConfig.from_yaml("config.yaml")
runtime_config = RuntimeConfig(
    model="gpt-4o",  # Also supports: claude-*, gemini-*
    temperature=0.1,
    max_turns=100,
    output_dir="./results"
)

agent = LangChainAgent(agent_config, runtime_config)

async with agent:
    result = await agent.run(
        "Draft an email to the marketing team",
        metadata={"task_id": "test-004", "domain": "workflow"}
    )`}
          language="python"
        />
      </div>

      {/* PocketFlow */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          PocketFlow
        </h2>

        <p className="text-muted-foreground mb-4">
          Uses PocketFlow with ReAct (Reasoning + Acting) pattern for graph-based execution.
        </p>

        <CodeBlock
          code={`from agent.pocketflow import MCPReactAgent
from dt_arena.src.types.agent import AgentConfig, RuntimeConfig

agent_config = AgentConfig.from_yaml("config.yaml")
runtime_config = RuntimeConfig(
    model="gpt-4o",
    temperature=0.1,
    max_turns=100,
    output_dir="./results"
)

agent = MCPReactAgent(agent_config, runtime_config)

async with agent:
    result = await agent.run(
        "Create a new lead named John Smith",
        metadata={"task_id": "test-005", "domain": "crm"}
    )`}
          language="python"
        />
      </div>

      {/* Multi-turn Conversations */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Multi-turn Conversations</h2>

        <p className="text-muted-foreground mb-4">
          All agents support multi-turn conversations. You can either make sequential calls or pass a list of queries:
        </p>

        <CodeBlock
          code={`# Method 1: Sequential calls (agent remembers context)
async with agent:
    result1 = await agent.run("List all leads in my account")
    result2 = await agent.run("How many leads are there total?")
    result3 = await agent.run("Create a new lead named Test User")

    # Reset conversation for fresh start
    agent.reset_conversation()

# Method 2: Pass list of queries
async with agent:
    queries = [
        "List all leads in my account.",
        "How many leads are there total?",
        "Create a new lead named Test User."
    ]
    result = await agent.run(queries, metadata={"task_id": "multi-turn-001"})`}
          language="python"
        />
      </div>

      {/* Framework Reference Table */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Framework Reference</h2>

        <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Framework</th>
                <th className="px-4 py-3 text-left font-medium">Agent Class</th>
                <th className="px-4 py-3 text-left font-medium">Default Model</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              <tr>
                <td className="px-4 py-3">OpenAI Agents SDK</td>
                <td className="px-4 py-3"><code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">OpenAISDKAgent</code></td>
                <td className="px-4 py-3">gpt-4o</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Claude SDK</td>
                <td className="px-4 py-3"><code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">ClaudeSDKAgent</code></td>
                <td className="px-4 py-3">claude-sonnet-4-20250514</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Google ADK</td>
                <td className="px-4 py-3"><code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">GoogleADKAgent</code></td>
                <td className="px-4 py-3">gemini-2.0-flash</td>
              </tr>
              <tr>
                <td className="px-4 py-3">LangChain</td>
                <td className="px-4 py-3"><code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">LangChainAgent</code></td>
                <td className="px-4 py-3">gpt-4o</td>
              </tr>
              <tr>
                <td className="px-4 py-3">PocketFlow</td>
                <td className="px-4 py-3"><code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">MCPReactAgent</code></td>
                <td className="px-4 py-3">gpt-4o</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

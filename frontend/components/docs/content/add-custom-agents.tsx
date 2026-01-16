"use client"

import { Code } from "lucide-react"
import { CodeBlock } from "../code-block"
import { Callout } from "../callout"

export function AddCustomAgentsContent() {
  return (
    <div>
      <p className="text-lg text-muted-foreground leading-relaxed mb-8">
        If your agent is built with a framework we don't support, or you have a completely custom implementation,
        you can integrate it by implementing our <code className="bg-secondary px-2 py-1 rounded text-sm">Agent</code> base class.
      </p>

      <Callout type="warning" title="Requirements">
        Your custom agent must implement 4 required methods and return an <code className="bg-secondary px-1 rounded">AgentResult</code> object
        for compatibility with the evaluation pipeline.
      </Callout>

      {/* Required Methods Summary - FIRST */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Required Methods</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Method</th>
                <th className="px-4 py-3 text-left font-medium">Input</th>
                <th className="px-4 py-3 text-left font-medium">Output</th>
                <th className="px-4 py-3 text-left font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              <tr>
                <td className="px-4 py-3"><code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">initialize()</code></td>
                <td className="px-4 py-3"><code className="text-xs">None</code></td>
                <td className="px-4 py-3"><code className="text-xs">None</code></td>
                <td className="px-4 py-3">Create LLM client, call <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-xs">load_mcp_servers()</code></td>
              </tr>
              <tr>
                <td className="px-4 py-3"><code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">_create_mcp_server()</code></td>
                <td className="px-4 py-3"><code className="text-xs">MCPServerConfig</code></td>
                <td className="px-4 py-3"><code className="text-xs">Any</code> (MCP client)</td>
                <td className="px-4 py-3">Create framework-specific MCP client</td>
              </tr>
              <tr className="bg-yellow-50 dark:bg-yellow-900/20">
                <td className="px-4 py-3"><code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">run()</code></td>
                <td className="px-4 py-3"><code className="text-xs">str, Optional[Dict]</code></td>
                <td className="px-4 py-3"><strong><code className="text-xs">AgentResult</code></strong></td>
                <td className="px-4 py-3">Execute agent, record trajectory, return result</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">cleanup()</code></td>
                <td className="px-4 py-3"><code className="text-xs">None</code></td>
                <td className="px-4 py-3"><code className="text-xs">None</code></td>
                <td className="px-4 py-3">Close MCP connections, clean up resources</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* AgentResult - Required Return Type */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">AgentResult (Required Return Type)</h2>

        <Callout type="warning" title="Important">
          The <code className="bg-secondary px-1 rounded">run()</code> method <strong>MUST</strong> return an <code className="bg-secondary px-1 rounded">AgentResult</code> object.
          Import it from <code className="bg-secondary px-1 rounded">dt_arena.src.types.agent</code>.
        </Callout>

        <CodeBlock
          code={`from dt_arena.src.types.agent import AgentResult

# AgentResult fields:
@dataclass
class AgentResult:
    # Required fields (positional)
    final_output: Optional[str]      # Agent's final text response
    turn_count: int                  # Number of LLM calls executed
    trajectory: Optional[Trajectory] # Trajectory object with all steps

    # Optional fields (keyword-only)
    trace_id: Optional[str] = None   # Trace/session identifier
    duration: Optional[float] = None # Execution duration in seconds

# Example usage in run():
return AgentResult(
    final_output="Here are all the leads...",
    turn_count=3,
    trajectory=self.trajectory,
    trace_id="trace_abc123",
)`}
          language="python"
        />
      </div>

      {/* Agent Interface Specification - Full Code */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Code className="h-5 w-5" />
          Full Implementation Example
        </h2>

        <p className="text-muted-foreground mb-4">
          Below is a complete example showing how to implement a custom agent:
        </p>

        <CodeBlock
          code={`from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from dt_arena.src.types.agent import Agent, AgentConfig, RuntimeConfig, MCPServerConfig, AgentResult
from dt_arena.src.types.trajectory import Trajectory

class CustomAgent(Agent):
    """
    Custom agent implementation following the DecodingTrust Agent interface.
    """

    def __init__(
        self,
        agent_config: AgentConfig,
        runtime_config: Optional[RuntimeConfig] = None,
    ):
        super().__init__(agent_config, runtime_config)
        self.client = None
        self.trajectory = None

    async def initialize(self) -> None:
        """Initialize the agent and connect to MCP servers."""
        # Initialize your LLM client
        self.client = YourLLMClient(
            model=self.runtime_config.model,
            temperature=self.runtime_config.temperature,
        )
        # Load and connect MCP servers from config
        await self.load_mcp_servers()
        # Initialize trajectory
        self.trajectory = Trajectory()

    def _create_mcp_server(self, config: MCPServerConfig) -> Any:
        """Create an MCP server instance for your framework."""
        return YourMCPClient(
            name=config.name,
            url=config.url,
            injections=self.runtime_config.mcp_injection.get(config.name, {})
        )

    async def run(
        self,
        user_input: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> AgentResult:
        """
        Execute the agent with user input.

        MUST return AgentResult with final_output, turn_count, and trajectory.
        """
        # Record user input
        self.trajectory.append_user_step(user_input, metadata or {})

        turns = 0
        final_output = None

        while turns < self.runtime_config.max_turns:
            response = await self.client.chat(
                messages=self._build_messages(),
                tools=self._get_available_tools()
            )
            turns += 1

            if response.tool_calls:
                for tool_call in response.tool_calls:
                    # Record agent action
                    self.trajectory.append_agent_step(
                        action=f"{tool_call.name}({tool_call.arguments})",
                        tool_name=tool_call.name,
                        tool_params=tool_call.arguments,
                    )
                    # Execute tool
                    result = await self._execute_tool(tool_call)
                    # Record tool result
                    self.trajectory.append_tool_return(
                        result=result,
                        tool_name=tool_call.name,
                    )
            else:
                final_output = response.content
                self.trajectory.append_agent_step(
                    action="send_message_to_user",
                    metadata={"message": final_output}
                )
                break

        # Save trajectory
        self.trajectory.save(self.runtime_config.output_dir, metadata=metadata)

        # MUST return AgentResult
        return AgentResult(
            final_output=final_output,
            turn_count=turns,
            trajectory=self.trajectory,
            trace_id=metadata.get("task_id") if metadata else None,
        )

    async def cleanup(self) -> None:
        """Clean up resources and close connections."""
        for server in self.mcp_servers:
            try:
                await server.close()
            except Exception:
                pass
        if self.client:
            await self.client.close()`}
          language="python"
        />
      </div>

      {/* Trajectory Format */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Trajectory Format</h2>

        <p className="text-muted-foreground mb-4">
          Your agent must save trajectories in the standard format for evaluation:
        </p>

        <CodeBlock
          code={`{
  "task_info": {
    "task_id": "trace_abc123",
    "original_instruction": "List all leads in the CRM",
    "domain": "crm"
  },
  "traj_info": {
    "step_count": 4,
    "duration": 3.5,
    "agent_final_response": "Here are all the leads..."
  },
  "trajectory": [
    {"role": "user", "state": "List all leads", "step_id": 0},
    {"role": "agent", "action": "list_leads()", "step_id": 1},
    {"role": "tool", "state": [...], "step_id": 2},
    {"role": "agent", "action": "send_message_to_user", "step_id": 3}
  ]
}`}
          language="json"
        />
      </div>

      {/* Integration Checklist */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Integration Checklist</h2>

        <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
              Inherit from <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">Agent</code> base class
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
              Implement all 4 required methods
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
              Call <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">load_mcp_servers()</code> in initialize()
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <strong>Return <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">AgentResult</code> from run()</strong>
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
              Record all steps in trajectory (user, agent, tool)
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
              Support async context manager (<code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">async with agent:</code>)
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
              Clean up all connections in cleanup()
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

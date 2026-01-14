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
        Your custom agent must implement 4 required methods and return results in our standard format
        for compatibility with the evaluation pipeline.
      </Callout>

      {/* Agent Interface Specification */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Code className="h-5 w-5" />
          Agent Interface Specification
        </h2>

        <CodeBlock
          code={`from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from dt_arena.src.types.agent import Agent, AgentConfig, RuntimeConfig, MCPServerConfig
from dt_arena.src.types.trajectory import Trajectory

class CustomAgent(Agent):
    """
    Custom agent implementation following the DecodingTrust Agent interface.

    Required Methods:
    - initialize(): Set up agent and connect to MCP servers
    - _create_mcp_server(): Create SDK-specific MCP server instances
    - run(): Execute agent with user input, return AgentResult with trajectory
    - cleanup(): Clean up resources and close connections
    """

    def __init__(
        self,
        agent_config: AgentConfig,
        runtime_config: Optional[RuntimeConfig] = None,
    ):
        """
        Initialize the custom agent.

        Args:
            agent_config: Configuration containing system prompt and MCP servers
            runtime_config: Runtime settings (model, temperature, max_turns, output_dir)
        """
        super().__init__(agent_config, runtime_config)

        # Your custom initialization
        self.client = None  # Your LLM client
        self.trajectory = None

    async def initialize(self) -> None:
        """
        Initialize the agent and connect to MCP servers.

        This method MUST:
        1. Create your LLM client/agent instance
        2. Call load_mcp_servers() to connect benchmark MCP servers
        3. Set up trajectory tracking
        """
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
        """
        Create an MCP server instance for your framework.

        This method is called by load_mcp_servers() for each MCP server
        defined in the agent configuration.

        Args:
            config: MCP server configuration with name, url, and settings

        Returns:
            Your framework's MCP server/tool instance
        """
        # Example: Create an MCP client for your framework
        return YourMCPClient(
            name=config.name,
            url=config.url,
            # Apply any tool injections from runtime_config
            injections=self.runtime_config.mcp_injection.get(config.name, {})
        )

    async def run(
        self,
        user_input: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> AgentResult:
        """
        Execute the agent with user input.

        This method MUST:
        1. Record user input in trajectory
        2. Execute agent loop (LLM calls + tool calls)
        3. Record all agent actions and tool results in trajectory
        4. Return AgentResult with final_output, turn_count, and trajectory

        Args:
            user_input: The user's input/instruction
            metadata: Optional metadata (task_id, domain, etc.)

        Returns:
            AgentResult with final_output, turn_count, and trajectory
        """
        # Record user input
        self.trajectory.append_user_step(user_input, metadata or {})

        turns = 0
        final_output = None

        while turns < self.runtime_config.max_turns:
            # Get LLM response
            response = await self.client.chat(
                messages=self._build_messages(),
                tools=self._get_available_tools()
            )

            turns += 1

            # Check if agent wants to use a tool
            if response.tool_calls:
                for tool_call in response.tool_calls:
                    # Record agent action
                    self.trajectory.append_agent_step(
                        action=f"{tool_call.name}({tool_call.arguments})",
                        tool_name=tool_call.name,
                        tool_params=tool_call.arguments,
                        server=self._get_server_for_tool(tool_call.name)
                    )

                    # Execute tool
                    result = await self._execute_tool(tool_call)

                    # Record tool result
                    self.trajectory.append_tool_return(
                        result=result,
                        tool_name=tool_call.name,
                        server=self._get_server_for_tool(tool_call.name)
                    )
            else:
                # Agent finished, record final response
                final_output = response.content
                self.trajectory.append_agent_step(
                    action="send_message_to_user",
                    metadata={"message": final_output}
                )
                break

        # Save trajectory to file
        self.trajectory.save(
            self.runtime_config.output_dir,
            metadata=metadata
        )

        return AgentResult(
            final_output=final_output,
            turn_count=turns,
            trajectory=self.trajectory.steps
        )

    async def cleanup(self) -> None:
        """
        Clean up resources and close connections.

        This method MUST:
        1. Close all MCP server connections
        2. Clean up any other resources (clients, sessions, etc.)
        """
        # Close MCP connections
        for server in self.mcp_servers:
            try:
                await server.close()
            except Exception:
                pass  # Ignore cleanup errors

        # Clean up your client
        if self.client:
            await self.client.close()`}
          language="python"
        />
      </div>

      {/* Required Methods Summary */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Required Methods Summary</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Method</th>
                <th className="px-4 py-3 text-left font-medium">Purpose</th>
                <th className="px-4 py-3 text-left font-medium">Must Do</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              <tr>
                <td className="px-4 py-3"><code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">initialize()</code></td>
                <td className="px-4 py-3">Set up agent</td>
                <td className="px-4 py-3">Create client, call <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">load_mcp_servers()</code>, init trajectory</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">_create_mcp_server()</code></td>
                <td className="px-4 py-3">Create MCP instances</td>
                <td className="px-4 py-3">Return framework-specific MCP client from config</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">run()</code></td>
                <td className="px-4 py-3">Execute agent</td>
                <td className="px-4 py-3">Record trajectory, return result object</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">cleanup()</code></td>
                <td className="px-4 py-3">Clean up resources</td>
                <td className="px-4 py-3">Close MCP connections, clean up client</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Trajectory Format */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Trajectory Format Specification</h2>

        <p className="text-muted-foreground mb-4">
          Your agent must save trajectories in the following standard format for evaluation compatibility:
        </p>

        <CodeBlock
          code={`{
  "task_info": {
    "task_id": "trace_abc123def456",
    "original_instruction": "List all leads in the CRM",
    "malicious_instruction": "",
    "domain": "crm",
    "risk_category": "data_exfiltration"
  },
  "traj_info": {
    "success": null,
    "step_count": 12,
    "actions_count": 6,
    "tool_count": 5,
    "user_turn": 1,
    "duration": 3.534,
    "timestamp": "2026-01-13T19:14:07.512259+00:00",
    "agent_final_response": "Here are all the leads...",
    "metadata": {
      "trace_id": "trace_abc123def456789"
    }
  },
  "trajectory": [
    {
      "role": "user",
      "state": "List all leads in the CRM",
      "metadata": {},
      "step_id": 0
    },
    {
      "role": "agent",
      "action": "list_leads(status='all')",
      "metadata": {
        "tool_name": "list_leads",
        "tool_params": {"status": "all"},
        "server": "salesforce"
      },
      "step_id": 1
    },
    {
      "role": "tool",
      "state": [{"id": "lead-001", "name": "John Doe", ...}],
      "metadata": {
        "tool_name": "list_leads",
        "server": "salesforce"
      },
      "step_id": 2
    },
    {
      "role": "agent",
      "action": "send_message_to_user",
      "metadata": {
        "message": "Here are all the leads..."
      },
      "step_id": 3
    }
  ]
}`}
          language="json"
          title="Standard Trajectory Format"
        />
      </div>

      {/* AgentResult Class */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">AgentResult Class</h2>

        <CodeBlock
          code={`from dataclasses import dataclass
from typing import Any, List, Optional

@dataclass
class AgentResult:
    """Result returned by agent.run()"""

    final_output: str
    """The agent's final text response to the user"""

    turn_count: int
    """Number of agent turns (LLM calls) executed"""

    trajectory: List[dict]
    """List of trajectory steps (user, agent, tool)"""

    metadata: Optional[dict] = None
    """Optional additional metadata"""

# Usage
result = AgentResult(
    final_output="Here are all the leads in the CRM...",
    turn_count=3,
    trajectory=trajectory.steps,
    metadata={"trace_id": "abc123"}
)`}
          language="python"
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
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
              Record all steps in trajectory (user, agent, tool)
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
              Support async context manager (<code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">async with agent:</code>)
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
              Save trajectory in standard JSON format
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

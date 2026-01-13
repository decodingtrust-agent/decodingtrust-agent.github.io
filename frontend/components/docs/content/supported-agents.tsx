"use client"

import { Cpu, Package, Code, Layers, Box, Server } from "lucide-react"
import { Callout } from "../callout"

const frameworks = [
  {
    name: "OpenAI Agents SDK",
    icon: Box,
    description: "Official OpenAI Python SDK with tool use and MCP support",
    features: ["Native MCP integration", "Structured outputs", "Function calling"],
  },
  {
    name: "Claude SDK",
    icon: Layers,
    description: "Anthropic's Claude API with computer use capabilities",
    features: ["Computer use", "Tool use", "Vision support"],
  },
  {
    name: "Google ADK",
    icon: Server,
    description: "Google's Agent Development Kit for Gemini models",
    features: ["Multimodal", "Grounding", "Extensions"],
  },
  {
    name: "LangChain",
    icon: Code,
    description: "Popular framework for building LLM applications",
    features: ["Chain composition", "Memory", "Tool integration"],
  },
  {
    name: "PocketFlow",
    icon: Package,
    description: "Lightweight agent framework with graph-based execution",
    features: ["Graph execution", "State management", "Custom nodes"],
  },
]

export function SupportedAgentsContent() {
  return (
    <div>
      <p className="text-lg text-muted-foreground leading-relaxed mb-8">
        DecodingTrust Agent Suite supports multiple integration patterns depending on how your agent is built.
        Choose the approach that best fits your use case.
      </p>

      {/* Supported Frameworks */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Cpu className="h-5 w-5 text-accent" />
          Supported Frameworks
        </h2>

        <p className="text-muted-foreground mb-4">
          We provide native support for 5 popular agent frameworks. If your agent is built with any of these,
          you can evaluate it directly without any modifications.
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {frameworks.map((framework) => (
            <div
              key={framework.name}
              className="border border-border rounded-lg p-4 hover:border-accent/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <framework.icon className="h-5 w-5 text-accent" />
                <h3 className="font-medium">{framework.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{framework.description}</p>
              <div className="flex flex-wrap gap-1">
                {framework.features.map((feature) => (
                  <span
                    key={feature}
                    className="text-xs bg-secondary px-2 py-0.5 rounded"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Integration Options */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4">Integration Options</h2>

        <Callout type="info" title="Choose Your Path">
          Select the integration approach that matches your situation:
        </Callout>

        <div className="grid gap-4">
          {/* Option 1 */}
          <div className="border border-accent/30 rounded-lg p-4 bg-accent/5">
            <h3 className="font-medium text-accent mb-2">
              Option 1: Off-the-Shelf Agents
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Build agents directly using our framework wrappers. Best for new projects or
              when you want tight integration with our evaluation pipeline.
            </p>
            <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
              Recommended for new projects
            </span>
          </div>

          {/* Option 2 */}
          <div className="border border-blue-500/30 rounded-lg p-4 bg-blue-500/5">
            <h3 className="font-medium text-blue-500 mb-2">
              Option 2: Wrap Pre-Built Native Agents
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Already have an agent built with a supported SDK? Wrap it for evaluation without
              changing your existing code. Your agent keeps its original tools and configuration.
            </p>
            <span className="text-xs bg-blue-500/20 text-blue-500 px-2 py-1 rounded">
              Best for existing production agents
            </span>
          </div>

          {/* Option 3 */}
          <div className="border border-yellow-500/30 rounded-lg p-4 bg-yellow-500/5">
            <h3 className="font-medium text-yellow-500 mb-2">
              Option 3: Add Custom Agents
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Using an unsupported framework or custom implementation? Implement our Agent interface
              with 4 required methods to integrate with the evaluation pipeline.
            </p>
            <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">
              For custom frameworks
            </span>
          </div>

          {/* Option 4 */}
          <div className="border border-purple-500/30 rounded-lg p-4 bg-purple-500/5">
            <h3 className="font-medium text-purple-500 mb-2">
              Option 4: Use Custom Models
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Want to use a different LLM provider or local model? Configure our existing agent
              wrappers to use your custom model endpoints.
            </p>
            <span className="text-xs bg-purple-500/20 text-purple-500 px-2 py-1 rounded">
              For custom LLM providers
            </span>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="mt-8 border-t border-border pt-6">
        <p className="text-muted-foreground">
          Select a sub-section from the sidebar to learn more about each integration approach.
        </p>
      </div>
    </div>
  )
}

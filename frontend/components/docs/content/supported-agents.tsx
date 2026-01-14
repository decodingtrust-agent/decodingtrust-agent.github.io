"use client"

import { Cpu, Package, Code, Layers, Box, Server, ChevronRight } from "lucide-react"
import { Callout } from "../callout"

interface SupportedAgentsContentProps {
  onNavigate?: (slug: string) => void
}

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

const integrationOptions = [
  {
    title: "Off-the-Shelf Agents",
    slug: "off-the-shelf-agents",
    description: "Build agents directly using our framework wrappers. Best for new projects or when you want tight integration with our evaluation pipeline.",
    tag: "Recommended for new projects",
  },
  {
    title: "Wrap Pre-Built Agents",
    slug: "wrap-prebuilt-agents",
    description: "Already have an agent built with a supported SDK? Wrap it for evaluation without changing your existing code. Your agent keeps its original tools and configuration.",
    tag: "Best for existing production agents",
  },
  {
    title: "Add Custom Agents",
    slug: "add-custom-agents",
    description: "Using an unsupported framework or custom implementation? Implement our Agent interface with 4 required methods to integrate with the evaluation pipeline.",
    tag: "For custom frameworks",
  },
  {
    title: "Use Custom Models",
    slug: "use-custom-models",
    description: "Want to use a different LLM provider or local model? Configure our existing agent wrappers to use your custom model endpoints.",
    tag: "For custom LLM providers",
  },
]

export function SupportedAgentsContent({ onNavigate }: SupportedAgentsContentProps) {
  return (
    <div>
      <p className="text-lg text-muted-foreground leading-relaxed mb-8">
        DecodingTrust Agent Suite supports multiple integration patterns depending on how your agent is built.
        Choose the approach that best fits your use case.
      </p>

      {/* Supported Frameworks */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Cpu className="h-5 w-5" />
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
              className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <framework.icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                <h3 className="font-medium">{framework.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{framework.description}</p>
              <div className="flex flex-wrap gap-1">
                {framework.features.map((feature) => (
                  <span
                    key={feature}
                    className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded"
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
      <div>
        <h2 className="text-xl font-semibold mb-4">Integration Options</h2>

        <Callout type="info" title="Choose Your Path">
          Select the integration approach that matches your situation:
        </Callout>

        <div className="grid gap-3 mt-6">
          {integrationOptions.map((option, index) => (
            <button
              key={option.slug}
              onClick={() => onNavigate?.(option.slug)}
              className="w-full text-left border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">
                  Option {index + 1}: {option.title}
                </h3>
                <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {option.description}
              </p>
              <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-1 rounded">
                {option.tag}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

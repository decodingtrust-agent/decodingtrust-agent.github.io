"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Github, FileText, Database, Package, ExternalLink, ArrowRight } from "lucide-react"

const DISCORD_INVITE = "https://discord.gg/z8ZhVwPqUk"
// Replace with the DecodingTrust-Agent Discord server ID (Server Settings → Widget → Server ID).
// The server's Widget must be enabled for this endpoint to respond.
const DISCORD_SERVER_ID = "1486520898906230798"

function formatMemberCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K+`
  return `${n}+`
}

function useDiscordPresence() {
  const [online, setOnline] = useState<number | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    fetch(`https://discord.com/api/guilds/${DISCORD_SERVER_ID}/widget.json`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.presence_count === "number") setOnline(data.presence_count)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])
  return online
}

function DiscordLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 127.14 96.36" className={className} fill="currentColor" aria-hidden="true">
      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
    </svg>
  )
}

const resources = [
  {
    icon: Github,
    title: "Source Code",
    description: "Explore and contribute to the DTap codebase.",
    link: "https://github.com",
    linkText: "github.com/decodingtrust-agent",
  },
  {
    icon: Database,
    title: "Dataset",
    description: "Access our evaluation datasets on HuggingFace.",
    link: "https://huggingface.co",
    linkText: "huggingface.co/decodingtrust-agent",
  },
  {
    icon: Package,
    title: "SDK / PyPI",
    description: "Install the Python SDK for easy integration.",
    link: "https://pypi.org",
    linkText: "pypi.org/project/decodingtrust-agent",
  },
  {
    icon: FileText,
    title: "Research Paper",
    description: "Read our technical paper on arXiv.",
    link: "https://arxiv.org/pdf/2605.04808",
    linkText: "arxiv.org/abs/2605.04808",
  },
]

export function CommunitySection() {
  const onlineCount = useDiscordPresence()
  const memberLabel = onlineCount != null ? `${formatMemberCount(onlineCount)} members online` : "Live community"

  return (
    <section className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Community & Resources</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join DTap community and contribute to advancing AI agent security.
          </p>
        </div>

        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Join the Community</h2>
          <a
            href={DISCORD_INVITE}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block overflow-hidden rounded-2xl p-8 md:p-10 bg-[#5865F2] shadow-[0_20px_60px_-20px_rgba(88,101,242,0.6)] transition-transform duration-300 hover:-translate-y-1"
          >
            {/* Decorative glow orbs */}
            <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-10 h-72 w-72 rounded-full bg-[#8b5cf6]/40 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />

            {/* Giant faded DTap logo watermark */}
            <Image
              src="/dt-agent-logo.png"
              alt=""
              width={384}
              height={384}
              aria-hidden="true"
              className="pointer-events-none absolute -right-6 -bottom-10 h-56 w-56 md:h-64 md:w-64 opacity-35 rotate-[-8deg] transition-transform duration-500 group-hover:rotate-0 group-hover:scale-105"
            />

            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-xs font-medium mb-5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  {memberLabel}
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <DiscordLogo className="h-8 w-8 text-white" />
                  <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    Join our Discord
                  </h3>
                </div>
                <p className="text-white/80 text-base md:text-lg max-w-xl leading-relaxed">
                  Chat with a community of red-teaming experts to build secure agents with the DecodingTrust-Agent platform, get support and troubleshooting for the dataset and evaluating your agent, and more.
                </p>
              </div>

              <div className="flex-shrink-0">
                <div className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#5865F2] font-semibold shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:bg-white/95">
                  Accept Invite
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </a>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-6">Resources</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {resources.map((resource) => (
              <a
                key={resource.title}
                href={resource.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:border-accent/50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-secondary group-hover:bg-accent/10 transition-colors">
                  <resource.icon className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-1 group-hover:text-accent transition-colors">{resource.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{resource.description}</p>
                  <p className="text-xs font-mono text-muted-foreground">{resource.linkText}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-12 p-6 rounded-lg border border-border bg-card">
          <h3 className="text-lg font-semibold mb-4">Contributing</h3>
          <p className="text-muted-foreground mb-4">
            We welcome contributions from the community! Here are some ways you can help:
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-accent">→</span>
              <span>Submit bug reports and feature requests on GitHub</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">→</span>
              <span>Contribute new sandbox environments or attack vectors</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">→</span>
              <span>Improve documentation and tutorials</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">→</span>
              <span>Share your evaluation results on the leaderboard</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}

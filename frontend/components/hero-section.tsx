"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, FileText, Play, Database } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Premium dark background with aurora effect */}
      <div className="absolute inset-0 aurora-bg" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[oklch(0.3_0.1_220/0.12)] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[oklch(0.25_0.08_230/0.08)] rounded-full blur-[100px]" />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-20 md:py-28 lg:py-36 relative z-10">
        {/* Announcement banner */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-sm px-5 py-2 shadow-lg shadow-primary/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-sm font-medium text-primary">v1.0 Released</span>
            <span className="h-4 w-px bg-primary/30" />
            <span className="text-sm text-muted-foreground">Read the announcement</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary" />
          </div>
        </div>

        <div className="text-center mb-10">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/dt-agent-logo.png"
              alt="DT-Agent Logo"
              width={160}
              height={160}
              className="drop-shadow-2xl"
              priority
            />
          </div>

          {/* Title matching logo colors: white "Decoding" + blue "Trust" + blue "Agent Platform" */}
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-8">
            <span className="text-foreground">Decoding</span>
            <span className="text-[oklch(0.7_0.14_220)]">Trust </span>
            <span className="text-[oklch(0.7_0.14_220)]">Agent Platform</span>
          </h1>

          <p className="text-xl md:text-2xl lg:text-3xl font-medium text-muted-foreground mb-4 leading-relaxed">
            A Real-World Simulation Platform for<br className="hidden md:block" />
            Advanced Red-Teaming of AI Agents
          </p>

          <p className="mx-auto max-w-3xl text-base md:text-lg text-muted-foreground/80 leading-relaxed mt-6">
            Powered by <span className="text-[oklch(0.7_0.14_220)] font-semibold">DT-Red</span>, our autonomous red-teaming agent, and{" "}
            <span className="text-[oklch(0.7_0.14_220)] font-semibold">DT-Bench</span>, a comprehensive benchmark with{" "}
            <span className="text-foreground font-medium">30+ sandbox environments</span>,{" "}
            <span className="text-foreground font-medium">15+ domains</span>, and{" "}
            <span className="text-foreground font-medium">500+ tasks</span> per domain.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <Button
            size="lg"
            className="w-full sm:w-auto h-12 px-8 text-base bg-[oklch(0.7_0.14_220)] text-white hover:bg-[oklch(0.65_0.14_220)] shadow-lg shadow-[oklch(0.5_0.14_220/0.3)]"
            asChild
          >
            <Link href="/quickstart">
              <Play className="mr-2 h-5 w-5" />
              Get Started
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto h-12 px-8 text-base bg-transparent border-[oklch(0.7_0.14_220/0.3)] hover:bg-[oklch(0.7_0.14_220/0.1)] hover:border-[oklch(0.7_0.14_220/0.5)]"
            asChild
          >
            <Link href="/docs">
              <FileText className="mr-2 h-5 w-5" />
              Documentation
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto h-12 px-8 text-base bg-transparent border-[oklch(0.7_0.14_220/0.3)] hover:bg-[oklch(0.7_0.14_220/0.1)] hover:border-[oklch(0.7_0.14_220/0.5)]"
            asChild
          >
            <Link href="/registry">
              <Database className="mr-2 h-5 w-5" />
              Data Registry
            </Link>
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          A research collaboration • Paper available on{" "}
          <a href="#" className="text-[oklch(0.7_0.14_220)] hover:underline font-medium">
            arXiv
          </a>
        </p>
      </div>
    </section>
  )
}

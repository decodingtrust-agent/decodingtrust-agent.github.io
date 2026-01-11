"use client"

import { useState } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { DomainsSection } from "@/components/domains-section"
import { LeaderboardPreview } from "@/components/leaderboard-preview"
import { QuickstartSection } from "@/components/quickstart-section"
import { DocsSection } from "@/components/docs-section"
import { LeaderboardSection } from "@/components/leaderboard-section"
import { CompetitionSection } from "@/components/competition-section"
import { CommunitySection } from "@/components/community-section"
import { AboutSection } from "@/components/about-section"
import { Footer } from "@/components/footer"

export type TabType = "home" | "quickstart" | "docs" | "leaderboard" | "competition" | "community" | "about"

function HomeContent() {
  const [activeTab, setActiveTab] = useState<TabType>("home")

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <>
            <HeroSection onNavigate={setActiveTab} />
            <FeaturesSection />
            <DomainsSection />
            <LeaderboardPreview onViewFull={() => setActiveTab("leaderboard")} />
          </>
        )
      case "quickstart":
        return <QuickstartSection />
      case "docs":
        return <DocsSection />
      case "leaderboard":
        return <LeaderboardSection />
      case "competition":
        return <CompetitionSection />
      case "community":
        return <CommunitySection />
      case "about":
        return <AboutSection />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 grid-pattern pointer-events-none opacity-50" />
      <div className="relative z-10">
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
        <main>{renderContent()}</main>
        <Footer />
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <ThemeProvider>
      <HomeContent />
    </ThemeProvider>
  )
}

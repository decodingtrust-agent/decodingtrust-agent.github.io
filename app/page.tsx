import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { DomainsSection } from "@/components/domains-section"
import { LeaderboardPreview } from "@/components/leaderboard-preview"

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <DomainsSection />
      <LeaderboardPreview />
    </>
  )
}

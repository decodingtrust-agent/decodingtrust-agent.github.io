import { HeroSection } from "@/components/hero-section"
import { DomainReleaseSection } from "@/components/domain-release-section"
import { FeaturesSection } from "@/components/features-section"
import { DomainsSection } from "@/components/domains-section"
import { LeaderboardPreview } from "@/components/leaderboard-preview"

export default function Home() {
  return (
    <>
      <HeroSection />
      <DomainReleaseSection />
      <FeaturesSection />
      <DomainsSection />
      <LeaderboardPreview />
    </>
  )
}

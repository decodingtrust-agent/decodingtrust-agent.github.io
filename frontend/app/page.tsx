import { HeroSection } from "@/components/hero-section"
import { DomainsSection } from "@/components/domains-section"
import { LeaderboardPreview } from "@/components/leaderboard-preview"
import { BenchmarkScatter } from "@/components/benchmark-scatter"
import { CitationSection } from "@/components/citation-section"

export default function Home() {
  return (
    <>
      <HeroSection />
      <LeaderboardPreview />
      <BenchmarkScatter />
      <DomainsSection />
      <CitationSection />
    </>
  )
}

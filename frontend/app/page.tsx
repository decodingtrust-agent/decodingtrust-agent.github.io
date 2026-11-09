import { HeroSection } from "@/components/hero-section"
import { DomainsSection } from "@/components/domains-section"
import { RecentBlogs } from "@/components/recent-blogs"
import { LeaderboardPreview } from "@/components/leaderboard-preview"
import { BenchmarkScatter } from "@/components/benchmark-scatter"
import { CitationSection } from "@/components/citation-section"

export default function Home() {
  return (
    <>
      <HeroSection />
      <RecentBlogs />
      <LeaderboardPreview />
      <BenchmarkScatter />
      <DomainsSection />
      <CitationSection />
    </>
  )
}

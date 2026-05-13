import Image from "next/image"
import { Mail, Users, ArrowRight, Heart } from "lucide-react"

// Affiliation index → { display name, logo path, homepage URL, optional dark-mode class }.
// `darkClass` handles logos that don't read well on a dark background:
//  - monochrome black artwork (Virtue AI) → `dark:invert` flips to white.
//  - dark-on-transparent crests (JHU) → wrap on a small white card.
// `sizeClass` lets a logo override the default `h-14` height — the Virtue AI
// wordmark is very wide, so it dominates the row at full height.
const AFFILIATIONS: Record<
  number,
  { name: string; logo: string; url: string; darkClass?: string; sizeClass?: string }
> = {
  1: {
    name: "Virtue AI",
    logo: "/logo/affiliations/virtueai-new.png",
    url: "https://virtueai.com/",
    darkClass: "dark:invert",
    sizeClass: "h-9",
  },
  2: { name: "University of Chicago", logo: "/logo/affiliations/uchicago.png", url: "https://www.uchicago.edu/" },
  3: { name: "UIUC", logo: "/logo/affiliations/uiuc.png", url: "https://illinois.edu/" },
  4: { name: "UC Santa Barbara", logo: "/logo/affiliations/ucsb-new.png", url: "https://www.ucsb.edu/" },
  5: { name: "Johns Hopkins University", logo: "/logo/affiliations/jhu-new.png", url: "https://www.jhu.edu/", darkClass: "dark:bg-white dark:p-1 dark:rounded" },
  6: { name: "UC Berkeley", logo: "/logo/affiliations/ucberkeley.png", url: "https://www.berkeley.edu/" },
  7: { name: "Stanford University", logo: "/logo/affiliations/stanford.png", url: "https://www.stanford.edu/" },
}

type Member = { name: string; affiliations: number[]; role: string; url?: string }

const team: Member[] = [
  { name: "Zhaorun Chen", affiliations: [1, 2], role: "Project Lead & Core Contributor", url: "https://billchan226.github.io/" },
  { name: "Xun Liu", affiliations: [3], role: "Core Contributor", url: "https://antiquality.github.io/" },
  { name: "Haibo Tong", affiliations: [3], role: "Core Contributor", url: "https://scholar.google.com/citations?user=s4B1efAAAAAJ&hl=zh-CN" },
  { name: "Chengquan Guo", affiliations: [2], role: "Core Contributor", url: "https://www.chengquanguo.com/" },
  { name: "Yuzhou Nie", affiliations: [1, 4], role: "Core Contributor", url: "https://rucnyz.github.io/" },
  { name: "Jiawei Zhang", affiliations: [2], role: "Core Contributor", url: "https://javyduck.github.io/" },
  { name: "Mintong Kang", affiliations: [3], role: "Core Contributor", url: "https://kangmintong.github.io/" },
  { name: "Chejian Xu", affiliations: [3], role: "Core Contributor", url: "https://xuchejian.com/" },
  { name: "Qichang Liu", affiliations: [3], role: "Core Contributor", url: "https://scholar.google.com/citations?user=BEojNpgAAAAJ&hl=en" },
  { name: "Xiaogeng Liu", affiliations: [5], role: "Core Contributor", url: "https://xiaogeng-liu.com/" },
  { name: "Tianneng Shi", affiliations: [6], role: "Core Contributor", url: "https://tnshi.com/" },
  { name: "Chaowei Xiao", affiliations: [5], role: "Advisor", url: "https://xiaocw11.github.io/" },
  { name: "Sanmi Koyejo", affiliations: [1, 7], role: "Advisor", url: "https://cs.stanford.edu/~sanmi/" },
  { name: "Percy Liang", affiliations: [7], role: "Advisor", url: "https://cs.stanford.edu/~pliang/" },
  { name: "Wenbo Guo", affiliations: [1, 4], role: "Advisor", url: "https://henrygwb.github.io/" },
  { name: "Dawn Song", affiliations: [1, 6], role: "Advisor", url: "https://dawnsong.io/" },
  { name: "Bo Li", affiliations: [1, 2, 3], role: "Project Lead & Core Contributor", url: "https://aisecure.github.io/" },
]

const affiliationList = Object.values(AFFILIATIONS)

export function AboutSection() {
  return (
    <section className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <Image
            src="/dt-agent-logo.png"
            alt="DecodingTrust-Agent"
            width={96}
            height={96}
            className="h-20 w-20 mx-auto mb-4"
          />
          <h1 className="text-3xl md:text-4xl font-bold mb-4">DTap Team</h1>
        </div>

        <div className="mb-12">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-6">
            {affiliationList.map((aff) => (
              <a
                key={aff.name}
                href={aff.url}
                target="_blank"
                rel="noopener noreferrer"
                title={aff.name}
                className="transition-opacity hover:opacity-75"
              >
                <Image
                  src={aff.logo}
                  alt={aff.name}
                  width={120}
                  height={80}
                  className={`w-auto object-contain ${aff.sizeClass ?? "h-14"} ${
                    aff.darkClass ?? ""
                  }`}
                />
              </a>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-semibold">Authors</h2>
          </div>
          <div className="border-t border-border">
          {Array.from({ length: Math.ceil(team.length / 4) }).map((_, rowIdx) => (
            <div
              key={rowIdx}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 border-b border-border"
            >
              {team.slice(rowIdx * 4, rowIdx * 4 + 4).map((member) => (
                <div
                  key={member.name}
                  className="px-5 py-4 border-r border-border last:border-r-0"
                >
                  {member.url ? (
                    <a
                      href={member.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-foreground leading-tight hover:text-accent hover:underline"
                    >
                      {member.name}
                    </a>
                  ) : (
                    <p className="font-semibold text-foreground leading-tight">{member.name}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">{member.role}</p>
                  <p className="text-xs text-accent mt-1">
                    {member.affiliations.map((i) => AFFILIATIONS[i].name).join(", ")}
                  </p>
                </div>
              ))}
            </div>
          ))}
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-semibold">Open-Source Contributors</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            DecodingTrust-Agent is an open community effort. Contribute red-teaming
            algorithms, datasets, environments, and more.
          </p>
          <div className="border-t border-b border-border">
            <div className="px-5 py-8 flex flex-col items-center justify-center gap-4 text-center">
              <p className="text-sm text-muted-foreground">
                No public contributors yet. Be the first!
              </p>
              <a
                href="https://github.com/AI-secure/DecodingTrust-Agent"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
              >
                Contribute now
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg border border-border bg-card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-accent" />
            Contact
          </h3>
          <p className="text-muted-foreground mb-4">
            For research collaborations, questions, or media inquiries, please reach out:
          </p>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">DecodingTrust-Agent Team: </span>
              <a href="mailto:decodingtrustagent@gmail.com" className="text-accent hover:underline">
                decodingtrustagent@gmail.com
              </a>
            </p>
            <p>
              <span className="text-muted-foreground">GitHub: </span>
              <a
                href="https://github.com/AI-secure/DecodingTrust-Agent"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                github.com/AI-secure/DecodingTrust-Agent
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

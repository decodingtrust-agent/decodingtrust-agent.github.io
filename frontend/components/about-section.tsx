import Image from "next/image"
import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

// Affiliation index → { display name, logo path }.
const AFFILIATIONS: Record<number, { name: string; logo: string }> = {
  1: { name: "Virtue AI", logo: "/logo/affiliations/virtueai-new.png" },
  2: { name: "University of Chicago", logo: "/logo/affiliations/uchicago.png" },
  3: { name: "UIUC", logo: "/logo/affiliations/uiuc.png" },
  4: { name: "UC Santa Barbara", logo: "/logo/affiliations/ucsb-new.png" },
  5: { name: "Johns Hopkins University", logo: "/logo/affiliations/jhu-new.png" },
  6: { name: "UC Berkeley", logo: "/logo/affiliations/ucberkeley.png" },
  7: { name: "Stanford University", logo: "/logo/affiliations/stanford.png" },
}

type Member = { name: string; affiliations: number[]; role: string }

const team: Member[] = [
  { name: "Zhaorun Chen", affiliations: [1, 2], role: "Project Lead & Core Contributor" },
  { name: "Xun Liu", affiliations: [3], role: "Core Contributor" },
  { name: "Haibo Tong", affiliations: [3], role: "Core Contributor" },
  { name: "Chengquan Guo", affiliations: [2], role: "Core Contributor" },
  { name: "Yuzhou Nie", affiliations: [1, 4], role: "Core Contributor" },
  { name: "Jiawei Zhang", affiliations: [2], role: "Core Contributor" },
  { name: "Mintong Kang", affiliations: [3], role: "Core Contributor" },
  { name: "Chejian Xu", affiliations: [3], role: "Core Contributor" },
  { name: "Qichang Liu", affiliations: [3], role: "Core Contributor" },
  { name: "Xiaogeng Liu", affiliations: [5], role: "Core Contributor" },
  { name: "Tianneng Shi", affiliations: [6], role: "Core Contributor" },
  { name: "Chaowei Xiao", affiliations: [5], role: "Advisor" },
  { name: "Sanmi Koyejo", affiliations: [1, 7], role: "Advisor" },
  { name: "Wenbo Guo", affiliations: [1, 4], role: "Advisor" },
  { name: "Percy Liang", affiliations: [7], role: "Advisor" },
  { name: "Dawn Song", affiliations: [1, 6], role: "Advisor" },
  { name: "Bo Li", affiliations: [1, 2, 3], role: "Project Lead & Core Contributor" },
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">DecodingTrust-Agent Team</h1>
        </div>

        <div className="mb-12 border-t border-border">
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
                  <p className="font-semibold text-foreground leading-tight">{member.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{member.role}</p>
                  <p className="text-xs text-accent mt-1">
                    {member.affiliations.map((i) => AFFILIATIONS[i].name).join(", ")}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Affiliations</h2>
          <div className="flex flex-wrap items-center gap-x-10 gap-y-6">
            {affiliationList.map((aff) => (
              <Image
                key={aff.name}
                src={aff.logo}
                alt={aff.name}
                title={aff.name}
                width={96}
                height={96}
                className="h-20 w-auto object-contain"
              />
            ))}
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
          <div className="space-y-2 text-sm mb-6">
            <p>
              <span className="text-muted-foreground">Email: </span>
              <a href="mailto:contact@decodingtrust-agent.org" className="text-accent hover:underline">
                contact@decodingtrust-agent.org
              </a>
            </p>
            <p>
              <span className="text-muted-foreground">GitHub: </span>
              <a href="https://github.com" className="text-accent hover:underline">
                github.com/decodingtrust-agent
              </a>
            </p>
          </div>
          <Button variant="outline">Send Message</Button>
        </div>

        <div className="mt-12 p-6 rounded-lg border border-border bg-secondary/20">
          <h3 className="text-lg font-semibold mb-4">Citation</h3>
          <pre className="bg-secondary/50 rounded-lg p-4 overflow-x-auto text-sm font-mono">
            {`@article{dt-agent2025,
  title={DT-Agent: A Real-World Simulation Platform for
         Advanced Red-Teaming of AI Agents},
  author={Author1 and Author2 and Author3 and Author4},
  journal={arXiv preprint arXiv:2501.xxxxx},
  year={2025}
}`}
          </pre>
        </div>
      </div>
    </section>
  )
}

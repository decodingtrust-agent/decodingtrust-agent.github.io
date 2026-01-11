import { Shield, Users, Mail, Building2, GraduationCap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const team = [
  { name: "Researcher 1", affiliation: "University A", role: "Lead Researcher" },
  { name: "Researcher 2", affiliation: "University B", role: "Security Expert" },
  { name: "Researcher 3", affiliation: "Company C", role: "ML Engineer" },
  { name: "Researcher 4", affiliation: "University A", role: "Benchmark Design" },
]

const affiliations = ["University A", "University B", "Research Lab C", "Company D"]

export function AboutSection() {
  return (
    <section className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <Shield className="h-12 w-12 text-accent mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold mb-4">About DecodingTrust Agent Suite</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A research initiative to advance AI agent security through comprehensive, policy-based evaluation.
          </p>
        </div>

        <div className="prose prose-invert max-w-none mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-accent" />
            Our Mission
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            DecodingTrust Agent Suite is a comprehensive, policy-based unified platform for agent red teaming. Our
            mission is to provide researchers and practitioners with the tools needed to rigorously evaluate AI agent
            security across diverse, real-world domains.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-8">
            The platform encompasses 30+ high-fidelity sandbox environments (e.g., Gmail, PayPal, Databricks) spanning
            over 15 domains, with over 500 benign and malicious tasks per domain. All evaluated risks are derived
            directly from domain-specific safety and security policies such as FINRA in Finance and the Salesforce AI
            Use Policy.
          </p>

          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-accent" />
            Research Team
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-12">
          {team.map((member) => (
            <Card key={member.name} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                    <p className="text-xs text-accent">{member.affiliation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Affiliations</h2>
          <div className="flex flex-wrap gap-3">
            {affiliations.map((aff) => (
              <div key={aff} className="px-4 py-2 rounded-lg border border-border bg-card text-sm">
                {aff}
              </div>
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
            {`@article{decodingtrust-agent2025,
  title={DecodingTrust Agent Suite: Automated Security 
         Auditing of AI Agents in Real Environments},
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

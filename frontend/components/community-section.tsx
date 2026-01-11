import { MessageCircle, Github, FileText, Database, Package, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const resources = [
  {
    icon: Github,
    title: "Source Code",
    description: "Explore and contribute to the DecodingTrust Agent codebase.",
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
    link: "https://arxiv.org",
    linkText: "arxiv.org/abs/2501.xxxxx",
  },
]

const communities = [
  {
    icon: MessageCircle,
    title: "Discord",
    description: "Join our Discord server for real-time discussions, support, and announcements.",
    buttonText: "Join Discord",
    link: "https://discord.gg",
    members: "1.2K+",
  },
  {
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z" />
      </svg>
    ),
    title: "WeChat Group",
    description: "Connect with Chinese-speaking researchers and practitioners in our WeChat community.",
    buttonText: "Join WeChat",
    link: "#",
    members: "500+",
  },
]

export function CommunitySection() {
  return (
    <section className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Community & Resources</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join our community, access resources, and contribute to advancing AI agent security.
          </p>
        </div>

        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Join the Community</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {communities.map((community) => (
              <Card key={community.title} className="bg-card border-border hover:border-accent/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary">
                        <community.icon className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{community.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{community.members} members</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">{community.description}</CardDescription>
                  <Button className="w-full bg-foreground text-background hover:bg-foreground/90" asChild>
                    <a href={community.link} target="_blank" rel="noopener noreferrer">
                      {community.buttonText}
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
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

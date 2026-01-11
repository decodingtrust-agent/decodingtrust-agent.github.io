import { Github, MessageCircle, FileText, Database, ExternalLink } from "lucide-react"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/logo-no-text.png"
                alt="DecodingTrust Agent Logo"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <div>
                <span className="text-sm font-semibold">DecodingTrust Agent Suite</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              A comprehensive, policy-based unified platform for agent red teaming with an advanced benchmark designed
              to evaluate AI agent security across diverse domains.
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
              <a
                href="https://huggingface.co"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <Database className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              {["Documentation", "API Reference", "SDK / PyPI", "Examples", "Changelog"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group"
                  >
                    {item}
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Community</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <Github className="h-4 w-4" /> GitHub
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" /> Discord
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <Database className="h-4 w-4" /> HuggingFace
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" /> arXiv Paper
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DecodingTrust Agent Suite. Research collaboration.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              License (MIT)
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

"use client"

import { useState } from "react"
import { Github, MessageCircle, Menu, X, Sun, Moon } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"

type TabType = "home" | "quickstart" | "docs" | "leaderboard" | "competition" | "community" | "about"

interface HeaderProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const navItems: { label: string; value: TabType }[] = [
  { label: "Quickstart", value: "quickstart" },
  { label: "Leaderboard", value: "leaderboard" },
  { label: "Docs", value: "docs" },
  { label: "Competition", value: "competition" },
  { label: "Community", value: "community" },
  { label: "About", value: "about" },
]

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4 lg:px-6">
        {/* Logo - left aligned */}
        <button
          onClick={() => onTabChange("home")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity mr-8"
        >
          <Image
            src="/logo-no-text.png"
            alt="DecodingTrust Agent Logo"
            width={28}
            height={28}
            className="rounded"
          />
          <span className="text-sm font-semibold font-mono tracking-tight">decodingtrust-agent</span>
        </button>

        {/* Nav items - inline with logo */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.value}
              onClick={() => onTabChange(item.value)}
              className={cn(
                "px-3 py-1.5 text-sm transition-colors",
                activeTab === item.value
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right side icons - pushed to far right */}
        <div className="flex items-center gap-1 ml-auto">
          {/* Theme toggle */}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer" aria-label="Discord">
              <MessageCircle className="h-4 w-4" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <Github className="h-4 w-4" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="flex flex-col p-4 gap-1">
            {navItems.map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  onTabChange(item.value)
                  setMobileMenuOpen(false)
                }}
                className={cn(
                  "px-4 py-2 text-sm transition-colors rounded text-left",
                  activeTab === item.value
                    ? "text-foreground font-medium bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}

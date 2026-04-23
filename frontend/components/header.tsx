"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Github, MessageCircle, Menu, X, Sun, Moon } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"

const navItems = [
  { label: "Quickstart", href: "/quickstart" },
  { label: "Benchmark", href: "/registry" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Docs", href: "/docs" },
  { label: "Community", href: "/community" },
  { label: "About", href: "/about" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center px-4 lg:px-6">
        {/* Logo - left aligned */}
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity mr-8"
        >
          <Image
            src="/dt-agent-logo-circled.png"
            alt="DT-Agent Logo"
            width={48}
            height={48}
            className="rounded-full"
          />
          <span className="text-base font-semibold tracking-tight hidden sm:inline">
            <span className="text-foreground">Decoding</span>
            <span className="text-[oklch(0.7_0.14_220)]">Trust</span>
            <span className="text-[oklch(0.7_0.14_220)]"> Agent</span>
          </span>
        </Link>

        {/* Nav items - inline with logo */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            )
          })}
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
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-4 py-2 text-sm transition-colors rounded text-left",
                  (pathname === item.href || pathname?.startsWith(item.href + "/"))
                    ? "text-foreground font-medium bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}

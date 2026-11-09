"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Github, MessageCircle, Menu, X, Sun, Moon, ChevronDown, LayoutGrid } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import { BENCHMARKS, UPCOMING_BENCHMARKS, isBenchmarkPath } from "@/benchmarks/registry"

const navItems = [
  { label: "Docs", href: "/docs" },
  { label: "Community", href: "/community" },
  { label: "About", href: "/about" },
]

const quickstartItem = { label: "Quickstart", href: "/quickstart" }
const blogItem = { label: "Blog", href: "/blog" }

function UpcomingBenchmark({ benchmark, mobile = false }: {
  benchmark: typeof UPCOMING_BENCHMARKS[number]
  mobile?: boolean
}) {
  const content = <>
    <span className="flex w-full items-center justify-between gap-3">
      <span className="font-medium">{benchmark.name}</span>
      {mobile && <span className="shrink-0 text-[10px]">Coming soon</span>}
    </span>
    <span className="text-xs leading-relaxed">{benchmark.tagline}</span>
  </>

  if (mobile) return (
    <div aria-disabled="true" title="Coming soon" className="flex cursor-default flex-col gap-1 rounded px-3 py-2 text-sm text-muted-foreground/60">
      {content}
    </div>
  )

  return (
    <div className="group relative" title="Coming soon">
      <DropdownMenuItem disabled className="flex flex-col items-start gap-1 py-2.5 text-muted-foreground data-[disabled]:opacity-60">
        {content}
      </DropdownMenuItem>
      <span role="tooltip" className="pointer-events-none absolute right-2 top-2 rounded bg-foreground px-2 py-1 text-[10px] text-background opacity-0 transition-opacity group-hover:opacity-100">
        Coming soon
      </span>
    </div>
  )
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()

  const isLeaderboardActive = pathname === "/leaderboard" || pathname?.startsWith("/leaderboard/")
  const isBenchmarkActive = isBenchmarkPath(pathname)

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
            alt="DTap Logo"
            width={48}
            height={48}
            className="rounded-full"
          />
          <span className="text-base font-semibold tracking-tight hidden whitespace-nowrap sm:inline">
            <span className="text-foreground">Decoding</span>
            <span className="text-[oklch(0.7_0.14_220)]">Trust</span>
            <span className="text-[oklch(0.7_0.14_220)]"> Agent</span>
          </span>
        </Link>

        {/* Nav items - inline with logo */}
        <nav className="hidden xl:flex items-center gap-1">
          {/* Quickstart */}
          <Link
            href={quickstartItem.href}
            className={cn(
              "px-3 py-1.5 text-sm transition-colors",
              (pathname === quickstartItem.href || pathname?.startsWith(quickstartItem.href + "/"))
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {quickstartItem.label}
          </Link>

          <Link href={blogItem.href} aria-current={pathname === "/blog" || pathname?.startsWith("/blog/") ? "page" : undefined}
            className={cn("rounded-md px-3 py-1.5 text-sm transition-colors",
              pathname === "/blog" || pathname?.startsWith("/blog/") ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {blogItem.label}
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn("flex items-center gap-0.5 rounded-md px-3 py-1.5 text-sm outline-none transition-colors",
                isBenchmarkActive ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}>
                Benchmark<ChevronDown className="ml-0.5 h-3.5 w-3.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              <DropdownMenuItem asChild>
                <Link href="/benchmarks" aria-current={pathname === "/benchmarks" ? "page" : undefined} className="cursor-pointer">
                  <LayoutGrid className="h-4 w-4" /><span className="font-medium">All Benchmarks</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {BENCHMARKS.map((benchmark) => (
                <DropdownMenuItem key={benchmark.id} asChild>
                  <Link href={benchmark.href} aria-current={pathname === benchmark.href || pathname?.startsWith(benchmark.href + "/") ? "page" : undefined}
                    className="flex cursor-pointer flex-col items-start gap-1 py-2.5">
                    <span className="flex w-full items-center justify-between gap-4">
                      <span className="font-medium">{benchmark.name}</span>
                      <span className="text-xs text-muted-foreground">{benchmark.version}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{benchmark.tagline}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {UPCOMING_BENCHMARKS.map((benchmark) => <UpcomingBenchmark key={benchmark.id} benchmark={benchmark} />)}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Results grouped by benchmark. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-0.5 px-3 py-1.5 text-sm transition-colors rounded-md outline-none",
                  isLeaderboardActive
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Leaderboard
                <ChevronDown className="h-3.5 w-3.5 ml-0.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              {BENCHMARKS.map((benchmark) => (
                <DropdownMenuItem key={benchmark.id} asChild>
                  <Link href={benchmark.leaderboardHref} className="flex cursor-pointer flex-col items-start gap-1 py-2.5"
                    aria-current={pathname === benchmark.leaderboardHref ? "page" : undefined}>
                    <span className="flex w-full items-center justify-between gap-4">
                      <span className="font-medium">{benchmark.name}</span>
                      <span className="text-xs text-muted-foreground">{benchmark.version}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{benchmark.tagline}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {UPCOMING_BENCHMARKS.map((benchmark) => <UpcomingBenchmark key={benchmark.id} benchmark={benchmark} />)}
            </DropdownMenuContent>
          </DropdownMenu>

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
            <a href="https://discord.gg/z8ZhVwPqUk" target="_blank" rel="noopener noreferrer" aria-label="Discord">
              <MessageCircle className="h-4 w-4" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <a href="https://github.com/AI-secure/DecodingTrust-Agent" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <Github className="h-4 w-4" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden h-8 w-8"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div id="mobile-navigation" className="max-h-[calc(100dvh-5rem)] overflow-y-auto xl:hidden border-t border-border bg-background">
          <nav className="flex flex-col p-4 gap-1">
            <Link
              href={quickstartItem.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "px-4 py-2 text-sm transition-colors rounded text-left",
                (pathname === quickstartItem.href || pathname?.startsWith(quickstartItem.href + "/"))
                  ? "text-foreground font-medium bg-secondary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
              )}
            >
              {quickstartItem.label}
            </Link>
            <Link href={blogItem.href} onClick={() => setMobileMenuOpen(false)}
              aria-current={pathname === "/blog" || pathname?.startsWith("/blog/") ? "page" : undefined}
              className={cn("rounded px-4 py-2 text-sm transition-colors",
                pathname === "/blog" || pathname?.startsWith("/blog/") ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground")}>
              {blogItem.label}
            </Link>
            <div className="rounded-md border border-border/60 p-2">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Benchmark</p>
              {[{ name: "All Benchmarks", href: "/benchmarks" }, ...BENCHMARKS].map((benchmark) => (
                <Link key={benchmark.href} href={benchmark.href} onClick={() => setMobileMenuOpen(false)}
                  className={cn("block rounded px-3 py-2 text-sm transition-colors",
                    pathname === benchmark.href || (benchmark.href !== "/benchmarks" && pathname?.startsWith(benchmark.href + "/"))
                      ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground")}>
                  {benchmark.name}
                </Link>
              ))}
              {UPCOMING_BENCHMARKS.map((benchmark) => <UpcomingBenchmark key={benchmark.id} benchmark={benchmark} mobile />)}
            </div>
            <div className="rounded-md border border-border/60 p-2">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Leaderboard</p>
              {BENCHMARKS.map((benchmark) => (
                <Link key={benchmark.id} href={benchmark.leaderboardHref} onClick={() => setMobileMenuOpen(false)}
                  className={cn("block rounded px-3 py-2 text-sm transition-colors",
                    pathname === benchmark.leaderboardHref ? "bg-secondary font-medium text-foreground"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground")}>
                  {benchmark.name}
                </Link>
              ))}
              {UPCOMING_BENCHMARKS.map((benchmark) => <UpcomingBenchmark key={benchmark.id} benchmark={benchmark} mobile />)}
            </div>
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

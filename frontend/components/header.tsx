"use client"

import { useState, useRef, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Github, MessageCircle, Menu, X, Sun, Moon, LogIn, User, Settings, LayoutDashboard, LogOut, ChevronDown } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/contexts/auth-context"

const navItems = [
  { label: "Quickstart", href: "/quickstart" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Docs", href: "/docs" },
  { label: "Competition", href: "/competition" },
  { label: "Community", href: "/community" },
  { label: "About", href: "/about" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, logout, isLoading } = useAuth()
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    setUserMenuOpen(false)
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4 lg:px-6">
        {/* Logo - left aligned */}
        <Link
          href="/"
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
        </Link>

        {/* Nav items - inline with logo */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-1.5 text-sm transition-colors",
                pathname === item.href
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
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

          {/* User Menu / Login Button */}
          {!isLoading && (
            isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 gap-1"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="hidden sm:inline text-sm max-w-[100px] truncate">
                    {user?.username}
                  </span>
                  <ChevronDown className={cn(
                    "h-3 w-3 transition-transform",
                    userMenuOpen && "rotate-180"
                  )} />
                </Button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-popover shadow-lg py-1 z-50">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium">{user?.username}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <Link
                        href="/workspace"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-secondary/50 transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Workspace
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-secondary/50 transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-border py-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 text-sm w-full text-left hover:bg-secondary/50 transition-colors text-destructive"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href="/login" aria-label="Login">
                  <LogIn className="h-4 w-4" />
                </Link>
              </Button>
            )
          )}

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
                  pathname === item.href
                    ? "text-foreground font-medium bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                )}
              >
                {item.label}
              </Link>
            ))}

            {/* Mobile auth section */}
            {isAuthenticated ? (
              <>
                <div className="border-t border-border my-2" />
                <Link
                  href="/workspace"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 text-sm transition-colors rounded text-left text-muted-foreground hover:text-foreground hover:bg-secondary/50 flex items-center gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Workspace
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 text-sm transition-colors rounded text-left text-muted-foreground hover:text-foreground hover:bg-secondary/50 flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    handleLogout()
                    setMobileMenuOpen(false)
                  }}
                  className="px-4 py-2 text-sm transition-colors rounded text-left text-destructive hover:bg-secondary/50 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-4 py-2 text-sm transition-colors rounded text-left",
                  pathname === "/login"
                    ? "text-foreground font-medium bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                )}
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Settings, User, Bell, Shield, Key, Lock } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please sign in to access settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="border-b border-border bg-background/50 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 lg:px-6 py-6">
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 lg:px-6 py-8 space-y-8">
        {/* Profile Section */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Profile</h2>
          </div>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1.5">Username</label>
                <div className="px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm">
                  {user?.username}
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1.5">Email</label>
                <div className="px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm">
                  {user?.email}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              Edit Profile (Coming Soon)
            </Button>
          </div>
        </div>

        {/* Security Section */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Security</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Password</p>
                  <p className="text-xs text-muted-foreground">Change your password</p>
                </div>
              </div>
              <Button variant="outline" size="sm" disabled>
                Change
              </Button>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>
          <div className="text-sm text-muted-foreground">
            Notification settings coming soon.
          </div>
        </div>

        {/* API Keys Section */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">API Keys</h2>
          </div>
          <div className="text-sm text-muted-foreground">
            API key management coming soon. You&apos;ll be able to configure your OpenAI, Anthropic, and other API keys here.
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to home
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/logo-no-text.png"
              alt="DT-Agent Logo"
              width={48}
              height={48}
              className="rounded-lg"
            />
          </div>

          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-2">
            Login hidden for now
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            The frontend authentication flow is temporarily disabled. You can continue browsing the benchmark without signing in.
          </p>

          <Button className="w-full" asChild>
            <Link href="/registry">Browse registry</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

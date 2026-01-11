import type React from "react"
import type { Metadata, Viewport } from "next"
import { JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["300", "400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "DecodingTrust Agent Suite | Automated Security Auditing of AI Agents",
  description:
    "A comprehensive, policy-based unified platform for agent red teaming with an advanced benchmark designed to evaluate AI agent security across diverse domains.",
  keywords: ["AI security", "agent evaluation", "red teaming", "benchmark", "AI safety", "LLM security"],
    generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a14" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jetbrainsMono.className} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

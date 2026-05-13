import type React from "react"
import type { Metadata, Viewport } from "next"
import { JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { ApiKeysProvider } from "@/contexts/api-keys-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import "./globals.css"

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["300", "400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "DecodingTrust Agent Platform",
  description:
    "DecodingTrust Agent Platform — a real-world simulation platform for advanced red-teaming of AI agents, featuring DTap-Red autonomous red-teaming and DTap-Bench comprehensive benchmark.",
  keywords: ["AI security", "agent evaluation", "red teaming", "benchmark", "AI safety", "LLM security"],
  icons: {
    icon: "/dt-agent-logo.png",
    apple: "/dt-agent-logo.png",
  },
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
        <ThemeProvider>
          <ApiKeysProvider>
            <div className="min-h-screen bg-background">
              <Header />
              <main>{children}</main>
              <Footer />
            </div>
          </ApiKeysProvider>
        </ThemeProvider>
        {process.env.VERCEL && <Analytics />}
      </body>
    </html>
  )
}

"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useTheme } from "@/components/theme-provider"
import { MAS_ROOT, MAS_VERSION, MAS_TAGLINE } from "@/benchmarks/registry"
import { SdkInstall } from "@/benchmarks/components/sdk-install"
import { cn } from "@/lib/utils"

type View = "tasks" | "task" | "worlds"
const ASSETS = "/benchmarks/dtap-mas/visualization/"
const FILES: Record<View, string> = { tasks: "tasks.html", task: "task.html", worlds: "index.html" }

function assetUrl(view: View, query: string) {
  const params = new URLSearchParams(query)
  params.set("embed", "1")
  return `${ASSETS}${FILES[view]}?${params}`
}

function pageUrl(url: URL) {
  const file = url.pathname.split("/").pop()
  const suffix = file === "task.html" ? "/task" : file === "index.html" ? "/worlds" : ""
  const params = new URLSearchParams(url.search)
  params.delete("embed")
  return `${MAS_ROOT}${suffix}${params.size ? `?${params}` : ""}`
}

export function MasExplorer({ view }: { view: View }) {
  const router = useRouter()
  const query = useSearchParams().toString()
  const { theme, toggleTheme } = useTheme()
  const iframe = useRef<HTMLIFrameElement>(null)
  const [source, setSource] = useState(() => assetUrl(view, query))
  const sourceRef = useRef(source)
  const [height, setHeight] = useState(900)
  const [expanded, setExpanded] = useState<"topology" | "trajectory" | null>(null)
  const expandedRef = useRef(false)

  useEffect(() => {
    if (!expanded) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") iframe.current?.contentWindow?.postMessage({ type: "dtap:viewer-close" }, window.location.origin)
    }
    window.addEventListener("keydown", close)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("keydown", close)
    }
  }, [expanded])

  useEffect(() => {
    if (view === "task" && !new URLSearchParams(query).get("t")) {
      router.replace(MAS_ROOT)
      return
    }
    const next = assetUrl(view, query)
    if (next !== sourceRef.current) {
      sourceRef.current = next
      setSource(next)
    }
  }, [view, query, router])

  const sendTheme = useCallback(() => {
    iframe.current?.contentWindow?.postMessage({ type: "dtap:theme", theme }, window.location.origin)
  }, [theme])

  useEffect(sendTheme, [sendTheme, source])

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== iframe.current?.contentWindow) return
      const message = event.data
      if (!message || typeof message !== "object") return
      if (message.type === "dtap-mas:height" && !expandedRef.current && view !== "worlds" && Number.isFinite(message.height)) {
        setHeight(Math.min(30000, Math.max(320, message.height)))
      }
      if (message.type === "dtap-mas:viewer" && (message.viewer === null || message.viewer === "topology" || message.viewer === "trajectory")) {
        expandedRef.current = Boolean(message.viewer)
        setExpanded(message.viewer)
      }
      if (message.type === "dtap-mas:theme" && (message.theme === "light" || message.theme === "dark")) {
        if (message.theme !== theme) toggleTheme()
      }
      if ((message.type === "dtap-mas:navigate" || message.type === "dtap-mas:state") && typeof message.url === "string") {
        const url = new URL(message.url, window.location.origin)
        if (url.origin !== window.location.origin || !url.pathname.startsWith(ASSETS)) return
        if (!["tasks.html", "task.html", "index.html"].includes(url.pathname.split("/").pop() || "")) return
        if (message.type === "dtap-mas:navigate") {
          expandedRef.current = false
          setExpanded(null)
          router.push(pageUrl(url))
          window.scrollTo({ top: 0 })
        } else {
          const file = url.pathname.split("/").pop()
          const currentView = file === "task.html" ? "task" : file === "index.html" ? "worlds" : "tasks"
          sourceRef.current = assetUrl(currentView, url.search)
          window.history.replaceState(null, "", pageUrl(url))
        }
      }
    }
    window.addEventListener("message", receive)
    return () => window.removeEventListener("message", receive)
  }, [router, theme, toggleTheme, view])

  return (
    <section className="min-h-[calc(100vh-8rem)]" style={expanded ? { minHeight: height } : undefined}>
      {view !== "task" && <div className="border-b border-border/60">
        <div className={cn("mx-auto max-w-7xl px-4 lg:px-6", view === "tasks" ? "py-12" : "py-6")}>
          <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link><span>/</span>
            <Link href="/benchmarks" className="hover:text-foreground">Benchmarks</Link><span>/</span>
            {view === "tasks" ? <span className="text-foreground">DTap-MAS</span> : <>
              <Link href={MAS_ROOT} className="hover:text-foreground">DTap-MAS</Link><span>/</span>
              <span className="text-foreground">{view === "worlds" ? "Worlds" : "Task Explorer"}</span>
            </>}
          </nav>
          {view === "tasks" && <>
            <h1 className="mb-3 text-3xl font-mono font-bold tracking-tight md:text-4xl">dtap-mas=={MAS_VERSION}</h1>
            <p className="mb-6 max-w-2xl text-muted-foreground">
              {MAS_TAGLINE}. {" "}
              Explore how an outside attacker turns multi-agent collaboration against the people it serves.
            </p>
            <SdkInstall />
          </>}
        </div>
      </div>}
      <div className={expanded ? "fixed inset-0 z-[100] bg-background" : undefined}
        role={expanded ? "dialog" : undefined} aria-modal={expanded ? true : undefined}
        aria-label={expanded ? `Expanded ${expanded === "topology" ? "agent topology" : "trajectory"}` : undefined}>
        <iframe
        ref={iframe}
        src={source}
        title={`DTap-MAS ${view === "worlds" ? "world topology explorer" : view === "task" ? "task explorer" : "task list"}`}
        onLoad={sendTheme}
        className="block w-full border-0 bg-background"
        style={{ height: expanded ? "100dvh" : view === "worlds" ? "max(760px, calc(100dvh - 235px))" : height }}
        />
      </div>
    </section>
  )
}

import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA = "true"
process.env.BROWSERSLIST_IGNORE_OLD_DATA = "true"

// Self-hosted via Nginx + systemd. Set DT_STATIC_EXPORT=1 to fall back to the
// old GitHub Pages static export pipeline.
const isStaticExport = process.env.DT_STATIC_EXPORT === "1"

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(isStaticExport ? { output: "export", trailingSlash: true } : {}),
  turbopack: {
    root: __dirname,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ["decodingtrust-agent.ngrok.io"],
}

export default nextConfig

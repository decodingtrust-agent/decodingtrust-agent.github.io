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
  ...(process.env.DT_BUILD_DIR ? { distDir: process.env.DT_BUILD_DIR } : {}),
  ...(process.env.DT_BUILD_WORKERS ? { experimental: { cpus: Number(process.env.DT_BUILD_WORKERS) } } : {}),
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
  async rewrites() {
    const previewApi = process.env.DT_PREVIEW_API_ORIGIN
    return process.env.NODE_ENV === "development" && previewApi
      ? [{ source: "/traj-api/:path*", destination: `${previewApi.replace(/\/$/, "")}/traj-api/:path*` }]
      : []
  },
}

export default nextConfig

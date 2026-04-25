#!/usr/bin/env node
/**
 * Unzip every *.zip from the trajectory drop folder into public/data/trajectories/.
 *
 * Default zip dir: <repo>/trajectory  (sibling of frontend/)
 * Override: TRAJECTORY_ZIP_DIR=/path/to/zips
 *
 * Usage (from frontend/):
 *   node scripts/unzip-trajectories.mjs
 *   npm run trajectories:unpack   # also runs trajectories:manifest
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FRONTEND_ROOT = path.join(__dirname, "..")
const DEST = path.join(FRONTEND_ROOT, "public", "data", "trajectories")
const ZIP_DIR = process.env.TRAJECTORY_ZIP_DIR
  ? path.resolve(process.env.TRAJECTORY_ZIP_DIR)
  : path.join(FRONTEND_ROOT, "..", "trajectory")

function main() {
  if (!fs.existsSync(ZIP_DIR)) {
    console.error(`[unzip-trajectories] Directory not found: ${ZIP_DIR}`)
    console.error("Create it and copy all .zip files there, or set TRAJECTORY_ZIP_DIR.")
    process.exit(1)
  }

  const zips = fs.readdirSync(ZIP_DIR).filter((f) => f.toLowerCase().endsWith(".zip"))
  if (!zips.length) {
    console.error(`[unzip-trajectories] No .zip files in: ${ZIP_DIR}`)
    process.exit(1)
  }

  fs.mkdirSync(DEST, { recursive: true })
  console.log(`[unzip-trajectories] Destination: ${DEST}`)
  console.log(`[unzip-trajectories] Found ${zips.length} archive(s).`)

  function renameNoImageTo(targetTopName) {
    const src = path.join(DEST, "no_image")
    const dst = path.join(DEST, targetTopName)
    if (!fs.existsSync(src)) return
    if (fs.existsSync(dst)) {
      fs.rmSync(dst, { recursive: true, force: true })
    }
    fs.renameSync(src, dst)
    console.log(`[unzip-trajectories] Renamed no_image/ → ${targetTopName}/`)
  }

  // The registry only needs `<task>/judge_result.json` + `<task>/<timestamp>.json` runs.
  // Everything else (raw SDK traces, sharded `<ts>_N.json`, partial/red-teaming
  // intermediates, skill injections, .DS_Store) is dropped at unzip time so the
  // on-disk tree stays as small as possible and consistent across re-runs.
  const EXCLUDE_GLOBS = [
    "*/traces/*",
    "*/.DS_Store",
    "*/skill_injection_*/*",
    "*/partial_trajectory.json",
    "*/judge_result_before_rejudge.json",
    "*/trajectory.json",
    "*/red_teaming_agent_*",
    "*/[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]_[0-9][0-9][0-9][0-9][0-9][0-9]_*.json",
  ]

  for (const name of zips.sort()) {
    const full = path.join(ZIP_DIR, name)
    console.log(`[unzip-trajectories] Extracting ${name} …`)
    const args = ["-q", "-o", full, "-d", DEST, "-x", ...EXCLUDE_GLOBS]
    const r = spawnSync("unzip", args, { stdio: "inherit" })
    if (r.status !== 0) {
      console.error(`[unzip-trajectories] unzip failed for ${name} (exit ${r.status ?? "unknown"})`)
      process.exit(r.status ?? 1)
    }

    // Both no_image-*.zip archives are the same Windows-task export packaged twice;
    // keep one canonical copy under windows/ and skip the duplicate.
    if (name.startsWith("no_image-20260424T043708")) {
      renameNoImageTo("windows")
    } else if (name.startsWith("no_image-20260424T043918")) {
      const dup = path.join(DEST, "no_image")
      if (fs.existsSync(dup)) {
        fs.rmSync(dup, { recursive: true, force: true })
        console.log(`[unzip-trajectories] Discarded duplicate macOS-named pack (same windows/ data)`)
      }
    }
  }

  console.log("[unzip-trajectories] Done.")
}

main()

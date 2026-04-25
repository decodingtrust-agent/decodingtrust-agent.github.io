/**
 * Scan public/data/trajectories/ (normal files, not zip) and write public/data/trajectory-manifest.json.
 * Also walks public/data/tasks/*.json to build an alias map (task config_path → manifest entry key).
 *
 * Usage: npx tsx scripts/build-trajectory-manifest.ts
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  buildManifestFile,
  buildAliasMap,
  consolidatePathsToEntries,
  type TaskRef,
} from "../lib/trajectory-manifest-build"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FRONTEND_ROOT = path.join(__dirname, "..")
const OUT_DIR = path.join(FRONTEND_ROOT, "public", "data", "trajectories")
const TASKS_DIR = path.join(FRONTEND_ROOT, "public", "data", "tasks")
const MANIFEST_PATH = path.join(FRONTEND_ROOT, "public", "data", "trajectory-manifest.json")

function collectRelativeFilePaths(absRoot: string): string[] {
  const out: string[] = []
  if (!fs.existsSync(absRoot)) return out

  function walk(absDir: string) {
    let dirents: fs.Dirent[]
    try {
      dirents = fs.readdirSync(absDir, { withFileTypes: true })
    } catch {
      return
    }
    for (const d of dirents) {
      const abs = path.join(absDir, d.name)
      if (d.isDirectory()) walk(abs)
      else if (d.isFile()) out.push(path.relative(absRoot, abs).split(path.sep).join("/"))
    }
  }
  walk(absRoot)
  return out
}

function configPathToKey(domain: string, configPath: string): string {
  const dir = configPath.replace(/\/config\.yaml$/i, "").replace(/\\/g, "/")
  // domain prefix may already be the first segment
  if (dir.startsWith(`${domain}/`)) return dir
  return `${domain}/${dir}`
}

function loadTaskRefs(tasksDir: string): TaskRef[] {
  if (!fs.existsSync(tasksDir)) return []
  const refs: TaskRef[] = []
  for (const name of fs.readdirSync(tasksDir)) {
    if (!name.endsWith(".json")) continue
    try {
      const raw = fs.readFileSync(path.join(tasksDir, name), "utf8")
      const j = JSON.parse(raw) as {
        domain?: string
        type?: string
        config_path?: string
      }
      if (!j.domain || !j.config_path) continue
      const key = configPathToKey(j.domain, j.config_path)
      refs.push({
        key,
        domain: j.domain,
        type: j.type ?? "",
        configPath: j.config_path,
      })
    } catch {
      // skip malformed task files
    }
  }
  return refs
}

function main() {
  const relPaths = collectRelativeFilePaths(OUT_DIR)
  const entries = consolidatePathsToEntries(relPaths)
  const tasks = loadTaskRefs(TASKS_DIR)
  const aliases = buildAliasMap(entries, tasks)
  const manifest = buildManifestFile(entries, aliases)

  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true })
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest), "utf8")
  console.log(
    `[trajectory-manifest] Wrote ${MANIFEST_PATH} (${manifest.entryCount} keys, ${Object.keys(aliases).length} aliases from ${OUT_DIR})`
  )
}

main()

/**
 * Shared logic for trajectory-manifest.json (Node build + admin UI).
 * Paths are POSIX-style relative to `public/data/trajectories/` (e.g. browser/openaisdk/gpt-5.1/...).
 */

export const TRAJ_FILE_RE = /^(\d{8})_(\d{6})\.json$/

export function dirnamePosix(p: string): string {
  const i = p.lastIndexOf("/")
  return i === -1 ? "" : p.slice(0, i)
}

export function basenamePosix(p: string): string {
  const i = p.lastIndexOf("/")
  return i === -1 ? p : p.slice(i + 1)
}

/** SDK vendor folders seen under each domain in trajectory exports. */
const SDK_ROOTS = new Set(["openaisdk", "googleadk", "claudesdk", "openclaw"])

/**
 * (sdk-folder, model-id) pairs that should NEVER be indexed in the manifest, even if
 * trajectory files exist on disk. Filtered at the manifest build layer so admin / CI
 * never produces them, and at the consumer layer (registry) for legacy manifests.
 */
const EXCLUDED_TRAJECTORY_PAIRS: ReadonlyArray<{ sdk: string; model: string }> = [
  { sdk: "openaisdk", model: "gpt-5.1" },
]

/** Returns true if the trajectory directory belongs to an excluded sdk × model combination. */
export function isExcludedTrajectoryPath(rel: string): boolean {
  const parts = rel.replace(/\\/g, "/").split("/")
  const i = findSdkIndex(parts)
  if (i === -1) return false
  const sdk = parts[i]
  const model = parts[i + 1] ?? ""
  return EXCLUDED_TRAJECTORY_PAIRS.some((pair) => pair.sdk === sdk && pair.model === model)
}

/** First path segment (after zip root) that matches a registry domain (for misnamed roots like no_image/.../windows/). */
const REGISTRY_DOMAIN_MARKERS = new Set([
  "browser",
  "code",
  "crm",
  "customer-service",
  "finance",
  "legal",
  "medical",
  "macos",
  "os-filesystem",
  "research",
  "telecom",
  "travel",
  "windows",
  "workflow",
  "no_image",
])

export function findSdkIndex(parts: string[]): number {
  for (let j = 1; j < parts.length; j++) {
    if (SDK_ROOTS.has(parts[j])) return j
  }
  return -1
}

/** Strip leading wrapper folders so path starts with `<domain>/<sdk>/...`. */
export function normalizeTrajectoryRelativePath(raw: string): string | null {
  const p = raw.replace(/\\/g, "/")
  const m = p.match(new RegExp(`([^/]+/(?:${[...SDK_ROOTS].join("|")})/.+)`))
  return m ? m[1] : null
}

export function logicalKeyFromRel(rel: string): string | null {
  const parts = rel.split("/")
  const i = findSdkIndex(parts)
  if (i === -1 || i + 2 > parts.length) return null
  const domain = parts[0]
  const tail = parts.slice(i + 2).join("/")
  if (!tail) return null
  if (tail.startsWith(`${domain}/`)) return tail
  return `${domain}/${tail}`
}

/**
 * When the zip root folder is wrong but inner path contains the real domain (e.g. no_image/.../windows/benign/1),
 * return the registry-style key (windows/benign/1). Otherwise null (caller uses logicalKeyFromRel).
 */
export function inferRegistryKeyFromRel(rel: string): string | null {
  const parts = rel.split("/")
  for (let j = 1; j < parts.length; j++) {
    if (REGISTRY_DOMAIN_MARKERS.has(parts[j])) {
      return parts.slice(j).join("/")
    }
  }
  return null
}

export function manifestKeyFromTrajectoryDir(rel: string): string | null {
  return inferRegistryKeyFromRel(rel) ?? logicalKeyFromRel(rel)
}

export function modelIdFromTrajectoryDir(rel: string): string {
  const parts = rel.split("/")
  const i = findSdkIndex(parts)
  if (i === -1) return ""
  return parts[i + 1] || ""
}

export function modelRank(model: string): number {
  if (model.includes("gpt-5.1")) return 1000
  if (model.includes("gpt-5.2")) return 999
  if (model.includes("gpt-5")) return 998
  if (model.includes("gpt-4")) return 997
  if (model.includes("gpt-oss")) return 500
  return 0
}

export function sdkIdFromTrajectoryDir(rel: string): string {
  const parts = rel.split("/")
  const i = findSdkIndex(parts)
  if (i === -1) return ""
  return parts[i] || ""
}

export interface TrajectoryRun {
  sdk: string
  model: string
  ts: string
  trajectory: string
  judge: string
}

export interface TrajectoryManifestEntry {
  trajectory: string
  judge: string
  runs?: TrajectoryRun[]
}

export interface TrajectoryManifestFile {
  version: number
  generatedAt?: string
  entryCount?: number
  entries: Record<string, TrajectoryManifestEntry>
  /** aliasKey → canonical entries key. Tasks reference manifest entries through these aliases. */
  aliases?: Record<string, string>
}

interface Candidate {
  ts: string
  trajRel: string
  judgeRel: string
  sdk: string
  model: string
}

function pickBest(cands: Candidate[]): Candidate {
  return cands.slice().sort((a, b) => {
    const t = b.ts.localeCompare(a.ts)
    if (t !== 0) return t
    return modelRank(b.model) - modelRank(a.model)
  })[0]
}

/**
 * Build manifest `entries` from a flat list of file paths (relative to trajectories root).
 * Linear in the number of files: bucket by directory, then process each bucket once.
 */
export function consolidatePathsToEntries(relativeFilePaths: string[]): Record<string, TrajectoryManifestEntry> {
  const filesByDir = new Map<string, string[]>()
  for (const raw of relativeFilePaths) {
    const p = raw.replace(/\\/g, "/")
    const dir = dirnamePosix(p)
    const base = basenamePosix(p)
    if (!dir) continue
    const arr = filesByDir.get(dir)
    if (arr) arr.push(base)
    else filesByDir.set(dir, [base])
  }

  const byKey = new Map<string, Candidate[]>()

  for (const [dir, names] of filesByDir) {
    if (!names.includes("judge_result.json")) continue
    if (isExcludedTrajectoryPath(dir)) continue
    let bestName: string | null = null
    let bestTs = ""
    for (const n of names) {
      const m = n.match(TRAJ_FILE_RE)
      if (!m) continue
      const ts = `${m[1]}_${m[2]}`
      if (ts > bestTs) {
        bestTs = ts
        bestName = n
      }
    }
    if (!bestName) continue

    const key = manifestKeyFromTrajectoryDir(dir)
    if (!key) continue
    const sdk = sdkIdFromTrajectoryDir(dir)
    const model = modelIdFromTrajectoryDir(dir)
    const judgeRel = `${dir}/judge_result.json`
    const trajRel = `${dir}/${bestName}`
    const list = byKey.get(key) || []
    list.push({ ts: bestTs, trajRel, judgeRel, sdk, model })
    byKey.set(key, list)
  }

  const entries: Record<string, TrajectoryManifestEntry> = {}
  for (const [key, cands] of byKey) {
    const best = pickBest(cands)
    const runs: TrajectoryRun[] = cands
      .slice()
      .sort((a, b) => {
        const ta = b.ts.localeCompare(a.ts)
        if (ta !== 0) return ta
        return modelRank(b.model) - modelRank(a.model)
      })
      .map((c) => ({
        sdk: c.sdk,
        model: c.model,
        ts: c.ts,
        trajectory: `/data/trajectories/${c.trajRel}`,
        judge: `/data/trajectories/${c.judgeRel}`,
      }))
    entries[key] = {
      trajectory: `/data/trajectories/${best.trajRel}`,
      judge: `/data/trajectories/${best.judgeRel}`,
      runs,
    }
  }
  return entries
}

export function mergeManifestEntries(
  base: Record<string, TrajectoryManifestEntry>,
  patch: Record<string, TrajectoryManifestEntry>,
  mode: "merge" | "replace"
): Record<string, TrajectoryManifestEntry> {
  if (mode === "replace") return { ...patch }
  return { ...base, ...patch }
}

export function buildManifestFile(
  entries: Record<string, TrajectoryManifestEntry>,
  aliases?: Record<string, string>
): TrajectoryManifestFile {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    entryCount: Object.keys(entries).length,
    entries,
    ...(aliases && Object.keys(aliases).length ? { aliases } : {}),
  }
}

/* ------------------------------------------------------------
 * Alias resolution: task config_path → manifest entry key
 *
 * We index manifest entries by:
 *   - exact key
 *   - (domain, leaf-id) where leaf-id = trailing numeric segment(s) of leaf
 *   - (domain, type, leaf-id) where type ∈ {benign, malicious}
 * Then for each task we try config_path-based logical key + several leaf
 * normalisations to find the matching entry.
 * ------------------------------------------------------------ */

export interface TaskRef {
  /** Logical task key — usually `<domain>/<config_path-without-config.yaml>` */
  key: string
  domain: string
  type: string
  configPath: string
}

function trailingId(leaf: string): string | null {
  // Picks the last `_001` / `-001` style trailing id, or a plain numeric id.
  const m = leaf.match(/(\d{1,4})$/)
  return m ? m[1].replace(/^0+(\d)/, "$1") : null
}

function entryKeyParts(entryKey: string): { domain: string; leaf: string; type: string } | null {
  const parts = entryKey.split("/")
  if (parts.length < 2) return null
  const domain = parts[0]
  const leaf = parts[parts.length - 1]
  const type = parts.find((p) => p === "benign" || p === "malicious") ?? ""
  return { domain, leaf, type }
}

export function buildAliasMap(
  entries: Record<string, TrajectoryManifestEntry>,
  tasks: TaskRef[]
): Record<string, string> {
  const aliases: Record<string, string> = {}
  if (!tasks.length) return aliases

  const entryByKey = new Map<string, string>()
  const byDomainTypeId = new Map<string, string[]>()
  const byDomainId = new Map<string, string[]>()

  for (const k of Object.keys(entries)) {
    entryByKey.set(k, k)
    const meta = entryKeyParts(k)
    if (!meta) continue
    const id = trailingId(meta.leaf)
    if (id) {
      if (meta.type) {
        const dtk = `${meta.domain}|${meta.type}|${id}`
        const arr = byDomainTypeId.get(dtk) || []
        arr.push(k)
        byDomainTypeId.set(dtk, arr)
      }
      const dk = `${meta.domain}|${id}`
      const arr2 = byDomainId.get(dk) || []
      arr2.push(k)
      byDomainId.set(dk, arr2)
    }
  }

  for (const task of tasks) {
    if (entryByKey.has(task.key)) continue // task key matches entry verbatim
    const id = trailingId(task.key.split("/").pop() || "") ?? trailingId(task.configPath.split("/").slice(-2)[0] || "")
    if (!id) continue
    const dt = `${task.domain}|${task.type}|${id}`
    const candidates = byDomainTypeId.get(dt) ?? byDomainId.get(`${task.domain}|${id}`) ?? []
    if (candidates.length === 1) {
      aliases[task.key] = candidates[0]
    } else if (candidates.length > 1) {
      // Pick the candidate whose remaining path overlaps best with task.key.
      const taskParts = task.key.split("/")
      const scored = candidates
        .map((c) => {
          const cParts = c.split("/")
          let score = 0
          for (const p of cParts) {
            if (taskParts.includes(p)) score++
          }
          return { c, score }
        })
        .sort((a, b) => b.score - a.score)
      aliases[task.key] = scored[0].c
    }
  }
  return aliases
}

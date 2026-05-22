export interface TrajectoryRun {
  run_id?: number
  sdk: string
  model: string
  ts: string
  trajectory: string
  judge: string
  attack_success?: boolean | null
  task_success?: boolean | null
}

export interface TrajectoryManifestEntry {
  trajectory: string
  judge: string
  runs?: TrajectoryRun[]
}

export interface TrajectoryManifest {
  version: number
  generatedAt?: string
  entryCount?: number
  entries: Record<string, TrajectoryManifestEntry>
  aliases?: Record<string, string>
}

/** Resolve a logical task key (possibly an alias) to a concrete entry key in the manifest. */
export function resolveManifestKey(
  manifest: TrajectoryManifest | null | undefined,
  rawKey: string
): string | null {
  if (!manifest?.entries || !rawKey) return null
  if (manifest.entries[rawKey]) return rawKey
  const aliased = manifest.aliases?.[rawKey]
  if (aliased && manifest.entries[aliased]) return aliased
  return null
}

export function configPathToDir(configPath: string): string {
  return configPath.replace(/\/config\.yaml$/i, "").replace(/\\/g, "/")
}

/** Manifest logical keys use forward slashes. */
export function underAttackKey(task: { config_path: string }): string {
  return configPathToDir(task.config_path)
}

/**
 * Baseline (no-attack) trajectory key for malicious tasks.
 * Uses base_task when present; otherwise matches benign manifest keys by numeric id from the malicious folder leaf name.
 */
export function noAttackKey(
  task: { domain: string; base_task: string | null; config_path: string },
  manifestKeys: string[]
): string | null {
  const domain = task.domain
  if (task.base_task) {
    const k = `${domain}/${task.base_task}`.replace(/\\/g, "/")
    return manifestKeys.includes(k) ? k : null
  }
  const maliciousDir = configPathToDir(task.config_path)
  if (!maliciousDir.includes("/malicious/")) return null
  const leaf = maliciousDir.split("/").pop() || ""
  const idFromHyphen = leaf.match(/-(\d+)$/)?.[1]
  const idPlain = leaf.match(/^(\d+)$/)?.[1]
  const id = idFromHyphen ?? idPlain
  if (!id) return null
  const exact = `${domain}/benign/${id}`
  if (manifestKeys.includes(exact)) return exact
  const hit = manifestKeys.find((k) => {
    if (!k.startsWith(`${domain}/benign/`)) return false
    const seg = k.split("/").pop() || ""
    return seg === id || seg.endsWith(`-${id}`)
  })
  return hit || null
}

export function benignTaskKey(task: { domain: string; config_path: string }): string {
  return configPathToDir(task.config_path)
}

/* ----------------------------------------------------------------------------
 * Run ordering — single source of truth shared by the Results tab and the
 * Trajectory tab. The Trajectory tab's default selection is "the first row of
 * the Results list", so both MUST order runs identically. Keep that guarantee
 * by routing both through orderRunsForResults() rather than duplicating sorts.
 * ------------------------------------------------------------------------- */

export const SDK_DISPLAY_NAMES: Record<string, string> = {
  openaisdk: "OpenAI Agents SDK",
  googleadk: "Google ADK",
  claudesdk: "Claude SDK",
  openclaw: "OpenClaw",
}

export function sdkDisplayName(sdk: string): string {
  return SDK_DISPLAY_NAMES[sdk] ?? sdk
}

/** Minimal shape needed to dedupe and rank a run. */
export interface RunLike {
  sdk: string
  model: string
  attack_success?: boolean | null
  task_success?: boolean | null
}

/** Keep the first run per (sdk, model); input is assumed newest-first. */
export function deduplicateRuns<T extends RunLike>(runs: T[]): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const r of runs) {
    const key = `${r.sdk}::${r.model}`
    if (!seen.has(key)) {
      seen.add(key)
      out.push(r)
    }
  }
  return out
}

/**
 * Rank runs the way the Results tab displays them: successful runs first
 * (attack_success when under attack, otherwise task_success), then by SDK
 * display name, then by model. Deduplicated by (sdk, model).
 */
export function orderRunsForResults<T extends RunLike>(
  runs: T[],
  useAttack: boolean
): T[] {
  return deduplicateRuns(runs).sort((a, b) => {
    const aOk = useAttack ? a.attack_success === true : a.task_success === true
    const bOk = useAttack ? b.attack_success === true : b.task_success === true
    if (aOk !== bOk) return aOk ? -1 : 1
    const sdkCmp = sdkDisplayName(a.sdk).localeCompare(sdkDisplayName(b.sdk))
    if (sdkCmp !== 0) return sdkCmp
    return a.model.localeCompare(b.model)
  })
}

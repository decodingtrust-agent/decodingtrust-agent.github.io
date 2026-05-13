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

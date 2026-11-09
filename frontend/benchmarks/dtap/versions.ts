export const DTAP_VERSIONS = ["1.0", "1.1"] as const
export type DtapVersion = (typeof DTAP_VERSIONS)[number]

export function dtapVersion(value: string | null): DtapVersion {
  return value === "1.1" || value === "0.1" ? "1.1" : "1.0"
}

export function taskType(value: string) {
  return value === "malicious" || value === "red-teaming" ? "rt" : value
}

export function taskTypeLabel(value: string) {
  return taskType(value) === "rt" ? "Red-Teaming" : value === "benign" ? "Benign" : value
}

export function dtapListHref(version: DtapVersion) {
  return version === "1.0" ? "/benchmark" : "/benchmark?version=1.1"
}

export function dtapTaskHref(slug: string, version: DtapVersion) {
  return version === "1.0" ? `/benchmark/${slug}` : `/benchmarks/dtap/1.1/task?slug=${encodeURIComponent(slug)}`
}

export function dtapRegistryUrl(version: DtapVersion, slug?: string) {
  if (version === "1.0") return `/traj-api/registry${slug ? `/${encodeURIComponent(slug)}` : ""}`
  return `/benchmarks/dtap/data/1.1/${slug ? `tasks/${encodeURIComponent(slug)}.json` : "tasks-index.json"}`
}
import challenging from "./data/1.1/manifest.json"


export function dtapSourceHref(configPath: string, version: DtapVersion) {
  const revision = version === "1.1" ? challenging.source_commit : "main"
  const dataset = version === "1.1" ? "dtap-bench-0.1" : "dtap-bench"
  return `https://github.com/AI-secure/DecodingTrust-Agent-Platform/blob/${revision}/benchmark/${dataset}/${configPath.replace("/malicious/", "/rt/")}`
}

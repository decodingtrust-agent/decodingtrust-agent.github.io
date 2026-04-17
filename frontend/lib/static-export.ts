import fs from "node:fs"
import path from "node:path"

function readJson(relativePath: string) {
  const filePath = path.join(process.cwd(), "public", relativePath)
  return JSON.parse(fs.readFileSync(filePath, "utf-8"))
}

export function getRegistrySlugs(): string[] {
  const index = readJson(path.join("data", "tasks-index.json"))
  const tasks = Array.isArray(index?.tasks) ? index.tasks : []
  return tasks
    .map((task: { slug?: string }) => task?.slug)
    .filter((slug: unknown): slug is string => typeof slug === "string" && slug.length > 0)
}

export function getDataAuditingDomains(reportFile: string): string[] {
  const data = readJson(path.join("data", reportFile))
  const domains = new Set<string>()

  for (const result of data?.llm_results ?? []) {
    if (typeof result?.task_path !== "string") continue
    const domain = result.task_path.split("/")[0]
    if (domain && domain !== "dataset") {
      domains.add(domain)
    }
  }

  for (const issue of data?.rule_results?.issues ?? []) {
    if (typeof issue?.path !== "string") continue
    const domain = issue.path.split("/")[0]
    if (domain && domain !== "dataset") {
      domains.add(domain)
    }
  }

  return Array.from(domains).sort()
}

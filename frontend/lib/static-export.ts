import fs from "node:fs"
import path from "node:path"

const PUBLIC_DATA_DIR = path.join(process.cwd(), "public", "data")
const TASKS_INDEX_PATH = path.join(PUBLIC_DATA_DIR, "tasks-index.json")
const REPORT_DATA_0308_PATH = path.join(PUBLIC_DATA_DIR, "report-data.json")
const REPORT_DATA_0313_PATH = path.join(PUBLIC_DATA_DIR, "report-data-0313.json")

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"))
}

export function getRegistrySlugs(): string[] {
  const index = readJson(TASKS_INDEX_PATH)
  const tasks = Array.isArray(index?.tasks) ? index.tasks : []
  return tasks
    .map((task: { slug?: string }) => task?.slug)
    .filter((slug: unknown): slug is string => typeof slug === "string" && slug.length > 0)
}

export function getDataAuditingDomains(reportFile: "report-data.json" | "report-data-0313.json"): string[] {
  const filePath = reportFile === "report-data.json" ? REPORT_DATA_0308_PATH : REPORT_DATA_0313_PATH
  const data = readJson(filePath)
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

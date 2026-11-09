import { cp, mkdir, readdir, rm } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const benchmarks = path.join(frontend, "benchmarks")

for (const entry of await readdir(benchmarks, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue
  const children = await readdir(path.join(benchmarks, entry.name))
  for (const directory of ["visualization", "data"]) {
    if (!children.includes(directory)) continue
    const destination = path.join(frontend, "public/benchmarks", entry.name, directory)
    await mkdir(path.dirname(destination), { recursive: true })
    await rm(destination, { recursive: true, force: true })
    await cp(path.join(benchmarks, entry.name, directory), destination, { recursive: true })
    console.log(`Prepared ${entry.name} ${directory}`)
  }
}

"use client"

import { useEffect, useState } from "react"

interface ManifestStats {
  version: number
  entry_count: number
  generated_at: string | null
}

export function TrajectoryAdminPanel() {
  const [stats, setStats] = useState<ManifestStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/traj-api/trajectories/manifest-stats")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<ManifestStats>
      })
      .then(setStats)
      .catch((e: Error) => setError(e.message))
  }, [])

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Trajectory index</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Trajectory files live under{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">backend/data/trajectories/</code>{" "}
          and are served at runtime through the FastAPI service at{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">/traj-api/*</code>. The SQLite
          index at <code className="rounded bg-muted px-1 py-0.5 text-xs">backend/data/trajectory-index.sqlite</code>{" "}
          is rebuilt on every redeploy when the trajectory tree changes.
        </p>
      </div>

      {error && (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Failed to read index stats: {error}
        </p>
      )}

      {stats && (
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Indexed tasks</dt>
            <dd className="mt-1 font-mono text-base">{stats.entry_count.toLocaleString()}</dd>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Index version</dt>
            <dd className="mt-1 font-mono text-base">{stats.version}</dd>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Last indexed</dt>
            <dd className="mt-1 font-mono text-xs">{stats.generated_at ?? "—"}</dd>
          </div>
        </dl>
      )}

      <div className="rounded-lg border border-border bg-muted/10 px-4 py-3 text-xs text-muted-foreground space-y-1.5">
        <p className="font-medium text-foreground">To refresh trajectories:</p>
        <ol className="list-decimal list-inside space-y-0.5">
          <li>
            Drop new <span className="font-mono">.zip</span> files into{" "}
            <span className="font-mono">~/decodingtrust-agent.github.io/trajectory/</span>
          </li>
          <li>
            From <span className="font-mono">frontend/</span> run{" "}
            <code className="rounded bg-muted px-1 py-0.5">npm run trajectories:unpack</code>
          </li>
          <li>
            Or trigger a redeploy:{" "}
            <code className="rounded bg-muted px-1 py-0.5">bash deploy/redeploy.sh</code>
          </li>
        </ol>
      </div>
    </div>
  )
}

"use client"

import { useCallback, useState, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  type TrajectoryManifestFile,
  buildManifestFile,
  consolidatePathsToEntries,
  mergeManifestEntries,
  normalizeTrajectoryRelativePath,
} from "@/lib/trajectory-manifest-build"

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function TrajectoryAdminPanel() {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [skipped, setSkipped] = useState(0)
  const [patchKeys, setPatchKeys] = useState(0)
  const [replaceAll, setReplaceAll] = useState(false)
  const [lastManifest, setLastManifest] = useState<TrajectoryManifestFile | null>(null)

  const handleFolder = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const list = event.target.files
      if (!list?.length) return
      setBusy(true)
      setMessage(null)
      setSkipped(0)
      let skip = 0
      const normalized: string[] = []

      for (let i = 0; i < list.length; i++) {
        const f = list.item(i)
        if (!f) continue
        const raw = (f as File & { webkitRelativePath?: string }).webkitRelativePath ?? f.name
        const n = normalizeTrajectoryRelativePath(raw)
        if (n) normalized.push(n)
        else skip++
      }

      setSkipped(skip)
      const patchEntries = consolidatePathsToEntries(normalized)
      setPatchKeys(Object.keys(patchEntries).length)

      let baseEntries: Record<string, { trajectory: string; judge: string }> = {}
      let baseAliases: Record<string, string> | undefined
      try {
        const res = await fetch("/data/trajectory-manifest.json")
        if (res.ok) {
          const j = (await res.json()) as TrajectoryManifestFile
          baseEntries = j.entries ?? {}
          baseAliases = j.aliases
        }
      } catch {
        /* empty */
      }

      const merged = mergeManifestEntries(baseEntries, patchEntries, replaceAll ? "replace" : "merge")
      // Drop aliases that point to entries we just discarded.
      const aliases = baseAliases
        ? Object.fromEntries(
            Object.entries(baseAliases).filter(([, v]) => merged[v] != null)
          )
        : undefined
      const manifest = buildManifestFile(merged, aliases)
      setLastManifest(manifest)
      setBusy(false)
      setMessage(
        `Parsed ${normalized.length} paths (${Object.keys(patchEntries).length} task keys). ` +
          `${skip ? `${skip} paths skipped (could not find domain/openaisdk/…). ` : ""}` +
          `Ready to download manifest (${manifest.entryCount} total keys).`
      )
      event.target.value = ""
    },
    [replaceAll]
  )

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Trajectory files & manifest</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Keep trajectories as a normal directory tree under{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">frontend/public/data/trajectories/</code> (not zip).
          Each task folder should contain <span className="font-mono">judge_result.json</span> and one or more{" "}
          <span className="font-mono">YYYYMMDD_HHMMSS.json</span> runs; the newest timestamp is referenced in the
          manifest.
        </p>
      </div>

      <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
        <li>Copy or sync trajectory files into the repo path above (same layout as produced by your eval pipeline).</li>
        <li>
          Optionally use the folder picker below to merge those files into a new{" "}
          <span className="font-mono">trajectory-manifest.json</span> without running Node locally.
        </li>
        <li>
          Replace <span className="font-mono">public/data/trajectory-manifest.json</span> with the download, commit, and
          deploy.
        </li>
        <li>
          Or from <span className="font-mono">frontend</span> run{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run trajectories:manifest</code> after files are on
          disk.
        </li>
      </ol>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3">
        <Checkbox
          id="traj-replace-all"
          checked={replaceAll}
          onCheckedChange={(v) => setReplaceAll(v === true)}
        />
        <Label htmlFor="traj-replace-all" className="text-sm cursor-pointer">
          Replace entire manifest (unchecked = merge with current site manifest)
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="traj-folder">Select trajectory root folder</Label>
        <p className="text-xs text-muted-foreground">
          Choose the directory whose <em>contents</em> are domain folders (browser, code, …), i.e. what goes inside{" "}
          <span className="font-mono">public/data/trajectories/</span>.
        </p>
        <InputFolder onChange={handleFolder} disabled={busy} />
      </div>

      {busy && <p className="text-sm text-muted-foreground">Processing…</p>}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      {skipped > 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Skipped {skipped} file path(s). Ensure selected files include a segment like{" "}
          <span className="font-mono">browser/openaisdk/…</span>.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={!lastManifest}
          onClick={() => lastManifest && downloadJson("trajectory-manifest.json", lastManifest)}
        >
          Download trajectory-manifest.json
        </Button>
        {lastManifest && (
          <span className="text-sm text-muted-foreground self-center">
            {lastManifest.entryCount} keys ({patchKeys} from last folder selection)
          </span>
        )}
      </div>
    </div>
  )
}

function InputFolder({
  onChange,
  disabled,
}: {
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
}) {
  return (
    <input
      id="traj-folder"
      type="file"
      {...({ webkitdirectory: "" } as Record<string, string>)}
      multiple
      disabled={disabled}
      onChange={onChange}
      className="text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5"
    />
  )
}

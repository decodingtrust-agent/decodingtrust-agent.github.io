"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import type { Session } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrajectoryAdminPanel } from "@/components/admin/trajectory-admin-panel"
import {
  METRIC_OPTIONS,
  formatPercent,
  getMetricDescription,
  resetBenchmarkDatasetCache,
  type BenchmarkDomain,
  type BenchmarkFramework,
  type BenchmarkMetricType,
  type BenchmarkModel,
} from "@/lib/benchmark"
import { getSupabaseBrowserClient, hasSupabasePublicConfig } from "@/lib/supabase-browser"

interface AdminRun {
  id: string
  slug: string
  name: string
}

interface AdminScore {
  id: string
  run_id: string
  framework_id: string
  model_id: string
  domain_id: string
  metric_type: BenchmarkMetricType
  value: number | null
}

interface AdminData {
  run: AdminRun
  domains: BenchmarkDomain[]
  frameworks: BenchmarkFramework[]
  models: BenchmarkModel[]
  scores: AdminScore[]
}

function slugifyName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function parseInputValue(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const parsed = Number(trimmed)
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number: ${value}`)
  }

  return Math.round(parsed * 10) / 10
}

export function BenchmarkAdminPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [session, setSession] = useState<Session | null>(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [data, setData] = useState<AdminData | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authError, setAuthError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [metricType, setMetricType] = useState<BenchmarkMetricType>("bsr")
  const [frameworkKey, setFrameworkKey] = useState("all")
  const [modelKey, setModelKey] = useState("all")
  const [draftValues, setDraftValues] = useState<Record<string, string>>({})
  const [createFrameworkKey, setCreateFrameworkKey] = useState("all")
  const [createMetricType, setCreateMetricType] = useState<BenchmarkMetricType>("bsr")
  const [newModelName, setNewModelName] = useState("")

  useEffect(() => {
    if (!supabase) {
      setLoadingSession(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoadingSession(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  async function loadAdminData() {
    if (!supabase) {
      return
    }

    setLoadingData(true)
    setStatusMessage(null)

    const { data: runs, error: runError } = await supabase
      .from("benchmark_runs")
      .select("id, slug, name")
      .eq("is_published", true)
      .limit(1)

    if (runError || !runs || runs.length === 0) {
      setLoadingData(false)
      setStatusMessage(runError?.message ?? "No published run found.")
      return
    }

    const run = runs[0]

    const [
      { data: domains, error: domainsError },
      { data: frameworks, error: frameworksError },
      { data: models, error: modelsError },
      { data: scores, error: scoresError },
    ] = await Promise.all([
      supabase.from("benchmark_domains").select("id, key, label, short_label, sort_order").order("sort_order"),
      supabase.from("benchmark_frameworks").select("id, key, name, sort_order").order("sort_order"),
      supabase.from("benchmark_models").select("id, key, name, sort_order").order("sort_order"),
      supabase
        .from("benchmark_scores")
        .select("id, run_id, framework_id, model_id, domain_id, metric_type, value")
        .eq("run_id", run.id),
    ])

    if (domainsError || frameworksError || modelsError || scoresError || !domains || !frameworks || !models || !scores) {
      setLoadingData(false)
      setStatusMessage(
        domainsError?.message ||
          frameworksError?.message ||
          modelsError?.message ||
          scoresError?.message ||
          "Failed to load benchmark data."
      )
      return
    }

    setData({
      run,
      domains: domains.map((domain) => ({
        id: domain.id,
        key: domain.key,
        label: domain.label,
        shortLabel: domain.short_label ?? domain.label,
        sortOrder: domain.sort_order,
      })),
      frameworks: frameworks.map((framework) => ({
        id: framework.id,
        key: framework.key,
        name: framework.name,
        sortOrder: framework.sort_order,
      })),
      models: models.map((model) => ({
        id: model.id,
        key: model.key,
        name: model.name,
        sortOrder: model.sort_order,
      })),
      scores: scores.map((score) => ({
        id: score.id,
        run_id: score.run_id,
        framework_id: score.framework_id,
        model_id: score.model_id,
        domain_id: score.domain_id,
        metric_type: score.metric_type as BenchmarkMetricType,
        value: score.value === null ? null : Number(score.value),
      })),
    })
    setLoadingData(false)
  }

  useEffect(() => {
    if (session) {
      void loadAdminData()
    } else {
      setData(null)
    }
  }, [session])

  const modelOptions = useMemo(() => {
    if (!data) {
      return []
    }

    const validModelIds = new Set(
      data.scores
        .filter((score) => score.metric_type === metricType)
        .filter((score) => {
          if (frameworkKey === "all") {
            return true
          }
          return data.frameworks.find((framework) => framework.id === score.framework_id)?.key === frameworkKey
        })
        .map((score) => score.model_id)
    )

    return data.models.filter((model) => model.id && validModelIds.has(model.id))
  }, [data, frameworkKey, metricType])

  useEffect(() => {
    if (!data) {
      return
    }

    if (frameworkKey === "all" && data.frameworks[0]) {
      setFrameworkKey(data.frameworks[0].key)
    }

    if (createFrameworkKey === "all" && data.frameworks[0]) {
      setCreateFrameworkKey(data.frameworks[0].key)
    }
  }, [createFrameworkKey, data, frameworkKey])

  useEffect(() => {
    if (!data) {
      return
    }

    if (modelOptions.length === 0) {
      setModelKey("all")
      return
    }

    if (modelKey === "all" || !modelOptions.some((model) => model.key === modelKey)) {
      setModelKey(modelOptions[0].key)
    }
  }, [data, modelKey, modelOptions])

  const selectedFramework = data?.frameworks.find((framework) => framework.key === frameworkKey) ?? null
  const selectedModel = data?.models.find((model) => model.key === modelKey) ?? null

  useEffect(() => {
    if (!data || !selectedFramework || !selectedModel) {
      setDraftValues({})
      return
    }

    const nextDraftValues = Object.fromEntries(
      data.domains.map((domain) => {
        const score = data.scores.find(
          (candidate) =>
            candidate.metric_type === metricType &&
            candidate.framework_id === selectedFramework.id &&
            candidate.model_id === selectedModel.id &&
            candidate.domain_id === domain.id
        )

        return [domain.key, score?.value === null || score?.value === undefined ? "" : String(score.value)]
      })
    )

    setDraftValues(nextDraftValues)
  }, [data, metricType, selectedFramework, selectedModel])

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase) {
      return
    }

    setAuthError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setAuthError(error.message)
      return
    }

    setPassword("")
  }

  const handleLogout = async () => {
    if (!supabase) {
      return
    }

    await supabase.auth.signOut()
    setStatusMessage("Signed out.")
    resetBenchmarkDatasetCache()
  }

  const handleSave = async () => {
    if (!supabase || !data || !selectedFramework || !selectedModel) {
      return
    }

    setStatusMessage("Saving benchmark values...")

    try {
      const payload = data.domains.map((domain) => ({
        run_id: data.run.id,
        framework_id: selectedFramework.id,
        model_id: selectedModel.id,
        domain_id: domain.id,
        metric_type: metricType,
        value: parseInputValue(draftValues[domain.key] ?? ""),
      }))

      const { error } = await supabase
        .from("benchmark_scores")
        .upsert(payload, { onConflict: "run_id,framework_id,model_id,domain_id,metric_type" })

      if (error) {
        setStatusMessage(error.message)
        return
      }

      resetBenchmarkDatasetCache()
      await loadAdminData()
      setStatusMessage("Saved benchmark values.")
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to save benchmark values.")
    }
  }

  const handleCreateEntry = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase || !data) {
      return
    }

    const framework = data.frameworks.find((candidate) => candidate.key === createFrameworkKey)
    if (!framework) {
      setStatusMessage("Choose a framework before creating a model entry.")
      return
    }

    const modelName = newModelName.trim()
    if (!modelName) {
      setStatusMessage("Enter a model name.")
      return
    }

    const modelKeySlug = slugifyName(modelName)
    if (!modelKeySlug) {
      setStatusMessage("Model name must contain letters or numbers.")
      return
    }

    setStatusMessage("Creating editable model entry...")

    const { data: modelRow, error: modelError } = await supabase
      .from("benchmark_models")
      .upsert(
        {
          key: modelKeySlug,
          name: modelName,
          sort_order: data.models.length + 1,
        },
        { onConflict: "key" }
      )
      .select("id, key")
      .single()

    if (modelError || !modelRow) {
      setStatusMessage(modelError?.message ?? "Failed to create model.")
      return
    }

    const scoreRows = data.domains.map((domain) => ({
      run_id: data.run.id,
      framework_id: framework.id,
      model_id: modelRow.id,
      domain_id: domain.id,
      metric_type: createMetricType,
      value: null,
    }))

    const { error: scoreError } = await supabase
      .from("benchmark_scores")
      .upsert(scoreRows, { onConflict: "run_id,framework_id,model_id,domain_id,metric_type" })

    if (scoreError) {
      setStatusMessage(scoreError.message)
      return
    }

    setMetricType(createMetricType)
    setFrameworkKey(framework.key)
    setModelKey(modelRow.key)
    setNewModelName("")
    resetBenchmarkDatasetCache()
    await loadAdminData()
    setStatusMessage("Created a new editable model entry.")
  }

  if (!hasSupabasePublicConfig() || !supabase) {
    return (
      <section className="min-h-[calc(100vh-8rem)]">
        <div className="mx-auto max-w-5xl px-4 py-12 lg:px-6">
          <div className="rounded-2xl border border-border bg-card p-8">
            <h1 className="text-2xl font-bold mb-3">Admin unavailable</h1>
            <p className="text-muted-foreground">
              Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to enable admin sign-in (benchmark
              scores and trajectory manifest tools). Trajectory files can always be updated locally: add files under{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">public/data/trajectories/</code>, then run{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run trajectories:manifest</code> in{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">frontend</code>.
            </p>
          </div>
        </div>
      </section>
    )
  }

  if (loadingSession) {
    return (
      <section className="min-h-[calc(100vh-8rem)]">
        <div className="mx-auto max-w-5xl px-4 py-12 lg:px-6 text-muted-foreground">Loading admin session...</div>
      </section>
    )
  }

  if (!session) {
    return (
      <section className="min-h-[calc(100vh-8rem)]">
        <div className="mx-auto max-w-md px-4 py-12 lg:px-6">
          <div className="rounded-2xl border border-border bg-card p-8">
            <h1 className="text-2xl font-bold mb-2">Site admin</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Sign in with the shared admin account to edit benchmark scores and trajectory manifests.
            </p>
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              {authError && <p className="text-sm text-red-500">{authError}</p>}
              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </form>
          </div>
        </div>
      </section>
    )
  }

  const currentMetricLabel = METRIC_OPTIONS.find((metric) => metric.key === metricType)?.label ?? metricType

  return (
    <section className="min-h-[calc(100vh-8rem)]">
      <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Site admin</h1>
            <p className="text-muted-foreground">
              Benchmark scores (Supabase) and trajectory manifest updates for the registry.
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Sign out
          </Button>
        </div>

        <Tabs defaultValue="benchmark" className="space-y-6">
          <TabsList className="h-11">
            <TabsTrigger value="benchmark" className="px-4">
              Benchmark scores
            </TabsTrigger>
            <TabsTrigger value="trajectories" className="px-4">
              Trajectories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trajectories" className="mt-6">
            <TrajectoryAdminPanel />
          </TabsContent>

          <TabsContent value="benchmark" className="mt-6 space-y-6">
        {loadingData || !data ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-muted-foreground">
            Loading benchmark records...
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="text-sm text-muted-foreground">Published run</div>
                <div className="mt-1 font-semibold">{data.run.name}</div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="text-sm text-muted-foreground">Frameworks</div>
                <div className="mt-1 font-semibold">{data.frameworks.length}</div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="text-sm text-muted-foreground">Models</div>
                <div className="mt-1 font-semibold">{data.models.length}</div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="text-sm text-muted-foreground">Domains</div>
                <div className="mt-1 font-semibold">{data.domains.length}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold">Edit published scores</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a metric, framework, and model, then edit the per-domain values for that entry.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Metric</Label>
                  <Select value={metricType} onValueChange={(value) => setMetricType(value as BenchmarkMetricType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {METRIC_OPTIONS.map((metric) => (
                        <SelectItem key={metric.key} value={metric.key}>
                          {metric.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Framework</Label>
                  <Select value={frameworkKey} onValueChange={setFrameworkKey}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Select framework</SelectItem>
                      {data.frameworks.map((framework) => (
                        <SelectItem key={framework.key} value={framework.key}>
                          {framework.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select value={modelKey} onValueChange={setModelKey}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Select model</SelectItem>
                      {modelOptions.map((model) => (
                        <SelectItem key={model.key} value={model.key}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Editing <span className="font-medium text-foreground">{currentMetricLabel}</span>.{" "}
                {getMetricDescription(metricType)}
              </p>

              {!selectedFramework || !selectedModel ? (
                <div className="rounded-xl border border-border bg-background/50 p-4 text-sm text-muted-foreground">
                  No editable entry matches the current selection yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-2 text-left text-xs font-medium text-muted-foreground">Domain</th>
                        <th className="py-2 text-left text-xs font-medium text-muted-foreground">Current value</th>
                        <th className="py-2 text-left text-xs font-medium text-muted-foreground">New value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.domains.map((domain) => {
                        const currentValue = draftValues[domain.key]
                        return (
                          <tr key={domain.key} className="border-b border-border last:border-0">
                            <td className="py-3 text-sm font-medium">{domain.label}</td>
                            <td className="py-3 text-sm text-muted-foreground">
                              {formatPercent(currentValue ? Number(currentValue) : null)}
                            </td>
                            <td className="py-3">
                              <Input
                                value={draftValues[domain.key] ?? ""}
                                onChange={(event) =>
                                  setDraftValues((previous) => ({
                                    ...previous,
                                    [domain.key]: event.target.value,
                                  }))
                                }
                                placeholder="Leave blank for null"
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                {statusMessage ? <p className="text-sm text-muted-foreground">{statusMessage}</p> : <div />}
                <Button onClick={handleSave} disabled={!selectedFramework || !selectedModel}>
                  Save scores
                </Button>
              </div>
            </div>

            <form className="rounded-2xl border border-border bg-card p-6 space-y-5" onSubmit={handleCreateEntry}>
              <div>
                <h2 className="text-lg font-semibold">Create editable model entry</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Adds a model and initializes blank score cells for the selected framework and metric.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Framework</Label>
                  <Select value={createFrameworkKey} onValueChange={setCreateFrameworkKey}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Select framework</SelectItem>
                      {data.frameworks.map((framework) => (
                        <SelectItem key={framework.key} value={framework.key}>
                          {framework.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Metric</Label>
                  <Select
                    value={createMetricType}
                    onValueChange={(value) => setCreateMetricType(value as BenchmarkMetricType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {METRIC_OPTIONS.map((metric) => (
                        <SelectItem key={metric.key} value={metric.key}>
                          {metric.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-model-name">Model name</Label>
                  <Input
                    id="new-model-name"
                    value={newModelName}
                    onChange={(event) => setNewModelName(event.target.value)}
                    placeholder="Example: GPT-5.5"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit">Create entry</Button>
              </div>
            </form>
          </>
        )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

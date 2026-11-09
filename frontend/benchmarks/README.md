# Benchmark modules

`registry.ts` is the shared catalogue used by desktop navigation, mobile navigation and `/benchmarks`.
Add a benchmark to `BENCHMARKS` after its route and content exist. Use `UPCOMING_BENCHMARKS` for disabled
Coming soon entries; these appear in both navigation menus and the family directory without placeholder URLs.

```text
benchmarks/
  registry.ts
  components/sdk-install.tsx # Shared SDK install command and copy control
  components/metric-cell.tsx # Shared percentage format and heatmap styling
  dtap/
    components/             # Task list, task detail, trajectory viewer and leaderboard
    data/1.1/               # Challenging task catalog and details
    versions.ts             # Version URLs and legacy type normalization
    tools/                  # Export committed version data
  dtap-mas/
    explorer.tsx            # Native site shell and isolated visualization bridge
    leaderboard.tsx         # Personal/Coding result tables and Finance placeholder
    leaderboard-data.ts     # Reported evaluation counts and percentage conversion
    visualization/          # Browser source, vendored dependencies and static data
    tools/                  # Dataset export and standalone preview utilities
```

App Router files in `app/` register URLs and metadata; benchmark-specific implementation lives in its module.
Shared UI primitives, site navigation and theme remain in `components/`. Shared helpers remain in `lib/`.

The existing DTap URLs `/benchmark` and `/benchmark/[slug]` retain their behavior. The family directory is
`/benchmarks`; DTap-MAS lives at `/benchmarks/dtap-mas`, `/task?t=…` and `/worlds?w=…`.

## Static visualizations

`npm run benchmarks:prepare` copies each module's `visualization/` and `data/` into
`public/benchmarks/<id>/`. The generated directory is ignored by Git. `predev`, `prebuild` and
`prebuild:export` run this automatically, so the normal production `npm run build` includes these assets.
Edit the module source; run prepare again and refresh when changing vanilla JS during a running preview.
Leaderboard navigation uses the same benchmark registry: `/leaderboard` serves DTap-Bench and
`/leaderboard/dtap-mas` serves DTap-MAS, with independent domain tables.

Visualizations run in same-origin iframes to isolate their CSS and D3 DOM ownership. The MAS bridge synchronizes
theme, height, navigation, task tabs and filter URLs with the native site shell. Task and world snapshots are
committed with their source SHA; neither Python nor the MAS repository is needed to serve the website.

## Local preview

```bash
cd frontend
npm ci
npm run dev -- --hostname 0.0.0.0 --port 3100
```

Open `http://localhost:3100/benchmarks`. The new family and MAS pages work with the committed data.

For existing DTap pages, use the read-only production API during development:

```bash
DT_PREVIEW_API_ORIGIN=https://decodingtrust-agent.com npm run dev -- --hostname 0.0.0.0 --port 3100
```

Dynamic DTap routes and production builds also need the existing `tasks-index.json`, `report-data.json` and
`report-data-0313.json`. Point `DT_DATA_ROOT` at an authorized local copy. These files are runtime data and must
stay outside Git. The preview API rewrite is enabled only in development and when explicitly configured.

To validate a production build while keeping the development preview running, use a separate output directory:

```bash
DT_DATA_ROOT=/path/to/data DT_BUILD_DIR=.next-validation DT_BUILD_WORKERS=4 npm run build
```

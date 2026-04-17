# Benchmark Data Workflow

This project now supports two benchmark data paths:

- A committed static fallback at `frontend/public/data/benchmark-data.json`
- Optional live reads and `/admin` edits through Supabase

The public site continues to deploy as a static GitHub Pages site. If Supabase env vars are not present, the frontend automatically falls back to the generated JSON snapshot.

## Files

- Parser: `scripts/generate-benchmark-data.py`
- Public fallback data: `frontend/public/data/benchmark-data.json`
- Supabase schema: `supabase/schema.sql`
- Supabase seed SQL: `supabase/seed.sql`
- Frontend env template: `frontend/.env.example`

## 1. Regenerate benchmark data from the paper ZIP

Run:

```bash
python3 scripts/generate-benchmark-data.py "/path/to/DecodingTrust_Agent.zip"
```

By default this updates:

- `frontend/public/data/benchmark-data.json`
- `supabase/seed.sql`

The parser reads these paper source tables:

- `table/main/asr_by_domain.tex`
- `table/main/benign_acc_by_domain.tex`

It emits three metric families:

- `bsr`
- `direct_asr`
- `indirect_asr`

## 2. Provision Supabase

Create a new Supabase project, then run `supabase/schema.sql` in the SQL editor.

This creates:

- `benchmark_runs`
- `benchmark_frameworks`
- `benchmark_models`
- `benchmark_domains`
- `benchmark_scores`
- `site_settings`

It also enables row-level security with:

- public anonymous read access for published benchmark data
- authenticated write access for admin operations

## 3. Seed the initial published run

After the schema is in place, run `supabase/seed.sql` in the Supabase SQL editor.

This will:

- upsert the `paper_v1` run
- mark it as published
- upsert frameworks, models, and domains
- upsert all parsed benchmark score cells

## 4. Create the shared admin account

Use Supabase Auth to create a single shared email/password account.

The `/admin` UI uses regular Supabase email/password auth under the hood even though the product flow is a single shared admin login.

## 5. Configure frontend env vars

Copy `frontend/.env.example` to `frontend/.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

With these set:

- `/leaderboard` reads live benchmark data from Supabase
- `/admin` can sign in and edit benchmark values
- the homepage average cards also read live data

Without these set:

- public pages fall back to `frontend/public/data/benchmark-data.json`
- `/admin` shows a configuration message

## 6. Editing data later

You have two supported update paths:

### Option A: Paper-driven refresh

Use this when the published paper tables change.

1. Regenerate the JSON and seed SQL with `scripts/generate-benchmark-data.py`
2. Apply the new `supabase/seed.sql`
3. Commit the refreshed `frontend/public/data/benchmark-data.json`

### Option B: Manual admin edits

Use this for corrections or incremental updates after deployment.

1. Open `/admin`
2. Sign in with the shared admin account
3. Select metric, framework, and model
4. Edit domain values and save

These writes go directly to Supabase and the public leaderboard/homepage will read them on the next load when Supabase env vars are configured.

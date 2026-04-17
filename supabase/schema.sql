create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'benchmark_metric_type'
  ) then
    create type public.benchmark_metric_type as enum ('bsr', 'direct_asr', 'indirect_asr');
  end if;
end $$;

create table if not exists public.benchmark_runs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  source_label text not null,
  source_path text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.benchmark_frameworks (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.benchmark_models (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.benchmark_domains (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  short_label text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.benchmark_scores (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.benchmark_runs(id) on delete cascade,
  framework_id uuid not null references public.benchmark_frameworks(id) on delete cascade,
  model_id uuid not null references public.benchmark_models(id) on delete cascade,
  domain_id uuid not null references public.benchmark_domains(id) on delete cascade,
  metric_type public.benchmark_metric_type not null,
  value numeric(5, 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id, framework_id, model_id, domain_id, metric_type)
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists benchmark_runs_set_updated_at on public.benchmark_runs;
create trigger benchmark_runs_set_updated_at
before update on public.benchmark_runs
for each row execute function public.set_updated_at();

drop trigger if exists benchmark_frameworks_set_updated_at on public.benchmark_frameworks;
create trigger benchmark_frameworks_set_updated_at
before update on public.benchmark_frameworks
for each row execute function public.set_updated_at();

drop trigger if exists benchmark_models_set_updated_at on public.benchmark_models;
create trigger benchmark_models_set_updated_at
before update on public.benchmark_models
for each row execute function public.set_updated_at();

drop trigger if exists benchmark_domains_set_updated_at on public.benchmark_domains;
create trigger benchmark_domains_set_updated_at
before update on public.benchmark_domains
for each row execute function public.set_updated_at();

drop trigger if exists benchmark_scores_set_updated_at on public.benchmark_scores;
create trigger benchmark_scores_set_updated_at
before update on public.benchmark_scores
for each row execute function public.set_updated_at();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

alter table public.benchmark_runs enable row level security;
alter table public.benchmark_frameworks enable row level security;
alter table public.benchmark_models enable row level security;
alter table public.benchmark_domains enable row level security;
alter table public.benchmark_scores enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists benchmark_runs_public_select on public.benchmark_runs;
create policy benchmark_runs_public_select
on public.benchmark_runs
for select
to anon, authenticated
using (is_published = true or auth.role() = 'authenticated');

drop policy if exists benchmark_runs_admin_write on public.benchmark_runs;
create policy benchmark_runs_admin_write
on public.benchmark_runs
for all
to authenticated
using (true)
with check (true);

drop policy if exists benchmark_frameworks_public_select on public.benchmark_frameworks;
create policy benchmark_frameworks_public_select
on public.benchmark_frameworks
for select
to anon, authenticated
using (true);

drop policy if exists benchmark_frameworks_admin_write on public.benchmark_frameworks;
create policy benchmark_frameworks_admin_write
on public.benchmark_frameworks
for all
to authenticated
using (true)
with check (true);

drop policy if exists benchmark_models_public_select on public.benchmark_models;
create policy benchmark_models_public_select
on public.benchmark_models
for select
to anon, authenticated
using (true);

drop policy if exists benchmark_models_admin_write on public.benchmark_models;
create policy benchmark_models_admin_write
on public.benchmark_models
for all
to authenticated
using (true)
with check (true);

drop policy if exists benchmark_domains_public_select on public.benchmark_domains;
create policy benchmark_domains_public_select
on public.benchmark_domains
for select
to anon, authenticated
using (true);

drop policy if exists benchmark_domains_admin_write on public.benchmark_domains;
create policy benchmark_domains_admin_write
on public.benchmark_domains
for all
to authenticated
using (true)
with check (true);

drop policy if exists benchmark_scores_public_select on public.benchmark_scores;
create policy benchmark_scores_public_select
on public.benchmark_scores
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.benchmark_runs runs
    where runs.id = benchmark_scores.run_id
      and (runs.is_published = true or auth.role() = 'authenticated')
  )
);

drop policy if exists benchmark_scores_admin_write on public.benchmark_scores;
create policy benchmark_scores_admin_write
on public.benchmark_scores
for all
to authenticated
using (true)
with check (true);

drop policy if exists site_settings_public_select on public.site_settings;
create policy site_settings_public_select
on public.site_settings
for select
to anon, authenticated
using (true);

drop policy if exists site_settings_admin_write on public.site_settings;
create policy site_settings_admin_write
on public.site_settings
for all
to authenticated
using (true)
with check (true);

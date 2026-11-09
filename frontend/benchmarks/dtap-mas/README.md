# DTap-MAS website module

The website owns the visualization source. It was migrated from `BillChan226/dtap-mas`, commit
`dd0c34437da56bd2fe5a5a2a13f4bd8494c6ee18`. The original repository was left unchanged.

## Pages and data

- `/benchmarks/dtap-mas`: 26 benchmark tasks plus one synthesized trajectory example, across Personal and Coding.
- `/benchmarks/dtap-mas/task?t=<dataset-path>`: Task, Agents, Verifier and Trajectory tabs, including paired tasks.
- `/benchmarks/dtap-mas/worlds?w=<world-id>`: the complete Topology Explorer with world selection and file import.
- `/benchmarks/dtap-mas/task?t=personal-credential-compromise-indirect-003&tab=trajectory`: the five-agent demo.

The benchmark is displayed as version 1.0 and Multi-Agent Indirect Prompt Injection Rating.
The dataset contains 13 Benign/Red-Teaming scenario pairs. Its 26 tasks have no recorded execution trajectories.
The anniversary-trip trajectory is synthesized; the viewer labels it "Illustrative trajectory" and the snapshot records
its full provenance. Illustrative outcomes are distinguished from recorded evaluation results.
The snapshot includes 13 base worlds and the available personal-world agent network.
The synthesized example is the first task card. Every task card opens the Task tab by default, with the scenario
description above the task-flow graph. Verifier checks have their own tab. Legacy Scenario and Checks links map
to Task and Verifier; explicit Trajectory links still open the trajectory. Representative Red-Teaming tasks
follow, then remaining Red-Teaming tasks, then Benign tasks. Type labels are Benign and Red-Teaming; all MAS
attacks are indirect, so the task list has no threat-model selector. The list header follows the DTap-Bench layout
with an SDK install command; scenario totals and Tasks/Worlds navigation are omitted. The Topology Explorer
remains available by direct URL for development.
The list uses "Explore tasks" without presenting a task total. Counts in the manifest describe the bundled source
snapshot and must not be replaced by presentation estimates.

## Expanded viewers

The task header shows its identifier, title, domain, risk category, participant counts and task type. Narrative
details appear once in Task. The Agents graph has an Expand control in its lower-right corner. Trajectory has
Expand, proportional zoom and Fit width controls. Expanded viewers occupy the browser viewport, retain their
state on close, and support Escape. The trajectory fits all visible agent columns without changing individual
column widths; step details remain available as popovers. The outcome section is labelled Attack outcome.

## Leaderboard

`/leaderboard/dtap-mas` displays Personal and Coding results from the evaluation tables supplied by the user.
`leaderboard-data.ts` preserves all 128 numerators across eight configurations and eight categories per domain.
Each percentage uses the denominator 20 shown in the supplied cells. The reference captions say ten tasks per
category; no inference about tasks versus repeated trials is made. Overall is the unweighted mean across the
eight category percentages. The tables share the DTap-Bench percentage formatter and heatmap component.
The source does not provide Finance results; Finance is marked Coming soon.

`visualization/data/manifest.json` records provenance and counts. All browser requests use relative snapshot paths;
there are no `/api/*` calls. D3 7.9.0, Lucide 0.454.0 and JetBrains Mono are bundled in `visualization/vendor/`,
with their licenses. The production website needs only the existing Next.js process.

## Refresh a snapshot

The exporter reads a committed source archive, including `src/worldgen`, `dataset` and `examples`. It uses this
module's own assembly code, so it does not need `tools/visualization` to remain in the MAS repository.
Use Python 3.12+ with Pydantic v2 and PyYAML installed:

```bash
python benchmarks/dtap-mas/tools/export_snapshot.py --source /path/to/dtap-mas --ref origin/main
npm run benchmarks:prepare
```

The exporter assembles all tasks before replacing the snapshot. It does not modify the source checkout or read
another worktree's uncommitted files. Review the resulting data and provenance changes before publishing them.

## Standalone tools

These commands need only Python's standard library and the committed snapshot:

```bash
python benchmarks/dtap-mas/tools/serve.py --port 8200
python benchmarks/dtap-mas/tools/export_task.py personal-credential-compromise-indirect-003 demo.html
```

The single-task export bundles scripts, styles, fonts, icons and data into one offline HTML file.
`tools/task_data.py` is the migrated source-data adapter; it is used by the snapshot exporter, not the web server.

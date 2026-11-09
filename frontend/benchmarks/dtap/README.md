# DTap-Bench versions

DTap-Bench is presented as the First Agent Robustness Benchmark.

| Website version | Source | Listing |
| --- | --- | --- |
| 1.0 (default) | Original `benchmark/dtap-bench` dataset | Existing `/traj-api/registry` service |
| 1.1 | Challenging `benchmark/dtap-bench-0.1` dataset | Committed snapshot of its 626 catalog tasks |

`versions.ts` owns version URLs and translates legacy task type values to `rt`. The UI labels are **Benign** and
**Red-Teaming**. Original 1.0 task URLs retain their behavior; 1.1 uses a separate task route and source snapshot.
Results and trajectories for 1.0 are not reused for 1.1.

Open `/benchmark` for 1.0, or `/benchmark?version=1.1` for 1.1. The version selector changes the task data and
preserves the version on task links and back navigation. Opening DTap-Bench from the global menu defaults to 1.0.
Both versions include direct and indirect threat models.
Task detail tabs are Task, Verifier, Results and Trajectory. Task is the default; legacy `#definition` and
`#instruction` links select Task.

## Refresh version 1.1

From `frontend/`, with Python 3.12+ and PyYAML:

```bash
python benchmarks/dtap/tools/export_version.py --source /path/to/DecodingTrust-Agent-Platform --ref origin/main
npm run benchmarks:prepare
```

The exporter reads committed config, verifier and catalog blobs without modifying the source checkout. It uses
the site's existing config parser, selects only catalogued tasks and records the source SHA in `data/1.1/manifest.json`.
The upstream directory's historical name remains part of provenance; the website's version label is 1.1.

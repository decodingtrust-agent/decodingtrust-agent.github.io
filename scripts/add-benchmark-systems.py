#!/usr/bin/env python3
"""
Add the three systems the leaderboard is missing to benchmark-data.json.

The board currently carries 8 agents on the ASR metrics (9 on BSR, since GPT-5.1
is benign-only). The Pokee AI whitepaper "Enterprise Agent and Model Security"
reports against an 11-system field, so three rows are added here to bring the
board onto that same field:

  * GPT-5.5 (OpenClaw)
  * DeepSeek-V4-Pro (OpenClaw)
  * Pokee-Isaac 28B v0.1

Every per-domain value is transcribed from Appendix A of the whitepaper
(frontend/public/papers/pokee-ai-dtap-security-whitepaper.pdf, Tables 10-23) and
each system's 14-domain macro-average reproduces the report's Table 6 exactly.

Note on Pokee-Isaac: it ran in Pokee's own agent scaffold rather than DTap's
stock runner, and its coding path is MCP-only with native shell and file tools
disabled. That makes its row a system-level result, not a model-level one, and
the site marks it with a dagger (see MODEL_RUN_NOTES in frontend/lib/benchmark.ts).
The other two ran under OpenClaw and carry no such caveat.

Usage
-----
    python3 scripts/add-benchmark-systems.py [path/to/benchmark-data.json]

Defaults to the production path. Writes a timestamped backup beside the file and
is idempotent — re-running replaces these rows rather than duplicating them.
"""

from __future__ import annotations

import datetime as _dt
import json
import shutil
import sys
from pathlib import Path

DEFAULT_DATA_FILE = Path(
    "/home/zhaorun/decodingtrust-agent.github.io/backend/data/benchmark-data.json"
)

# (framework key, framework name, model key, model name, per-domain scores)
# Scores are domainKey -> (direct_asr, indirect_asr, bsr).
SYSTEMS = [
    (
        "openclaw",
        "OpenClaw",
        "gpt-5-5",
        "GPT-5.5",
        {
            "workflow": (31.1, 42.4, 88.1),
            "crm": (44.4, 32.4, 75.6),
            "customer-service": (50.0, 29.0, 88.6),
            "travel": (18.1, 16.7, 86.1),
            "coding": (28.1, 7.9, 99.6),
            "browser": (20.2, 17.5, 88.8),
            "research": (38.1, 4.4, 99.0),
            "os-filesystem": (24.8, 6.8, 52.5),
            "windows": (14.2, 2.1, 68.9),
            "macos": (6.3, 0.0, 91.7),
            "finance": (11.0, 15.5, 96.5),
            "legal": (42.0, 40.7, 93.1),
            "telecom": (45.9, 12.8, 89.3),
            "medical": (30.4, 19.1, 91.0),
        },
    ),
    (
        "openclaw",
        "OpenClaw",
        "deepseek-v4-pro",
        "DeepSeek-V4-Pro",
        {
            "workflow": (58.0, 47.0, 96.4),
            "crm": (55.7, 44.4, 83.6),
            "customer-service": (75.5, 69.8, 83.8),
            "travel": (60.0, 48.3, 95.1),
            "coding": (77.9, 9.5, 99.8),
            "browser": (27.7, 29.7, 83.1),
            "research": (54.7, 17.3, 96.0),
            "os-filesystem": (82.9, 51.1, 57.6),
            "windows": (33.3, 5.6, 67.3),
            "macos": (10.4, 0.0, 33.1),
            "finance": (68.0, 54.8, 92.4),
            "legal": (67.0, 76.6, 92.6),
            "telecom": (82.5, 63.4, 93.8),
            "medical": (81.0, 65.9, 91.0),
        },
    ),
    (
        "pokee-harness",
        "Pokee Harness",
        "pokee-isaac-28b",
        "Pokee-Isaac 28B v0.1",
        {
            "workflow": (35.3, 12.6, 82.6),
            "crm": (32.2, 5.3, 82.4),
            "customer-service": (25.0, 8.9, 94.4),
            "travel": (11.4, 13.3, 94.6),
            "coding": (52.9, 3.6, 97.9),
            "browser": (24.7, 2.4, 94.1),
            "research": (48.7, 1.6, 100.0),
            "os-filesystem": (28.0, 2.5, 63.0),
            "windows": (19.9, 4.5, 54.8),
            "macos": (8.0, 0.0, 56.7),
            "finance": (5.0, 2.0, 96.0),
            "legal": (18.5, 13.0, 85.5),
            "telecom": (34.8, 3.0, 79.2),
            "medical": (49.3, 31.1, 57.9),
        },
    ),
]

# Table 6 of the whitepaper — (direct, indirect, bsr) macro-averages, asserted
# against what we compute so a transcription slip cannot reach the board.
EXPECTED_MACRO = {
    "gpt-5-5": (28.9, 17.7, 86.3),
    "deepseek-v4-pro": (59.6, 41.7, 83.3),
    "pokee-isaac-28b": (28.1, 7.4, 81.4),
}

METRIC_INDEX = {"direct_asr": 0, "indirect_asr": 1, "bsr": 2}
METRIC_LABELS = {"direct_asr": "Direct ASR", "indirect_asr": "Indirect ASR", "bsr": "BSR"}


def mean(values) -> float | None:
    scored = [v for v in values if v is not None]
    if not scored:
        return None
    return round(sum(scored) / len(scored), 1)


def main() -> int:
    data_file = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_DATA_FILE
    if not data_file.is_file():
        print(f"error: {data_file} not found", file=sys.stderr)
        return 1

    data = json.loads(data_file.read_text())
    domain_labels = {d["key"]: d["label"] for d in data["domains"]}
    run_slug = data["run"]["slug"]

    # Validate before touching anything.
    for _, _, model_key, model_name, scores in SYSTEMS:
        unknown = set(scores) - set(domain_labels)
        if unknown:
            print(f"error: {model_name} has unknown domains {sorted(unknown)}", file=sys.stderr)
            return 1
        if set(scores) != set(domain_labels):
            missing = sorted(set(domain_labels) - set(scores))
            print(f"error: {model_name} missing domains {missing}", file=sys.stderr)
            return 1
        for metric_type, idx in METRIC_INDEX.items():
            got = mean([v[idx] for v in scores.values()])
            want = EXPECTED_MACRO[model_key][idx]
            if abs(got - want) > 0.05:
                print(
                    f"error: {model_name} {metric_type} macro {got} != expected {want}",
                    file=sys.stderr,
                )
                return 1
    print("validated: all three systems reproduce the report's Table 6 macro-averages")

    model_keys = {s[2] for s in SYSTEMS}
    framework_keys = {s[0] for s in SYSTEMS}

    # Drop any prior rows for these systems so the script is safe to re-run.
    data["scores"] = [s for s in data["scores"] if s["modelKey"] not in model_keys]
    data["entries"] = [e for e in data["entries"] if e["modelKey"] not in model_keys]
    data["models"] = [m for m in data["models"] if m["key"] not in model_keys]

    existing_frameworks = {f["key"] for f in data["frameworks"]}
    next_framework_order = max(f["sortOrder"] for f in data["frameworks"]) + 1
    next_model_order = max((m["sortOrder"] for m in data["models"]), default=0) + 1

    for framework_key, framework_name, model_key, model_name, scores in SYSTEMS:
        if framework_key not in existing_frameworks:
            data["frameworks"].append(
                {"key": framework_key, "name": framework_name, "sortOrder": next_framework_order}
            )
            existing_frameworks.add(framework_key)
            next_framework_order += 1

        data["models"].append(
            {"key": model_key, "name": model_name, "sortOrder": next_model_order}
        )
        next_model_order += 1

        for metric_type, idx in METRIC_INDEX.items():
            domain_scores = {k: scores[k][idx] for k in domain_labels}
            for domain_key, value in domain_scores.items():
                data["scores"].append(
                    {
                        "runSlug": run_slug,
                        "metricType": metric_type,
                        "frameworkKey": framework_key,
                        "frameworkName": framework_name,
                        "modelKey": model_key,
                        "modelName": model_name,
                        "domainKey": domain_key,
                        "domainLabel": domain_labels[domain_key],
                        "value": value,
                    }
                )
            data["entries"].append(
                {
                    "entryKey": f"{metric_type}::{framework_key}::{model_key}",
                    "metricType": metric_type,
                    "metricLabel": METRIC_LABELS[metric_type],
                    "frameworkKey": framework_key,
                    "frameworkName": framework_name,
                    "modelKey": model_key,
                    "modelName": model_name,
                    "domainScores": domain_scores,
                    "overall": mean(list(domain_scores.values())),
                    "scoredDomains": len(domain_scores),
                }
            )

    # Recompute the aggregate blocks the same unweighted way the generator does.
    for metric_type in METRIC_INDEX:
        entries = [e for e in data["entries"] if e["metricType"] == metric_type]
        summary = data["averages"][metric_type]
        summary["entryCount"] = len(entries)
        summary["scoredCells"] = sum(e["scoredDomains"] for e in entries)
        summary["overall"] = mean([e["overall"] for e in entries])
        summary["domainAverages"] = {
            key: mean([e["domainScores"].get(key) for e in entries]) for key in domain_labels
        }
        for metric in data["metrics"]:
            if metric["key"] == metric_type:
                metric["entryCount"] = len(entries)

    stamp = _dt.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup = data_file.with_suffix(f".json.bak-{stamp}")
    shutil.copy2(data_file, backup)
    data_file.write_text(json.dumps(data, indent=2) + "\n")

    print(f"backup:  {backup}")
    print(f"updated: {data_file}\n")
    for metric_type in ("direct_asr", "indirect_asr", "bsr"):
        entries = [e for e in data["entries"] if e["metricType"] == metric_type]
        higher_better = metric_type == "bsr"
        ordered = sorted(
            entries, key=lambda e: e["overall"], reverse=higher_better
        )
        print(f"{METRIC_LABELS[metric_type]} ({len(ordered)} systems):")
        for rank, entry in enumerate(ordered, 1):
            mark = "  <-- new" if entry["modelKey"] in model_keys else ""
            print(
                f"  {rank:2}. {entry['frameworkName']:14} {entry['modelName']:22} "
                f"{entry['overall']:5}{mark}"
            )
        print()
    print("Restart the API so it serves the new file:")
    print("  systemctl restart decodingtrust-trajapi")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

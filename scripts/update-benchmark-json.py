#!/usr/bin/env python3
"""
Rewrite frontend/public/data/benchmark-data.json with the new BSR /
Indirect ASR / Direct ASR numbers from the paper update.

Notable changes vs. the prior snapshot:
  - `os-gui` is split into two domains: `windows` and `macos`.
  - GPT-5.1 gains BSR scores (no ASR scores — it's benign-only in the paper).
  - All per-cell values are replaced; `entries` and `averages` are
    recomputed from the new `scores`.

`categoryTables` is preserved unchanged.
"""

from __future__ import annotations

import json
from pathlib import Path

DATA_FILE = Path("/scr/zhaorun/decodingtrust-agent.github.io/frontend/public/data/benchmark-data.json")

# Ordered list of (key, label, shortLabel) — matches the paper's column order.
DOMAINS = [
    ("workflow",        "Workflow",         "Workflow"),
    ("crm",             "CRM",              "CRM"),
    ("customer-service","Customer Service", "CS"),
    ("travel",          "Travel",           "Travel"),
    ("coding",          "Coding",           "Coding"),
    ("browser",         "Browser",          "Browser"),
    ("research",        "Research",         "Research"),
    ("os-filesystem",   "OS-FS",            "OS-FS"),
    ("windows",         "Windows",          "Windows"),
    ("macos",           "macOS",            "macOS"),
    ("finance",         "Finance",          "Finance"),
    ("legal",           "Legal",            "Legal"),
    ("telecom",         "Telecom",          "Telecom"),
    ("medical",         "Medical",          "Medical"),
]

DOMAIN_KEYS = [d[0] for d in DOMAINS]

FRAMEWORKS = [
    ("openai-agents", "OpenAI Agents", 1),
    ("claude-code",   "Claude Code",   2),
    ("google-adk",    "Google ADK",    3),
    ("openclaw",      "OpenClaw",      4),
]

MODELS = [
    ("gpt-5-4",        "GPT-5.4",        1),
    ("gpt-5-2",        "GPT-5.2",        2),
    ("gpt-oss-120b",   "GPT-OSS-120B",   3),
    ("opus-4-6",       "Opus-4.6",       4),
    ("sonnet-4-5",     "Sonnet-4.5",     5),
    ("gemini-3-pro",   "Gemini-3-Pro",   6),
    ("gpt-5-1",        "GPT-5.1",        7),
    ("gemini-3-1-pro", "Gemini-3.1-Pro", 8),
]

# Values come from the latest paper tables. Order matches DOMAIN_KEYS above.
INDIRECT_ASR = {
    ("openai-agents", "gpt-5-4"):       [39.0, 53.8, 52.4, 55.0, 62.2, 42.9, 14.2, 37.5, 10.6, 26.0, 36.5, 58.0, 15.1, 37.5],
    ("openai-agents", "gpt-5-2"):       [42.5, 66.4, 46.4, 66.7, 79.3, 24.8,  7.0, 44.3, 12.9, 38.0, 40.5, 66.0, 33.7, 47.2],
    ("openai-agents", "gpt-oss-120b"):  [ 3.0,  9.3, 19.6, 40.8, 15.7, 41.3, 17.3, 32.8, 14.7, 18.0, 32.5, 31.0, 54.8, 62.1],
    ("claude-code",   "opus-4-6"):      [13.3,  3.9,  1.9,  0.0, 15.3,  0.0,  0.0,  1.2,  7.7, 28.0,  0.5,  9.5, 22.9, 16.7],
    ("claude-code",   "sonnet-4-5"):    [52.0, 40.6, 12.9, 11.7, 56.0,  4.5,  0.0, 17.6,  7.7, 20.0,  7.0, 26.5, 44.0, 51.7],
    ("google-adk",    "gemini-3-pro"):  [53.7, 69.9, 75.8, 84.2, 77.9, 62.2, 16.2, 59.5, 13.9, 34.0, 59.5, 56.0, 43.4, 49.1],
    ("openclaw",      "opus-4-6"):      [16.1,  7.2,  4.4,  5.8, 29.3,  0.0,  1.5,  3.1,  5.6, 16.0,  1.5, 12.5, 24.7, 23.0],
    ("openclaw",      "gpt-5-2"):       [23.3, 50.9, 53.9, 32.5, 65.3, 27.6,  5.8, 20.0,  9.6, 26.0, 26.5, 66.0, 36.7, 48.2],
}

DIRECT_ASR = {
    ("openai-agents", "gpt-5-4"):       [53.5, 67.8, 65.7, 32.4, 62.5, 29.2, 27.5, 84.0, 50.0, 30.0, 30.5, 54.0, 37.3, 60.4],
    ("openai-agents", "gpt-5-2"):       [60.6, 83.3, 72.0, 42.9, 62.5, 20.3, 37.7, 83.6, 49.3, 40.0, 51.5, 59.5, 54.7, 71.1],
    ("openai-agents", "gpt-oss-120b"):  [61.7, 38.9, 36.5, 54.3, 60.0, 10.0, 30.6, 70.0, 34.3, 20.0, 37.7, 60.5, 57.1, 61.3],
    ("claude-code",   "opus-4-6"):      [21.0, 11.1,  0.0,  2.9, 33.3,  8.8, 20.8, 26.2, 50.7, 26.0,  4.0, 30.0, 28.0, 54.7],
    ("claude-code",   "sonnet-4-5"):    [47.3, 16.7, 15.0,  3.8, 56.6, 20.0, 15.9, 22.6, 27.1, 18.0,  5.5, 20.0, 28.6, 75.1],
    ("google-adk",    "gemini-3-pro"):  [51.5, 55.6, 42.9, 52.4, 71.6, 35.3, 30.2, 73.5, 42.9, 30.0, 22.0, 64.0, 30.4, 62.7],
    ("openclaw",      "opus-4-6"):      [18.8, 11.1, 17.9,  5.7, 33.2, 10.2, 21.2, 24.2, 30.7, 14.0,  4.0, 22.5, 32.9, 50.7],
    ("openclaw",      "gpt-5-2"):       [28.3, 67.8, 64.1, 12.4, 32.9, 22.8, 34.3, 33.7, 35.0, 26.0, 26.0, 51.5, 54.0, 43.1],
}

BSR = {
    ("openai-agents", "gpt-5-4"):       [76.7, 78.8, 97.5, 90.6, 98.5, 77.1, 95.0, 85.7, 77.8, 76.7, 95.5, 89.5, 74.2, 86.1],
    ("openai-agents", "gpt-5-2"):       [73.1, 72.7, 97.3, 95.3, 93.6, 55.6, 94.5, 80.0, 74.6, 73.3, 96.5, 84.5, 74.2, 66.3],
    ("openai-agents", "gpt-5-1"):       [77.3, 65.5, 98.4, 89.2, 93.2, 79.2, 90.0, 74.5, 72.0, 70.0, 94.0, 91.5, 70.8, 52.8],
    ("openai-agents", "gpt-oss-120b"):  [56.0,  4.2, 72.5,  0.0, 49.5, 25.0, 30.0, 61.7, 67.9, 13.3, 21.5,  9.5, 67.5, 35.8],
    ("claude-code",   "opus-4-6"):      [83.0, 83.0,100.0, 89.4, 98.4, 97.2,100.0, 83.3, 78.0, 83.3, 96.5, 91.0, 70.8, 57.8],
    ("claude-code",   "sonnet-4-5"):    [71.0, 82.4, 94.7, 56.7, 98.2, 95.8,100.0, 78.6, 83.8, 73.3, 92.0, 79.0, 74.2, 66.4],
    ("google-adk",    "gemini-3-pro"):  [88.1, 86.1, 98.6, 99.4,100.0, 97.2,100.0, 87.0, 85.4, 60.0, 90.0, 87.5, 69.2, 81.9],
    ("openclaw",      "opus-4-6"):      [91.0, 82.4, 97.3, 89.4,100.0, 97.2, 96.0, 78.7, 70.0, 80.0, 91.0, 94.0, 77.5, 69.3],
    ("openclaw",      "gpt-5-2"):       [62.7, 75.2, 98.4, 91.4, 91.1, 56.9, 95.0, 78.6, 58.1, 76.7, 89.5, 91.0, 68.3, 68.4],
}


def mean(values):
    clean = [v for v in values if v is not None]
    if not clean:
        return None
    return round(sum(clean) / len(clean), 1)


def build_scores(metric_type, table, run_slug, framework_lookup, model_lookup):
    scores = []
    for (fw_key, model_key), values in table.items():
        fw_name = framework_lookup[fw_key]
        model_name = model_lookup[model_key]
        for i, (domain_key, domain_label, _) in enumerate(DOMAINS):
            v = values[i]
            scores.append({
                "runSlug": run_slug,
                "metricType": metric_type,
                "frameworkKey": fw_key,
                "frameworkName": fw_name,
                "modelKey": model_key,
                "modelName": model_name,
                "domainKey": domain_key,
                "domainLabel": domain_label,
                "value": v,
            })
    return scores


def build_entries(metric_type, metric_label, table, framework_lookup, model_lookup):
    entries = []
    for (fw_key, model_key), values in table.items():
        fw_name = framework_lookup[fw_key]
        model_name = model_lookup[model_key]
        domain_scores = {DOMAIN_KEYS[i]: values[i] for i in range(len(DOMAINS))}
        valid = [v for v in values if v is not None]
        entries.append({
            "entryKey": f"{metric_type}::{fw_key}::{model_key}",
            "metricType": metric_type,
            "metricLabel": metric_label,
            "frameworkKey": fw_key,
            "frameworkName": fw_name,
            "modelKey": model_key,
            "modelName": model_name,
            "domainScores": domain_scores,
            "overall": round(sum(valid) / len(valid), 1) if valid else None,
            "scoredDomains": len(valid),
        })
    return entries


def build_averages(metric_type, metric_label, table):
    # Per-domain average across all (framework, model) rows that have a value
    per_domain = {}
    cell_count = 0
    all_values = []
    for i, domain_key in enumerate(DOMAIN_KEYS):
        col_values = [values[i] for values in table.values() if values[i] is not None]
        cell_count += len(col_values)
        all_values.extend(col_values)
        per_domain[domain_key] = round(sum(col_values) / len(col_values), 1) if col_values else None

    overall = round(sum(all_values) / len(all_values), 1) if all_values else None
    return {
        "metricType": metric_type,
        "metricLabel": metric_label,
        "overall": overall,
        "entryCount": len(table),
        "scoredCells": cell_count,
        "domainAverages": per_domain,
    }


def main():
    existing = json.load(open(DATA_FILE))
    run = existing["run"]
    category_tables = existing.get("categoryTables", [])

    fw_lookup = {k: n for k, n, _ in FRAMEWORKS}
    model_lookup = {k: n for k, n, _ in MODELS}

    domains_out = [
        {"key": k, "label": l, "shortLabel": s, "sortOrder": i + 1}
        for i, (k, l, s) in enumerate(DOMAINS)
    ]
    frameworks_out = [{"key": k, "name": n, "sortOrder": so} for k, n, so in FRAMEWORKS]
    models_out = [{"key": k, "name": n, "sortOrder": so} for k, n, so in MODELS]

    metrics_out = [
        {"key": "bsr",          "label": "BSR",          "entryCount": len(BSR)},
        {"key": "direct_asr",   "label": "Direct ASR",   "entryCount": len(DIRECT_ASR)},
        {"key": "indirect_asr", "label": "Indirect ASR", "entryCount": len(INDIRECT_ASR)},
    ]

    scores = (
        build_scores("bsr",          BSR,          run["slug"], fw_lookup, model_lookup) +
        build_scores("direct_asr",   DIRECT_ASR,   run["slug"], fw_lookup, model_lookup) +
        build_scores("indirect_asr", INDIRECT_ASR, run["slug"], fw_lookup, model_lookup)
    )

    entries = (
        build_entries("bsr",          "BSR",          BSR,          fw_lookup, model_lookup) +
        build_entries("direct_asr",   "Direct ASR",   DIRECT_ASR,   fw_lookup, model_lookup) +
        build_entries("indirect_asr", "Indirect ASR", INDIRECT_ASR, fw_lookup, model_lookup)
    )

    averages = {
        "bsr":          build_averages("bsr",          "BSR",          BSR),
        "direct_asr":   build_averages("direct_asr",   "Direct ASR",   DIRECT_ASR),
        "indirect_asr": build_averages("indirect_asr", "Indirect ASR", INDIRECT_ASR),
    }

    # Filter / rewrite categoryTables: drop any tables that reference the removed
    # `os-gui` domain (there's no clean split for per-category breakdowns into
    # Windows vs. macOS without source data).
    filtered_category_tables = [
        tbl for tbl in category_tables if tbl.get("domainKey") != "os-gui"
    ]

    out = {
        "run":            run,
        "metrics":        metrics_out,
        "domains":        domains_out,
        "frameworks":     frameworks_out,
        "models":         models_out,
        "scores":         scores,
        "entries":        entries,
        "averages":       averages,
        "categoryTables": filtered_category_tables,
    }

    DATA_FILE.write_text(json.dumps(out, indent=2) + "\n")
    print(f"Wrote {DATA_FILE}")
    print(f"  {len(domains_out)} domains, {len(scores)} scores, {len(entries)} entries")
    print(f"  Overall BSR:          {averages['bsr']['overall']}%")
    print(f"  Overall Direct ASR:   {averages['direct_asr']['overall']}%")
    print(f"  Overall Indirect ASR: {averages['indirect_asr']['overall']}%")
    print(f"  categoryTables: kept {len(filtered_category_tables)} of {len(category_tables)}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Parse the paper LaTeX result tables into backend/data/benchmark-data.json.

Reads:
  /tmp/dt-paper/table/main/asr_by_domain.tex      (Indirect + Direct ASR halves)
  /tmp/dt-paper/table/main/benign_acc_by_domain.tex (BSR)

The paper rows contain 14 per-domain columns plus an "Overall" column.
We discard the "Overall" — the front-end recomputes it as a domain mean.

Some rows are commented out (% prefix); we still include them so Opus-4.6
remains visible on the leaderboard.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

PAPER_ROOT = Path("/tmp/dt-paper")
SITE_DATA = Path(
    "/home/zhaorun/decodingtrust-agent.github.io/backend/data/benchmark-data.json"
)

# Paper's column order (after Overall): the 14 domains.
PAPER_DOMAINS = [
    "Workflow",
    "CRM",
    "CS",
    "Travel",
    "Code",
    "Browser",
    "Research",
    "OS-FS",
    "Windows",
    "macOS",
    "Finance",
    "Legal",
    "Telecom",
    "Medical",
]

# (site_key, full_label, short_label, paper_column_name)
DOMAIN_META = [
    ("workflow", "Workflow", "Workflow", "Workflow"),
    ("crm", "CRM", "CRM", "CRM"),
    ("customer-service", "Customer Service", "CS", "CS"),
    ("travel", "Travel", "Travel", "Travel"),
    ("coding", "Coding", "Coding", "Code"),
    ("browser", "Browser", "Browser", "Browser"),
    ("research", "Research", "Research", "Research"),
    ("os-filesystem", "OS-FS", "OS-FS", "OS-FS"),
    ("windows", "Windows", "Windows", "Windows"),
    ("macos", "macOS", "macOS", "macOS"),
    ("finance", "Finance", "Finance", "Finance"),
    ("legal", "Legal", "Legal", "Legal"),
    ("telecom", "Telecom", "Telecom", "Telecom"),
    ("medical", "Medical", "Medical", "Medical"),
]
PAPER_NAME_TO_KEY = {paper: key for (key, _, _, paper) in DOMAIN_META}

FRAMEWORKS = [
    {"key": "openai-agents", "name": "OpenAI Agents", "sortOrder": 1},
    {"key": "claude-code", "name": "Claude Code", "sortOrder": 2},
    {"key": "google-adk", "name": "Google ADK", "sortOrder": 3},
    {"key": "openclaw", "name": "OpenClaw", "sortOrder": 4},
]
FRAMEWORK_NAME_TO_KEY = {f["name"]: f["key"] for f in FRAMEWORKS}

# Models that we expose on the site. Key order = display order.
MODELS = [
    {"key": "gpt-5-5", "name": "GPT-5.5", "sortOrder": 1},
    {"key": "gpt-5-4", "name": "GPT-5.4", "sortOrder": 2},
    {"key": "gpt-5-2", "name": "GPT-5.2", "sortOrder": 3},
    {"key": "gpt-oss-120b", "name": "GPT-OSS-120B", "sortOrder": 4},
    {"key": "opus-4-6", "name": "Opus-4.6", "sortOrder": 5},
    {"key": "sonnet-4-5", "name": "Sonnet-4.5", "sortOrder": 6},
    {"key": "gemini-3-pro", "name": "Gemini-3-Pro", "sortOrder": 7},
    {"key": "deepseek-v4-pro", "name": "DeepSeek-V4-Pro", "sortOrder": 8},
]
MODEL_NAME_TO_KEY = {m["name"]: m["key"] for m in MODELS}

# GPT-5.1 appears in BSR-only and we are explicitly omitting it per user instruction.
EXCLUDED_MODELS = {"GPT-5.1"}


def strip_latex(s: str) -> str:
    """Strip `\\textbf{...}` so we can pull a plain number.

    For `\\multirow{N}{*}{X}`, keep X — it carries the framework / threat-model
    label and downstream code uses it to identify the framework column.
    """
    s = re.sub(r"\\textbf\{([^}]*)\}", r"\1", s)
    s = re.sub(r"\\multirow\{[^}]*\}\{[^}]*\}\{([^}]*)\}", r"\1", s)
    return s.strip()


def parse_value(cell: str) -> float | None:
    cell = strip_latex(cell)
    if cell in ("", "--", "-"):
        return None
    try:
        return float(cell)
    except ValueError:
        return None


def parse_data_row(line: str) -> tuple[str, list[float | None]] | None:
    """Return (model_name, [overall, dom1..dom14]) or None if not a data row."""
    # Drop comment marker — we still want commented rows.
    line = line.lstrip()
    if line.startswith("%"):
        line = line.lstrip("%").lstrip()
    line = line.rstrip()
    line = line.rstrip("\\").rstrip()  # strip trailing \\

    if not line:
        return None
    # Skip header / structural rows.
    skip_markers = (
        "\\toprule",
        "\\midrule",
        "\\bottomrule",
        "\\cmidrule",
        "\\multicolumn",
        "\\textbf{Threat",
        "\\textbf{Agent",
        "\\textbf{Model",
        "\\textbf{Overall",
    )
    for m in skip_markers:
        if m in line:
            return None

    # Split on '&' that aren't escaped.
    cells = [c.strip() for c in re.split(r"(?<!\\)&", line)]
    cells = [strip_latex(c) for c in cells]
    # Drop empty leading cells (multirow placeholders) plus the threat-model
    # column (Indirect / Direct) — we already split the table by section.
    while cells and cells[0] in ("", "\\", "Indirect", "Direct"):
        cells.pop(0)
    if not cells:
        return None

    # Possible row shapes (after we discarded the threat-model multirow):
    #  [Framework, Model, Overall, dom1..dom14]    -> len 17
    #  [Model, Overall, dom1..dom14]               -> len 16
    # Both shapes have a model name in cell 0 or 1. Detect by whether cell0
    # is one of the known frameworks.
    framework = None
    if cells[0] in FRAMEWORK_NAME_TO_KEY:
        framework = cells[0]
        cells = cells[1:]
    if not cells:
        return None
    model = cells[0]
    rest = cells[1:]
    # Some rows look like "Model" with no number cells — header / divider.
    if not rest:
        return None
    if len(rest) < 15:
        return None
    rest = rest[:15]
    overall = parse_value(rest[0])
    domain_values = [parse_value(c) for c in rest[1:]]
    return (framework, model, overall, domain_values)


def parse_paper_table(path: Path) -> list[tuple[str | None, str, list[float | None]]]:
    """Yield (framework_name | None, model_name, [14 values]) tuples in order."""
    rows: list[tuple[str | None, str, list[float | None]]] = []
    last_framework: str | None = None
    text = path.read_text()
    # The asr table has a `\multirow{8}{*}{\textbf{Indirect}}` then later
    # `\multirow{8}{*}{\textbf{Direct}}`. We don't care about the threat-model
    # column; the caller decides how to split.
    for raw in text.splitlines():
        # Capture framework-only rows. They come in two flavors:
        #   `\multirow{N}{*}{<Framework>}` (ASR table + BSR for some frameworks)
        #   `<Framework>` standalone on a line (BSR table for Google ADK)
        stripped_raw = raw.strip().rstrip("\\").strip()
        framework_only = None
        fm_match = re.search(
            r"\\multirow\{[^}]*\}\{[^}]*\}\{(OpenAI Agents|Claude Code|Google ADK|OpenClaw)\}",
            raw,
        )
        if fm_match:
            # Only treat as framework-only if there's no model name later on
            # the same line (ie. not enough `&` cells for a data row).
            if not re.search(r"&\s*(?:%\s*)?[A-Za-z][\w\.\-]*\s*&", raw):
                framework_only = fm_match.group(1)
        elif stripped_raw in FRAMEWORK_NAME_TO_KEY:
            framework_only = stripped_raw
        if framework_only:
            last_framework = framework_only

        parsed = parse_data_row(raw)
        if parsed is None:
            continue
        framework, model, overall, vals = parsed
        if framework:
            last_framework = framework
        if model in EXCLUDED_MODELS:
            continue
        if model not in MODEL_NAME_TO_KEY:
            # Unknown model — skip silently (e.g. headers we missed).
            continue
        rows.append((last_framework, model, vals))
    return rows


def split_indirect_direct(asr_path: Path):
    """Split the ASR table into (indirect_rows, direct_rows)."""
    text = asr_path.read_text()
    direct_idx = text.find("{\\textbf{Direct}}")
    if direct_idx < 0:
        raise RuntimeError("Could not find Direct ASR section")
    head = text[:direct_idx]
    tail = text[direct_idx:]

    head_path = Path("/tmp/dt-paper-asr-indirect.tex")
    tail_path = Path("/tmp/dt-paper-asr-direct.tex")
    head_path.write_text(head)
    tail_path.write_text(tail)
    return parse_paper_table(head_path), parse_paper_table(tail_path)


def build_scores(rows, metric: str) -> list[dict]:
    """Convert (framework_name, model_name, [14 vals]) → flat score dicts."""
    out = []
    for framework_name, model_name, values in rows:
        framework_key = FRAMEWORK_NAME_TO_KEY[framework_name]
        model_key = MODEL_NAME_TO_KEY[model_name]
        for paper_dom, value in zip(PAPER_DOMAINS, values):
            domain_key = PAPER_NAME_TO_KEY[paper_dom]
            domain_label = next(
                label for (key, label, _, _) in DOMAIN_META if key == domain_key
            )
            out.append(
                {
                    "runSlug": "paper_v2",
                    "metricType": metric,
                    "frameworkKey": framework_key,
                    "frameworkName": framework_name,
                    "modelKey": model_key,
                    "modelName": model_name,
                    "domainKey": domain_key,
                    "domainLabel": domain_label,
                    "value": value,
                }
            )
    return out


def main() -> int:
    asr_path = PAPER_ROOT / "table/main/asr_by_domain.tex"
    bsr_path = PAPER_ROOT / "table/main/benign_acc_by_domain.tex"
    if not asr_path.exists() or not bsr_path.exists():
        print("Paper tables not found under /tmp/dt-paper", file=sys.stderr)
        return 1

    indirect_rows, direct_rows = split_indirect_direct(asr_path)
    bsr_rows = parse_paper_table(bsr_path)

    scores = (
        build_scores(indirect_rows, "indirect_asr")
        + build_scores(direct_rows, "direct_asr")
        + build_scores(bsr_rows, "bsr")
    )

    # Preserve site order: domains in DOMAIN_META, frameworks/models in their lists.
    domains = [
        {"key": k, "label": label, "shortLabel": short, "sortOrder": idx + 1}
        for idx, (k, label, short, _) in enumerate(DOMAIN_META)
    ]

    metrics_count = {}
    for s in scores:
        metrics_count.setdefault(s["metricType"], set()).add(
            (s["frameworkKey"], s["modelKey"])
        )

    payload = {
        "run": {
            "slug": "paper_v2",
            "name": "DecodingTrust-Agent Platform (DTap) — NeurIPS 2025",
            "sourceLabel": "DecodingTrust_Agent (5).zip",
            "sourcePath": "table/main/asr_by_domain.tex + benign_acc_by_domain.tex",
            "isPublished": True,
        },
        "metrics": [
            {"key": "bsr", "label": "BSR", "entryCount": len(metrics_count.get("bsr", set()))},
            {"key": "direct_asr", "label": "Direct ASR", "entryCount": len(metrics_count.get("direct_asr", set()))},
            {"key": "indirect_asr", "label": "Indirect ASR", "entryCount": len(metrics_count.get("indirect_asr", set()))},
        ],
        "domains": domains,
        "frameworks": FRAMEWORKS,
        "models": MODELS,
        "scores": scores,
        "entries": [],
        "averages": {},
        "categoryTables": [],
    }

    SITE_DATA.write_text(json.dumps(payload, indent=2))
    print(f"wrote {SITE_DATA}: {len(scores)} score cells")
    print("metric coverage:", {k: len(v) for k, v in metrics_count.items()})
    return 0


if __name__ == "__main__":
    sys.exit(main())

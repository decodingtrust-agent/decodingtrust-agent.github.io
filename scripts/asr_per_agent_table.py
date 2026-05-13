#!/usr/bin/env python3
"""ASR per (agent framework, model) for the 6 named injection-type buckets +
'Other' (catch-all of remaining combinations). Emits a LaTeX table.

Buckets:
    prompt           -> task uses only {prompt}
    tool             -> task uses only {tool}
    skill            -> task uses only {skill}
    environment      -> task uses only {environment}
    skill+tool       -> task uses exactly {skill, tool}
    environment+tool -> task uses exactly {environment, tool}
    other            -> any other combination
"""
from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
DATASET_ROOT = REPO_ROOT / "DecodingTrust-Agent-Platform" / "dataset"
TRAJ_ROOT = REPO_ROOT / "backend" / "data" / "trajectories"

BUCKETS = ["prompt", "tool", "skill", "environment",
           "skill+tool", "environment+tool", "other"]
BUCKET_LABEL = {
    "prompt": "Prompt",
    "tool": "Tool",
    "skill": "Skill",
    "environment": "Env",
    "skill+tool": "Skill+Tool",
    "environment+tool": "Env+Tool",
    "other": "Other",
}

# Display rows in the LaTeX table.
# (sdk_dir, model_dir, framework_label, model_label, framework_first_in_block, comment_out)
ROWS = [
    ("openaisdk", "gpt-5.4",         "OpenAI Agents", "GPT-5.4",       True,  False),
    ("openaisdk", "gpt-5.2",         "OpenAI Agents", "GPT-5.2",       False, False),
    ("openaisdk", "gpt-5.1",         "OpenAI Agents", "GPT-5.1",       False, False),
    ("openaisdk", "gpt-oss-120b",    "OpenAI Agents", "GPT-OSS-120B",  False, False),
    ("claudesdk", "claude-opus-4-6", "Claude Code",   "Opus-4.6",      True,  True),
    ("claudesdk", "claude-sonnet-4-5", "Claude Code", "Sonnet-4.5",    False, False),
    ("googleadk", "gemini-3-pro-preview", "Google ADK", "Gemini-3-Pro", True, False),
    ("openclaw",  "claude-opus-4-6", "OpenClaw",      "Opus-4.6",      True,  True),
    ("openclaw",  "gpt-5.2",         "OpenClaw",      "GPT-5.2",       False, False),
    ("openclaw",  "gpt-5.5",         "OpenClaw",      "GPT-5.5",       False, False),
    ("openclaw",  "deepseek-v4-pro", "OpenClaw",      "DeepSeek-V4-Pro", False, False),
]

# How many active rows per framework, for \multirow.
FRAMEWORK_ACTIVE_COUNT = defaultdict(int)
for *_, fw_label, _, _, comment in [(r[0], r[1], r[2], r[3], r[4], r[5]) for r in ROWS]:
    pass  # handled below


def task_bucket(types: frozenset[str]) -> str:
    if types == frozenset({"prompt"}):
        return "prompt"
    if types == frozenset({"tool"}):
        return "tool"
    if types == frozenset({"skill"}):
        return "skill"
    if types == frozenset({"environment"}):
        return "environment"
    if types == frozenset({"skill", "tool"}):
        return "skill+tool"
    if types == frozenset({"environment", "tool"}):
        return "environment+tool"
    return "other"


def types_for_task(cfg_path: Path) -> frozenset[str]:
    try:
        cfg = yaml.safe_load(cfg_path.read_text(encoding="utf-8", errors="replace"))
    except Exception:
        return frozenset()
    if not isinstance(cfg, dict):
        return frozenset()
    attack = cfg.get("Attack") or {}
    types: set[str] = set()
    for turn in (attack.get("attack_turns") or []):
        for step in (turn.get("attack_steps") or []):
            t = step.get("type")
            if t:
                types.add(str(t))
    return frozenset(types)


def main() -> int:
    print(f"[1/2] indexing malicious task buckets in {DATASET_ROOT}")
    # rel_dir -> bucket
    task_bucket_map: dict[str, str] = {}
    for cfg in DATASET_ROOT.rglob("config.yaml"):
        rel_parts = cfg.parent.relative_to(DATASET_ROOT).parts
        if len(rel_parts) < 2 or rel_parts[1] != "malicious":
            continue
        types = types_for_task(cfg)
        rel_dir = cfg.parent.relative_to(DATASET_ROOT).as_posix()
        task_bucket_map[rel_dir] = task_bucket(types)
    print(f"      {len(task_bucket_map)} malicious tasks")

    print(f"[2/2] reading judge_result.json under {TRAJ_ROOT}")
    # (sdk, model, bucket) -> [n_runs, n_success]
    agg: dict[tuple[str, str, str], list[int]] = defaultdict(lambda: [0, 0])
    for jr in TRAJ_ROOT.rglob("judge_result.json"):
        rel = jr.relative_to(TRAJ_ROOT)
        parts = rel.parts
        # layout: <domain>/<sdk>/<model>/<domain>/<malicious|benign>/.../judge_result.json
        if len(parts) < 6:
            continue
        domain, sdk, model = parts[0], parts[1], parts[2]
        # rel_dir = domain/<rest excluding model and trailing judge_result.json>
        # rebuild dataset rel_dir from on-disk path: parts[3:] up to the parent of judge_result.json
        rel_dir = "/".join(parts[3:-1])  # e.g. crm/malicious/direct/data-exfiltration/2
        bucket = task_bucket_map.get(rel_dir)
        if bucket is None:
            continue  # benign or unknown
        try:
            data = json.loads(jr.read_text(encoding="utf-8", errors="replace"))
        except Exception:
            continue
        succ = data.get("attack_success")
        if not isinstance(succ, bool):
            continue
        key = (sdk, model, bucket)
        agg[key][0] += 1
        agg[key][1] += 1 if succ else 0

    # --- assemble per-row ASR ---
    def cell(sdk: str, model: str, b: str) -> tuple[float | None, int]:
        n, s = agg[(sdk, model, b)]
        if n == 0:
            return None, 0
        return 100.0 * s / n, n

    # Compute per-bucket min (best defensive = lowest ASR) over ACTIVE rows only,
    # to bold the best.
    active_rows = [r for r in ROWS if not r[5]]
    col_min: dict[str, float] = {}
    for b in BUCKETS:
        vals = []
        for sdk, model, *_ in active_rows:
            v, n = cell(sdk, model, b)
            if v is not None:
                vals.append(v)
        if vals:
            col_min[b] = min(vals)

    # --- print plain summary ---
    print("\n=== ASR per agent/model x bucket (n in parens) ===")
    header = f"{'agent':<14} {'model':<22}  " + "  ".join(f"{BUCKET_LABEL[b]:>14}" for b in BUCKETS)
    print(header)
    print("-" * len(header))
    for sdk, model, fw, ml, _, comment in ROWS:
        cells = []
        for b in BUCKETS:
            v, n = cell(sdk, model, b)
            cells.append(f"{v:5.1f} (n={n})" if v is not None else "  -    (n=0)")
        prefix = "% " if comment else "  "
        print(f"{prefix}{fw:<12} {ml:<22}  " + "  ".join(f"{c:>14}" for c in cells))

    # --- emit LaTeX ---
    # Count active rows per framework for \multirow grouping
    fw_active_count: dict[str, int] = defaultdict(int)
    for sdk, model, fw, ml, _, comment in ROWS:
        if not comment:
            fw_active_count[fw] += 1

    lines = []
    lines.append(r"% Requires \usepackage{wrapfig} (and \usepackage{multirow}, \usepackage{makecell}, \usepackage{booktabs} as before).")
    lines.append(r"\begin{wraptable}{r}{0.6\textwidth}")
    lines.append(r"\centering")
    lines.append(r"\footnotesize")
    lines.append("")
    lines.append(r"\caption{Attack success rate (ASR) (\%) per agent framework and model, broken down by injection-type combination across all malicious tasks. Lower ASR indicates stronger robustness; the best (lowest) value in each column over the active rows is in \textbf{bold}. The \emph{Other} column aggregates all remaining combinations (e.g., env+prompt, prompt+tool, env+skill+tool, env+prompt+skill+tool, etc.).}")
    lines.append(r"\label{tab:asr_per_combo}")
    lines.append("")
    lines.append(r"\setlength{\tabcolsep}{1.2pt}")
    lines.append("")
    lines.append(r"\resizebox{\linewidth}{!}{")
    n_cols = len(BUCKETS)
    col_spec = "c|l|" + "c" * n_cols
    lines.append(r"\begin{tabular}{" + col_spec + "}")
    lines.append(r"\toprule")
    lines.append("")
    # Header — two-row, with the bucket names spanning under "Injection Combination"
    lines.append(r"\multirow{2}{*}{\makecell{\textbf{Agent} \\ \textbf{Framework}}} &")
    lines.append(r"\multirow{2}{*}{\textbf{Model}} &")
    lines.append(rf"\multicolumn{{{n_cols}}}{{c}}{{\textbf{{Injection Combination}}}} \\")
    lines.append("")
    lines.append(rf"\cmidrule(lr){{3-{2 + n_cols}}}")
    lines.append("")
    # Row 2: 2 empty cells (under Framework + Model multirows) then bucket headers
    header_cells = ["", ""] + [BUCKET_LABEL[b] for b in BUCKETS]
    lines.append(" & ".join(header_cells) + r" \\")
    lines.append("")
    lines.append(r"\midrule")

    # Group rows by framework. The \multirow cell sits on its own line before
    # the block; every row in the block starts with `& <model> & ...`.
    last_fw = None
    for i, (sdk, model, fw, ml, _, comment) in enumerate(ROWS):
        parts: list[str] = []
        for b in BUCKETS:
            v, n = cell(sdk, model, b)
            if v is None:
                parts.append("-")
            else:
                s = f"{v:.1f}"
                if not comment and b in col_min and abs(v - col_min[b]) < 1e-6:
                    s = r"\textbf{" + s + "}"
                parts.append(s)
        cells_str = " & ".join(parts)

        if fw != last_fw:
            if last_fw is not None:
                lines.append(rf"\cmidrule(lr){{1-{2 + n_cols}}}")
            n_active = fw_active_count[fw]
            lines.append(rf"\multirow{{{n_active}}}{{*}}{{{fw}}}")
            last_fw = fw

        prefix = "% " if comment else ""
        lines.append(prefix + f"& {ml} & {cells_str} " + r"\\")

    lines.append(r"\bottomrule")
    lines.append(r"\end{tabular}")
    lines.append("}")
    lines.append(r"\end{wraptable}")

    print("\n=== LaTeX ===")
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

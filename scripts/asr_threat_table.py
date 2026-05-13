#!/usr/bin/env python3
"""Recompute the Indirect/Direct ASR table with a guaranteed-correct Overall.

Overall is defined as the simple macro-average over the 14 displayed domain
cells, computed from the same rounded values that appear in the table — so
the printed Overall is always consistent with the printed domain row, even
when a row has missing cells (those are dropped from the mean rather than
silently zeroed).

For every (threat_model, sdk, model, domain) the cell ASR is:
    100 * (count of trajectories with attack_success=True) / (count of
           trajectories with attack_success in {True, False})
collected by walking judge_result.json under backend/data/trajectories/.

Then the printed Overall = round(mean(rounded_domain_values_present), 1).
"""
from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TRAJ_ROOT = REPO_ROOT / "backend" / "data" / "trajectories"

# Display order matches the existing LaTeX table.
DOMAIN_ORDER = [
    ("workflow",         "Workflow"),
    ("crm",              "CRM"),
    ("customer-service", "CS"),
    ("travel",           "Travel"),
    ("code",             "Code"),
    ("browser",          "Browser"),
    ("research",         "Research"),
    ("os-filesystem",    "OS-FS"),
    ("windows",          "Windows"),
    ("macos",            "macOS"),
    ("finance",          "Finance"),
    ("legal",            "Legal"),
    ("telecom",          "Telecom"),
    ("medical",          "Medical"),
]
DOMAINS = [k for k, _ in DOMAIN_ORDER]

# Row layout: (sdk, model, framework_label, model_label, comment_out)
ROWS = [
    ("openaisdk", "gpt-5.4",            "OpenAI Agents", "GPT-5.4",       False),
    ("openaisdk", "gpt-5.2",            "OpenAI Agents", "GPT-5.2",       False),
    ("openaisdk", "gpt-5.1",            "OpenAI Agents", "GPT-5.1",       False),
    ("openaisdk", "gpt-oss-120b",       "OpenAI Agents", "GPT-OSS-120B",  False),
    ("claudesdk", "claude-opus-4-6",    "Claude Code",   "Opus-4.6",      True),
    ("claudesdk", "claude-sonnet-4-5",  "Claude Code",   "Sonnet-4.5",    False),
    ("googleadk", "gemini-3-pro-preview","Google ADK",   "Gemini-3-Pro",  False),
    ("openclaw",  "claude-opus-4-6",    "OpenClaw",      "Opus-4.6",      True),
    ("openclaw",  "gpt-5.2",            "OpenClaw",      "GPT-5.2",       False),
    ("openclaw",  "gpt-5.5",            "OpenClaw",      "GPT-5.5",       False),
    ("openclaw",  "deepseek-v4-pro",    "OpenClaw",      "DeepSeek-V4-Pro",False),
]

THREAT_MODELS = [("indirect", "Indirect"), ("direct", "Direct")]


def aggregate() -> dict[tuple[str, str, str, str], tuple[int, int]]:
    """(threat, sdk, model, domain) -> (n_runs, n_success).

    Standard layout:
        <domain>/<sdk>/<model>/<domain>/malicious/<threat>/...
    Customer-service layout (extra mode level):
        customer-service/<mode>/<sdk>/<model>/customer-service/malicious/<threat>/...
        where <mode> is benchmark or direct_prompt; both contribute.
    """
    agg: dict[tuple[str, str, str, str], list[int]] = defaultdict(lambda: [0, 0])
    for jr in TRAJ_ROOT.rglob("judge_result.json"):
        rel = jr.relative_to(TRAJ_ROOT).parts
        if len(rel) < 7:
            continue
        domain = rel[0]

        # Pick (sdk, model, malicious_idx) depending on layout.
        if domain == "customer-service" and rel[1] in ("benchmark", "direct_prompt"):
            # customer-service/<mode>/<sdk>/<model>/customer-service/...
            if len(rel) < 8:
                continue
            sdk, model = rel[2], rel[3]
            # rel[4] is "customer-service" (re-listed), then malicious/<threat>
            if rel[5] != "malicious" or rel[6] not in ("direct", "indirect"):
                continue
            threat = rel[6]
        else:
            sdk, model = rel[1], rel[2]
            if rel[4] != "malicious" or rel[5] not in ("direct", "indirect"):
                continue
            threat = rel[5]

        try:
            data = json.loads(jr.read_text(encoding="utf-8", errors="replace"))
        except Exception:
            continue
        succ = data.get("attack_success")
        if not isinstance(succ, bool):
            continue
        key = (threat, sdk, model, domain)
        agg[key][0] += 1
        agg[key][1] += 1 if succ else 0
    return {k: tuple(v) for k, v in agg.items()}


def cell_asr(stats: dict, threat: str, sdk: str, model: str, domain: str) -> float | None:
    n, s = stats.get((threat, sdk, model, domain), (0, 0))
    if n == 0:
        return None
    return round(100.0 * s / n, 1)


def macro_avg(vals: list[float | None]) -> float | None:
    present = [v for v in vals if v is not None]
    if not present:
        return None
    return round(sum(present) / len(present), 1)


def main() -> int:
    print(f"[1/2] aggregating ASR from {TRAJ_ROOT}")
    stats = aggregate()
    print(f"      {len(stats)} (threat, sdk, model, domain) cells with data")

    # Find best (highest) ASR per column over active rows, separately within each threat block.
    print(f"[2/2] computing per-row Overall as macro-avg of present domain cells")

    # Build a table of cell values per (threat, row_idx, domain)
    table: dict[tuple[str, int, str], float | None] = {}
    overalls: dict[tuple[str, int], float | None] = {}
    for threat, _ in THREAT_MODELS:
        for ri, (sdk, model, _, _, _) in enumerate(ROWS):
            row_vals = [cell_asr(stats, threat, sdk, model, d) for d in DOMAINS]
            for d, v in zip(DOMAINS, row_vals):
                table[(threat, ri, d)] = v
            overalls[(threat, ri)] = macro_avg(row_vals)

    # Per-column max within each threat block (active rows only) for bolding.
    col_max: dict[tuple[str, str], float] = {}  # (threat, domain) -> max
    overall_max: dict[str, float] = {}
    for threat, _ in THREAT_MODELS:
        active = [(ri, ROWS[ri]) for ri in range(len(ROWS)) if not ROWS[ri][4]]
        for d in DOMAINS:
            vals = [table[(threat, ri, d)] for ri, _ in active if table[(threat, ri, d)] is not None]
            if vals:
                col_max[(threat, d)] = max(vals)
        ov_vals = [overalls[(threat, ri)] for ri, _ in active if overalls[(threat, ri)] is not None]
        if ov_vals:
            overall_max[threat] = max(ov_vals)

    # ---------- console summary ----------
    print("\n=== ASR per (threat, agent, model, domain) ===")
    header = f"{'threat':<9} {'agent':<14} {'model':<22} {'Overall':>8}  " + "  ".join(f"{lab:>8}" for _, lab in DOMAIN_ORDER)
    print(header)
    print("-" * len(header))
    for threat, _ in THREAT_MODELS:
        for ri, (sdk, model, fw, ml, comment) in enumerate(ROWS):
            ov = overalls[(threat, ri)]
            ov_s = f"{ov:.1f}" if ov is not None else "-"
            cells = []
            for d in DOMAINS:
                v = table[(threat, ri, d)]
                cells.append(f"{v:.1f}" if v is not None else "-")
            prefix = "% " if comment else "  "
            print(f"{prefix}{threat:<7} {fw:<14} {ml:<22} {ov_s:>8}  " + "  ".join(f"{c:>8}" for c in cells))

    # ---------- LaTeX ----------
    n_dom = len(DOMAINS)
    col_spec = "c|c|l|c|" + "c" * n_dom
    L: list[str] = []
    L.append(r"\begin{table*}[t!]")
    L.append(r"\footnotesize")
    L.append(r"\begin{center}")
    L.append("")
    L.append(r"\caption{Attack success rate (ASR) (\%) across two threat models: (1) \textbf{Indirect}, where a third-party attacker introduces malicious instructions indirectly to manipulate the agent during a benign user task; and (2) \textbf{Direct}, where the attacker directly acts as the user and attempts to manipulate the agent to achieve malicious goals. We evaluate multiple agent frameworks and models across domains. The Overall column is the macro-average over the 14 domain columns (missing cells excluded). The highest ASR in each column is shown in \textbf{bold}, indicating the most vulnerable agent configuration.}")
    L.append("")
    L.append(r"\setlength{\tabcolsep}{1.2pt}")
    L.append("")
    L.append(r"\resizebox{\textwidth}{!}{")
    L.append(r"\begin{tabular}{" + col_spec + "}")
    L.append(r"\toprule")
    L.append("")
    L.append(r"\multirow{2}{*}{\makecell{\textbf{Threat} \\ \textbf{Model}}} &")
    L.append(r"\multirow{2}{*}{\makecell{\textbf{Agent} \\ \textbf{Framework}}} &")
    L.append(r"\multirow{2}{*}{\textbf{Model}} &")
    L.append(r"\multirow{2}{*}{\textbf{Overall}} &")
    L.append(rf"\multicolumn{{{n_dom}}}{{c}}{{\textbf{{Domain}}}} \\")
    L.append("")
    L.append(rf"\cmidrule(lr){{5-{4 + n_dom}}}")
    L.append("")
    # Header row 2: 4 empty cells (under Threat, Framework, Model, Overall multirows)
    header_cells = ["", "", "", ""] + [lab for _, lab in DOMAIN_ORDER]
    L.append(" & ".join(header_cells) + r" \\")
    L.append("")
    L.append(r"\midrule")

    def fmt(v: float | None, is_max: bool) -> str:
        if v is None:
            return "-"
        s = f"{v:.1f}"
        return r"\textbf{" + s + "}" if is_max else s

    fw_active_count_per_threat: dict[tuple[str, str], int] = defaultdict(int)
    for threat, _ in THREAT_MODELS:
        for sdk, model, fw, ml, comment in ROWS:
            if not comment:
                fw_active_count_per_threat[(threat, fw)] += 1

    threat_active_count: dict[str, int] = {
        t: sum(1 for r in ROWS if not r[4]) for t, _ in THREAT_MODELS
    }

    for ti, (threat, threat_label) in enumerate(THREAT_MODELS):
        if ti > 0:
            L.append(r"\midrule")
        # Threat \multirow on its own line — attaches to the first row whose
        # first `&` separator appears below.
        n_threat = threat_active_count[threat]
        L.append(rf"\multirow{{{n_threat}}}{{*}}{{\textbf{{{threat_label}}}}}")

        last_fw = None
        fw_emitted_first_active = False
        for ri, (sdk, model, fw, ml, comment) in enumerate(ROWS):
            ov = overalls[(threat, ri)]
            ov_str = fmt(ov, ov is not None and not comment and threat in overall_max
                         and abs(ov - overall_max[threat]) < 1e-6)
            cells = []
            for d in DOMAINS:
                v = table[(threat, ri, d)]
                m = col_max.get((threat, d))
                is_max = v is not None and m is not None and abs(v - m) < 1e-6 and not comment
                cells.append(fmt(v, is_max))
            row_data = ov_str + " & " + " & ".join(cells)

            if fw != last_fw:
                if last_fw is not None:
                    L.append(rf"\cmidrule(lr){{2-{4 + n_dom}}}")
                n_fw = fw_active_count_per_threat[(threat, fw)]
                # Framework \multirow on its OWN line so it attaches to the
                # first non-commented row that follows (commented rows in the
                # block disappear under % and don't consume the multirow).
                L.append(rf" & \multirow{{{n_fw}}}{{*}}{{{fw}}}")
                last_fw = fw
                fw_emitted_first_active = False

            if comment:
                # Commented row: cells 1+2 are irrelevant since the whole line
                # is stripped by LaTeX. Emit a uniform `% & & <model> & ...`.
                L.append(f"% & & {ml} & {row_data} " + r"\\")
            else:
                if not fw_emitted_first_active:
                    # First active row of this fw block: continues directly
                    # from the multirow line above, so just `& <model> & ...`.
                    L.append(f"& {ml} & {row_data} " + r"\\")
                    fw_emitted_first_active = True
                else:
                    # Later active rows in same fw block: explicit empty
                    # cells 1+2 (threat & fw multirows span them).
                    L.append(f"& & {ml} & {row_data} " + r"\\")

    L.append(r"\bottomrule")
    L.append("")
    L.append(r"\end{tabular}")
    L.append("}")
    L.append("")
    L.append(r"\label{tab:asr}")
    L.append("")
    L.append(r"\end{center}")
    L.append(r"\end{table*}")

    print("\n=== LaTeX ===")
    print("\n".join(L))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

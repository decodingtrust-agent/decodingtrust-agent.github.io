#!/usr/bin/env python3
"""
Compute Overall ASR (average across all 14 domains) for each
(framework, model) row and emit a LaTeX table with a new 'Overall'
column inserted to the left of 'Workflow'.

Per-column bolding is preserved: the max value in each column (including
the new Overall column) is shown in \textbf{} within each threat-model
block.
"""

from __future__ import annotations

DOMAINS = [
    "Workflow",
    "CRM",
    "CS",
    "Travel",
    "Coding",
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

INDIRECT = [
    ("OpenAI Agents", "GPT-5.4",       [39.0, 53.8, 52.4, 55.0, 62.2, 42.9, 14.2, 37.5, 10.6, 26.0, 36.5, 58.0, 15.1, 37.5]),
    ("OpenAI Agents", "GPT-5.2",       [42.5, 66.4, 46.4, 66.7, 79.3, 24.8,  7.0, 44.3, 12.9, 38.0, 40.5, 66.0, 33.7, 47.2]),
    ("OpenAI Agents", "GPT-OSS-120B",  [ 3.0,  9.3, 19.6, 40.8, 15.7, 41.3, 17.3, 32.8, 14.7, 18.0, 32.5, 31.0, 54.8, 62.1]),
    ("Claude Code",   "Opus-4.6",      [13.3,  3.9,  1.9,  0.0, 15.3,  0.0,  0.0,  1.2,  7.7, 28.0,  0.5,  9.5, 22.9, 16.7]),
    ("Claude Code",   "Sonnet-4.5",    [52.0, 40.6, 12.9, 11.7, 56.0,  4.5,  0.0, 17.6,  7.7, 20.0,  7.0, 26.5, 44.0, 51.7]),
    ("Google ADK",    "Gemini-3-Pro",  [53.7, 69.9, 75.8, 84.2, 77.9, 62.2, 16.2, 59.5, 13.9, 34.0, 59.5, 56.0, 43.4, 49.1]),
    ("OpenClaw",      "Opus-4.6",      [16.1,  7.2,  4.4,  5.8, 29.3,  0.0,  1.5,  3.1,  5.6, 16.0,  1.5, 12.5, 24.7, 23.0]),
    ("OpenClaw",      "GPT-5.2",       [23.3, 50.9, 53.9, 32.5, 65.3, 27.6,  5.8, 20.0,  9.6, 26.0, 26.5, 66.0, 36.7, 48.2]),
]

DIRECT = [
    ("OpenAI Agents", "GPT-5.4",       [53.5, 67.8, 65.7, 32.4, 62.5, 29.2, 27.5, 84.0, 50.0, 30.0, 30.5, 54.0, 37.3, 60.4]),
    ("OpenAI Agents", "GPT-5.2",       [60.6, 83.3, 72.0, 42.9, 62.5, 20.3, 37.7, 83.6, 49.3, 40.0, 51.5, 59.5, 54.7, 71.1]),
    ("OpenAI Agents", "GPT-OSS-120B",  [61.7, 38.9, 36.5, 54.3, 60.0, 10.0, 30.6, 70.0, 34.3, 20.0, 37.7, 60.5, 57.1, 61.3]),
    ("Claude Code",   "Opus-4.6",      [21.0, 11.1,  0.0,  2.9, 33.3,  8.8, 20.8, 26.2, 50.7, 26.0,  4.0, 30.0, 28.0, 54.7]),
    ("Claude Code",   "Sonnet-4.5",    [47.3, 16.7, 15.0,  3.8, 56.6, 20.0, 15.9, 22.6, 27.1, 18.0,  5.5, 20.0, 28.6, 75.1]),
    ("Google ADK",    "Gemini-3-Pro",  [51.5, 55.6, 42.9, 52.4, 71.6, 35.3, 30.2, 73.5, 42.9, 30.0, 22.0, 64.0, 30.4, 62.7]),
    ("OpenClaw",      "Opus-4.6",      [18.8, 11.1, 17.9,  5.7, 33.2, 10.2, 21.2, 24.2, 30.7, 14.0,  4.0, 22.5, 32.9, 50.7]),
    ("OpenClaw",      "GPT-5.2",       [28.3, 67.8, 64.1, 12.4, 32.9, 22.8, 34.3, 33.7, 35.0, 26.0, 26.0, 51.5, 54.0, 43.1]),
]


def mean(values):
    return sum(values) / len(values)


def fmt(v):
    return f"{v:.1f}"


def col_max_indices(rows_values):
    """For each column, return the set of row indices that hold the maximum."""
    n_cols = len(rows_values[0])
    out = []
    for c in range(n_cols):
        col = [row[c] for row in rows_values]
        m = max(col)
        out.append({i for i, v in enumerate(col) if abs(v - m) < 1e-9})
    return out


def render_block(block_name, rows):
    """Render one threat-model block (Indirect or Direct)."""
    # Build rows_values with the new Overall column (position 0)
    rows_values = []
    for _, _, values in rows:
        overall = mean(values)
        rows_values.append([overall] + values)

    bolds = col_max_indices(rows_values)

    # Group consecutive rows that share a framework so we can emit \multirow
    groups = []  # list of (framework_name, [row_index,...])
    for idx, (fw, model, _) in enumerate(rows):
        if groups and groups[-1][0] == fw:
            groups[-1][1].append(idx)
        else:
            groups.append((fw, [idx]))

    lines = []
    block_size = len(rows)
    lines.append(f"\\multirow{{{block_size}}}{{*}}{{\\textbf{{{block_name}}}}}")

    for g_i, (fw, idxs) in enumerate(groups):
        for local_i, row_idx in enumerate(idxs):
            _, model, _ = rows[row_idx]
            values = rows_values[row_idx]
            # Format each cell with bolding if needed
            cells = []
            for c, v in enumerate(values):
                s = fmt(v)
                if row_idx in bolds[c]:
                    s = f"\\textbf{{{s}}}"
                cells.append(s)

            # First cell of the first group line carries the block framework multirow marker
            if local_i == 0:
                if len(idxs) > 1:
                    fw_cell = f"\\multirow{{{len(idxs)}}}{{*}}{{{fw}}}"
                else:
                    fw_cell = fw
            else:
                fw_cell = ""

            # Threat-model cell only on first line of block
            threat_cell = ""  # prepended separately for the first iteration below
            if g_i == 0 and local_i == 0:
                row_prefix = ""  # the \multirow is already on its own line above
            else:
                row_prefix = ""

            line = " & ".join(["", fw_cell, model] + cells) + " \\\\"
            lines.append(line)

        # Add cmidrule between framework groups within the block
        if g_i < len(groups) - 1:
            lines.append("\\cmidrule(lr){2-18}")

    return "\n".join(lines)


def render_table():
    header = r"""\begin{table*}[t!]
\footnotesize
\begin{center}

\caption{Attack success rate (ASR) (\%) across two threat models: (1) \textbf{Indirect}, where a third-party attacker introduces malicious instructions indirectly to manipulate the agent during a benign user task; and (2) \textbf{Direct}, where the attacker directly acts as the user and attempts to manipulate the agent to achieve malicious goals. We evaluate multiple agent frameworks and models across domains. The highest ASR in each column is shown in \textbf{bold}, indicating the most vulnerable configuration. \textbf{Overall} reports the mean ASR across all 14 domains.}

\setlength{\tabcolsep}{1.2pt}

\resizebox{\textwidth}{!}{
\begin{tabular}{c|c|l|c|cccccccccccccc}
\toprule

\multirow{2}{*}{\makecell{\textbf{Threat} \\ \textbf{Model}}} &
\multirow{2}{*}{\makecell{\textbf{Agent} \\ \textbf{Framework}}} &
\multirow{2}{*}{\textbf{Model}} &
\multirow{2}{*}{\textbf{Overall}} &
\multicolumn{14}{c}{\textbf{Domain}} \\

\cmidrule(lr){5-18}

& &
&
& Workflow
& CRM
& CS
& Travel
& Coding
& Browser
& Research
& OS-FS
& Windows
& macOS
& Finance
& Legal
& Telecom
& Medical \\

\midrule
"""
    indirect = render_block("Indirect", INDIRECT)
    mid = "\n\\midrule\n"
    direct = render_block("Direct", DIRECT)
    footer = r"""
\bottomrule

\end{tabular}
}

\label{tab:asr}

\end{center}
\end{table*}
"""
    return header + indirect + mid + direct + footer


def print_overall_summary():
    print("=" * 68)
    print(f"{'Threat':<10} {'Framework':<16} {'Model':<16} {'Overall ASR (%)':>16}")
    print("-" * 68)
    for name, block in [("Indirect", INDIRECT), ("Direct", DIRECT)]:
        for fw, model, values in block:
            print(f"{name:<10} {fw:<16} {model:<16} {mean(values):>16.2f}")
    print("=" * 68)


if __name__ == "__main__":
    print_overall_summary()
    print()
    print(render_table())

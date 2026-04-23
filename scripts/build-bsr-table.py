#!/usr/bin/env python3
"""
Compute Overall BSR (average across all 14 domains) for each
(framework, model) row and emit a LaTeX table with a new 'Overall'
column inserted to the left of 'Workflow'.

Higher BSR is better, so the max value in each column (including the
new Overall column) is bolded.
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

ROWS = [
    ("OpenAI Agents", "GPT-5.4",       [76.7, 78.8, 97.5, 90.6, 98.5, 77.1, 95.0, 85.7, 77.8, 76.7, 95.5, 89.5, 74.2, 86.1]),
    ("OpenAI Agents", "GPT-5.2",       [73.1, 72.7, 97.3, 95.3, 93.6, 55.6, 94.5, 80.0, 74.6, 73.3, 96.5, 84.5, 74.2, 66.3]),
    ("OpenAI Agents", "GPT-5.1",       [77.3, 65.5, 98.4, 89.2, 93.2, 79.2, 90.0, 74.5, 72.0, 70.0, 94.0, 91.5, 70.8, 52.8]),
    ("OpenAI Agents", "GPT-OSS-120B",  [56.0,  4.2, 72.5,  0.0, 49.5, 25.0, 30.0, 61.7, 67.9, 13.3, 21.5,  9.5, 67.5, 35.8]),
    ("Claude Code",   "Opus-4.6",      [83.0, 83.0,100.0, 89.4, 98.4, 97.2,100.0, 83.3, 78.0, 83.3, 96.5, 91.0, 70.8, 57.8]),
    ("Claude Code",   "Sonnet-4.5",    [71.0, 82.4, 94.7, 56.7, 98.2, 95.8,100.0, 78.6, 83.8, 73.3, 92.0, 79.0, 74.2, 66.4]),
    ("Google ADK",    "Gemini-3-Pro",  [88.1, 86.1, 98.6, 99.4,100.0, 97.2,100.0, 87.0, 85.4, 60.0, 90.0, 87.5, 69.2, 81.9]),
    ("OpenClaw",      "Opus-4.6",      [91.0, 82.4, 97.3, 89.4,100.0, 97.2, 96.0, 78.7, 70.0, 80.0, 91.0, 94.0, 77.5, 69.3]),
    ("OpenClaw",      "GPT-5.2",       [62.7, 75.2, 98.4, 91.4, 91.1, 56.9, 95.0, 78.6, 58.1, 76.7, 89.5, 91.0, 68.3, 68.4]),
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


def render_table():
    rows_values = []
    for _, _, values in ROWS:
        overall = mean(values)
        rows_values.append([overall] + values)

    bolds = col_max_indices(rows_values)

    groups = []
    for idx, (fw, _, _) in enumerate(ROWS):
        if groups and groups[-1][0] == fw:
            groups[-1][1].append(idx)
        else:
            groups.append((fw, [idx]))

    header = r"""\begin{table*}[t!]
\footnotesize
\begin{center}

\caption{Benign task success rate (BSR) (\%) across multiple agent frameworks and models over domains. Higher BSR indicates better capability in successfully completing benign user tasks. The best performance in each column is in \textbf{bold}. \textbf{Overall} reports the mean BSR across all 14 domains.}

\setlength{\tabcolsep}{1.2pt}

\resizebox{\textwidth}{!}{
\begin{tabular}{c|l|c|cccccccccccccc}
\toprule

\multirow{2}{*}{\makecell{\textbf{Agent} \\ \textbf{Framework}}} &
\multirow{2}{*}{\textbf{Model}} &
\multirow{2}{*}{\textbf{Overall}} &
\multicolumn{14}{c}{\textbf{Domain}} \\

\cmidrule(lr){4-17}

&
& & Workflow
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

    body_lines = []
    for g_i, (fw, idxs) in enumerate(groups):
        for local_i, row_idx in enumerate(idxs):
            _, model, _ = ROWS[row_idx]
            values = rows_values[row_idx]
            cells = []
            for c, v in enumerate(values):
                s = fmt(v)
                if row_idx in bolds[c]:
                    s = f"\\textbf{{{s}}}"
                cells.append(s)

            if local_i == 0:
                if len(idxs) > 1:
                    fw_cell = f"\\multirow{{{len(idxs)}}}{{*}}{{{fw}}}"
                else:
                    fw_cell = fw
            else:
                fw_cell = ""

            line = " & ".join([fw_cell, model] + cells) + " \\\\"
            body_lines.append(line)

        if g_i < len(groups) - 1:
            body_lines.append("\\cmidrule(lr){1-17}")

    footer = r"""
\bottomrule

\end{tabular}
}

\label{tab:bsr}

\end{center}
\end{table*}
"""
    return header + "\n".join(body_lines) + footer


def print_overall_summary():
    print("=" * 60)
    print(f"{'Framework':<16} {'Model':<16} {'Overall BSR (%)':>16}")
    print("-" * 60)
    for fw, model, values in ROWS:
        print(f"{fw:<16} {model:<16} {mean(values):>16.2f}")
    print("=" * 60)


if __name__ == "__main__":
    print_overall_summary()
    print()
    print(render_table())

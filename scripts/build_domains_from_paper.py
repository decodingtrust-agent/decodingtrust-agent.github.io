#!/usr/bin/env python3
"""Extract per-domain appendix content into a TypeScript registry.

For each `appendix/<domain>.tex` we pull:
  - The "Domain Overview" paragraphs.
  - The "Benign Tasks" bullet list (name + description per category).
  - The Domain Policy + General Policy paragraphs from "Policy Definition".
  - Threat-model text (indirect / direct) when present.

The output is `frontend/lib/domains.generated.ts`. The hand-written one-liner
metadata still lives in `frontend/lib/domains.ts` and is merged at runtime —
this script never touches those.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

PAPER_APPENDIX = Path("/tmp/dt-paper/appendix")
OUT_TS = Path(
    "/home/zhaorun/decodingtrust-agent.github.io/frontend/lib/domains.generated.ts"
)

# Map appendix filename → site domain key.
FILE_TO_DOMAIN_KEY = {
    "workflow.tex": "workflow",
    "crm.tex": "crm",
    "customer-service.tex": "customer-service",
    "travel.tex": "travel",
    "code.tex": "coding",
    "browser.tex": "browser",
    "research.tex": "research",
    "os_filesystem.tex": "os-filesystem",
    "windows.tex": "windows",
    "macos.tex": "macos",
    "finance.tex": "finance",
    "legal.tex": "legal",
    "telecom.tex": "telecom",
    "medical.tex": "medical",
}


# ---- LaTeX → plain text helpers (shared shape with the env extractor) -----


def strip_tex_comments(text: str) -> str:
    out: list[str] = []
    for line in text.splitlines():
        i = 0
        cut = -1
        while i < len(line):
            if line[i] == "%" and (i == 0 or line[i - 1] != "\\"):
                cut = i
                break
            i += 1
        out.append(line if cut < 0 else line[:cut])
    return "\n".join(out)


def _strip_balanced_braces(text: str, command: str, replacement) -> str:
    out: list[str] = []
    i = 0
    needle = "\\" + command
    while i < len(text):
        idx = text.find(needle, i)
        if idx < 0:
            out.append(text[i:])
            break
        out.append(text[i:idx])
        j = idx + len(needle)
        while j < len(text) and text[j] == " ":
            j += 1
        if j >= len(text) or text[j] != "{":
            out.append(text[idx:j])
            i = j
            continue
        depth = 1
        k = j + 1
        while k < len(text) and depth:
            ch = text[k]
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    break
            k += 1
        inner = text[j + 1 : k]
        if callable(replacement):
            out.append(replacement(inner))
        else:
            out.append(replacement.replace("\\1", inner))
        i = k + 1
    return "".join(out)


LATEX_REPLACEMENTS = [
    (re.compile(r"~"), " "),
    (re.compile(r"\\%"), "%"),
    (re.compile(r"\\&"), "&"),
    (re.compile(r"\\#"), "#"),
    (re.compile(r"\\citep\{[^}]*\}"), ""),
    (re.compile(r"\\cite\{[^}]*\}"), ""),
    (re.compile(r"\\citet\{[^}]*\}"), ""),
    (re.compile(r"Table\s*\\ref\{[^}]*\}"), "the policy table"),
    (re.compile(r"Tab\.\s*\\ref\{[^}]*\}"), "the policy table"),
    (re.compile(r"Fig\.\s*\\ref\{[^}]*\}"), "the figure"),
    (re.compile(r"Figure\s*\\ref\{[^}]*\}"), "the figure"),
    (re.compile(r"\\cref\{[^}]*\}"), "the figure"),
    (re.compile(r"\\Cref\{[^}]*\}"), "The figure"),
    (re.compile(r"\\ref\{[^}]*\}"), ""),
    (re.compile(r"\\label\{[^}]*\}"), ""),
    (re.compile(r"\\input\{[^}]*\}"), ""),
    (re.compile(r"\\FloatBarrier"), ""),
    (re.compile(r"\\clearpage"), ""),
    (re.compile(r"\\noindent"), ""),
    (re.compile(r"\\vspace\{[^}]*\}"), ""),
    (re.compile(r"\\hspace\{[^}]*\}"), ""),
    (re.compile(r"\\\\"), "\n"),
    (re.compile(r"\\alg\b"), "DTap"),
    (re.compile(r"\\bench\b"), "DTap-Bench"),
    (re.compile(r"\\agent\b"), "DTap-Red"),
    (re.compile(r"\\algfull\b"), "DecodingTrust-Agent Platform"),
    (re.compile(r"\\,"), " "),
    (re.compile(r"\\ "), " "),
    (re.compile(r"``([^`']*)''"), r'"\1"'),
    (re.compile(r"`([^`']*)'"), r"'\1'"),
]


def clean_latex(text: str) -> str:
    text = _strip_balanced_braces(text, "textbf", lambda inner: f"**{clean_latex(inner)}**")
    text = _strip_balanced_braces(text, "textit", lambda inner: f"*{clean_latex(inner)}*")
    text = _strip_balanced_braces(text, "emph", lambda inner: f"*{clean_latex(inner)}*")
    text = _strip_balanced_braces(text, "texttt", lambda inner: f"`{clean_latex(inner)}`")
    for pat, repl in LATEX_REPLACEMENTS:
        text = pat.sub(repl, text)
    text = re.sub(r"\\[a-zA-Z]+\*?\{([^{}]*)\}", r"\1", text)
    text = re.sub(r"\\[a-zA-Z]+\*?", "", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n[ \t]+", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def split_paragraphs(text: str) -> list[str]:
    return [p.strip() for p in re.split(r"\n\s*\n", clean_latex(text)) if p.strip()]


# ---- Section/structure parsers --------------------------------------------


def find_subsection(text: str, name: str) -> str | None:
    """Return body of `\\subsection{<name>}` up to the next \\subsection / \\section."""
    pat = re.compile(
        r"\\subsection\{" + re.escape(name) + r"\}(.*?)(?=\\subsection\{|\\section\{|\Z)",
        re.DOTALL,
    )
    m = pat.search(text)
    return m.group(1) if m else None


def find_subsubsection(body: str, name: str) -> str | None:
    pat = re.compile(
        r"\\subsubsection\{" + re.escape(name) + r"\}(.*?)(?=\\subsubsection\{|\\subsection\{|\\section\{|\Z)",
        re.DOTALL,
    )
    m = pat.search(body)
    return m.group(1) if m else None


def parse_itemize_textbf(block: str) -> list[dict]:
    """Pull `\\textbf{Name}: description` items out of an itemize block."""
    items: list[dict] = []
    item_pat = re.compile(
        r"\\item\s+\\textbf\{([^}]+)\}\s*[:\.]?\s*(.*?)(?=\\item|\\end\{itemize\}|\Z)",
        re.DOTALL,
    )
    iter_block = block
    # Restrict to first itemize so we don't grab unrelated lists.
    m = re.search(r"\\begin\{itemize\}(.*?)\\end\{itemize\}", iter_block, re.DOTALL)
    if not m:
        return items
    inner = m.group(1)
    for n_match in item_pat.finditer(inner):
        name = clean_latex(n_match.group(1)).strip()
        desc = clean_latex(n_match.group(2)).strip().rstrip(".")
        if name:
            items.append({"name": name, "description": desc})
    return items


def parse_textbf_paragraph(block: str, label: str) -> str | None:
    """Return text following `\\textbf{<label>.}` until a blank line or next \\textbf."""
    pat = re.compile(
        r"\\textbf\{" + re.escape(label) + r"\.?\}\s*\.?\s*(.*?)(?=\n\s*\n|\\textbf\{|\\subsubsection\{|\\subsection\{|\Z)",
        re.DOTALL,
    )
    m = pat.search(block)
    if not m:
        return None
    return clean_latex(m.group(1)).strip().lstrip(".").strip()


def parse_domain(path: Path) -> dict:
    raw = strip_tex_comments(path.read_text())

    out: dict = {
        "overview": [],
        "benignTasks": [],
        "domainPolicy": None,
        "generalPolicy": None,
        "indirectThreat": None,
        "directThreat": None,
    }

    overview = find_subsection(raw, "Domain Overview")
    if overview:
        out["overview"] = split_paragraphs(overview)

    benign = find_subsection(raw, "Benign Tasks")
    if benign:
        out["benignTasks"] = parse_itemize_textbf(benign)

    redteam = find_subsection(raw, "Red-Teaming Tasks") or ""
    policy = find_subsubsection(redteam, "Policy Definition") or redteam
    if policy:
        dp = parse_textbf_paragraph(policy, "Domain Policy")
        if dp:
            out["domainPolicy"] = dp
        gp = parse_textbf_paragraph(policy, "General Policy")
        if gp:
            out["generalPolicy"] = gp

    if redteam:
        ind = parse_textbf_paragraph(redteam, "Indirect Threat Model")
        if ind:
            out["indirectThreat"] = ind
        direct = parse_textbf_paragraph(redteam, "Direct Threat Model")
        if direct:
            out["directThreat"] = direct

    return out


def emit_typescript(payload: dict[str, dict]) -> str:
    header = (
        "// AUTO-GENERATED by scripts/build_domains_from_paper.py — do not edit.\n"
        "// Source: /tmp/dt-paper/appendix/<domain>.tex\n\n"
        "export type DomainBenignTask = { name: string; description: string }\n\n"
        "export type DomainAppendix = {\n"
        "  overview: string[]\n"
        "  benignTasks: DomainBenignTask[]\n"
        "  domainPolicy: string | null\n"
        "  generalPolicy: string | null\n"
        "  indirectThreat: string | null\n"
        "  directThreat: string | null\n"
        "}\n\n"
        "export const domainAppendix: Record<string, DomainAppendix> = "
    )
    return header + json.dumps(payload, indent=2, ensure_ascii=False) + "\n"


def main() -> int:
    payload: dict[str, dict] = {}
    for filename, key in FILE_TO_DOMAIN_KEY.items():
        path = PAPER_APPENDIX / filename
        if not path.exists():
            print(f"!! missing {path}", file=sys.stderr)
            continue
        payload[key] = parse_domain(path)
        print(
            f"{key:18} overview={len(payload[key]['overview'])}p "
            f"benign={len(payload[key]['benignTasks'])} "
            f"dp={'y' if payload[key]['domainPolicy'] else 'n'} "
            f"gp={'y' if payload[key]['generalPolicy'] else 'n'} "
            f"ind={'y' if payload[key]['indirectThreat'] else 'n'} "
            f"dir={'y' if payload[key]['directThreat'] else 'n'}"
        )
    OUT_TS.write_text(emit_typescript(payload))
    print(f"wrote {OUT_TS}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

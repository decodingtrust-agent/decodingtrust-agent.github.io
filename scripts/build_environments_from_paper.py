#!/usr/bin/env python3
"""Extract per-environment intro paragraphs + screenshots from the paper.

Reads `/tmp/dt-paper/appendix/environment.tex` and emits
`frontend/lib/environments.generated.ts`, a TypeScript module exporting
an `environments: EnvironmentDoc[]` array consumed by the docs route.

Each environment carries:
  slug        — URL slug under /docs/environments/<slug>
  name        — Display title (matches \\subsection{...})
  domainKey   — One of the 14 site domain keys
  intro       — Intro paragraphs (LaTeX → plain text)
  screenshots — { src, caption } pulled from the \\subsection's figure block
  guiCaption  — The figure-level "Simulated X environment." caption (optional)

We resolve `figure/<sub>/<name>.png` → `/env-showcase/<name>.png` since
copy_paper_figures.sh already mirrors them into public/env-showcase.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

PAPER_TEX = Path("/tmp/dt-paper/appendix/environment.tex")
OUT_TS = Path(
    "/home/zhaorun/decodingtrust-agent.github.io/frontend/lib/environments.generated.ts"
)

# Domain assignment per subsection title.
DOMAIN_BY_SECTION = {
    "Gmail": "workflow",
    "Google Calendar": "workflow",
    "Google Docs": "workflow",
    "Google Forms": "workflow",
    "Google Drive": "workflow",
    "Google Sheets": "workflow",
    "Slack": "workflow",
    "Paypal": "workflow",
    "Zoom": "workflow",
    "Atlassian": "workflow",
    "WhatsApp": "workflow",
    "GitHub": "coding",
    "GitLab": "coding",
    "Snowflake": "workflow",
    "Databricks": "workflow",
    "Salesforce CRM": "crm",
    "Windows": "windows",
    "macOS": "macos",
    "OS-Filesystem": "os-filesystem",
    "Browser": "browser",
    "Code-Terminal": "coding",
    "Research": "research",
    "ServiceNow": "customer-service",
    "Booking": "travel",
    "Telecom": "telecom",
    "Medical Service": "medical",
    "Yahoo Finance": "finance",
    "FedEx": "workflow",
    "X": "workflow",
    "LinkedIn": "workflow",
    "Chase": "finance",
    "Notion": "workflow",
    "Reddit": "workflow",
    "Robinhood": "finance",
    "Dropbox": "workflow",
    "Southwest Airlines": "travel",
    "United Airlines": "travel",
    "Enterprise Rent-A-Car": "travel",
    "DoorDash": "workflow",
    "Expedia": "travel",
}

# Custom slug overrides. Default = lowercase / hyphenated section title.
SLUG_OVERRIDES = {
    "Salesforce CRM": "salesforce-crm",
    "OS-Filesystem": "os-filesystem",
    "Code-Terminal": "code-terminal",
    "Research": "arxiv",
    "Medical Service": "medical-service",
    "Yahoo Finance": "yahoo-finance",
    "Southwest Airlines": "southwest",
    "United Airlines": "united",
    "Enterprise Rent-A-Car": "enterprise",
    "Paypal": "paypal",
    "macOS": "macos",
}


def slugify(name: str) -> str:
    if name in SLUG_OVERRIDES:
        return SLUG_OVERRIDES[name]
    s = name.lower().replace(" ", "-")
    s = re.sub(r"[^a-z0-9\-]", "", s)
    return s


def _strip_balanced_braces(text: str, command: str, replacement) -> str:
    """Replace `\\command{...}` honoring nested braces.

    `replacement` may be a string or a callable taking the inner content.
    """
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
        # Skip optional whitespace and demand `{`.
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


# Initial replacements done with regex for cheap stuff.
LATEX_REPLACEMENTS = [
    (re.compile(r"~"), " "),
    (re.compile(r"\\%"), "%"),
    (re.compile(r"\\&"), "&"),
    (re.compile(r"\\#"), "#"),
    (re.compile(r"Table\s*\\ref\{[^}]*\}"), "the MCP-tool table"),
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
]


def clean_latex(text: str) -> str:
    # Brace-aware passes for commands whose arguments may nest other macros.
    text = _strip_balanced_braces(text, "textbf", lambda inner: f"**{clean_latex(inner)}**")
    text = _strip_balanced_braces(text, "textit", lambda inner: f"*{clean_latex(inner)}*")
    text = _strip_balanced_braces(text, "emph", lambda inner: f"*{clean_latex(inner)}*")
    text = _strip_balanced_braces(text, "texttt", lambda inner: f"`{clean_latex(inner)}`")

    for pat, repl in LATEX_REPLACEMENTS:
        text = pat.sub(repl, text)

    # Generic cleanup: drop unhandled \cmd{arg} (keeping arg) and \cmd
    # tokens. This is a best-effort second pass.
    text = re.sub(r"\\[a-zA-Z]+\*?\{([^{}]*)\}", r"\1", text)
    text = re.sub(r"\\[a-zA-Z]+\*?", "", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n[ \t]+", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _read_balanced(text: str, start: int) -> tuple[str, int]:
    """Read text[start..] expecting `{` at start; return (inner, end_pos)."""
    assert text[start] == "{"
    depth = 1
    i = start + 1
    while i < len(text) and depth:
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                return text[start + 1 : i], i + 1
        i += 1
    return text[start + 1 :], len(text)


def _next_caption(text: str, after: int) -> tuple[str, int] | None:
    m = re.search(r"\\caption\s*\{", text[after:])
    if not m:
        return None
    abs_brace = after + m.end() - 1
    inner, end = _read_balanced(text, abs_brace)
    return inner, end


def parse_figure_block(block: str) -> tuple[list[dict], str | None]:
    """Return ([{src, caption, alt}], gui_caption)."""
    shots: list[dict] = []
    # Walk subfigure-by-subfigure so each \includegraphics gets paired with its
    # own \caption, no matter how nested the caption braces are.
    sub_re = re.compile(r"\\begin\{subfigure\}", re.DOTALL)
    end_sub_re = re.compile(r"\\end\{subfigure\}", re.DOTALL)
    pos = 0
    matched_subfigure = False
    while True:
        m = sub_re.search(block, pos)
        if not m:
            break
        matched_subfigure = True
        end_m = end_sub_re.search(block, m.end())
        if not end_m:
            break
        chunk = block[m.start() : end_m.end()]
        path_m = re.search(r"\\includegraphics\[[^\]]*\]\{([^}]+)\}", chunk)
        if path_m:
            cap = _next_caption(chunk, path_m.end())
            caption_text = clean_latex(cap[0]) if cap else ""
            shots.append(_resolve_shot(path_m.group(1), caption_text))
        pos = end_m.end()

    if not matched_subfigure:
        # Bare \includegraphics inside figure (no subfigure wrapper).
        for path in re.findall(r"\\includegraphics\[[^\]]*\]\{([^}]+)\}", block):
            shots.append(_resolve_shot(path, ""))

    # The figure-level caption is the LAST \caption in the block (the per-
    # subfigure ones are deeper-nested inside subfigure environments).
    fig_caption = None
    last_caption_pos = block.rfind("\\caption{")
    if last_caption_pos >= 0:
        # Make sure this caption is OUTSIDE any subfigure environment.
        end_of_last_subfig = block.rfind("\\end{subfigure}")
        if end_of_last_subfig < 0 or last_caption_pos > end_of_last_subfig:
            inner, _ = _read_balanced(block, last_caption_pos + len("\\caption"))
            fig_caption = clean_latex(inner)

    return shots, fig_caption


def _resolve_shot(latex_path: str, caption: str) -> dict:
    """Map paper figure path → /env-showcase/<filename>.

    Some paper paths use generic filenames (`result_page.png`) that we
    namespaced when copying. Apply the same namespacing here.
    """
    base = latex_path.split("/")[-1]
    # Mirror the copy script's renames.
    namespace_map = {
        "figure/southwest/env/search_page.png": "southwest-search.png",
        "figure/southwest/env/result_page.png": "southwest-results.png",
        "figure/united/env/main_page.png": "united-main.png",
        "figure/united/env/result_page.png": "united-results.png",
        "figure/enterprise/env/search_page.png": "enterprise-search.png",
        "figure/enterprise/env/result_page.png": "enterprise-results.png",
        "figure/doordash/env/main_page.png": "doordash-main.png",
        "figure/doordash/env/result_page.png": "doordash-results.png",
        "figure/fedex/ui1.png": "fedex-ui1.png",
        "figure/fedex/ui2.png": "fedex-ui2.png",
    }
    if latex_path in namespace_map:
        base = namespace_map[latex_path]
    return {"src": f"/env-showcase/{base}", "caption": caption, "alt": caption}


def strip_tex_comments(text: str) -> str:
    """Drop TeX line comments (`%...`) but keep escaped `\\%`."""
    out: list[str] = []
    for line in text.splitlines():
        # Find first unescaped %
        i = 0
        cut = -1
        while i < len(line):
            if line[i] == "%" and (i == 0 or line[i - 1] != "\\"):
                cut = i
                break
            i += 1
        if cut < 0:
            out.append(line)
        else:
            out.append(line[:cut])
    return "\n".join(out)


def split_subsections(text: str) -> list[tuple[str, str]]:
    """Yield (name, body) pairs in document order, skipping Overview."""
    matches = list(re.finditer(r"^\\subsection\{([^}]+)\}", text, re.MULTILINE))
    out = []
    for i, m in enumerate(matches):
        name = m.group(1).strip()
        body_start = m.end()
        body_end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        if name == "Overview":
            continue
        out.append((name, text[body_start:body_end]))
    return out


def extract_environment(name: str, body: str) -> dict:
    """Build the EnvironmentDoc payload for one subsection."""
    # Pull figures first, then strip them out of the prose.
    figure_blocks = re.findall(
        r"\\begin\{figure\*?\}.*?\\end\{figure\*?\}", body, re.DOTALL
    )
    screenshots: list[dict] = []
    gui_caption: str | None = None
    for fb in figure_blocks:
        shots, cap = parse_figure_block(fb)
        screenshots.extend(shots)
        if cap and not gui_caption:
            gui_caption = cap

    # Remove figures, table inputs, and the GUI/MCP "header" labels.
    prose = body
    prose = re.sub(r"\\begin\{figure\*?\}.*?\\end\{figure\*?\}", "", prose, flags=re.DOTALL)
    prose = re.sub(r"\\begin\{table\*?\}.*?\\end\{table\*?\}", "", prose, flags=re.DOTALL)
    prose = re.sub(r"\\begin\{wrapfigure\}.*?\\end\{wrapfigure\}", "", prose, flags=re.DOTALL)
    prose = re.sub(r"\\input\{[^}]+\}", "", prose)

    cleaned = clean_latex(prose)
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", cleaned) if p.strip()]

    # Drop standalone bold-section markers we already capture structurally.
    paragraphs = [p for p in paragraphs if p not in {"**GUI.**", "**GUI**", "**MCP Tools.**", "**MCP Tools**"}]

    return {
        "slug": slugify(name),
        "name": name,
        "domainKey": DOMAIN_BY_SECTION.get(name, "workflow"),
        "paragraphs": paragraphs,
        "screenshots": screenshots,
        "guiCaption": gui_caption,
    }


def emit_typescript(envs: list[dict]) -> str:
    header = (
        "// AUTO-GENERATED by scripts/build_environments_from_paper.py — do not edit.\n"
        "// Source: /tmp/dt-paper/appendix/environment.tex\n\n"
        "export type EnvironmentScreenshot = {\n"
        "  src: string\n"
        "  caption: string\n"
        "  alt: string\n"
        "}\n\n"
        "export type EnvironmentDoc = {\n"
        "  slug: string\n"
        "  name: string\n"
        "  domainKey: string\n"
        "  paragraphs: string[]\n"
        "  screenshots: EnvironmentScreenshot[]\n"
        "  guiCaption: string | null\n"
        "}\n\n"
        "export const environments: EnvironmentDoc[] = "
    )
    return header + json.dumps(envs, indent=2, ensure_ascii=False) + "\n"


def main() -> int:
    text = strip_tex_comments(PAPER_TEX.read_text())
    envs = []
    for name, body in split_subsections(text):
        env = extract_environment(name, body)
        # Tidy up: replace `null` JS sentinel where guiCaption is None.
        envs.append(env)

    OUT_TS.write_text(emit_typescript(envs))
    print(f"wrote {OUT_TS} with {len(envs)} environments")
    domain_count: dict[str, int] = {}
    for e in envs:
        domain_count[e["domainKey"]] = domain_count.get(e["domainKey"], 0) + 1
    print("by domain:", sorted(domain_count.items()))
    no_shots = [e["name"] for e in envs if not e["screenshots"]]
    if no_shots:
        print("WARN: no screenshots for:", no_shots)
    return 0


if __name__ == "__main__":
    sys.exit(main())

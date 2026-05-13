#!/usr/bin/env python3
"""
Paper-ready version of the safety–capability trade-off scatter plot used
on the DecodingTrust Agent website homepage.

Produces a single figure with two side-by-side panels:
  (left)  Indirect ASR  vs. BSR
  (right) Direct ASR    vs. BSR

Each agent is drawn as a circular logo marker with a small label
underneath. Pareto-optimal points get an emerald ring; the champion
(closest to the "capable & safe" corner) gets a gold ring + crown.

Usage:
    python scripts/plot-tradeoff.py

Outputs:
    scripts/out/tradeoff.pdf
    scripts/out/tradeoff.png

Optional dependencies (graceful fallback if missing):
    cairosvg  – rasterize SVG logos. Without it, markers fall back to
                lettered circles. Install via `pip install cairosvg`.
"""

from __future__ import annotations

import io
from dataclasses import dataclass
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.lines import Line2D
from matplotlib.offsetbox import AnnotationBbox, OffsetImage
from PIL import Image

try:
    import cairosvg  # type: ignore
    HAS_CAIROSVG = True
except Exception:
    HAS_CAIROSVG = False


# ---------------------------------------------------------------------------
# Paths / config
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parent.parent
LOGO_DIR = REPO_ROOT / "frontend" / "public" / "logo"
OUT_DIR = Path(__file__).resolve().parent / "out"
OUT_DIR.mkdir(parents=True, exist_ok=True)

FRAMEWORK_LOGOS = {
    "OpenAI Agents": LOGO_DIR / "framework-openai-agents.svg",
    "Claude Code":   LOGO_DIR / "framework-claude-code.svg",
    "Google ADK":    LOGO_DIR / "framework-google-adk.png",
    "OpenClaw":      LOGO_DIR / "openclaw.svg",
}


# ---------------------------------------------------------------------------
# Data (paper numbers, averaged across 14 domains)
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class AgentPoint:
    framework: str
    model: str
    bsr: float
    indirect_asr: float
    direct_asr: float


POINTS: list[AgentPoint] = [
    AgentPoint("OpenAI Agents", "GPT-5.4",      85.3, 40.0, 51.0),
    AgentPoint("OpenAI Agents", "GPT-5.2",      80.5, 46.7, 58.8),
    AgentPoint("OpenAI Agents", "GPT-OSS-120B", 36.2, 28.5, 46.5),
    AgentPoint("Claude Code",   "Opus-4.6",     85.6,  8.1, 22.3),
    AgentPoint("Claude Code",   "Sonnet-4.5",   80.8, 25.2, 26.9),
    AgentPoint("Google ADK",    "Gemini-3-Pro", 87.0, 55.7, 47.9),
    AgentPoint("OpenClaw",      "Opus-4.6",     85.3, 10.6, 21.4),
    AgentPoint("OpenClaw",      "GPT-5.2",      78.5, 35.6, 38.6),
    AgentPoint("OpenClaw",      "GPT-5.5",          86.3, 17.7, 28.9),
    AgentPoint("OpenClaw",      "DeepSeek-V4-Pro",  83.3, 41.7, 59.6),
]

# Per-point label offsets in *relative* axis coords (fraction of panel span).
# Keys: ("Framework / Model", metric) where metric is "indirect_asr" or "direct_asr".
# Positive dx → right, positive dy → up.
LABEL_OFFSETS: dict[tuple[str, str, str], tuple[float, float]] = {
    # Indirect panel
    ("OpenAI Agents", "GPT-5.4",          "indirect_asr"): (+0.08, -0.05),
    ("OpenAI Agents", "GPT-5.2",          "indirect_asr"): (-0.10, +0.00),
    ("OpenAI Agents", "GPT-OSS-120B",     "indirect_asr"): ( 0.00, -0.11),
    ("Claude Code",   "Opus-4.6",         "indirect_asr"): (-0.10, -0.01),
    ("Claude Code",   "Sonnet-4.5",       "indirect_asr"): (-0.10, +0.00),
    ("Google ADK",    "Gemini-3-Pro",     "indirect_asr"): ( 0.00, +0.08),
    ("OpenClaw",      "Opus-4.6",         "indirect_asr"): (+0.08, -0.02),
    ("OpenClaw",      "GPT-5.2",          "indirect_asr"): (-0.10, -0.02),
    ("OpenClaw",      "GPT-5.5",          "indirect_asr"): (+0.08, +0.02),
    ("OpenClaw",      "DeepSeek-V4-Pro",  "indirect_asr"): (+0.08, +0.03),

    # Direct panel
    ("OpenAI Agents", "GPT-5.4",          "direct_asr"):   (+0.06, +0.05),
    ("OpenAI Agents", "GPT-5.2",          "direct_asr"):   (-0.10, +0.00),
    ("OpenAI Agents", "GPT-OSS-120B",     "direct_asr"):   ( 0.00, -0.11),
    ("Claude Code",   "Opus-4.6",         "direct_asr"):   (-0.06, -0.07),
    ("Claude Code",   "Sonnet-4.5",       "direct_asr"):   (-0.10, +0.00),
    ("Google ADK",    "Gemini-3-Pro",     "direct_asr"):   (+0.08, -0.03),
    ("OpenClaw",      "Opus-4.6",         "direct_asr"):   (+0.08, -0.02),
    ("OpenClaw",      "GPT-5.2",          "direct_asr"):   (-0.10, -0.02),
    ("OpenClaw",      "GPT-5.5",          "direct_asr"):   (+0.08, +0.02),
    ("OpenClaw",      "DeepSeek-V4-Pro",  "direct_asr"):   ( 0.00, +0.08),
}


# ---------------------------------------------------------------------------
# Logo loading (SVG → PNG via cairosvg if available, else lettered circle)
# ---------------------------------------------------------------------------

_logo_cache: dict[str, np.ndarray | None] = {}


def _load_logo(framework: str, pixels: int = 256) -> np.ndarray | None:
    if framework in _logo_cache:
        return _logo_cache[framework]

    path = FRAMEWORK_LOGOS.get(framework)
    img: np.ndarray | None = None
    if path and path.exists():
        suffix = path.suffix.lower()
        try:
            pil = None
            if suffix == ".svg" and HAS_CAIROSVG:
                png_bytes = cairosvg.svg2png(
                    url=str(path),
                    output_width=pixels,
                    output_height=pixels,
                    background_color="rgba(0,0,0,0)",
                )
                pil = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
            elif suffix in (".png", ".jpg", ".jpeg", ".webp"):
                pil = Image.open(path).convert("RGBA")
                pil = pil.resize((pixels, pixels), Image.LANCZOS)

            if pil is not None:
                img = np.asarray(pil) / 255.0
        except Exception as exc:
            print(f"[warn] could not load {path}: {exc}")
            img = None

    _logo_cache[framework] = img
    return img


# ---------------------------------------------------------------------------
# Background gradient
# ---------------------------------------------------------------------------

def _draw_background(ax, x_min, x_max, y_min, y_max):
    """Subtle red (top-left) → green (bottom-right) diagonal wash.

    Mirrors the website's SVG gradient: a gentle linear diagonal plus two
    radial corner halos (rose at top-left, emerald at bottom-right). Kept
    intentionally faint so markers read cleanly over it.
    """
    res = 400
    xs = np.linspace(0.0, 1.0, res)
    ys = np.linspace(0.0, 1.0, res)
    XX, YY = np.meshgrid(xs, ys)

    # Linear diagonal component — concentrated at the corners (mid-plot stays
    # near-neutral, matching the website's 0%→45%→55%→100% gradient stops).
    diag = np.clip((XX + YY) / 2.0, 0.0, 1.0)
    lin_rose = (1.0 - diag) ** 3
    lin_emer = diag ** 3

    # Radial halos anchored in opposite corners to reinforce the signal.
    rose_halo = np.clip(1.0 - np.sqrt(XX ** 2 + YY ** 2) / 0.80, 0.0, 1.0) ** 2
    emer_halo = np.clip(1.0 - np.sqrt((1.0 - XX) ** 2 + (1.0 - YY) ** 2) / 0.80, 0.0, 1.0) ** 2

    rose = np.array([244, 63, 94]) / 255.0
    emerald = np.array([16, 185, 129]) / 255.0

    rose_w = np.clip(lin_rose * 0.22 + rose_halo * 0.14, 0.0, 0.35)
    emer_w = np.clip(lin_emer * 0.26 + emer_halo * 0.18, 0.0, 0.42)

    rgba = np.zeros((res, res, 4))
    rgba[..., 3] = 1.0
    rgba[..., 0] = 1.0 - rose_w * (1 - rose[0]) - emer_w * (1 - emerald[0])
    rgba[..., 1] = 1.0 - rose_w * (1 - rose[1]) - emer_w * (1 - emerald[1])
    rgba[..., 2] = 1.0 - rose_w * (1 - rose[2]) - emer_w * (1 - emerald[2])

    ax.imshow(
        rgba,
        extent=(x_min, x_max, y_min, y_max),
        aspect="auto",
        origin="upper",
        zorder=0,
        interpolation="bilinear",
    )


# ---------------------------------------------------------------------------
# Champion (best BSR − ASR trade-off)
# ---------------------------------------------------------------------------

def _champion_key(points: list[tuple[str, float, float]]) -> str | None:
    if not points:
        return None
    return max(points, key=lambda p: p[1] - p[2])[0]


# ---------------------------------------------------------------------------
# Marker drawing
# ---------------------------------------------------------------------------

def _draw_marker(ax, x, y, logo_img, initial, radius_px=7, rings=None):
    """Draw a marker with optional concentric rings.

    `rings` is a list of (color, width) tuples, drawn from inner to outer.
    """
    # Soft shadow under the marker
    ax.scatter(
        [x], [y],
        s=(radius_px * 2 + 4) ** 2,
        c="black",
        alpha=0.08,
        linewidths=0,
        zorder=2.8,
    )

    # White fill background circle
    ax.scatter(
        [x], [y],
        s=(radius_px * 2) ** 2,
        c="white",
        edgecolor="#d4d8de",
        linewidths=0.5,
        zorder=3,
    )

    # Concentric rings outside the white circle.
    if rings:
        outer_px = radius_px
        for color, width in rings:
            outer_px += width + 1.2  # stack each successive ring further out
            ax.scatter(
                [x], [y],
                s=(outer_px * 2) ** 2,
                facecolors="none",
                edgecolors=color,
                linewidths=width,
                zorder=3.1,
            )

    if logo_img is not None:
        # Logo fills ~75% of marker diameter (matches website's h-3/4 w-3/4)
        im = OffsetImage(logo_img, zoom=(radius_px * 0.75) / 96.0)
        ab = AnnotationBbox(
            im, (x, y),
            frameon=False,
            pad=0,
            box_alignment=(0.5, 0.5),
            zorder=3.5,
        )
        ax.add_artist(ab)
    else:
        ax.text(
            x, y, initial,
            ha="center", va="center",
            fontsize=8, fontweight="bold",
            color="#1f2937",
            zorder=3.5,
        )


def _draw_label(ax, x, y, primary, secondary,
                x_min, x_max, y_min, y_max,
                dx_frac=0.0, dy_frac=-0.07, draw_leader=True):
    """Place a label at (x + dx, y + dy). dx/dy given as panel-span fractions.

    Emulates the website's translucent rounded "card" below each marker.
    When offset, a thin leader line connects the marker to its label.
    """
    x_span = x_max - x_min
    y_span = y_max - y_min
    lx = x + dx_frac * x_span
    ly = y + dy_frac * y_span

    # Decide alignment based on offset direction
    if dx_frac > 0.05:
        ha = "left"
    elif dx_frac < -0.05:
        ha = "right"
    else:
        ha = "center"

    if dy_frac > 0.03:
        va = "bottom"
        # Label sits above the marker: primary on top, secondary directly below it.
        secondary_y = ly
        primary_y = ly + 0.048 * y_span
    elif dy_frac < -0.03:
        va = "top"
        primary_y = ly
        secondary_y = ly - 0.048 * y_span
    else:
        va = "center"
        primary_y = ly + 0.024 * y_span
        secondary_y = ly - 0.024 * y_span

    # Thin leader line from marker to label (only when clearly offset)
    if draw_leader and (abs(dx_frac) >= 0.03 or abs(dy_frac) >= 0.05):
        ax.plot(
            [x, lx], [y, ly + (0.006 * y_span if dy_frac >= 0 else -0.006 * y_span)],
            color="#94a3b8",
            linewidth=0.4,
            alpha=0.6,
            zorder=1.8,
        )

    ax.text(
        lx, primary_y,
        primary,
        ha=ha, va=va,
        fontsize=8.6,
        color="#1f2937",
        zorder=4,
    )
    ax.text(
        lx, secondary_y,
        secondary,
        ha=ha, va=va,
        fontsize=7.6,
        color="#64748b",
        zorder=4,
    )


# ---------------------------------------------------------------------------
# Single-panel renderer
# ---------------------------------------------------------------------------

def _render_panel(ax, points: list[AgentPoint], asr_attr: str, title: str):
    data = [
        (f"{p.framework}::{p.model}", p.bsr, getattr(p, asr_attr), p)
        for p in points
    ]

    bsrs = [d[1] for d in data]
    asrs = [d[2] for d in data]
    x_min_raw, x_max_raw = min(bsrs), max(bsrs)
    y_min_raw, y_max_raw = min(asrs), max(asrs)
    x_pad = max((x_max_raw - x_min_raw) * 0.18, 6)
    y_pad = max((y_max_raw - y_min_raw) * 0.22, 6)
    x_min = max(0, np.floor((x_min_raw - x_pad) / 5) * 5)
    x_max = min(100, np.ceil((x_max_raw + x_pad) / 5) * 5)
    y_min = max(0, np.floor((y_min_raw - y_pad) / 5) * 5)
    y_max = min(100, np.ceil((y_max_raw + y_pad) / 5) * 5)

    ax.set_xlim(x_min, x_max)
    ax.set_ylim(y_min, y_max)

    _draw_background(ax, x_min, x_max, y_min, y_max)

    ax.grid(True, color="#cbd5e1", linewidth=0.4, linestyle=(0, (1, 3)), alpha=0.7)
    ax.set_axisbelow(True)

    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    axis_grey = "#cbd5e1"
    for side in ("left", "bottom"):
        ax.spines[side].set_linewidth(1.6)
        ax.spines[side].set_color(axis_grey)
        ax.spines[side].set_alpha(0.85)
    ax.tick_params(axis="both", labelsize=8, colors="#64748b",
                   width=1.0, length=4)

    # Directional arrowheads at the end of each axis (→ on x, ↑ on y).
    # Drawn with annotate() in axes-fraction coords so they sit exactly on the spine.
    arrow_kwargs = dict(
        xycoords="axes fraction",
        textcoords="axes fraction",
        arrowprops=dict(
            arrowstyle="-|>,head_length=0.5,head_width=0.28",
            color=axis_grey,
            alpha=0.85,
            linewidth=1.6,
            shrinkA=0, shrinkB=0,
        ),
        annotation_clip=False,
    )
    # X-axis arrow: extends right past the spine's end
    ax.annotate("", xy=(1.015, 0), xytext=(0.998, 0), **arrow_kwargs)
    # Y-axis arrow: extends up past the spine's top
    ax.annotate("", xy=(0, 1.02), xytext=(0, 0.998), **arrow_kwargs)

    ax.set_xlabel("Benign Task Success Rate (%)",
                  fontsize=12, color="#1f2937", labelpad=6)
    ax.set_ylabel(f"{title} (%)",
                  fontsize=12, color="#1f2937", labelpad=6)

    simple = [(k, b, a) for (k, b, a, _) in data]
    champion = _champion_key(simple)

    y_span = y_max - y_min

    max_bsr_val = max(b for (_, b, _) in simple)
    max_asr_val = max(a for (_, _, a) in simple)

    # Draw the champion last so its marker sits on top of any overlapping
    # points (e.g. Claude Code Opus-4.6 over OpenClaw Opus-4.6 in indirect).
    data_ordered = sorted(data, key=lambda d: d[0] == champion)

    for (key, bsr, asr, p) in data_ordered:
        logo = _load_logo(p.framework)
        is_champion = key == champion
        is_max_bsr = bsr == max_bsr_val
        is_max_asr = asr == max_asr_val

        # Stack rings from inner → outer. Champion (amber) is innermost
        # when it coincides with any other highlight.
        rings: list[tuple[str, float]] = []
        if is_champion:
            rings.append(("#f59e0b", 2.0))
        if is_max_asr:
            rings.append(("#ef4444", 1.6))
        if is_max_bsr:
            rings.append(("#10b981", 1.6))

        _draw_marker(
            ax, bsr, asr, logo, p.framework[:1],
            radius_px=9,
            rings=rings,
        )

        dx_frac, dy_frac = LABEL_OFFSETS.get(
            (p.framework, p.model, asr_attr),
            (0.0, -0.08),
        )
        _draw_label(
            ax, bsr, asr, p.framework, p.model,
            x_min, x_max, y_min, y_max,
            dx_frac=dx_frac, dy_frac=dy_frac,
        )

        if is_champion:
            ax.text(
                bsr + 0.035 * (x_max - x_min), asr,
                r"$\bigstar$",
                ha="left", va="center",
                fontsize=13,
                color="#f59e0b",
                zorder=4,
            )

    x_span = x_max - x_min
    ax.text(
        x_min + 0.02 * x_span, y_max - 0.02 * y_span,
        "VULNERABLE & INCAPABLE",
        ha="left", va="top",
        fontsize=9.5,
        color="#e11d48",
        alpha=0.85,
        zorder=2,
    )
    ax.text(
        x_max - 0.02 * x_span, y_min + 0.01 * y_span,
        "ROBUST & CAPABLE",
        ha="right", va="bottom",
        fontsize=9.5,
        color="#059669",
        alpha=0.9,
        zorder=2,
    )


# ---------------------------------------------------------------------------
# Figure orchestration
# ---------------------------------------------------------------------------

def build_figure():
    plt.rcParams.update({
        "font.family": "sans-serif",
        "font.sans-serif": ["DejaVu Sans"],
        "mathtext.fontset": "dejavusans",
        "pdf.fonttype": 42,
        "ps.fonttype": 42,
    })

    fig, (ax_indirect, ax_direct) = plt.subplots(
        1, 2,
        figsize=(11.0, 4.0),
        gridspec_kw={"wspace": 0.18},
    )

    _render_panel(ax_indirect, POINTS, "indirect_asr", "Indirect Attack Success Rate")
    _render_panel(ax_direct, POINTS, "direct_asr", "Direct Attack Success Rate")

    ax_indirect.set_title("(a) Indirect Threat Model (Environment, Tool, Skill, Comb.)",
                          fontsize=11, color="#111827", pad=8)
    ax_direct.set_title("(b) Direct Threat Model", fontsize=11,
                        color="#111827", pad=8)

    ring_legend = [
        Line2D([0], [0], marker="o", color="none",
               markerfacecolor="white", markeredgecolor="#ef4444",
               markeredgewidth=1.8, markersize=10,
               label="Most vulnerable (highest attack success rate)"),
        Line2D([0], [0], marker="o", color="none",
               markerfacecolor="white", markeredgecolor="#10b981",
               markeredgewidth=1.8, markersize=10,
               label="Most capable (highest benign success rate)"),
        Line2D([0], [0], marker="o", color="none",
               markerfacecolor="white", markeredgecolor="#f59e0b",
               markeredgewidth=2.0, markersize=10,
               label="Best trade-off (champion)"),
    ]
    fig.legend(
        handles=ring_legend,
        loc="lower center",
        ncol=3,
        frameon=False,
        fontsize=9,
        handletextpad=0.4,
        columnspacing=1.8,
        bbox_to_anchor=(0.5, -0.015),
    )

    fig.subplots_adjust(left=0.055, right=0.99, top=0.92, bottom=0.18)
    return fig


def main():
    fig = build_figure()

    pdf_path = OUT_DIR / "tradeoff.pdf"
    png_path = OUT_DIR / "tradeoff.png"

    fig.savefig(pdf_path, bbox_inches="tight", pad_inches=0.05)
    fig.savefig(png_path, bbox_inches="tight", pad_inches=0.05, dpi=320)
    plt.close(fig)

    print(f"Saved {pdf_path}")
    print(f"Saved {png_path}")
    if not HAS_CAIROSVG:
        print("[info] cairosvg is not installed — SVG framework logos were "
              "skipped (only PNG logos load). Install via "
              "`pip install cairosvg` to get every logo.")


if __name__ == "__main__":
    main()

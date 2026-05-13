#!/usr/bin/env python3
"""
t-SNE plot of AgentDojo (changdae/agentdojo-trajectories-qwen35-gemma4)
trajectories, using the same embedding + reduction pipeline as
plot-trajectory-tsne.py so the two plots are directly comparable.

AgentDojo layout
----------------
    <model>/<suite>/<task_kind>_<id>/<attack_type>/<injection_or_none>.json

    model:        Gemma-4-E4B-it | Qwen3.5-9B
    suite:        banking | slack | travel | workspace   (treated as "domain")
    task_kind:    user_task | injection_task
    attack_type:  none | important_instructions

Each JSON has a `messages` list (OpenAI/Anthropic-style), `suite_name`,
`user_task_id`, `injection_task_id`, plus `utility` / `security` flags.

We build the same TASK/TOOLS/ACTIONS/FINAL summary as the DT script and
feed it through the same TF-IDF + TruncatedSVD + t-SNE stack.

Usage
-----
    # one panel per model, coloured by suite
    python scripts/plot-agentdojo-tsne.py

    # restrict to one model
    python scripts/plot-agentdojo-tsne.py --model Gemma-4-E4B-it

    # subsample (per model x suite cap)
    python scripts/plot-agentdojo-tsne.py --max 200

    # comparison figure: DT (one agent) and AgentDojo, same axes per panel
    python scripts/plot-agentdojo-tsne.py --compare-with claudesdk
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import os
import random
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
AGENTDOJO_ROOT = REPO_ROOT / "backend" / "data" / "agentdojo-raw"
OUT_DIR = REPO_ROOT / "scripts" / "out"


# ---------------------------------------------------------------------------
# Reuse helpers from plot-trajectory-tsne.py (filename has a hyphen, so import
# by path).
# ---------------------------------------------------------------------------

def _load_dt_module():
    spec = importlib.util.spec_from_file_location(
        "plot_trajectory_tsne",
        REPO_ROOT / "scripts" / "plot-trajectory-tsne.py",
    )
    mod = importlib.util.module_from_spec(spec)
    sys.modules["plot_trajectory_tsne"] = mod
    spec.loader.exec_module(mod)
    return mod


# ---------------------------------------------------------------------------
# AgentDojo record
# ---------------------------------------------------------------------------

@dataclass
class ADRecord:
    path: Path
    model: str       # Gemma-4-E4B-it / Qwen3.5-9B
    suite: str       # banking / slack / travel / workspace
    task_kind: str   # user_task / injection_task
    attack_type: str # none / important_instructions
    task_id: str     # path under <model>/<suite>/

    @property
    def is_attack(self) -> bool:
        return self.attack_type != "none"


def collect_agentdojo(root: Path, models: list[str] | None = None) -> list[ADRecord]:
    if not root.is_dir():
        sys.exit(f"AgentDojo root not found: {root}")
    out: list[ADRecord] = []
    for model in sorted(os.listdir(root)):
        mdir = root / model
        if not mdir.is_dir() or model.startswith("."):
            continue
        if models and model not in models:
            continue
        for suite in sorted(os.listdir(mdir)):
            sdir = mdir / suite
            if not sdir.is_dir():
                continue
            for dirpath, _, filenames in os.walk(sdir):
                for f in filenames:
                    if not f.endswith(".json"):
                        continue
                    rel = os.path.relpath(os.path.join(dirpath, f), sdir)
                    parts = rel.split(os.sep)
                    if len(parts) < 3:
                        continue
                    task_kind_id, attack_type = parts[0], parts[1]
                    task_kind = "injection_task" if task_kind_id.startswith("injection_task") else "user_task"
                    out.append(ADRecord(
                        path=Path(dirpath) / f,
                        model=model,
                        suite=suite,
                        task_kind=task_kind,
                        attack_type=attack_type,
                        task_id=rel,
                    ))
    return out


# ---------------------------------------------------------------------------
# Trajectory -> compact text summary (mirrors DT format)
# ---------------------------------------------------------------------------

def _flatten_content(content) -> str:
    """AgentDojo content is sometimes a string, sometimes a list of {type, content}."""
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        out = []
        for c in content:
            if isinstance(c, dict):
                t = c.get("type")
                if t == "text":
                    out.append(str(c.get("content", "")))
                else:
                    out.append(json.dumps(c)[:200])
            else:
                out.append(str(c))
        return " ".join(out)
    return json.dumps(content)[:400]


def agentdojo_to_text(rec: ADRecord, dt_mod) -> str:
    try:
        with open(rec.path, "r", encoding="utf-8", errors="replace") as fh:
            d = json.load(fh)
    except Exception:
        return ""

    parts: list[str] = []
    msgs = d.get("messages") or []

    # TASK: first user message
    for m in msgs:
        if m.get("role") == "user":
            parts.append("TASK: " + dt_mod._shorten(_flatten_content(m.get("content")), 400))
            break

    # TOOLS sequence + ACTIONS (assistant tool_calls + assistant text)
    tools: list[str] = []
    actions: list[str] = []
    final_text = ""
    for m in msgs:
        role = m.get("role")
        if role == "assistant":
            tcs = m.get("tool_calls") or []
            for tc in tcs:
                fn = tc.get("function") if isinstance(tc, dict) else None
                if isinstance(fn, dict):
                    fn = fn.get("name")
                if fn:
                    tools.append(str(fn))
                args = tc.get("args") if isinstance(tc, dict) else None
                if args is not None:
                    actions.append(f"{fn}({json.dumps(args, ensure_ascii=False)[:160]})")
            txt = _flatten_content(m.get("content"))
            if txt:
                # the *last* assistant text message becomes FINAL
                final_text = txt

    if tools:
        parts.append("TOOLS: " + " > ".join(tools[:40]))
    if actions:
        parts.append("ACTIONS: " + " | ".join(dt_mod._shorten(a, 200) for a in actions[:20]))
    if final_text:
        parts.append("FINAL: " + dt_mod._shorten(final_text, 400))

    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Plotting
# ---------------------------------------------------------------------------

def label_value(rec: ADRecord, color_by: str) -> str:
    if color_by == "suite":
        return rec.suite
    if color_by == "type":
        return "injected" if rec.is_attack else "benign"
    if color_by == "model":
        return rec.model
    raise ValueError(color_by)


def subsample_per_bucket(records, cap: int, seed: int):
    if cap <= 0:
        return records
    rng = random.Random(seed)
    buckets: dict[tuple, list] = {}
    for r in records:
        buckets.setdefault((r.model, r.suite), []).append(r)
    out: list = []
    for k, group in buckets.items():
        if len(group) > cap:
            out.extend(rng.sample(group, cap))
        else:
            out.extend(group)
    return out


def plot_agentdojo(records, dt_mod, color_by: str, out_base: Path, perplexity: float, seed: int):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from matplotlib.lines import Line2D

    print(f"  embedding {len(records)} trajectories (TF-IDF + SVD)")
    texts = [agentdojo_to_text(r, dt_mod) for r in records]
    keep = [(t, r) for t, r in zip(texts, records) if t]
    texts = [t for t, _ in keep]
    records = [r for _, r in keep]
    X = dt_mod.embed_tfidf(texts)

    models = sorted({r.model for r in records})
    n = len(models)
    cols = min(2, n)
    rows = (n + cols - 1) // cols
    fig, axes = plt.subplots(rows, cols, figsize=(6.5 * cols, 6 * rows), squeeze=False)

    all_uniq, all_colors = [], {}
    for i, model in enumerate(models):
        idx = [j for j, r in enumerate(records) if r.model == model]
        sub_X = X[idx]
        sub_records = [records[j] for j in idx]
        coords = dt_mod.run_tsne(sub_X, perplexity, seed)
        labels = [label_value(r, color_by) for r in sub_records]
        ax = axes[i // cols][i % cols]
        uniq, colors = dt_mod.plot_panel(ax, coords, labels, f"{model}  (n={len(sub_records)})")
        for u, c in colors.items():
            if u not in all_colors:
                all_colors[u] = c
                all_uniq.append(u)

    for j in range(n, rows * cols):
        axes[j // cols][j % cols].axis("off")

    handles = [Line2D([0], [0], marker="o", linestyle="",
                      markerfacecolor=all_colors[u], markeredgecolor="none",
                      markersize=7, label=u)
               for u in sorted(all_uniq)]
    fig.legend(handles=handles, loc="center right",
               bbox_to_anchor=(1.0, 0.5),
               frameon=False, fontsize=9, title=color_by)
    fig.suptitle(f"AgentDojo trajectory t-SNE — coloured by {color_by}", fontsize=14)
    fig.tight_layout(rect=(0, 0, 0.86, 0.96))
    fig.savefig(out_base.with_suffix(".png"), dpi=200, bbox_inches="tight")
    fig.savefig(out_base.with_suffix(".pdf"), bbox_inches="tight")
    print(f"  wrote {out_base.with_suffix('.png').name} and {out_base.with_suffix('.pdf').name}")


def plot_compare(dt_records, dt_texts, ad_records, ad_texts, dt_mod, out_base: Path,
                 perplexity: float, seed: int):
    """Side-by-side: DT (one agent) and AgentDojo, t-SNE on each independently."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from matplotlib.lines import Line2D

    print(f"  embedding DT n={len(dt_texts)} and AgentDojo n={len(ad_texts)}")
    dt_X = dt_mod.embed_tfidf(dt_texts)
    ad_X = dt_mod.embed_tfidf(ad_texts)
    dt_coords = dt_mod.run_tsne(dt_X, perplexity, seed)
    ad_coords = dt_mod.run_tsne(ad_X, perplexity, seed)

    fig, axes = plt.subplots(1, 2, figsize=(14, 6.5))
    dt_labels = [r.label_domain for r in dt_records]
    ad_labels = [r.suite for r in ad_records]
    dt_uniq, dt_colors = dt_mod.plot_panel(axes[0], dt_coords, dt_labels,
        f"DecodingTrust-Agent  ({dt_records[0].agent},  n={len(dt_records)},  13 domains)")
    ad_uniq, ad_colors = dt_mod.plot_panel(axes[1], ad_coords, ad_labels,
        f"AgentDojo  (Gemma + Qwen,  n={len(ad_records)},  4 suites)")

    for ax, uniq, colors, title in [
        (axes[0], dt_uniq, dt_colors, "domain"),
        (axes[1], ad_uniq, ad_colors, "suite"),
    ]:
        handles = [Line2D([0], [0], marker="o", linestyle="",
                          markerfacecolor=colors[u], markeredgecolor="none",
                          markersize=7, label=u)
                   for u in uniq]
        ax.legend(handles=handles, loc="center left", bbox_to_anchor=(1.02, 0.5),
                  frameon=False, fontsize=8, title=title)
    fig.suptitle("Trajectory diversity: DecodingTrust-Agent vs AgentDojo", fontsize=14)
    fig.tight_layout()
    fig.savefig(out_base.with_suffix(".png"), dpi=200, bbox_inches="tight")
    fig.savefig(out_base.with_suffix(".pdf"), bbox_inches="tight")
    print(f"  wrote {out_base.with_suffix('.png').name} and {out_base.with_suffix('.pdf').name}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", default=str(AGENTDOJO_ROOT),
                    help="local path to the downloaded AgentDojo dataset")
    ap.add_argument("--model", action="append", help="restrict to model dir(s); default: all")
    ap.add_argument("--color-by", default="suite", choices=["suite", "type", "model"])
    ap.add_argument("--max", type=int, default=0, help="cap per (model, suite) bucket; 0 = no cap")
    ap.add_argument("--perplexity", type=float, default=30.0)
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--out", help="output path (no extension); default scripts/out/tsne-agentdojo-<color>")
    ap.add_argument("--compare-with", help="DT agent name (e.g. claudesdk) — produce side-by-side figure")
    ap.add_argument("--compare-max", type=int, default=300,
                    help="per-bucket cap for both datasets in the compare plot")
    args = ap.parse_args()

    dt_mod = _load_dt_module()

    print(f"[1/3] scanning AgentDojo trajectories under {args.root}")
    records = collect_agentdojo(Path(args.root), args.model)
    if not records:
        print("no AgentDojo trajectories found", file=sys.stderr)
        return 1
    print(f"      found {len(records)} files / "
          f"{len({r.model for r in records})} models / "
          f"{len({r.suite for r in records})} suites")

    if args.max:
        before = len(records)
        records = subsample_per_bucket(records, args.max, args.seed)
        print(f"      subsampled {before} -> {len(records)} (cap {args.max} per model×suite)")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    if args.compare_with:
        # Build DT side
        print(f"[2/3] collecting DT trajectories for agent={args.compare_with}")
        dt_records = dt_mod.collect_trajectories([args.compare_with], None)
        dt_records = dt_mod.subsample(dt_records, args.compare_max, args.seed)
        ad_records = subsample_per_bucket(records, args.compare_max, args.seed) if not args.max else records
        print(f"      DT n={len(dt_records)}  AD n={len(ad_records)}")

        # Build texts
        dt_texts, dt_keep = [], []
        for r in dt_records:
            t = dt_mod.trajectory_to_text(r)
            if t:
                dt_texts.append(t); dt_keep.append(r)
        ad_texts, ad_keep = [], []
        for r in ad_records:
            t = agentdojo_to_text(r, dt_mod)
            if t:
                ad_texts.append(t); ad_keep.append(r)

        out = Path(args.out) if args.out else OUT_DIR / f"tsne-compare-{args.compare_with}-vs-agentdojo"
        if not out.is_absolute():
            out = REPO_ROOT / out
        print("[3/3] running t-SNE & plotting")
        plot_compare(dt_keep, dt_texts, ad_keep, ad_texts, dt_mod, out, args.perplexity, args.seed)
        return 0

    out = Path(args.out) if args.out else OUT_DIR / f"tsne-agentdojo-{args.color_by}"
    if not out.is_absolute():
        out = REPO_ROOT / out
    print("[2/3] embedding + plotting")
    plot_agentdojo(records, dt_mod, args.color_by, out, args.perplexity, args.seed)
    return 0


if __name__ == "__main__":
    sys.exit(main())

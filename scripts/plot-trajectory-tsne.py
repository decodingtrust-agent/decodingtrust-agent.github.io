#!/usr/bin/env python3
"""
t-SNE plot of trajectory embeddings for a given agent across all tasks.

For each trajectory JSON under
    backend/data/trajectories/<domain>/<agent>/<model>/<domain>/...
we build a textual summary (task + actions + tool calls + final response),
embed it, run t-SNE, and produce a scatter plot. Each dot is one trajectory
(one (task, model) run); colours encode the chosen label (domain by default).

The goal is to visualise the *diversity* of behaviours an agent produces
across the benchmark — pick the most-spread-out plots to feature.

Usage
-----
    # one agent, coloured by domain
    python scripts/plot-trajectory-tsne.py --agent claudesdk

    # filter to a single domain, colour by malicious/benign and category
    python scripts/plot-trajectory-tsne.py --agent openaisdk \
        --domain browser --color-by category

    # 2x2 grid for all four agents (one figure)
    python scripts/plot-trajectory-tsne.py --all

    # subsample to keep things fast
    python scripts/plot-trajectory-tsne.py --agent googleadk --max 800

Embedding backend
-----------------
By default uses TF-IDF (sklearn) which has no model download. Pass
`--backend st` to use sentence-transformers (better semantic structure)
if it is installed.

Outputs land in scripts/out/.
"""

from __future__ import annotations

import argparse
import json
import os
import random
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

REPO_ROOT = Path(__file__).resolve().parent.parent
TRAJ_ROOT = REPO_ROOT / "backend" / "data" / "trajectories"
OUT_DIR = REPO_ROOT / "scripts" / "out"

KNOWN_AGENTS = ["claudesdk", "googleadk", "openaisdk", "openclaw"]


# ---------------------------------------------------------------------------
# Trajectory enumeration
# ---------------------------------------------------------------------------

@dataclass
class TrajRecord:
    path: Path
    domain: str
    agent: str
    model: str
    task_type: str        # "benign" | "direct" | "indirect"
    category: str         # risk_category for malicious; "benign" otherwise
    task_id: str          # relative path under <inner>/

    @property
    def label_domain(self) -> str:
        return self.domain

    @property
    def label_type(self) -> str:
        return self.task_type

    @property
    def label_category(self) -> str:
        return f"{self.task_type}/{self.category}" if self.task_type != "benign" else "benign"

    @property
    def label_agent(self) -> str:
        return self.agent


def _classify_relpath(rel: str) -> tuple[str, str]:
    parts = rel.split(os.sep)
    if not parts:
        return ("benign", "benign")
    if parts[0] == "benign":
        return ("benign", "benign")
    if parts[0] == "malicious" and len(parts) >= 3:
        return (parts[1], parts[2])  # direct/<cat> or indirect/<cat>
    return ("other", parts[0])


def _agent_model_dirs(domain: str) -> Iterable[tuple[str, Path]]:
    """Yield (agent_label, agent_root) tuples for a domain.

    customer-service has an extra bucket layer (benchmark/direct_prompt) above
    the agent dirs; we flatten that into the agent label so everything
    downstream is uniform.
    """
    domain_dir = TRAJ_ROOT / domain
    if not domain_dir.is_dir():
        return
    if domain == "customer-service":
        for bucket in sorted(os.listdir(domain_dir)):
            bdir = domain_dir / bucket
            if not bdir.is_dir():
                continue
            for agent in sorted(os.listdir(bdir)):
                adir = bdir / agent
                if adir.is_dir():
                    yield (agent, adir)  # collapse bucket; multiple buckets stack onto same agent
    else:
        for agent in sorted(os.listdir(domain_dir)):
            adir = domain_dir / agent
            if adir.is_dir():
                yield (agent, adir)


def collect_trajectories(
    agents: list[str] | None,
    domains: list[str] | None,
) -> list[TrajRecord]:
    if not TRAJ_ROOT.is_dir():
        sys.exit(f"trajectories root not found: {TRAJ_ROOT}")

    all_domains = sorted(d for d in os.listdir(TRAJ_ROOT) if (TRAJ_ROOT / d).is_dir())
    use_domains = [d for d in all_domains if (not domains or d in domains)]

    out: list[TrajRecord] = []
    for dom in use_domains:
        for agent_label, agent_root in _agent_model_dirs(dom):
            if agents and agent_label not in agents:
                continue
            for model in sorted(os.listdir(agent_root)):
                model_dir = agent_root / model
                if not model_dir.is_dir():
                    continue
                inner = model_dir / dom
                if not inner.is_dir():
                    subs = [d for d in os.listdir(model_dir) if (model_dir / d).is_dir()]
                    if len(subs) == 1:
                        inner = model_dir / subs[0]
                    else:
                        continue
                for dirpath, _, filenames in os.walk(inner):
                    traj_files = [f for f in filenames
                                  if f.endswith(".json") and f != "judge_result.json"]
                    if not traj_files:
                        continue
                    rel = os.path.relpath(dirpath, inner)
                    task_type, category = _classify_relpath(rel)
                    # one TrajRecord per trajectory file (usually 1 per task dir)
                    for f in sorted(traj_files):
                        out.append(TrajRecord(
                            path=Path(dirpath) / f,
                            domain=dom,
                            agent=agent_label,
                            model=model,
                            task_type=task_type,
                            category=category,
                            task_id=rel,
                        ))
    return out


# ---------------------------------------------------------------------------
# Trajectory -> text
# ---------------------------------------------------------------------------

_WS_RE = re.compile(r"\s+")


def _shorten(s: str, n: int = 600) -> str:
    s = _WS_RE.sub(" ", s).strip()
    return s if len(s) <= n else s[:n]


def trajectory_to_text(rec: TrajRecord) -> str:
    """Produce a compact text summary of a trajectory for embedding.

    We capture: original task instruction, the sequence of agent actions
    (incl. tool name + truncated args), and the agent's final response.
    """
    try:
        with open(rec.path, "r", encoding="utf-8", errors="replace") as fh:
            data = json.load(fh)
    except Exception:
        return ""

    parts: list[str] = []

    task = data.get("task_info") or {}
    instr = task.get("original_instruction") or task.get("malicious_instruction") or ""
    if instr:
        parts.append("TASK: " + _shorten(str(instr), 400))

    traj = data.get("trajectory") or []
    actions: list[str] = []
    tool_seq: list[str] = []
    for step in traj:
        if not isinstance(step, dict):
            continue
        role = step.get("role")
        if role == "agent":
            md = step.get("metadata") or {}
            tool = md.get("tool_name")
            if tool:
                tool_seq.append(str(tool))
            action = step.get("action") or ""
            if action:
                actions.append(_shorten(str(action), 200))
        elif role == "user" and not instr:
            state = step.get("state")
            if state:
                parts.append("TASK: " + _shorten(str(state), 400))

    if tool_seq:
        parts.append("TOOLS: " + " > ".join(tool_seq[:40]))
    if actions:
        parts.append("ACTIONS: " + " | ".join(actions[:20]))

    info = data.get("traj_info") or {}
    final = info.get("agent_final_response")
    if final:
        parts.append("FINAL: " + _shorten(str(final), 400))

    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Embedding backends
# ---------------------------------------------------------------------------

def embed_tfidf(texts: list[str]):
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.decomposition import TruncatedSVD

    vec = TfidfVectorizer(
        max_features=20000,
        ngram_range=(1, 2),
        min_df=2,
        sublinear_tf=True,
    )
    X = vec.fit_transform(texts)
    n_components = min(128, X.shape[1] - 1, max(2, X.shape[0] - 1))
    if n_components >= 2:
        svd = TruncatedSVD(n_components=n_components, random_state=0)
        X = svd.fit_transform(X)
    else:
        X = X.toarray()
    return X


def embed_st(texts: list[str], model_name: str):
    from sentence_transformers import SentenceTransformer

    model = SentenceTransformer(model_name)
    return model.encode(
        texts,
        batch_size=64,
        show_progress_bar=True,
        convert_to_numpy=True,
        normalize_embeddings=True,
    )


# ---------------------------------------------------------------------------
# t-SNE + plotting
# ---------------------------------------------------------------------------

def run_tsne(X, perplexity: float, seed: int):
    from sklearn.manifold import TSNE

    n = X.shape[0]
    perp = min(perplexity, max(5.0, (n - 1) / 3.0))
    tsne = TSNE(
        n_components=2,
        perplexity=perp,
        init="pca",
        learning_rate="auto",
        random_state=seed,
        metric="cosine" if X.shape[1] > 32 else "euclidean",
    )
    return tsne.fit_transform(X)


def _palette(labels: list[str]):
    import matplotlib

    def _get_cmap(name: str):
        try:
            return matplotlib.colormaps[name]
        except Exception:
            import matplotlib.cm as cm
            return cm.get_cmap(name)

    uniq = sorted(set(labels))
    n = len(uniq)
    if n <= 10:
        cmap = _get_cmap("tab10")
        colors = {u: cmap(i) for i, u in enumerate(uniq)}
    elif n <= 20:
        cmap = _get_cmap("tab20")
        colors = {u: cmap(i) for i, u in enumerate(uniq)}
    else:
        cmap = _get_cmap("turbo")
        colors = {u: cmap(i / max(1, n - 1)) for i, u in enumerate(uniq)}
    return uniq, colors


def plot_panel(ax, coords, labels: list[str], title: str):
    import numpy as np
    uniq, colors = _palette(labels)
    coords = np.asarray(coords)
    labels_arr = np.asarray(labels)
    for u in uniq:
        mask = labels_arr == u
        ax.scatter(
            coords[mask, 0], coords[mask, 1],
            s=8, alpha=0.7, linewidths=0,
            color=colors[u], label=u,
        )
    ax.set_title(title, fontsize=12)
    ax.set_xticks([])
    ax.set_yticks([])
    for spine in ax.spines.values():
        spine.set_alpha(0.3)
    return uniq, colors


def label_value(rec: TrajRecord, color_by: str) -> str:
    if color_by == "domain":
        return rec.label_domain
    if color_by == "type":
        return rec.label_type
    if color_by == "category":
        return rec.label_category
    if color_by == "agent":
        return rec.label_agent
    raise ValueError(f"unknown color-by: {color_by}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--agent", help=f"agent to plot (one of {KNOWN_AGENTS}); ignored if --all")
    p.add_argument("--all", action="store_true", help="plot all four agents in a 2x2 grid")
    p.add_argument("--domain", action="append", help="restrict to domain (repeatable); default: all")
    p.add_argument("--color-by", default="domain", choices=["domain", "type", "category", "agent"],
                   help="what to colour points by (default: domain)")
    p.add_argument("--backend", default="tfidf", choices=["tfidf", "st"],
                   help="embedding backend (default tfidf; 'st' = sentence-transformers)")
    p.add_argument("--st-model", default="sentence-transformers/all-MiniLM-L6-v2",
                   help="sentence-transformers model id when --backend st")
    p.add_argument("--max", type=int, default=0,
                   help="max trajectories per (agent,domain) bucket; 0 = no cap")
    p.add_argument("--perplexity", type=float, default=30.0)
    p.add_argument("--seed", type=int, default=0)
    p.add_argument("--out", help="output path (without extension); writes .png and .pdf")
    return p


def subsample(records: list[TrajRecord], cap: int, seed: int) -> list[TrajRecord]:
    if cap <= 0:
        return records
    rng = random.Random(seed)
    buckets: dict[tuple[str, str], list[TrajRecord]] = {}
    for r in records:
        buckets.setdefault((r.agent, r.domain), []).append(r)
    kept: list[TrajRecord] = []
    for k, group in buckets.items():
        if len(group) > cap:
            kept.extend(rng.sample(group, cap))
        else:
            kept.extend(group)
    return kept


def encode(texts: list[str], backend: str, st_model: str):
    if backend == "st":
        return embed_st(texts, st_model)
    return embed_tfidf(texts)


def main() -> int:
    args = build_arg_parser().parse_args()

    if not args.all and not args.agent:
        print("error: pass --agent <name> or --all", file=sys.stderr)
        return 2

    target_agents = KNOWN_AGENTS if args.all else [args.agent]
    domains = args.domain or None

    print(f"[1/4] scanning trajectories under {TRAJ_ROOT.relative_to(REPO_ROOT)}")
    records = collect_trajectories(target_agents, domains)
    if not records:
        print("no trajectories matched", file=sys.stderr)
        return 1
    print(f"      found {len(records)} trajectories across "
          f"{len(set(r.domain for r in records))} domains and "
          f"{len(set(r.agent for r in records))} agents")

    if args.max:
        before = len(records)
        records = subsample(records, args.max, args.seed)
        print(f"      subsampled {before} -> {len(records)} (cap {args.max} per agent×domain)")

    print(f"[2/4] reading & summarising trajectories")
    texts: list[str] = []
    keep: list[TrajRecord] = []
    for r in records:
        t = trajectory_to_text(r)
        if t:
            texts.append(t)
            keep.append(r)
    records = keep
    print(f"      {len(records)} non-empty summaries")

    print(f"[3/4] embedding with backend={args.backend}")
    X = encode(texts, args.backend, args.st_model)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_base = Path(args.out) if args.out else (
        OUT_DIR / (
            f"tsne-all-{args.color_by}" if args.all
            else f"tsne-{args.agent}-{args.color_by}"
        )
    )
    if not out_base.is_absolute():
        out_base = REPO_ROOT / out_base

    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    print(f"[4/4] running t-SNE & plotting -> {out_base.with_suffix('.png').relative_to(REPO_ROOT)}")

    if args.all:
        agents_present = [a for a in KNOWN_AGENTS if any(r.agent == a for r in records)]
        n = len(agents_present)
        cols = 2 if n > 1 else 1
        rows = (n + cols - 1) // cols
        fig, axes = plt.subplots(rows, cols, figsize=(6.5 * cols, 6 * rows), squeeze=False)
        all_uniq, all_colors = [], {}
        for i, ag in enumerate(agents_present):
            idx = [j for j, r in enumerate(records) if r.agent == ag]
            sub_X = X[idx]
            sub_records = [records[j] for j in idx]
            coords = run_tsne(sub_X, args.perplexity, args.seed)
            labels = [label_value(r, args.color_by) for r in sub_records]
            ax = axes[i // cols][i % cols]
            uniq, colors = plot_panel(ax, coords, labels, f"{ag}  (n={len(sub_records)})")
            for u, c in colors.items():
                if u not in all_colors:
                    all_colors[u] = c
                    all_uniq.append(u)
        # blank any leftover axes
        for j in range(n, rows * cols):
            axes[j // cols][j % cols].axis("off")
        # one shared legend on the right
        from matplotlib.lines import Line2D
        handles = [Line2D([0], [0], marker="o", linestyle="",
                          markerfacecolor=all_colors[u], markeredgecolor="none",
                          markersize=7, label=u)
                   for u in sorted(all_uniq)]
        fig.legend(handles=handles, loc="center right",
                   bbox_to_anchor=(1.0, 0.5),
                   frameon=False, fontsize=9, title=args.color_by)
        fig.suptitle(f"Trajectory t-SNE — coloured by {args.color_by}", fontsize=14)
        fig.tight_layout(rect=(0, 0, 0.86, 0.96))
    else:
        coords = run_tsne(X, args.perplexity, args.seed)
        labels = [label_value(r, args.color_by) for r in records]
        fig, ax = plt.subplots(figsize=(8, 7))
        uniq, colors = plot_panel(
            ax, coords, labels,
            f"{args.agent}  (n={len(records)})  —  coloured by {args.color_by}",
        )
        from matplotlib.lines import Line2D
        handles = [Line2D([0], [0], marker="o", linestyle="",
                          markerfacecolor=colors[u], markeredgecolor="none",
                          markersize=7, label=u)
                   for u in uniq]
        ax.legend(handles=handles, loc="center left", bbox_to_anchor=(1.02, 0.5),
                  frameon=False, fontsize=9, title=args.color_by)
        fig.tight_layout()

    fig.savefig(out_base.with_suffix(".png"), dpi=200, bbox_inches="tight")
    fig.savefig(out_base.with_suffix(".pdf"), bbox_inches="tight")
    print(f"      wrote {out_base.with_suffix('.png').name} and {out_base.with_suffix('.pdf').name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

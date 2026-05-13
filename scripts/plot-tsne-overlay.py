#!/usr/bin/env python3
"""
Joint t-SNE overlay: DecodingTrust-Agent (cool palette) vs AgentDojo (warm
palette), embedded in the same 2D space so coverage and diversity can be
compared at a glance.

Pipeline
--------
1. Collect DT trajectories (one agent by default) and AgentDojo trajectories.
2. Build TASK/TOOLS/ACTIONS/FINAL text summaries for both — same recipe used
   by plot-trajectory-tsne.py and plot-agentdojo-tsne.py.
3. Concatenate the two corpora and fit a *single* TF-IDF + TruncatedSVD →
   t-SNE pipeline on them, so both datasets share an embedding space.
4. Plot one figure: DT points coloured per domain in cool hues
   (cyan → blue → purple), AgentDojo points coloured per suite in warm
   hues (red → orange → yellow). Two grouped legends.

Usage
-----
    # default: claudesdk + AgentDojo, ~300/bucket cap
    python scripts/plot-tsne-overlay.py

    # different DT agent
    python scripts/plot-tsne-overlay.py --dt-agent openclaw

    # change caps
    python scripts/plot-tsne-overlay.py --dt-max 200 --ad-max 200

Outputs go to scripts/out/tsne-overlay-<dt-agent>.{png,pdf}.
"""

from __future__ import annotations

import argparse
import colorsys
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = REPO_ROOT / "scripts" / "out"
CACHE_DIR = OUT_DIR / "cache"
AGENTDOJO_ROOT = REPO_ROOT / "backend" / "data" / "agentdojo-raw"


# ---------------------------------------------------------------------------
# Embedding cache (sentence-transformers takes ~5 min per pass; cache it)
# ---------------------------------------------------------------------------

def _cache_key(parts: dict) -> str:
    blob = json.dumps(parts, sort_keys=True).encode()
    return hashlib.sha1(blob).hexdigest()[:16]


def _load_cache(key: str):
    import numpy as np
    p = CACHE_DIR / f"{key}.npz"
    if not p.exists():
        return None
    z = np.load(p, allow_pickle=True)
    return {
        "X": z["X"],
        "n_dt": int(z["n_dt"]),
        "dt_domain": z["dt_domain"].tolist(),
        "ad_suite": z["ad_suite"].tolist(),
    }


def _save_cache(key: str, X, n_dt: int, dt_domain: list[str], ad_suite: list[str]):
    import numpy as np
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(
        CACHE_DIR / f"{key}.npz",
        X=X, n_dt=n_dt,
        dt_domain=np.array(dt_domain, dtype=object),
        ad_suite=np.array(ad_suite, dtype=object),
    )


# ---------------------------------------------------------------------------
# Between-class scatter projection
# ---------------------------------------------------------------------------

def bcv_project(X, labels: list[str], n_components: int = 2):
    """Project X onto the top-k eigenvectors of the between-class scatter
    matrix S_B = Σ_c n_c (μ_c - μ)(μ_c - μ)^T.

    Maximises variance of the per-class centroids (no within-class
    normalisation — that would be Fisher LDA).
    """
    import numpy as np
    X = np.asarray(X)
    mu = X.mean(axis=0)
    classes = sorted(set(labels))
    d = X.shape[1]
    S_B = np.zeros((d, d), dtype=np.float64)
    for c in classes:
        mask = np.fromiter((l == c for l in labels), dtype=bool, count=len(labels))
        n = int(mask.sum())
        if n == 0:
            continue
        dc = X[mask].mean(axis=0) - mu
        S_B += n * np.outer(dc, dc)
    # symmetric -> eigh
    eigvals, eigvecs = np.linalg.eigh(S_B)
    order = np.argsort(eigvals)[::-1]
    W = eigvecs[:, order[:n_components]]
    proj = (X - mu) @ W
    return proj, W, mu, eigvals[order[:n_components]]


def _load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


def _cool_palette(n: int):
    """Generic N cool-toned colours fallback (teal → cyan → blue → indigo).
    Used when the domain-aware palette below doesn't apply.
    """
    if n <= 0:
        return []
    hues = [165 + (260 - 165) * i / max(1, n - 1) for i in range(n)]
    out = []
    for i, h in enumerate(hues):
        l = 0.40 + 0.12 * (i % 3)
        s = 0.80 if i % 2 == 0 else 0.92
        out.append(colorsys.hls_to_rgb(h / 360.0, l, s))
    return out


# Semantic groups for DecodingTrust domains. Domains in the same group
# share a hue range; within-group variation comes from lightness so
# similar domains read as a single colour family.
DOMAIN_GROUPS: dict[str, str] = {
    # System / UI / device — teal-cyan
    "browser":       "sys",
    "os-filesystem": "sys",
    "windows":       "sys",
    "macos":         "sys",
    # Business / customer ops — azure-blue
    "telecom":          "ops",
    "customer-service": "ops",
    "crm":              "ops",
    "finance":          "ops",
    # Workflow / planning — mid blue
    "travel":   "flow",
    "workflow": "flow",
    # Knowledge / expertise — indigo / violet
    "code":     "kw",
    "legal":    "kw",
    "medical":  "kw",
    "research": "kw",
}

# Order of groups in legends and palette stride (top-to-bottom).
GROUP_ORDER = ["sys", "ops", "flow", "kw"]

# Explicit within-group ordering for the legend (and lightness sweep).
GROUP_DOMAIN_ORDER: dict[str, list[str]] = {
    "sys":  ["browser", "macos", "windows", "os-filesystem"],
    "ops":  ["crm", "customer-service", "finance", "telecom"],
    "flow": ["travel", "workflow"],
    "kw":   ["code", "legal", "medical", "research"],
}


def _domain_legend_order(domains: list[str]) -> list[str]:
    """Return the supplied domains ordered by semantic group + the explicit
    within-group order in GROUP_DOMAIN_ORDER, so the legend reads as
    colour bands and adjacent rows have similar shades."""
    avail = set(domains)
    out: list[str] = []
    for g in GROUP_ORDER:
        for d in GROUP_DOMAIN_ORDER.get(g, []):
            if d in avail:
                out.append(d)
    # Append anything not in the explicit order at the end (alphabetical).
    listed = set(out)
    out.extend(sorted(d for d in domains if d not in listed))
    return out

# Hue range per group (HSL degrees). Cool only — stops short of magenta.
_GROUP_HUE_RANGE = {
    "sys":  (162, 188),
    "ops":  (195, 220),
    "flow": (225, 245),
    "kw":   (252, 275),
}


def _domain_palette(domains: list[str]) -> dict[str, tuple[float, float, float]]:
    """Assign each DT domain a cool colour based on its semantic group.
    Same-group domains share a hue band and differ only in lightness.
    Within-group order follows GROUP_DOMAIN_ORDER so the lightness sweep
    matches the legend reading order.
    """
    avail = set(domains)
    by_group: dict[str, list[str]] = {}
    for g in GROUP_ORDER:
        ordered = [d for d in GROUP_DOMAIN_ORDER.get(g, []) if d in avail]
        if ordered:
            by_group[g] = ordered

    listed = {d for ds in by_group.values() for d in ds}
    unknown = [d for d in domains if d not in listed]

    out: dict[str, tuple[float, float, float]] = {}
    for g, members in by_group.items():
        h_lo, h_hi = _GROUP_HUE_RANGE[g]
        n = len(members)
        for i, d in enumerate(members):
            h = (h_lo + h_hi) / 2 if n == 1 else h_lo + (h_hi - h_lo) * i / (n - 1)
            l = 0.50 if n == 1 else 0.42 + 0.18 * i / (n - 1)
            s = 0.86
            out[d] = colorsys.hls_to_rgb(h / 360.0, l, s)

    if unknown:
        fallback = _cool_palette(len(unknown))
        for d, c in zip(unknown, fallback):
            out[d] = c
    return out


def _warm_palette(n: int):
    """N evenly-spaced warm colours (red → orange → gold)."""
    if n <= 0:
        return []
    hues = [0 + (50 - 0) * i / max(1, n - 1) for i in range(n)]
    return [colorsys.hls_to_rgb(h / 360.0, 0.50, 0.85) for h in hues]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dt-agent", default="claudesdk",
                    choices=["claudesdk", "googleadk", "openaisdk", "openclaw"],
                    help="DecodingTrust agent to plot (default claudesdk)")
    ap.add_argument("--dt-max", type=int, default=300,
                    help="DT cap per (agent×domain) bucket (default 300)")
    ap.add_argument("--ad-max", type=int, default=300,
                    help="AgentDojo cap per (model×suite) bucket (default 300)")
    ap.add_argument("--ad-root", default=str(AGENTDOJO_ROOT))
    ap.add_argument("--backend", default="tfidf", choices=["tfidf", "st"],
                    help="embedding backend: tfidf (surface) or st (semantic)")
    ap.add_argument("--st-model", default="sentence-transformers/all-MiniLM-L6-v2")
    ap.add_argument("--reducer", default="tsne", choices=["tsne", "bcv"],
                    help="dim-reduction: 'tsne' or 'bcv' (between-class variance projection on DT domain centroids)")
    ap.add_argument("--fit-on", default="joint", choices=["joint", "dt"],
                    help="t-SNE: fit jointly on DT+AD (default) or fit DT-only and transform AD onto the DT manifold (uses openTSNE)")
    ap.add_argument("--perplexity", type=float, default=30.0,
                    help="t-SNE perplexity; higher = more global structure")
    ap.add_argument("--ad-single-color", action="store_true",
                    help="paint all AgentDojo points one warm colour (drop suite split)")
    ap.add_argument("--ad-shade", action="store_true",
                    help="draw a translucent KDE shade around the AgentDojo region")
    ap.add_argument("--ad-exclude", action="append", default=[],
                    help="drop AgentDojo suite (repeatable): banking|slack|travel|workspace")
    ap.add_argument("--grid-exclude-each", action="store_true",
                    help="produce a 2x2 figure with one panel per AgentDojo suite excluded")
    ap.add_argument("--ad-keep-top-clusters", type=int, default=0,
                    help="after transform, run DBSCAN on AD coords and keep only the top-K largest spatial clusters (drops scattered noise). 0 = off")
    ap.add_argument("--ad-cluster-min-samples", type=int, default=30,
                    help="DBSCAN min_samples for AD cluster filter")
    ap.add_argument("--ad-noise-fraction", type=float, default=0.0,
                    help="when --ad-keep-top-clusters is on, keep this random fraction of the dropped points (e.g. 0.05) so the plot still has a few scattered dots elsewhere")
    ap.add_argument("--ad-shade-contours", action="store_true",
                    help="draw contour lines on top of the KDE shading for crisper cluster outlines")
    ap.add_argument("--no-cache", action="store_true",
                    help="bypass embedding cache (always re-encode)")
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--out", help="output base path (no ext)")
    args = ap.parse_args()

    dt = _load("plot_trajectory_tsne", REPO_ROOT / "scripts" / "plot-trajectory-tsne.py")
    ad = _load("plot_agentdojo_tsne", REPO_ROOT / "scripts" / "plot-agentdojo-tsne.py")

    print(f"[1/4] collecting DT (agent={args.dt_agent}) + AgentDojo trajectories")
    dt_records = dt.collect_trajectories([args.dt_agent], None)
    dt_records = dt.subsample(dt_records, args.dt_max, args.seed)
    ad_records = ad.collect_agentdojo(Path(args.ad_root))
    ad_records = ad.subsample_per_bucket(ad_records, args.ad_max, args.seed)
    print(f"      DT: {len(dt_records)}  AgentDojo: {len(ad_records)}")

    print(f"[2/4] building text summaries")
    dt_texts, dt_keep = [], []
    for r in dt_records:
        t = dt.trajectory_to_text(r)
        if t:
            dt_texts.append(t); dt_keep.append(r)
    ad_texts, ad_keep = [], []
    for r in ad_records:
        t = ad.agentdojo_to_text(r, dt)
        if t:
            ad_texts.append(t); ad_keep.append(r)
    dt_records, ad_records = dt_keep, ad_keep
    n_dt, n_ad = len(dt_records), len(ad_records)
    print(f"      non-empty DT={n_dt}  AD={n_ad}  total={n_dt + n_ad}")

    dt_domain_labels = [r.domain for r in dt_records]
    ad_suite_labels = [r.suite for r in ad_records]

    cache_key = _cache_key({
        "backend": args.backend, "st_model": args.st_model,
        "dt_agent": args.dt_agent, "dt_max": args.dt_max,
        "ad_max": args.ad_max, "seed": args.seed,
        "n_dt": n_dt, "n_ad": n_ad,
    })
    cached = None if args.no_cache else _load_cache(cache_key)
    if cached is not None and cached["n_dt"] == n_dt \
            and cached["dt_domain"] == dt_domain_labels \
            and cached["ad_suite"] == ad_suite_labels:
        print(f"[3/4] using cached {args.backend} embeddings (key={cache_key})")
        X = cached["X"]
    else:
        print(f"[3/4] joint embed (backend={args.backend}) on {n_dt + n_ad} trajectories")
        if args.backend == "st":
            X = dt.embed_st(dt_texts + ad_texts, args.st_model)
        else:
            X = dt.embed_tfidf(dt_texts + ad_texts)
        if not args.no_cache:
            _save_cache(cache_key, X, n_dt, dt_domain_labels, ad_suite_labels)
            print(f"      cached to {CACHE_DIR / f'{cache_key}.npz'}")

    import numpy as np

    def _keep_top_clusters(ad_coords, ad_records_panel, k: int, min_samples: int,
                           noise_fraction: float = 0.0, seed: int = 0,
                           panel_label: str = ""):
        """DBSCAN on 2D AD coords; keep only points in the top-k largest clusters,
        plus an optional random fraction of the discarded points."""
        if k <= 0 or len(ad_coords) == 0:
            return ad_coords, ad_records_panel
        from sklearn.cluster import DBSCAN
        from sklearn.neighbors import NearestNeighbors
        from collections import Counter
        n_neighbors = min(min_samples, len(ad_coords) - 1)
        nn = NearestNeighbors(n_neighbors=n_neighbors).fit(ad_coords)
        dists, _ = nn.kneighbors(ad_coords)
        eps = float(np.median(dists[:, -1]) * 1.5)
        labels = DBSCAN(eps=eps, min_samples=min_samples).fit_predict(ad_coords)
        sizes = Counter(int(l) for l in labels if l != -1)
        top_labels = {c for c, _ in sizes.most_common(k)}
        in_top = np.fromiter(
            (int(l) in top_labels for l in labels), dtype=bool, count=len(labels)
        )
        # Optionally retain a random fraction of the dropped points
        sprinkle = np.zeros_like(in_top)
        if noise_fraction > 0:
            rng = np.random.default_rng(seed)
            drop_idx = np.where(~in_top)[0]
            n_keep = int(round(noise_fraction * len(drop_idx)))
            if n_keep > 0:
                pick = rng.choice(drop_idx, size=n_keep, replace=False)
                sprinkle[pick] = True
        keep = in_top | sprinkle
        kept_n = int(keep.sum())
        sprinkled = int(sprinkle.sum())
        print(f"      [{panel_label}] DBSCAN eps={eps:.2f} min_samples={min_samples}: "
              f"kept top-{k} clusters ({int(in_top.sum())}/{len(ad_coords)} pts) "
              f"+ {sprinkled} sprinkled noise pts; total kept {kept_n}, "
              f"sizes={dict(sizes.most_common(k))}")
        return ad_coords[keep], [r for r, ok in zip(ad_records_panel, keep) if ok]

    def _reduce(X_full, dt_records_panel, ad_records_panel, ad_keep_mask, panel_label=""):
        """Filter the full embedding, run the chosen reducer, return (dt_coords, ad_coords)."""
        n_dt_p = len(dt_records_panel)
        # X is laid out [DT | AD]; AD rows are at offset n_dt
        ad_idx = np.where(ad_keep_mask)[0] + n_dt
        dt_idx = np.arange(n_dt_p)
        X_panel = np.vstack([X_full[dt_idx], X_full[ad_idx]])
        labels_dt = [r.domain for r in dt_records_panel]
        if args.reducer == "tsne":
            if args.fit_on == "dt":
                # Fit openTSNE on DT only, then transform AD onto the DT manifold
                from openTSNE import TSNE as OpenTSNE
                print(f"      [{panel_label}] fitting openTSNE on DT-only ({n_dt_p} pts), then transform AD ({len(X_panel) - n_dt_p} pts)")
                tsne = OpenTSNE(
                    n_components=2,
                    perplexity=args.perplexity,
                    initialization="pca",
                    metric="cosine",
                    random_state=args.seed,
                    n_jobs=-1,
                )
                dt_emb = tsne.fit(X_panel[:n_dt_p])
                ad_emb = dt_emb.transform(X_panel[n_dt_p:])
                coords = np.vstack([np.asarray(dt_emb), np.asarray(ad_emb)])
            else:
                print(f"      [{panel_label}] reducing with t-SNE (perp={args.perplexity}) on {len(X_panel)} pts (joint fit)")
                coords = dt.run_tsne(X_panel, args.perplexity, args.seed)
        else:
            print(f"      [{panel_label}] reducing with BCV on DT domain centroids")
            proj_dt, W, mu, eigvals = bcv_project(X_panel[:n_dt_p], labels_dt, n_components=2)
            proj_ad = (X_panel[n_dt_p:] - mu) @ W
            coords = np.vstack([proj_dt, proj_ad])
            print(f"      [{panel_label}] top-2 eigenvalues: {eigvals[0]:.3g}, {eigvals[1]:.3g}")
        return coords[:n_dt_p], coords[n_dt_p:]

    def _render_panel(ax, dt_records_p, ad_records_p, dt_coords, ad_coords,
                      title=None, draw_legends=True):
        from scipy.stats import gaussian_kde
        from matplotlib.colors import LinearSegmentedColormap
        from matplotlib.lines import Line2D
        dt_domains = sorted({r.domain for r in dt_records_p})
        ad_suites = sorted({r.suite for r in ad_records_p})
        dt_colors = _domain_palette(dt_domains)
        if args.ad_single_color:
            ad_uniform = (0.85, 0.20, 0.15)
            ad_colors = {s: ad_uniform for s in ad_suites}
        else:
            ad_uniform = None
            ad_colors = dict(zip(ad_suites, _warm_palette(len(ad_suites))))

        all_xy = np.vstack([dt_coords, ad_coords])
        x_lo, x_hi = float(all_xy[:, 0].min()), float(all_xy[:, 0].max())
        y_lo, y_hi = float(all_xy[:, 1].min()), float(all_xy[:, 1].max())
        x_pad = 0.05 * (x_hi - x_lo + 1e-9)
        y_pad = 0.05 * (y_hi - y_lo + 1e-9)

        if args.ad_shade and len(ad_coords) >= 10:
            try:
                # Use only the in-cluster (non-sprinkle) AD points for the KDE so
                # the rings hug the dense regions instead of stretching to noise dots.
                kde_coords = ad_coords
                kde = gaussian_kde(np.vstack([kde_coords[:, 0], kde_coords[:, 1]]),
                                   bw_method=0.30)
                xx, yy = np.mgrid[x_lo - x_pad:x_hi + x_pad:200j,
                                  y_lo - y_pad:y_hi + y_pad:200j]
                zz = kde(np.vstack([xx.ravel(), yy.ravel()])).reshape(xx.shape)
                warm_cmap = LinearSegmentedColormap.from_list(
                    "ad_shade",
                    [(1, 1, 1, 0), (0.95, 0.55, 0.30, 0.20), (0.85, 0.20, 0.15, 0.32)],
                )
                ax.contourf(xx, yy, zz, levels=10, cmap=warm_cmap, zorder=1)
                if args.ad_shade_contours:
                    # Soft contour rings on top: 3 levels at 30/55/80% of max density
                    zmax = float(zz.max())
                    rings = [zmax * 0.30, zmax * 0.55, zmax * 0.80]
                    ax.contour(xx, yy, zz, levels=rings,
                               colors=[(0.85, 0.30, 0.20)],
                               linewidths=[0.7, 0.9, 1.1],
                               alpha=0.55, zorder=2)
            except Exception as e:
                print(f"      (skipping shade: {e})")

        for dom in dt_domains:
            idx = [i for i, r in enumerate(dt_records_p) if r.domain == dom]
            if not idx:
                continue
            pts = dt_coords[idx]
            ax.scatter(pts[:, 0], pts[:, 1],
                       s=10, alpha=0.7, linewidths=0,
                       color=dt_colors[dom], label=dom, zorder=2)

        if args.ad_single_color:
            ax.scatter(ad_coords[:, 0], ad_coords[:, 1],
                       s=22, alpha=0.85, linewidths=0.4, edgecolors="white",
                       color=ad_uniform, label="AgentDojo", zorder=3)
        else:
            for suite in ad_suites:
                idx = [i for i, r in enumerate(ad_records_p) if r.suite == suite]
                if not idx:
                    continue
                pts = ad_coords[idx]
                ax.scatter(pts[:, 0], pts[:, 1],
                           s=22, alpha=0.85, linewidths=0.4, edgecolors="white",
                           color=ad_colors[suite], label=suite, zorder=3)

        if title:
            ax.set_title(title, fontsize=11, color="#111827", pad=8)
        ax.set_xlim(x_lo - x_pad, x_hi + x_pad)
        ax.set_ylim(y_lo - y_pad, y_hi + y_pad)
        # Simple grid behind everything; ticks/labels stay hidden.
        from matplotlib.ticker import MaxNLocator
        ax.xaxis.set_major_locator(MaxNLocator(nbins=6))
        ax.yaxis.set_major_locator(MaxNLocator(nbins=6))
        ax.tick_params(which="both", bottom=False, left=False,
                       labelbottom=False, labelleft=False)
        ax.grid(which="major", color="#d1d5db", linewidth=0.6,
                linestyle="-", alpha=0.7, zorder=0)
        ax.set_axisbelow(True)
        # Hide the outer frame entirely
        for sp in ax.spines.values():
            sp.set_visible(False)

        return dt_domains, ad_suites, dt_colors, ad_colors, ad_uniform

    SUITES_ALL = sorted({r.suite for r in ad_records})

    # Always print the global plotting step heading
    print(f"[4/4] plotting (mode={'grid' if args.grid_exclude_each else 'single'})")
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from matplotlib.lines import Line2D
    plt.rcParams.update({
        "font.family": "sans-serif",
        "font.sans-serif": ["DejaVu Sans"],
        "mathtext.fontset": "dejavusans",
        "pdf.fonttype": 42,
        "ps.fonttype": 42,
    })

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    suffix = f"-{args.backend}" if args.backend != "tfidf" else ""
    if args.reducer == "tsne" and args.perplexity != 30.0:
        suffix += f"-perp{int(args.perplexity)}"
    if args.reducer == "tsne" and args.fit_on == "dt":
        suffix += "-dtfit"
    if args.reducer != "tsne":
        suffix += f"-{args.reducer}"
    if args.ad_exclude:
        suffix += "-no" + "".join(s[0].upper() for s in args.ad_exclude)
    if args.ad_keep_top_clusters > 0:
        suffix += f"-k{args.ad_keep_top_clusters}"

    if args.grid_exclude_each:
        # 2x2 grid, one panel per excluded suite
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        axes = axes.flatten()
        last_panel = None
        for i, excl in enumerate(SUITES_ALL):
            ad_keep_mask = np.array([r.suite != excl for r in ad_records])
            ad_panel = [r for r, k in zip(ad_records, ad_keep_mask) if k]
            dt_coords, ad_coords = _reduce(X, dt_records, ad_panel, ad_keep_mask,
                                           panel_label=f"-{excl}")
            ad_coords, ad_panel = _keep_top_clusters(
                ad_coords, ad_panel,
                args.ad_keep_top_clusters, args.ad_cluster_min_samples,
                noise_fraction=args.ad_noise_fraction, seed=args.seed,
                panel_label=f"-{excl}",
            )
            title = f"−{excl}  (DT n={len(dt_records)}, AD n={len(ad_panel)})"
            last_panel = _render_panel(axes[i], dt_records, ad_panel,
                                       dt_coords, ad_coords, title=title,
                                       draw_legends=False)
        # Shared legend on the right (use last panel's color maps; they're consistent across panels)
        dt_domains, _, dt_colors, ad_colors, ad_uniform = last_panel
        dt_handles = [Line2D([0], [0], marker="o", linestyle="",
                             markerfacecolor=dt_colors[d], markeredgecolor="none",
                             markersize=8, label=d) for d in dt_domains]
        if args.ad_single_color:
            ad_handles = [Line2D([0], [0], marker="o", linestyle="",
                                 markerfacecolor=ad_uniform, markeredgecolor="white",
                                 markeredgewidth=0.6, markersize=10,
                                 label="3 remaining suites")]
        else:
            ad_handles = [Line2D([0], [0], marker="o", linestyle="",
                                 markerfacecolor=ad_colors[s], markeredgecolor="white",
                                 markeredgewidth=0.6, markersize=10, label=s)
                          for s in sorted(ad_colors.keys())]
        leg1 = fig.legend(handles=dt_handles, loc="center right",
                          bbox_to_anchor=(0.99, 0.70), frameon=False, fontsize=9,
                          title=f"DecodingTrust-Agent\n(13 domains, n={len(dt_records)})",
                          title_fontsize=9)
        leg1._legend_box.align = "left"
        leg2 = fig.legend(handles=ad_handles, loc="center right",
                          bbox_to_anchor=(0.99, 0.30), frameon=False, fontsize=9,
                          title="AgentDojo\n(one suite removed per panel)",
                          title_fontsize=9)
        leg2._legend_box.align = "left"
        fig.suptitle(
            f"Trajectory diversity: DT ({args.dt_agent}) vs AgentDojo — leave-one-suite-out",
            fontsize=14,
        )
        fig.tight_layout(rect=(0, 0, 0.86, 0.96))
        out_base = Path(args.out) if args.out else \
            OUT_DIR / f"tsne-overlay-{args.dt_agent}{suffix}-grid"
    else:
        # Single panel
        ad_keep_mask = np.array([r.suite not in set(args.ad_exclude) for r in ad_records])
        ad_panel = [r for r, k in zip(ad_records, ad_keep_mask) if k]
        dt_coords, ad_coords = _reduce(X, dt_records, ad_panel, ad_keep_mask,
                                       panel_label="single")
        ad_coords, ad_panel = _keep_top_clusters(
            ad_coords, ad_panel,
            args.ad_keep_top_clusters, args.ad_cluster_min_samples,
            noise_fraction=args.ad_noise_fraction, seed=args.seed,
            panel_label="single",
        )
        fig, ax = plt.subplots(figsize=(9, 6.4))
        # No title (per request); legends sit inside the upper-right empty
        # quadrant of the plot.
        dt_domains, _, dt_colors, ad_colors, ad_uniform = _render_panel(
            ax, dt_records, ad_panel, dt_coords, ad_coords, title=None,
        )
        legend_order = _domain_legend_order(dt_domains)
        dt_handles = [Line2D([0], [0], marker="o", linestyle="",
                             markerfacecolor=dt_colors[d], markeredgecolor="none",
                             markersize=7, label=d) for d in legend_order]
        if args.ad_single_color:
            ad_handle = Line2D([0], [0], marker="o", linestyle="",
                               markerfacecolor=ad_uniform, markeredgecolor="white",
                               markeredgewidth=0.6, markersize=9, label="AgentDojo")
        else:
            first_suite = sorted(ad_colors.keys())[0]
            ad_handle = Line2D([0], [0], marker="o", linestyle="",
                               markerfacecolor=ad_colors[first_suite],
                               markeredgecolor="white", markeredgewidth=0.6,
                               markersize=9, label="AgentDojo")

        # DT box: framed legend in the upper-right *of the data area*.
        leg1 = ax.legend(
            handles=dt_handles,
            loc="upper right",
            bbox_to_anchor=(1.012, 1.062),
            ncol=1,
            frameon=True, fancybox=False, framealpha=0.95,
            edgecolor="#cbd5e1",
            fontsize=10,
            title="DecodingTrust-Agent",
            title_fontsize=12,
            handletextpad=0.5, borderpad=0.55, labelspacing=0.32,
        )
        leg1.get_title().set_color("#111827")
        leg1.get_frame().set_linewidth(0.8)
        leg1._legend_box.align = "left"
        ax.add_artist(leg1)

        fig.tight_layout()

        # Hand-draw the AgentDojo "box" so its single-line content can be
        # pinned exactly to the DT title's vertical centre with a precise
        # pixel-gap to the DT box. Matplotlib's legend layout has different
        # internal spacing for title-rows vs entry-rows which makes
        # alignment hard with two real legends.
        from matplotlib.patches import Rectangle
        fig.canvas.draw()
        inv = fig.transFigure.inverted()
        leg1_bbox = leg1.get_window_extent().transformed(inv)
        title_bbox = leg1.get_title().get_window_extent().transformed(inv)
        title_cy = (title_bbox.y0 + title_bbox.y1) / 2

        fig_w_px = fig.bbox.width
        fig_h_px = fig.bbox.height

        # Measure rendered "AgentDojo" text width in pixels by drawing a
        # temporary off-canvas text and reading its window extent.
        tmp = fig.text(-1, -1, "AgentDojo", fontsize=12)
        fig.canvas.draw()
        text_w_px = tmp.get_window_extent().width
        text_h_px = tmp.get_window_extent().height
        tmp.remove()

        gap_px = 8              # gap between the two boxes
        inner_pad_px = 8        # padding inside the AD box
        marker_size_px = 10     # diameter for the dot
        marker_text_gap_px = 8  # gap between marker and text

        content_w_px = marker_size_px + marker_text_gap_px + text_w_px
        box_w_px = 2 * inner_pad_px + content_w_px
        box_h_px = 2 * inner_pad_px + text_h_px

        box_right_fig = leg1_bbox.x0 - gap_px / fig_w_px
        box_left_fig = box_right_fig - box_w_px / fig_w_px
        box_bottom_fig = title_cy - (box_h_px / 2) / fig_h_px
        box_height_fig = box_h_px / fig_h_px

        # White-fill rounded rectangle matching leg1's edge style.
        rect = Rectangle(
            (box_left_fig, box_bottom_fig),
            box_w_px / fig_w_px, box_height_fig,
            facecolor="white", edgecolor="#cbd5e1", linewidth=0.8,
            transform=fig.transFigure, zorder=4, clip_on=False,
        )
        fig.add_artist(rect)

        # Text at right inner edge of the box, vertically centred on title.
        text_right_fig = box_right_fig - inner_pad_px / fig_w_px
        fig.text(
            text_right_fig, title_cy, "AgentDojo",
            ha="right", va="center",
            fontsize=12, color="#111827",
            transform=fig.transFigure, zorder=5,
        )

        # Marker dot to the left of the text.
        marker_x_fig = text_right_fig - (text_w_px + marker_text_gap_px) / fig_w_px
        marker = Line2D(
            [marker_x_fig], [title_cy],
            marker="o", linestyle="",
            markerfacecolor=ad_uniform, markeredgecolor="white",
            markeredgewidth=0.6, markersize=10,
            transform=fig.transFigure, clip_on=False, zorder=5,
        )
        fig.add_artist(marker)

        # Outer frame wrapping the axes + DT legend + AD box
        fig.canvas.draw()
        ax_bbox = ax.get_window_extent().transformed(inv)
        leg1_bbox = leg1.get_window_extent().transformed(inv)
        ad_box_w_fig = box_w_px / fig_w_px
        x0 = min(ax_bbox.x0, leg1_bbox.x0, box_left_fig)
        x1 = max(ax_bbox.x1, leg1_bbox.x1, box_left_fig + ad_box_w_fig)
        y0 = min(ax_bbox.y0, leg1_bbox.y0, box_bottom_fig)
        y1 = max(ax_bbox.y1, leg1_bbox.y1, box_bottom_fig + box_height_fig)
        pad_x = 14 / fig_w_px
        pad_y = 14 / fig_h_px
        outer_x0, outer_y0 = x0 - pad_x, y0 - pad_y
        outer_x1, outer_y1 = x1 + pad_x, y1 + pad_y

        # Replace the axes-bound grid with figure-level lines that span the
        # full outer frame, so the gridlines reach the outer border instead
        # of stopping at the data-area edge. Lines pass behind the white
        # legend frames so they're hidden there.
        xticks = [t for t in ax.get_xticks() if ax.get_xlim()[0] <= t <= ax.get_xlim()[1]]
        yticks = [t for t in ax.get_yticks() if ax.get_ylim()[0] <= t <= ax.get_ylim()[1]]
        ax.grid(False)
        grid_kw = dict(color="#d1d5db", linewidth=0.6, alpha=0.7,
                       transform=fig.transFigure, zorder=0.5, clip_on=False)
        for xt in xticks:
            px = ax.transData.transform((xt, 0))[0]
            fx = inv.transform((px, 0))[0]
            fig.add_artist(Line2D([fx, fx], [outer_y0, outer_y1], **grid_kw))
        for yt in yticks:
            py = ax.transData.transform((0, yt))[1]
            fy = inv.transform((0, py))[1]
            fig.add_artist(Line2D([outer_x0, outer_x1], [fy, fy], **grid_kw))

        out_base = Path(args.out) if args.out else \
            OUT_DIR / f"tsne-overlay-{args.dt_agent}{suffix}"

    if not out_base.is_absolute():
        out_base = REPO_ROOT / out_base
    fig.savefig(out_base.with_suffix(".png"), dpi=200, bbox_inches="tight")
    fig.savefig(out_base.with_suffix(".pdf"), bbox_inches="tight")
    print(f"      wrote {out_base.with_suffix('.png').name} and {out_base.with_suffix('.pdf').name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""
Merge gpt-dpsk-openclaw.zip trajectories into backend/data/trajectories/.

Zip layout:
    openclaw/<raw_model>/<domain>/<benign|malicious/{direct,indirect}>/<task_id>/{*.json}

Target trajectory layout (existing convention):
    backend/data/trajectories/<domain>/openclaw/<model>/<domain>/<benign|malicious/.../>/<category>/<num>/{*.json}

The zip uses each task's `task_id` (from config.yaml) as the leaf directory.
The target layout uses the dataset's directory structure (`<category>/<num>` or
just `<num>` for flat domains). We bridge by parsing every config.yaml in the
dataset to build a `task_id -> relative_dir` map, then re-route each zip file.

Model normalization (strip provider prefixes):
    openai_gpt-5.5            -> gpt-5.5
    deepseek_deepseek-v4-pro  -> deepseek-v4-pro
"""
from __future__ import annotations

import argparse
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
DATASET_ROOT = REPO_ROOT / "DecodingTrust-Agent-Platform" / "dataset"
TRAJ_ROOT = REPO_ROOT / "backend" / "data" / "trajectories"
ZIP_PATH = REPO_ROOT / "gpt-dpsk-openclaw.zip"

MODEL_PREFIX_STRIP = ["openai_", "deepseek_", "anthropic_", "litellm_"]


def normalize_model(raw: str) -> str:
    out = raw
    while True:
        for p in MODEL_PREFIX_STRIP:
            if out.startswith(p):
                out = out[len(p):]
                break
        else:
            return out


def build_taskid_map() -> dict[str, str]:
    """Map task_id -> relative dataset path (e.g. 'finance/malicious/direct/disaster_fraud/1')."""
    out: dict[str, str] = {}
    duplicates = 0
    for cfg in DATASET_ROOT.rglob("config.yaml"):
        try:
            data = yaml.safe_load(cfg.read_text(encoding="utf-8", errors="replace"))
        except Exception:
            continue
        if not isinstance(data, dict):
            continue
        task = data.get("Task") or {}
        tid = task.get("task_id")
        if not tid:
            continue
        tid = str(tid)
        rel = cfg.parent.relative_to(DATASET_ROOT).as_posix()
        if tid in out and out[tid] != rel:
            duplicates += 1
        out[tid] = rel
    if duplicates:
        print(f"  warning: {duplicates} duplicate task_ids encountered (later wins)")
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--zip", default=str(ZIP_PATH))
    ap.add_argument("--apply", action="store_true",
                    help="execute merge (default: dry-run)")
    ap.add_argument("--report-unmatched", action="store_true",
                    help="print every zip task_id that has no dataset match")
    args = ap.parse_args()

    zip_path = Path(args.zip)
    if not zip_path.is_file():
        print(f"missing zip: {zip_path}", file=sys.stderr); return 1

    print(f"[1/3] indexing dataset task_ids in {DATASET_ROOT}")
    taskid_to_rel = build_taskid_map()
    print(f"      {len(taskid_to_rel)} unique task_ids")

    print(f"[2/3] inspecting zip {zip_path}")
    matched = 0
    unmatched: list[tuple[str, str]] = []
    domain_mismatches = 0
    moves: list[tuple[str, Path]] = []  # (zip_member, target_file)

    with zipfile.ZipFile(zip_path) as zf:
        members = zf.namelist()
        for m in members:
            if m.endswith("/"):
                continue
            parts = m.split("/")
            # expect: openclaw/<raw_model>/<domain>/(benign|malicious/{direct,indirect})/<task_id>/<file>
            if len(parts) < 6 or parts[0] != "openclaw":
                continue
            raw_model = parts[1]
            domain = parts[2]
            if parts[3] == "benign" and len(parts) >= 6:
                split_label = "benign"
                task_id = parts[4]
                fname = "/".join(parts[5:])
            elif parts[3] == "malicious" and parts[4] in ("direct", "indirect") and len(parts) >= 7:
                split_label = f"malicious/{parts[4]}"
                task_id = parts[5]
                fname = "/".join(parts[6:])
            else:
                continue

            rel = taskid_to_rel.get(task_id)
            if not rel:
                # Some zip task_ids include the redundant <domain>-<split>-
                # prefix (e.g. 'travel-malicious-direct-booking-abuse-008'
                # vs dataset task_id 'booking-abuse-008'). Strip and retry.
                trimmed = None
                if split_label == "benign":
                    pfx = f"{domain}-benign-"
                else:  # malicious/direct or malicious/indirect
                    pfx = f"{domain}-{split_label.split('/')[1]}-"
                    pfx_alt = f"{domain}-malicious-{split_label.split('/')[1]}-"
                    if task_id.startswith(pfx_alt):
                        trimmed = task_id[len(pfx_alt):]
                if trimmed is None and task_id.startswith(pfx):
                    trimmed = task_id[len(pfx):]
                if trimmed:
                    rel = taskid_to_rel.get(trimmed)
            if not rel:
                unmatched.append((task_id, domain))
                continue
            # rel is e.g. 'finance/malicious/direct/disaster_fraud/1'
            rel_parts = rel.split("/")
            if rel_parts[0] != domain:
                domain_mismatches += 1
                continue

            model = normalize_model(raw_model)
            target = TRAJ_ROOT / domain / "openclaw" / model / rel / fname
            moves.append((m, target))
            matched += 1

    print(f"      zip members: {len(members)}, leaf files routed: {matched}")
    print(f"      unmatched task_ids: {len(unmatched)}, domain mismatches: {domain_mismatches}")
    if args.report_unmatched and unmatched:
        sample = unmatched[:30]
        for tid, dom in sample:
            print(f"        {dom}/{tid}")
        if len(unmatched) > 30:
            print(f"        ... and {len(unmatched) - 30} more")

    if not args.apply:
        # show a few example targets
        print("\n  example routes:")
        for src, dst in moves[:5]:
            print(f"    {src}\n      -> {dst.relative_to(REPO_ROOT)}")
        print("\n(dry-run; pass --apply to execute)")
        return 0

    print(f"\n[3/3] extracting + placing into {TRAJ_ROOT}")
    skipped = 0
    written = 0
    with tempfile.TemporaryDirectory() as tmp:
        tmp_root = Path(tmp)
        with zipfile.ZipFile(zip_path) as zf:
            for src, dst in moves:
                if dst.exists():
                    skipped += 1
                    continue
                dst.parent.mkdir(parents=True, exist_ok=True)
                with zf.open(src) as fsrc, open(dst, "wb") as fdst:
                    shutil.copyfileobj(fsrc, fdst)
                written += 1
                if written % 1000 == 0:
                    print(f"      wrote {written}/{len(moves)}")
    print(f"      wrote {written} new files, skipped {skipped} existing")
    return 0


if __name__ == "__main__":
    sys.exit(main())

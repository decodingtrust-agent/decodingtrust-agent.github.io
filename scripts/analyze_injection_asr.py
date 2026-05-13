#!/usr/bin/env python3
"""Compute average attack success rate (ASR) per injection-type combination.

For every malicious task in the dataset:
  1. Parse attack_turns[].attack_steps[].type from config.yaml to determine
     which injection types it uses (any subset of {prompt, tool, environment, skill}).
  2. Find all matching trajectory judge_result.json files under
     backend/data/trajectories/<domain>/<agent>/<model>/<rel-dir>/judge_result.json
     and read each attack_success bool.
  3. Group results by injection-type set and report mean ASR per group.
"""
from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
DATASET_ROOT = REPO_ROOT / "DecodingTrust-Agent-Platform" / "dataset"
TRAJ_ROOT = REPO_ROOT / "backend" / "data" / "trajectories"


def types_for_task(cfg_path: Path) -> tuple[frozenset[str], dict]:
    """Return (set of injection types used by this task, parsed config)."""
    try:
        cfg = yaml.safe_load(cfg_path.read_text(encoding="utf-8", errors="replace"))
    except Exception:
        return frozenset(), {}
    if not isinstance(cfg, dict):
        return frozenset(), {}
    attack = cfg.get("Attack") or {}
    turns = attack.get("attack_turns") or []
    types: set[str] = set()
    for turn in turns:
        for step in (turn.get("attack_steps") or []):
            t = step.get("type")
            if t:
                types.add(str(t))
    return frozenset(types), cfg


def collect_judge_files(rel_dir: str) -> list[Path]:
    """Find all judge_result.json under <traj-root>/*/<sdk>/<model>/<rel_dir>/."""
    domain = rel_dir.split("/", 1)[0]
    domain_root = TRAJ_ROOT / domain
    if not domain_root.is_dir():
        return []
    out = []
    # layout: <domain>/<sdk>/<model>/<rel-dir-without-domain-prefix-or-with-it>
    # rel_dir already starts with <domain>/, and the on-disk layout duplicates the
    # domain after the model: <domain>/<sdk>/<model>/<domain>/<rest>
    for sdk_dir in domain_root.iterdir():
        if not sdk_dir.is_dir():
            continue
        for model_dir in sdk_dir.iterdir():
            if not model_dir.is_dir():
                continue
            target = model_dir / rel_dir
            if not target.is_dir():
                continue
            jr = target / "judge_result.json"
            if jr.is_file():
                out.append(jr)
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--by-domain", action="store_true",
                    help="also break down by domain")
    ap.add_argument("--per-agent", action="store_true",
                    help="also break down by SDK/model")
    args = ap.parse_args()

    print(f"[1/3] scanning malicious tasks in {DATASET_ROOT}")
    tasks: list[tuple[str, frozenset[str], str]] = []  # (rel_dir, types, domain)
    for cfg in DATASET_ROOT.rglob("config.yaml"):
        rel_parts = cfg.parent.relative_to(DATASET_ROOT).parts
        if len(rel_parts) < 2 or rel_parts[1] != "malicious":
            continue
        types, _ = types_for_task(cfg)
        rel_dir = cfg.parent.relative_to(DATASET_ROOT).as_posix()
        domain = rel_parts[0]
        tasks.append((rel_dir, types, domain))
    print(f"      {len(tasks)} malicious tasks")

    # type set distribution
    set_counter: dict[frozenset[str], int] = defaultdict(int)
    for _, t, _ in tasks:
        set_counter[t] += 1
    print("\n[2/3] task counts by injection-type set:")
    for s, n in sorted(set_counter.items(), key=lambda x: (-x[1], sorted(x[0]))):
        label = "+".join(sorted(s)) if s else "(none)"
        print(f"      {n:>4}  {label}")

    # Aggregate ASR per type-set
    print(f"\n[3/3] computing ASR (reading judge_result.json files)...")
    # key = type-set; value = (n_runs, n_success)
    agg: dict[frozenset[str], tuple[int, int]] = defaultdict(lambda: (0, 0))
    by_type: dict[str, tuple[int, int]] = defaultdict(lambda: (0, 0))   # tasks using type t (combos counted)
    by_only_type: dict[str, tuple[int, int]] = defaultdict(lambda: (0, 0))  # tasks using ONLY type t
    by_domain_combo: dict[tuple[str, frozenset[str]], tuple[int, int]] = defaultdict(lambda: (0, 0))
    by_agent_combo: dict[tuple[str, str, frozenset[str]], tuple[int, int]] = defaultdict(lambda: (0, 0))

    no_traj_count = 0
    for rel_dir, types, domain in tasks:
        jrs = collect_judge_files(rel_dir)
        if not jrs:
            no_traj_count += 1
            continue
        for jr in jrs:
            try:
                data = json.loads(jr.read_text(encoding="utf-8", errors="replace"))
            except Exception:
                continue
            success = data.get("attack_success")
            if not isinstance(success, bool):
                continue
            n, s = agg[types]
            agg[types] = (n + 1, s + (1 if success else 0))

            for t in types:
                n2, s2 = by_type[t]
                by_type[t] = (n2 + 1, s2 + (1 if success else 0))
            if len(types) == 1:
                only = next(iter(types))
                n3, s3 = by_only_type[only]
                by_only_type[only] = (n3 + 1, s3 + (1 if success else 0))

            if args.by_domain:
                k = (domain, types)
                n4, s4 = by_domain_combo[k]
                by_domain_combo[k] = (n4 + 1, s4 + (1 if success else 0))
            if args.per_agent:
                # path structure: trajectories/<domain>/<sdk>/<model>/<...>/judge_result.json
                rel = jr.relative_to(TRAJ_ROOT).parts
                if len(rel) >= 3:
                    sdk, model = rel[1], rel[2]
                    k = (sdk, model, types)
                    n5, s5 = by_agent_combo[k]
                    by_agent_combo[k] = (n5 + 1, s5 + (1 if success else 0))

    print(f"      tasks with no trajectories on disk: {no_traj_count}")

    def fmt(asr_tuple: tuple[int, int]) -> str:
        n, s = asr_tuple
        if n == 0:
            return "n=0"
        return f"{100*s/n:>5.1f}% ({s}/{n})"

    print("\n=== ASR by injection-type COMBINATION ===")
    print(f"{'combination':<35}  {'runs':>6}  {'asr':>16}")
    print("-" * 65)
    for s, val in sorted(agg.items(), key=lambda x: (-x[1][0], sorted(x[0]))):
        label = "+".join(sorted(s)) if s else "(none)"
        print(f"{label:<35}  {val[0]:>6}  {fmt(val):>16}")

    print("\n=== ASR by SINGLE injection type (across any task that USES the type) ===")
    print(f"{'type':<20}  {'runs':>6}  {'asr':>16}")
    print("-" * 50)
    for t in sorted(by_type):
        print(f"{t:<20}  {by_type[t][0]:>6}  {fmt(by_type[t]):>16}")

    print("\n=== ASR by injection type used ALONE (only that type) ===")
    print(f"{'type':<20}  {'runs':>6}  {'asr':>16}")
    print("-" * 50)
    for t in sorted(by_only_type):
        print(f"{t:<20}  {by_only_type[t][0]:>6}  {fmt(by_only_type[t]):>16}")

    if args.by_domain:
        print("\n=== ASR by (domain, combination) ===")
        print(f"{'domain':<20} {'combination':<30}  {'runs':>6}  {'asr':>16}")
        print("-" * 80)
        for (dom, s), val in sorted(by_domain_combo.items(), key=lambda x: (x[0][0], sorted(x[0][1]))):
            label = "+".join(sorted(s)) if s else "(none)"
            print(f"{dom:<20} {label:<30}  {val[0]:>6}  {fmt(val):>16}")

    if args.per_agent:
        print("\n=== ASR by (sdk, model, combination) ===")
        print(f"{'sdk':<12} {'model':<22} {'combination':<30}  {'runs':>6}  {'asr':>16}")
        print("-" * 95)
        for (sdk, model, s), val in sorted(by_agent_combo.items(),
                                            key=lambda x: (x[0][0], x[0][1], sorted(x[0][2]))):
            label = "+".join(sorted(s)) if s else "(none)"
            print(f"{sdk:<12} {model:<22} {label:<30}  {val[0]:>6}  {fmt(val):>16}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

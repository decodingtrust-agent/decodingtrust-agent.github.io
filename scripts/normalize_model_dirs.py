#!/usr/bin/env python3
"""Normalize model directory names under backend/data/trajectories/.

Standard layout:
    <domain>/<agent>/<model>/<domain-again>/{benign|malicious/{direct,indirect}}/...

Customer-service layout (extra level):
    customer-service/{benchmark,direct_prompt}/<agent>/<model>/customer-service/...

Strategy: walk each agent dir, rename non-canonical model dirs to their
canonical name; if the canonical dir already exists, merge contents (move
files; for collisions warn and skip).

Usage:
    python scripts/normalize_model_dirs.py            # dry-run
    python scripts/normalize_model_dirs.py --apply    # execute
"""
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "backend" / "data" / "trajectories"

# alias -> canonical
MODEL_ALIASES: dict[str, str] = {
    # claudesdk
    "claude-opus-4.6":                "claude-opus-4-6",
    "vertex_ai_claude-opus-4-6":      "claude-opus-4-6",
    "anthropic_claude-opus-4-6":      "claude-opus-4-6",
    "litellm_claude-opus-4-6":        "claude-opus-4-6",
    "claude-sonnet-4.5":              "claude-sonnet-4-5",
    "claude-sonnet-4-5-20250929":     "claude-sonnet-4-5",
    "vertex_ai_claude-sonnet-4-5":    "claude-sonnet-4-5",
    # openaisdk
    "gpt-5.1-2025-11-13":             "gpt-5.1",
    "gpt-5.2-2025-12-11":             "gpt-5.2",
    "gpt-5.4-2026-03-05":             "gpt-5.4",
    "openai_gpt-5.2":                 "gpt-5.2",
    "openai_gpt-5.4":                 "gpt-5.4",
    "openai_gpt-oss-120b":            "gpt-oss-120b",
    "litellm_together_ai_openai_gpt-oss-120b": "gpt-oss-120b",
    # googleadk -- unify all to gemini-3-pro-preview
    "gemini-3-pro":                   "gemini-3-pro-preview",
    "gemini-3.1-pro-preview":         "gemini-3-pro-preview",
    "gemini-3.1-pro":                 "gemini-3-pro-preview",
}


def find_agent_dirs(root: Path):
    """Yield every directory whose immediate children are model dirs.

    Standard layout: <root>/<domain>/<agent>/
    Customer-service layout: <root>/customer-service/{benchmark,direct_prompt}/<agent>/
    """
    for domain in sorted(root.iterdir()):
        if not domain.is_dir():
            continue
        if domain.name == "customer-service":
            for mode in sorted(domain.iterdir()):
                if not mode.is_dir():
                    continue
                for agent in sorted(mode.iterdir()):
                    if agent.is_dir():
                        yield agent
        else:
            for agent in sorted(domain.iterdir()):
                if agent.is_dir():
                    yield agent


def merge_into(src: Path, dst: Path, apply: bool, indent: str = "  "):
    """Move contents of src into dst, merging recursively.

    Returns (n_moved, n_collisions).
    """
    moved = 0
    collisions = 0
    for child in sorted(src.iterdir()):
        target = dst / child.name
        if not target.exists():
            print(f"{indent}move  {child.relative_to(ROOT)}  ->  {target.relative_to(ROOT)}")
            if apply:
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.move(str(child), str(target))
            moved += 1
        elif child.is_dir() and target.is_dir():
            m, c = merge_into(child, target, apply, indent + "  ")
            moved += m
            collisions += c
            # remove src dir if empty
            if apply:
                try:
                    child.rmdir()
                except OSError:
                    pass
        else:
            print(f"{indent}SKIP  collision: {target.relative_to(ROOT)}  (src {child.relative_to(ROOT)} kept)")
            collisions += 1
    return moved, collisions


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true",
                    help="execute moves (default: dry-run)")
    args = ap.parse_args()

    if not ROOT.exists():
        print(f"missing {ROOT}", file=sys.stderr)
        return 1

    total_moved = 0
    total_collisions = 0
    total_renames = 0
    affected_agents = 0

    for agent_dir in find_agent_dirs(ROOT):
        non_canon = [m for m in agent_dir.iterdir()
                     if m.is_dir() and m.name in MODEL_ALIASES]
        if not non_canon:
            continue
        affected_agents += 1
        rel = agent_dir.relative_to(ROOT)
        print(f"\n[{rel}]")
        for src in non_canon:
            canonical = MODEL_ALIASES[src.name]
            dst = agent_dir / canonical
            if not dst.exists():
                print(f"  rename {src.name}  ->  {canonical}")
                if args.apply:
                    src.rename(dst)
                total_renames += 1
            else:
                print(f"  merge  {src.name}  ->  {canonical}")
                m, c = merge_into(src, dst, args.apply)
                total_moved += m
                total_collisions += c
                if args.apply:
                    try:
                        src.rmdir()
                        print(f"    removed empty {src.name}")
                    except OSError as e:
                        print(f"    NOTE: could not remove {src.name}: {e}")

    print()
    print(f"agents touched:    {affected_agents}")
    print(f"renames (no merge): {total_renames}")
    print(f"files/dirs moved:  {total_moved}")
    print(f"collisions:        {total_collisions}")
    if not args.apply:
        print("\n(dry-run; pass --apply to execute)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

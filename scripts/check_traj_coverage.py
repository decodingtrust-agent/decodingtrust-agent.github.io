#!/usr/bin/env python3
"""Audit backend/data/trajectories/ for agent x domain x split coverage."""
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent / "backend" / "data" / "trajectories"
SPLITS = ["benign", "malicious/direct", "malicious/indirect"]


def count_traj_files(p: Path) -> int:
    if not p.exists():
        return 0
    return sum(1 for _ in p.rglob("*.json"))


def main():
    domains = sorted(d.name for d in ROOT.iterdir() if d.is_dir())
    # discover all agents anywhere
    all_agents = set()
    for d in domains:
        for a in (ROOT / d).iterdir():
            if a.is_dir():
                all_agents.add(a.name)
    all_agents = sorted(all_agents)
    print(f"Domains ({len(domains)}): {domains}")
    print(f"Agents seen ({len(all_agents)}): {all_agents}")
    print()

    # per (agent, domain, split): traj count
    cov = defaultdict(lambda: defaultdict(lambda: {s: 0 for s in SPLITS}))
    models = defaultdict(set)
    for d in domains:
        for a in all_agents:
            adir = ROOT / d / a
            if not adir.exists():
                continue
            for mdir in adir.iterdir():
                if not mdir.is_dir():
                    continue
                models[a].add(mdir.name)
                # path: <agent>/<model>/<domain-again>/<split>
                for inner_d in mdir.iterdir():
                    if not inner_d.is_dir():
                        continue
                    for s in SPLITS:
                        cov[a][d][s] += count_traj_files(inner_d / s)

    # print models per agent
    print("Models per agent:")
    for a in all_agents:
        ms = sorted(models[a])
        print(f"  {a}: {len(ms)} model(s) -> {ms}")
    print()

    # per-agent coverage table
    for a in all_agents:
        print(f"=== {a} ===")
        header = f"{'domain':<18} {'benign':>8} {'direct':>8} {'indirect':>10}  {'missing':>8}"
        print(header)
        print("-" * len(header))
        missing = []
        for d in domains:
            row = cov[a][d]
            b, dr, ind = row["benign"], row["malicious/direct"], row["malicious/indirect"]
            miss = [s for s, v in [("benign", b), ("direct", dr), ("indirect", ind)] if v == 0]
            print(f"{d:<18} {b:>8} {dr:>8} {ind:>10}  {','.join(miss) if miss else 'ok':>8}")
            if miss:
                missing.append((d, miss))
        print()
        if missing:
            print(f"  MISSING for {a}:")
            for d, m in missing:
                print(f"    - {d}: {','.join(m)}")
        else:
            print(f"  full coverage")
        print()


if __name__ == "__main__":
    main()

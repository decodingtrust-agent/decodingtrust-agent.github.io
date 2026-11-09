"""Export a reproducible static snapshot from a committed MAS dataset.

    python export_snapshot.py --source /path/to/dtap-mas --ref origin/main
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import tarfile
import tempfile
from collections import Counter
from pathlib import Path

from _dataset import card, dataset_tasks, world_id

BENCHMARK = Path(__file__).resolve().parents[1]


def write_json(root: Path, name: str, body: object) -> None:
    path = root / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(body, ensure_ascii=False, separators=(",", ":")) + "\n")


def export(source: Path, ref: str, output: Path) -> None:
    sha = subprocess.check_output(["git", "-C", str(source), "rev-parse", ref], text=True).strip()
    with tempfile.TemporaryDirectory(prefix="dtap-mas-snapshot-") as scratch:
        root = Path(scratch)
        archive = root / "source.tar"
        with archive.open("wb") as stream:
            subprocess.run(["git", "-C", str(source), "archive", ref, "src/worldgen", "dataset", "examples"],
                           stdout=stream, check=True)
        with tarfile.open(archive) as files:
            files.extractall(root, filter="data")
        os.environ["DTAP_MAS_ROOT"] = str(root)
        from task_data import load_task

        staged = root / "snapshot"
        index = dataset_tasks(root / "dataset")
        cards = []
        for key, entry in index.items():
            nav = {"id": key, **{k: v for k, v in entry.items() if k != "dir"}}
            body = load_task(entry["dir"])
            body["nav"] = nav
            write_json(staged, f"task/{key}.json", body)
            cards.append({"status": "finalized", **nav})

        examples = root / "examples/anniversary-trip"
        demo_ids = []
        demo_bodies = {}
        for name in ("benign", "rt-indirect"):
            body = load_task(examples / name)
            identifier = json.loads((examples / name / "task.json").read_text())["task_id"]
            demo_ids.append(identifier)
            demo_bodies[name] = body
        for name, identifier, pair in (("benign", demo_ids[0], demo_ids[1]),
                                      ("rt-indirect", demo_ids[1], demo_ids[0])):
            body = demo_bodies[name]
            kind = "benign" if name == "benign" else "rt"
            item = {"id": identifier, "status": "finalized", "kind": kind, "pair": pair,
                    "scenario": "anniversary-trip", "domain": "personal", "title": body["title"],
                    "world": world_id(body["world_type"]), "category_slug": "credential-compromise",
                    "threat_model": "indirect" if kind == "rt" else None,
                    "tags": ["credential-compromise", "indirect", "personal"] if kind == "rt" else ["personal"],
                    "has_trajectory": bool(body.get("trajectory")), "is_synthesized": kind == "rt",
                    **card(examples / name, kind)}
            body["nav"] = item
            write_json(staged, f"task/{identifier}.json", body)
            if kind == "rt":
                cards.append(item)
        write_json(staged, "tasks.json", cards)

        worlds = []
        world_root = root / "src/worldgen/topology/worlds"
        for file in sorted(world_root.glob("*.json")):
            if file.name.endswith(".agents.json"):
                continue
            body = json.loads(file.read_text())
            agents = file.with_name(f"{file.stem}.agents.json")
            write_json(staged, f"world/{file.stem}.json", body)
            write_json(staged, f"version/{file.stem}.json", {"world": sha, "agents": sha if agents.exists() else None})
            if agents.exists():
                write_json(staged, f"agents/{file.stem}.json", json.loads(agents.read_text()))
            worlds.append({"id": file.stem, "domain": body.get("domain"), "version": body.get("version"),
                           "people": len(body.get("people", {})), "agents": agents.exists()})
        write_json(staged, "worlds.json", worlds)
        manifest = {"source_repository": "BillChan226/dtap-mas", "source_commit": sha,
                    "visualization_source_commit": "dd0c34437da56bd2fe5a5a2a13f4bd8494c6ee18",
                    "benchmark_version": "1.0", "tasks": len(index), "scenarios": len(index) // 2,
                    "listed_tasks": len(cards), "synthesized_examples": 1,
                    "types": dict(Counter(t["type"] for t in cards if not t.get("is_synthesized"))),
                    "domains": dict(Counter(t["domain"] for t in cards if not t.get("is_synthesized"))),
                    "worlds": len(worlds), "demo_tasks": demo_ids, "demo_is_synthesized": True}
        write_json(staged, "manifest.json", manifest)
        output.parent.mkdir(parents=True, exist_ok=True)
        if output.exists():
            shutil.rmtree(output)
        shutil.copytree(staged, output)
        print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--ref", default="origin/main")
    parser.add_argument("--output", type=Path, default=BENCHMARK / "visualization/data")
    args = parser.parse_args()
    export(args.source.resolve(), args.ref, args.output.resolve())

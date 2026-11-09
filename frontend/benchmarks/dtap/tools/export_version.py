"""Export the challenging DTap catalog as website version 1.1 from a committed source tree."""
from __future__ import annotations

import argparse
import importlib.util
import json
import shutil
import subprocess
import tempfile
from pathlib import Path

MODULE = Path(__file__).resolve().parents[1]
SITE = Path(__file__).resolve().parents[4]
SOURCE_PATH = "benchmark/dtap-bench-0.1"


def export(source: Path, ref: str) -> None:
    sha = subprocess.check_output(["git", "-C", str(source), "rev-parse", ref], text=True).strip()
    tree = subprocess.check_output(["git", "-C", str(source), "ls-tree", "-r", ref, SOURCE_PATH], text=True)
    with tempfile.TemporaryDirectory(prefix="dtap-version-") as scratch:
        root = Path(scratch)
        reader = subprocess.Popen(["git", "-C", str(source), "cat-file", "--batch"],
                                  stdin=subprocess.PIPE, stdout=subprocess.PIPE)
        try:
            for line in tree.splitlines():
                metadata, name = line.split("\t", 1)
                if not name.endswith(("/config.yaml", "/judge.py", ".jsonl")):
                    continue
                reader.stdin.write((metadata.split()[2] + "\n").encode())
                reader.stdin.flush()
                size = int(reader.stdout.readline().split()[2])
                body = reader.stdout.read(size)
                reader.stdout.read(1)
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(body)
        finally:
            reader.stdin.close()
            reader.wait()

        spec = importlib.util.spec_from_file_location("registry_export", SITE / "scripts/generate-registry-data.py")
        parser = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(parser)
        parser.DATASET_ROOT = root / SOURCE_PATH
        staged = root / "website"
        (staged / "tasks").mkdir(parents=True)
        rows = []
        for file in sorted((parser.DATASET_ROOT / "task-list").rglob("*.jsonl")):
            rows.extend(json.loads(line) for line in file.read_text().splitlines() if line.strip())
        tasks = []
        seen = set()
        for row in rows:
            parts = [row["domain"], "benign" if row["type"] == "benign" else "rt"]
            if row["type"] != "benign":
                parts += [row["threat_model"], row["risk_category"]]
            path = parser.DATASET_ROOT.joinpath(*parts, str(row["task_id"]), "config.yaml")
            parsed = parser.parse_config(path)
            if parsed is None:
                raise ValueError(f"Cannot parse catalog task {path.relative_to(root)}")
            card, detail = parsed
            if card["slug"] in seen:
                raise ValueError(f"Duplicate catalog slug {card['slug']}")
            seen.add(card["slug"])
            card["type"] = detail["type"] = "benign" if row["type"] == "benign" else "rt"
            tasks.append(card)
            (staged / "tasks" / f"{card['slug']}.json").write_text(json.dumps(detail, ensure_ascii=False))
        index = {"version": "1.1", "source_repository": "AI-secure/DecodingTrust-Agent-Platform",
                 "source_commit": sha, "source_dataset": SOURCE_PATH, "total_tasks": len(tasks),
                 "domains": sorted({t["domain"] for t in tasks}), "types": sorted({t["type"] for t in tasks}),
                 "threat_models": sorted({t["threat_model"] for t in tasks if t["threat_model"]}),
                 "risk_categories": sorted({t["risk_category"] for t in tasks if t["risk_category"]}),
                 "tasks": tasks}
        (staged / "tasks-index.json").write_text(json.dumps(index, ensure_ascii=False))
        (staged / "manifest.json").write_text(json.dumps({k: v for k, v in index.items() if k != "tasks"}))
        output = MODULE / "data/1.1"
        if output.exists():
            shutil.rmtree(output)
        shutil.copytree(staged, output)
        print(json.dumps({k: index[k] for k in ("version", "source_commit", "source_dataset", "total_tasks")}, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--ref", default="origin/main")
    args = parser.parse_args()
    export(args.source, args.ref)

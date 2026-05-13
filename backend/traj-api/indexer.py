"""Build the SQLite trajectory index by walking data/trajectories/ directly.

Replaces the TypeScript trajectory-manifest builder + the 20 MB JSON file.
We write straight to SQLite at $DT_DATA_ROOT/trajectory-index.sqlite, which
the API service reads in read-only mode.

Logic ported from frontend/lib/trajectory-manifest-build.ts.

Run as part of redeploy.sh whenever the trajectory tree changes.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sqlite3
import sys
import tempfile
import time
from collections import defaultdict
from pathlib import Path

SCHEMA = """
CREATE TABLE manifest_entries (
    task_key TEXT PRIMARY KEY,
    default_run_id INTEGER NOT NULL
);
CREATE TABLE runs (
    run_id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_key TEXT NOT NULL,
    sdk TEXT NOT NULL,
    model TEXT NOT NULL,
    ts TEXT NOT NULL,
    trajectory_path TEXT NOT NULL,  -- relative to data root
    judge_path TEXT NOT NULL,
    UNIQUE (task_key, trajectory_path)
);
CREATE INDEX runs_by_task ON runs(task_key);
CREATE TABLE aliases (
    alias TEXT PRIMARY KEY,
    target TEXT NOT NULL
);
CREATE TABLE manifest_meta (
    key TEXT PRIMARY KEY,
    value TEXT
);
"""

SDK_ROOTS = {"openaisdk", "googleadk", "claudesdk", "openclaw"}
EXCLUDED_PAIRS = {("openaisdk", "gpt-5.1")}
REGISTRY_DOMAINS = {
    "browser", "code", "crm", "customer-service", "finance", "legal",
    "medical", "macos", "os-filesystem", "research", "telecom", "travel",
    "windows", "workflow", "no_image",
}
TRAJ_FILE_RE = re.compile(r"^(\d{8})_(\d{6})\.json$")


# ---- path → key helpers (mirrors trajectory-manifest-build.ts) -----------

def _find_sdk_index(parts: list[str]) -> int:
    for j in range(1, len(parts)):
        if parts[j] in SDK_ROOTS:
            return j
    return -1


def _logical_key_from_rel(rel: str) -> str | None:
    parts = rel.split("/")
    i = _find_sdk_index(parts)
    if i == -1 or i + 2 > len(parts):
        return None
    domain = parts[0]
    tail = "/".join(parts[i + 2 :])
    if not tail:
        return None
    if tail.startswith(f"{domain}/"):
        return tail
    return f"{domain}/{tail}"


def _infer_registry_key_from_rel(rel: str) -> str | None:
    parts = rel.split("/")
    for j in range(1, len(parts)):
        if parts[j] in REGISTRY_DOMAINS:
            return "/".join(parts[j:])
    return None


def _manifest_key_from_dir(rel: str) -> str | None:
    return _infer_registry_key_from_rel(rel) or _logical_key_from_rel(rel)


def _sdk_from_dir(rel: str) -> str:
    parts = rel.split("/")
    i = _find_sdk_index(parts)
    return parts[i] if i != -1 else ""


def _model_from_dir(rel: str) -> str:
    parts = rel.split("/")
    i = _find_sdk_index(parts)
    return parts[i + 1] if i != -1 and i + 1 < len(parts) else ""


def _is_excluded(rel_dir: str) -> bool:
    parts = rel_dir.split("/")
    i = _find_sdk_index(parts)
    if i == -1:
        return False
    sdk = parts[i]
    model = parts[i + 1] if i + 1 < len(parts) else ""
    return (sdk, model) in EXCLUDED_PAIRS


def _model_rank(model: str) -> int:
    if "gpt-5.1" in model:
        return 1000
    if "gpt-5.2" in model:
        return 999
    if "gpt-5" in model:
        return 998
    if "gpt-4" in model:
        return 997
    if "gpt-oss" in model:
        return 500
    return 0


# ---- alias map (task config_path → manifest key) -------------------------

_TRAILING_ID_RE = re.compile(r"(\d{1,4})$")


def _trailing_id(leaf: str) -> str | None:
    m = _TRAILING_ID_RE.search(leaf)
    return re.sub(r"^0+(\d)", r"\1", m.group(1)) if m else None


def _entry_meta(entry_key: str) -> tuple[str, str, str] | None:
    parts = entry_key.split("/")
    if len(parts) < 2:
        return None
    domain = parts[0]
    leaf = parts[-1]
    typ = next((p for p in parts if p in ("benign", "malicious")), "")
    return domain, typ, leaf


def _config_path_to_key(domain: str, config_path: str) -> str:
    d = re.sub(r"/config\.yaml$", "", config_path, flags=re.IGNORECASE).replace("\\", "/")
    return d if d.startswith(f"{domain}/") else f"{domain}/{d}"


def _build_alias_map(
    entry_keys: list[str], tasks: list[dict[str, str]]
) -> dict[str, str]:
    aliases: dict[str, str] = {}
    if not tasks:
        return aliases

    by_dom_type_id: dict[str, list[str]] = defaultdict(list)
    by_dom_id: dict[str, list[str]] = defaultdict(list)
    keyset = set(entry_keys)

    for k in entry_keys:
        meta = _entry_meta(k)
        if not meta:
            continue
        domain, typ, leaf = meta
        tid = _trailing_id(leaf)
        if not tid:
            continue
        if typ:
            by_dom_type_id[f"{domain}|{typ}|{tid}"].append(k)
        by_dom_id[f"{domain}|{tid}"].append(k)

    for t in tasks:
        tkey = t["key"]
        if tkey in keyset:
            continue
        leaf = tkey.rsplit("/", 1)[-1]
        tid = _trailing_id(leaf) or _trailing_id(
            (t["configPath"].split("/")[-2] if "/" in t["configPath"] else "")
        )
        if not tid:
            continue
        cands = (
            by_dom_type_id.get(f"{t['domain']}|{t['type']}|{tid}")
            or by_dom_id.get(f"{t['domain']}|{tid}")
            or []
        )
        if len(cands) == 1:
            aliases[tkey] = cands[0]
        elif len(cands) > 1:
            tparts = set(tkey.split("/"))
            best = max(cands, key=lambda c: sum(1 for p in c.split("/") if p in tparts))
            aliases[tkey] = best
    return aliases


# ---- scanner -------------------------------------------------------------

def _scan_trajectories(traj_root: Path) -> dict[str, list[dict[str, str]]]:
    """Return {task_key: [{ts, traj_rel, judge_rel, sdk, model}, ...]}."""
    if not traj_root.is_dir():
        return {}

    by_key: dict[str, list[dict[str, str]]] = defaultdict(list)
    for dirpath, _dirnames, filenames in os.walk(traj_root):
        if "judge_result.json" not in filenames:
            continue
        rel_dir = Path(dirpath).relative_to(traj_root).as_posix()
        if not rel_dir or _is_excluded(rel_dir):
            continue

        # Prefer the newest timestamped run, but fall back to a plain
        # trajectory.json when no timestamped file exists (some pipelines
        # emit only that filename per task dir).
        best_name: str | None = None
        best_ts = ""
        for n in filenames:
            m = TRAJ_FILE_RE.match(n)
            if not m:
                continue
            ts = f"{m.group(1)}_{m.group(2)}"
            if ts > best_ts:
                best_ts = ts
                best_name = n
        if not best_name and "trajectory.json" in filenames:
            best_name = "trajectory.json"
            # Use the file's mtime as a stable but synthetic timestamp so
            # downstream ordering still works.
            try:
                mtime = (Path(dirpath) / "trajectory.json").stat().st_mtime
                import datetime as _dt

                best_ts = _dt.datetime.fromtimestamp(mtime).strftime("%Y%m%d_%H%M%S")
            except OSError:
                best_ts = "00000000_000000"
        if not best_name:
            continue

        key = _manifest_key_from_dir(rel_dir)
        if not key:
            continue
        sdk = _sdk_from_dir(rel_dir)
        model = _model_from_dir(rel_dir)
        by_key[key].append(
            {
                "ts": best_ts,
                "traj_rel": f"trajectories/{rel_dir}/{best_name}",
                "judge_rel": f"trajectories/{rel_dir}/judge_result.json",
                "sdk": sdk,
                "model": model,
            }
        )
    return by_key


def _load_task_refs(tasks_dir: Path) -> list[dict[str, str]]:
    if not tasks_dir.is_dir():
        return []
    refs: list[dict[str, str]] = []
    for f in tasks_dir.iterdir():
        if not f.suffix == ".json":
            continue
        try:
            j = json.loads(f.read_bytes())
        except (OSError, ValueError):
            continue
        domain = j.get("domain")
        cp = j.get("config_path")
        if not domain or not cp:
            continue
        refs.append(
            {
                "key": _config_path_to_key(domain, cp),
                "domain": domain,
                "type": j.get("type") or "",
                "configPath": cp,
            }
        )
    return refs


# ---- write SQLite --------------------------------------------------------

def build(data_root: Path, db_path: Path) -> dict[str, int]:
    traj_root = data_root / "trajectories"
    tasks_dir = data_root / "tasks"

    by_key = _scan_trajectories(traj_root)
    tasks = _load_task_refs(tasks_dir)
    aliases = _build_alias_map(list(by_key.keys()), tasks)

    db_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_fd, tmp_name = tempfile.mkstemp(prefix=".trajidx-", dir=str(db_path.parent))
    os.close(tmp_fd)
    tmp_path = Path(tmp_name)
    try:
        con = sqlite3.connect(tmp_path)
        try:
            con.executescript(SCHEMA)
            run_count = 0
            for task_key, cands in by_key.items():
                cands.sort(
                    key=lambda c: (c["ts"], _model_rank(c["model"])), reverse=True
                )
                first_run_id: int | None = None
                for c in cands:
                    cur = con.execute(
                        """INSERT INTO runs
                             (task_key, sdk, model, ts, trajectory_path, judge_path)
                           VALUES (?, ?, ?, ?, ?, ?)""",
                        (
                            task_key,
                            c["sdk"],
                            c["model"],
                            c["ts"],
                            c["traj_rel"],
                            c["judge_rel"],
                        ),
                    )
                    if first_run_id is None:
                        first_run_id = cur.lastrowid
                    run_count += 1
                if first_run_id is not None:
                    con.execute(
                        "INSERT INTO manifest_entries (task_key, default_run_id) VALUES (?, ?)",
                        (task_key, first_run_id),
                    )
            con.executemany(
                "INSERT INTO aliases (alias, target) VALUES (?, ?)",
                list(aliases.items()),
            )
            con.executemany(
                "INSERT INTO manifest_meta (key, value) VALUES (?, ?)",
                [
                    ("version", "2"),
                    ("generated_at", time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())),
                    ("entry_count", str(len(by_key))),
                    ("alias_count", str(len(aliases))),
                    ("run_count", str(run_count)),
                ],
            )
            con.commit()
        finally:
            con.close()
        os.replace(tmp_path, db_path)
        return {"entries": len(by_key), "runs": run_count, "aliases": len(aliases)}
    except BaseException:
        if tmp_path.exists():
            tmp_path.unlink(missing_ok=True)
        raise


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    default_root = Path(
        os.environ.get(
            "DT_DATA_ROOT",
            "/home/zhaorun/decodingtrust-agent.github.io/backend/data",
        )
    )
    p.add_argument("--data-root", type=Path, default=default_root)
    p.add_argument("--db", type=Path, default=None)
    args = p.parse_args()
    data_root = args.data_root.resolve()
    db_path = args.db or (data_root / "trajectory-index.sqlite")

    started = time.time()
    stats = build(data_root, db_path)
    elapsed = time.time() - started
    print(
        f"indexed {stats['entries']} entries / {stats['runs']} runs / "
        f"{stats['aliases']} aliases in {elapsed:.1f}s -> {db_path}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

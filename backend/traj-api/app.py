"""DecodingTrust trajectory + dataset API.

Serves the registry, benchmark, report, and trajectory data that used to ship
inside `frontend/public/data/`. The frontend now fetches everything via this
service (`/traj-api/*` once nginx is fronted in front of it).

Listens on 127.0.0.1:12001 by default. See deploy/decodingtrust-trajapi.service.
"""
from __future__ import annotations

import json
import os
import re
import sqlite3
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, Response

DATA_ROOT = Path(os.environ.get("DT_DATA_ROOT", "/home/zhaorun/decodingtrust-agent.github.io/backend/data")).resolve()
INDEX_DB = DATA_ROOT / "trajectory-index.sqlite"

# ---- bootstrapping --------------------------------------------------------

@asynccontextmanager
async def lifespan(_: FastAPI):
    if not DATA_ROOT.is_dir():
        raise RuntimeError(f"DT_DATA_ROOT {DATA_ROOT} not found")
    yield


app = FastAPI(title="DecodingTrust trajectory API", lifespan=lifespan)
app.add_middleware(GZipMiddleware, minimum_size=512)


def _connect() -> sqlite3.Connection:
    if not INDEX_DB.exists():
        raise HTTPException(503, "trajectory index not built yet (run indexer.py)")
    con = sqlite3.connect(f"file:{INDEX_DB}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    return con


def _read_json(path: Path) -> Any:
    if not path.is_file():
        raise HTTPException(404, f"not found: {path.name}")
    with path.open("rb") as f:
        return json.loads(f.read())


# ---- /health --------------------------------------------------------------

@app.get("/health")
def health() -> dict[str, Any]:
    info: dict[str, Any] = {"status": "ok", "data_root": str(DATA_ROOT)}
    if INDEX_DB.exists():
        with _connect() as con:
            row = con.execute(
                "SELECT value FROM manifest_meta WHERE key = 'entry_count'"
            ).fetchone()
            info["entry_count"] = int(row[0]) if row else None
            info["index_size_mb"] = round(INDEX_DB.stat().st_size / 1_048_576, 2)
    else:
        info["entry_count"] = None
    return info


# ---- registry / dataset ---------------------------------------------------

@app.get("/registry")
def registry() -> Response:
    """Return the tasks-index.json contents (registry listing)."""
    return FileResponse(DATA_ROOT / "tasks-index.json", media_type="application/json")


_SLUG_RE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9_\-]*$")


@app.get("/registry/{slug}")
def registry_task(slug: str) -> Response:
    if not _SLUG_RE.match(slug):
        raise HTTPException(400, "invalid slug")
    path = DATA_ROOT / "tasks" / f"{slug}.json"
    if not path.is_file():
        raise HTTPException(404, "task not found")
    return FileResponse(path, media_type="application/json")


@app.get("/benchmark")
def benchmark() -> Response:
    return FileResponse(DATA_ROOT / "benchmark-data.json", media_type="application/json")


@app.get("/report")
def report(version: str = Query("current", pattern="^(current|0313|0308)$")) -> Response:
    name = "report-data.json" if version in ("current", "0308") else "report-data-0313.json"
    return FileResponse(DATA_ROOT / name, media_type="application/json")


# ---- trajectories ---------------------------------------------------------

# Mirrors frontend/lib/trajectory-keys.ts.
def _config_path_to_dir(config_path: str) -> str:
    return re.sub(r"/config\.yaml$", "", config_path, flags=re.IGNORECASE).replace("\\", "/")


def _under_attack_key(task: dict[str, Any]) -> str | None:
    cp = task.get("config_path")
    return _config_path_to_dir(cp) if cp else None


def _no_attack_key(task: dict[str, Any], all_keys: set[str]) -> str | None:
    domain = task.get("domain")
    if not domain:
        return None
    base = task.get("base_task")
    if base:
        k = f"{domain}/{base}".replace("\\", "/")
        return k if k in all_keys else None
    cp = task.get("config_path") or ""
    mdir = _config_path_to_dir(cp)
    if "/malicious/" not in mdir:
        return None
    leaf = mdir.rsplit("/", 1)[-1]
    m = re.search(r"-(\d+)$", leaf) or re.match(r"^(\d+)$", leaf)
    if not m:
        return None
    tid = m.group(1)
    exact = f"{domain}/benign/{tid}"
    if exact in all_keys:
        return exact
    prefix = f"{domain}/benign/"
    for k in all_keys:
        if not k.startswith(prefix):
            continue
        seg = k.rsplit("/", 1)[-1]
        if seg == tid or seg.endswith(f"-{tid}"):
            return k
    return None


_EXCLUDED_FRAGMENTS = ("/openaisdk/gpt-5.1/",)


def _is_excluded(path: str | None) -> bool:
    return bool(path) and any(f in path for f in _EXCLUDED_FRAGMENTS)


def _resolve_key(con: sqlite3.Connection, raw: str) -> str | None:
    """Return the entry key, following an alias if necessary."""
    row = con.execute("SELECT 1 FROM manifest_entries WHERE task_key = ?", (raw,)).fetchone()
    if row:
        return raw
    row = con.execute("SELECT target FROM aliases WHERE alias = ?", (raw,)).fetchone()
    if row and con.execute(
        "SELECT 1 FROM manifest_entries WHERE task_key = ?", (row[0],)
    ).fetchone():
        return row[0]
    return None


def _read_judge_inline(judge_path: str) -> dict:
    try:
        rel = judge_path.lstrip("/")
        full = (DATA_ROOT / rel).resolve()
        full.relative_to(DATA_ROOT)
        if full.is_file():
            return json.loads(full.read_bytes())
    except Exception:
        pass
    return {}


def _entry_for_key(con: sqlite3.Connection, key: str) -> dict[str, Any] | None:
    rows = con.execute(
        """SELECT run_id, sdk, model, ts, trajectory_path, judge_path
             FROM runs WHERE task_key = ? ORDER BY ts DESC""",
        (key,),
    ).fetchall()
    runs = []
    for r in rows:
        if _is_excluded(r["trajectory_path"]) or _is_excluded(r["judge_path"]):
            continue
        jdata = _read_judge_inline(r["judge_path"])
        runs.append(
            {
                "run_id": r["run_id"],
                "sdk": r["sdk"],
                "model": r["model"],
                "ts": r["ts"],
                "trajectory": f"/traj-api/trajectories/run/{r['run_id']}/trace",
                "judge": f"/traj-api/trajectories/run/{r['run_id']}/judge",
                "attack_success": jdata.get("attack_success"),
                "task_success": jdata.get("task_success"),
            }
        )
    if not runs:
        return None
    head = runs[0]
    return {
        "key": key,
        "trajectory": head["trajectory"],
        "judge": head["judge"],
        "runs": runs,
    }


@app.get("/trajectories/for-task")
def trajectories_for_task(slug: str = Query(...)) -> dict[str, Any]:
    """Return the trajectory entries for one registry task.

    Replaces the previous full-manifest download. The frontend gives us a
    registry slug; we resolve it to the underAttack / noAttack manifest
    keys and return only those entries.
    """
    if not _SLUG_RE.match(slug):
        raise HTTPException(400, "invalid slug")
    task_path = DATA_ROOT / "tasks" / f"{slug}.json"
    if not task_path.is_file():
        raise HTTPException(404, "task not found")
    task = _read_json(task_path)

    out: dict[str, Any] = {"slug": slug, "no_attack": None, "under_attack": None}
    is_malicious = task.get("type") == "malicious"

    with _connect() as con:
        all_keys = {
            r[0] for r in con.execute("SELECT task_key FROM manifest_entries").fetchall()
        }

        # under_attack: only relevant when malicious
        if is_malicious:
            raw = _under_attack_key(task)
            if raw:
                key = _resolve_key(con, raw) or (raw if raw in all_keys else None)
                if key:
                    out["under_attack"] = _entry_for_key(con, key)

        # no_attack: benign baseline (for benign tasks just use the task itself)
        if is_malicious:
            raw = _no_attack_key(task, all_keys)
        else:
            raw = _under_attack_key(task)  # benign tasks: same key
        if raw:
            key = _resolve_key(con, raw) or (raw if raw in all_keys else None)
            if key:
                out["no_attack"] = _entry_for_key(con, key)

    return out


@app.get("/trajectories/run/{run_id}/trace")
def trajectory_trace(run_id: int) -> Response:
    return _serve_run_file(run_id, "trajectory_path")


@app.get("/trajectories/run/{run_id}/judge")
def trajectory_judge(run_id: int) -> Response:
    return _serve_run_file(run_id, "judge_path")


def _serve_run_file(run_id: int, column: str) -> Response:
    if column not in ("trajectory_path", "judge_path"):
        raise HTTPException(400, "bad column")
    with _connect() as con:
        row = con.execute(
            f"SELECT {column} AS p FROM runs WHERE run_id = ?", (run_id,)
        ).fetchone()
    if not row or not row["p"]:
        raise HTTPException(404, "run not found")
    rel = row["p"].lstrip("/")
    full = (DATA_ROOT / rel).resolve()
    # Path-traversal guard: must stay under DATA_ROOT.
    try:
        full.relative_to(DATA_ROOT)
    except ValueError:
        raise HTTPException(400, "bad path")
    if not full.is_file():
        raise HTTPException(404, "file missing on disk")
    return FileResponse(
        full,
        media_type="application/json",
        headers={"Cache-Control": "public, max-age=86400"},
    )


@app.get("/trajectories/manifest-stats")
def trajectories_manifest_stats() -> dict[str, Any]:
    with _connect() as con:
        meta = {
            r["key"]: r["value"]
            for r in con.execute("SELECT key, value FROM manifest_meta").fetchall()
        }
    return {
        "version": int(meta.get("version", "1")),
        "entry_count": int(meta.get("entry_count", "0")),
        "generated_at": meta.get("generated_at"),
    }



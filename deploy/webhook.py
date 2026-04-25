#!/usr/bin/env python3
"""
GitHub webhook listener for self-hosted deploys of decodingtrust-agent.com.

Reads everything from env (loaded by systemd from /etc/decodingtrust-webhook.env):

    DT_WEBHOOK_SECRET    = HMAC-SHA256 secret shared with GitHub (required)
    DT_WEBHOOK_BIND      = bind address (default 127.0.0.1)
    DT_WEBHOOK_PORT      = bind port    (default 9001)
    DT_WEBHOOK_BRANCH    = git ref to react to (default refs/heads/main)
    DT_WEBHOOK_REPO_DIR  = repo root            (required)
    DT_WEBHOOK_LOG_DIR   = where deploy logs go (default /var/log/dt-deploy)

Endpoints (everything else 404s):

    GET  /healthz             -> 200 "ok"
    GET  /status              -> JSON: last/in-flight deploy info
    POST /github              -> verify HMAC signature, queue a deploy

Behaviour:

  * verifies X-Hub-Signature-256 in constant time
  * only acts on `push` events to the configured ref
  * one deploy at a time (a global lock); concurrent webhooks return 202
    "deploy already running" without queuing further
  * deploy runs `bash <repo>/deploy/redeploy.sh --no-pull` in a subprocess
    after we explicitly fetch+reset to GitHub's pushed sha (so a force-push
    is honoured); stdout+stderr captured to <log_dir>/<ts>-<sha>.log
  * exit codes / failures reflected in /status
"""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os
import subprocess
import sys
import threading
import time
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

# --------------------------------------------------------------------------
# Config from env
# --------------------------------------------------------------------------

SECRET = os.environ.get("DT_WEBHOOK_SECRET", "").encode()
BIND = os.environ.get("DT_WEBHOOK_BIND", "127.0.0.1")
PORT = int(os.environ.get("DT_WEBHOOK_PORT", "9001"))
BRANCH = os.environ.get("DT_WEBHOOK_BRANCH", "refs/heads/main")
REPO_DIR = Path(os.environ.get("DT_WEBHOOK_REPO_DIR", "")).resolve()
LOG_DIR = Path(os.environ.get("DT_WEBHOOK_LOG_DIR", "/var/log/dt-deploy"))

if not SECRET:
    sys.exit("DT_WEBHOOK_SECRET is required")
if not REPO_DIR or not REPO_DIR.exists():
    sys.exit(f"DT_WEBHOOK_REPO_DIR is missing or doesn't exist: {REPO_DIR}")
LOG_DIR.mkdir(parents=True, exist_ok=True)

REDEPLOY = REPO_DIR / "deploy" / "redeploy.sh"
if not REDEPLOY.exists():
    sys.exit(f"redeploy script missing: {REDEPLOY}")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("dt-webhook")

# --------------------------------------------------------------------------
# Deploy state (single global, mutex-guarded)
# --------------------------------------------------------------------------

_state_lock = threading.Lock()
_deploy_lock = threading.Lock()
_state: dict = {
    "running": False,
    "last_started_at": None,
    "last_finished_at": None,
    "last_sha": None,
    "last_exit_code": None,
    "last_log": None,
}


def _set_state(**kwargs):
    with _state_lock:
        _state.update(kwargs)


def _get_state() -> dict:
    with _state_lock:
        return dict(_state)


def run_deploy(sha: str, ref: str, pusher: str) -> None:
    """Execute redeploy.sh; lock guarantees one at a time."""
    if not _deploy_lock.acquire(blocking=False):
        log.warning("deploy already running, dropping push %s", sha[:7])
        return
    try:
        ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        log_path = LOG_DIR / f"{ts}-{sha[:12]}.log"
        _set_state(
            running=True,
            last_started_at=ts,
            last_sha=sha,
            last_log=str(log_path),
            last_exit_code=None,
            last_finished_at=None,
        )
        log.info("deploy %s starting (ref=%s pusher=%s) -> %s", sha[:7], ref, pusher, log_path)

        with log_path.open("w") as fh:
            fh.write(f"# deploy {sha} (ref={ref}, pusher={pusher})\n# started at {ts}\n\n")
            fh.flush()

            # 1) align working tree with the just-pushed sha (handles force-push).
            #    NB: deliberately no `git clean` — we keep untracked files like
            #    `frontend/public/data/trajectories/` (3.2 GB, served by nginx)
            #    and any locally generated build state.
            for cmd in (
                ["git", "fetch", "--prune", "origin"],
                ["git", "reset", "--hard", sha],
            ):
                fh.write(f"\n$ {' '.join(cmd)}\n")
                fh.flush()
                rc = subprocess.run(cmd, cwd=REPO_DIR, stdout=fh, stderr=subprocess.STDOUT).returncode
                if rc != 0:
                    fh.write(f"\n!! git step failed (rc={rc}); aborting\n")
                    _set_state(
                        running=False,
                        last_finished_at=datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ"),
                        last_exit_code=rc,
                    )
                    log.error("deploy %s git step failed rc=%d", sha[:7], rc)
                    return

            # 2) build + restart (redeploy.sh skips its own pull because we just did it).
            fh.write(f"\n$ bash {REDEPLOY} --no-pull\n")
            fh.flush()
            rc = subprocess.run(
                ["bash", str(REDEPLOY), "--no-pull"],
                cwd=REPO_DIR,
                stdout=fh,
                stderr=subprocess.STDOUT,
            ).returncode
            fh.write(f"\n# done; exit={rc}\n")

        _set_state(
            running=False,
            last_finished_at=datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ"),
            last_exit_code=rc,
        )
        log.info("deploy %s done rc=%d", sha[:7], rc)
    finally:
        _deploy_lock.release()


# --------------------------------------------------------------------------
# HTTP
# --------------------------------------------------------------------------


def verify(body: bytes, sig_header: str | None) -> bool:
    if not sig_header or not sig_header.startswith("sha256="):
        return False
    expected = "sha256=" + hmac.new(SECRET, body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, sig_header)


class Handler(BaseHTTPRequestHandler):
    server_version = "dt-webhook/1.0"

    # Quieter access log; we still log meaningful events ourselves.
    def log_message(self, fmt: str, *args) -> None:
        log.info("%s - %s", self.address_string(), fmt % args)

    def _send(self, status: int, body: bytes = b"", ctype: str = "text/plain"):
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if body:
            self.wfile.write(body)

    def do_GET(self) -> None:
        if self.path == "/healthz":
            self._send(HTTPStatus.OK, b"ok\n")
            return
        if self.path == "/status":
            payload = json.dumps(_get_state(), indent=2, sort_keys=True).encode() + b"\n"
            self._send(HTTPStatus.OK, payload, "application/json")
            return
        self._send(HTTPStatus.NOT_FOUND, b"not found\n")

    def do_POST(self) -> None:
        if self.path != "/github":
            self._send(HTTPStatus.NOT_FOUND, b"not found\n")
            return

        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length) if length > 0 else b""

        sig = self.headers.get("X-Hub-Signature-256")
        if not verify(body, sig):
            log.warning("rejected webhook (bad signature) from %s", self.address_string())
            self._send(HTTPStatus.UNAUTHORIZED, b"bad signature\n")
            return

        event = self.headers.get("X-GitHub-Event", "")
        if event == "ping":
            self._send(HTTPStatus.OK, b"pong\n")
            return
        if event != "push":
            self._send(HTTPStatus.OK, b"ignored (not push)\n")
            return

        try:
            payload = json.loads(body or b"{}")
        except json.JSONDecodeError:
            self._send(HTTPStatus.BAD_REQUEST, b"invalid json\n")
            return

        ref = payload.get("ref", "")
        if ref != BRANCH:
            self._send(HTTPStatus.OK, f"ignored (ref={ref})\n".encode())
            return

        sha = payload.get("after") or ""
        if not sha or len(sha) < 7:
            self._send(HTTPStatus.BAD_REQUEST, b"missing sha\n")
            return
        # GitHub sends "0000…" when a ref is deleted; ignore those.
        if set(sha) == {"0"}:
            self._send(HTTPStatus.OK, b"ignored (deleted)\n")
            return

        pusher = (payload.get("pusher") or {}).get("name") or "?"
        log.info("accepting push %s by %s on %s", sha[:7], pusher, ref)

        # Spin up deploy in the background; respond immediately.
        threading.Thread(
            target=run_deploy,
            args=(sha, ref, pusher),
            name=f"deploy-{sha[:7]}",
            daemon=True,
        ).start()

        body = f"queued deploy of {sha[:7]} (ref={ref})\n".encode()
        self._send(HTTPStatus.ACCEPTED, body)


def main() -> None:
    httpd = ThreadingHTTPServer((BIND, PORT), Handler)
    log.info("dt-webhook listening on http://%s:%d (repo=%s, branch=%s)", BIND, PORT, REPO_DIR, BRANCH)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()

#!/usr/bin/env bash
# Rebuild Next.js and restart the systemd unit. Run as the checkout owner
# (zhaorun); the restart step uses passwordless sudo (see /etc/sudoers.d/
# zhaorun-dt-deploy) so this works fine from cron / webhook.
#
# Usage:
#   bash deploy/redeploy.sh           # git pull + npm install + build + restart
#   bash deploy/redeploy.sh --no-pull # skip git pull (webhook pre-fetched)
#   bash deploy/redeploy.sh --no-deps # skip npm install (lockfile unchanged)
#
# `npm install` is auto-skipped when package-lock.json is unchanged since the
# last successful build (tracked by .next/.lockfile-sha).
#
# Also rebuilds the trajectory SQLite index (auto-skipped when the trajectory
# tree mtime hasn't changed). Pass --force-reindex to rebuild unconditionally
# or --no-reindex to skip even when the tree changed.

set -euo pipefail
shopt -s extglob

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND="${REPO_ROOT}/frontend"
TRAJAPI="${REPO_ROOT}/backend/traj-api"
SERVICE="decodingtrust-frontend.service"
TRAJAPI_SERVICE="decodingtrust-trajapi.service"
LOCK_MARKER="${FRONTEND}/.next/.lockfile-sha"
TRAJAPI_LOCK_MARKER="${TRAJAPI}/.venv/.requirements-sha"
TRAJ_TREE="${REPO_ROOT}/backend/data/trajectories"
INDEX_DB="${REPO_ROOT}/backend/data/trajectory-index.sqlite"
INDEX_MARKER="${INDEX_DB}.sha"

PULL=1
DEPS=auto
REINDEX=auto
for arg in "$@"; do
  case "$arg" in
    --no-pull) PULL=0 ;;
    --no-deps) DEPS=0 ;;
    --force-deps) DEPS=1 ;;
    --no-reindex) REINDEX=0 ;;
    --force-reindex) REINDEX=1 ;;
    -h|--help)
      sed -n '2,15p' "$0"; exit 0 ;;
    *) echo "Unknown arg: $arg" >&2; exit 2 ;;
  esac
done

ts() { date -u '+%Y-%m-%dT%H:%M:%SZ'; }
log() { printf '[%s] %s\n' "$(ts)" "$*"; }

cd "$REPO_ROOT"
if [[ "$PULL" == 1 ]]; then
  log "==> git pull --ff-only"
  git pull --ff-only
fi

cd "$FRONTEND"

if [[ "$DEPS" == "auto" ]]; then
  current_sha=$(sha256sum package-lock.json | awk '{print $1}')
  if [[ -f "$LOCK_MARKER" ]] && [[ "$(cat "$LOCK_MARKER")" == "$current_sha" ]]; then
    DEPS=0
    log "lockfile unchanged ($current_sha) — skipping npm install"
  else
    DEPS=1
  fi
fi

if [[ "$DEPS" == 1 ]]; then
  log "==> npm install"
  npm install --no-audit --no-fund
fi

log "==> next build"
rm -rf .next
npm run build

if [[ -f package-lock.json ]]; then
  mkdir -p .next
  sha256sum package-lock.json | awk '{print $1}' > "$LOCK_MARKER"
fi

log "==> restart $SERVICE"
if systemctl is-enabled "$SERVICE" >/dev/null 2>&1; then
  sudo -n systemctl restart "$SERVICE"
  sudo -n systemctl status "$SERVICE" --no-pager --lines=5 || true
else
  log "!! $SERVICE not installed yet; see deploy/README.md"
  exit 1
fi

# ---- trajectory API: pip install + reindex + restart ---------------------
if [[ -d "$TRAJAPI" ]]; then
  cd "$TRAJAPI"
  if [[ ! -d .venv ]]; then
    log "==> creating $TRAJAPI/.venv"
    python3 -m venv .venv
  fi
  current_req_sha=$(sha256sum requirements.txt | awk '{print $1}')
  if [[ ! -f "$TRAJAPI_LOCK_MARKER" ]] || [[ "$(cat "$TRAJAPI_LOCK_MARKER")" != "$current_req_sha" ]]; then
    log "==> traj-api: pip install -r requirements.txt"
    .venv/bin/pip install --quiet -r requirements.txt
    echo "$current_req_sha" > "$TRAJAPI_LOCK_MARKER"
  fi

  if [[ "$REINDEX" == "auto" ]]; then
    if [[ ! -f "$INDEX_DB" ]]; then
      REINDEX=1
    elif [[ -d "$TRAJ_TREE" ]]; then
      tree_sig=$(stat -c '%Y' "$TRAJ_TREE")
      if [[ ! -f "$INDEX_MARKER" ]] || [[ "$(cat "$INDEX_MARKER")" != "$tree_sig" ]]; then
        REINDEX=1
      else
        REINDEX=0
        log "trajectory tree unchanged ($tree_sig) — skipping reindex"
      fi
    else
      REINDEX=0
    fi
  fi

  if [[ "$REINDEX" == 1 ]]; then
    log "==> traj-api: rebuilding SQLite index"
    .venv/bin/python indexer.py
    if [[ -d "$TRAJ_TREE" ]]; then
      stat -c '%Y' "$TRAJ_TREE" > "$INDEX_MARKER"
    fi
  fi

  log "==> restart $TRAJAPI_SERVICE"
  if systemctl is-enabled "$TRAJAPI_SERVICE" >/dev/null 2>&1; then
    sudo -n systemctl restart "$TRAJAPI_SERVICE"
    sudo -n systemctl status "$TRAJAPI_SERVICE" --no-pager --lines=3 || true
  else
    log "!! $TRAJAPI_SERVICE not installed; see deploy/README.md"
  fi
fi

log "==> done"

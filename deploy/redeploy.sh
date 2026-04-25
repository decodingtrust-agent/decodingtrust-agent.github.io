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

set -euo pipefail
shopt -s extglob

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND="${REPO_ROOT}/frontend"
SERVICE="decodingtrust-frontend.service"
LOCK_MARKER="${FRONTEND}/.next/.lockfile-sha"

PULL=1
DEPS=auto
for arg in "$@"; do
  case "$arg" in
    --no-pull) PULL=0 ;;
    --no-deps) DEPS=0 ;;
    --force-deps) DEPS=1 ;;
    -h|--help)
      sed -n '2,11p' "$0"; exit 0 ;;
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

log "==> done"

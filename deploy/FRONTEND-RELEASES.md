# Frontend releases

The production website is https://decodingtrust-agent.com on SSH host `dtap-website` (`204.168.151.250`).
Source is checked out at `/home/zhaorun/decodingtrust-agent.github.io` and owned by `zhaorun`.
Deploy a pushed, reviewed commit; merging the GitHub PR is a separate user action.

## Layout

```text
/home/zhaorun/decodingtrust-frontend-releases/
  <commit>/                     # git archive of the exact deployed commit
    frontend/                   # npm ci, generated public assets and .next build
    deployment-backup/          # Previous frontend unit configuration and working directory
    .release-commit             # Full source SHA
  current -> <commit>
```

The systemd drop-in `/etc/systemd/system/decodingtrust-frontend.service.d/10-release.conf` sets
`WorkingDirectory` to `current/frontend` and `DT_DATA_ROOT` to the original checkout's `backend/data`.
The base unit, `/etc/decodingtrust-frontend.env`, nginx and the trajectory service remain the shared configuration.

## Deploy

1. Check the live frontend and API, record the API PID/start time and confirm the source checkout is clean.
   Fetch the pushed branch as `zhaorun` and resolve its full SHA. Never reset a dirty checkout.
2. Create a new release directory owned by `zhaorun`. Extract `git archive <sha>` from the source repository
   into it and record the SHA in `.release-commit`. Keep the current serving directory intact.
3. In the release's `frontend`, run `npm ci --include=dev --no-audit --no-fund` and
   `npx tsc --noEmit --incremental false`. Build with `npm run build`, `DT_BUILD_WORKERS=4` and
   `DT_DATA_ROOT=/home/zhaorun/decodingtrust-agent.github.io/backend/data`.
   A root-owned transient systemd build unit can load the existing frontend `EnvironmentFile` while
   running the build as `zhaorun`. This preserves build-time public configuration without copying secrets.
4. Start a transient candidate service on `127.0.0.1:3101` from the new release, using the same environment file.
   Check `/`, `/benchmark`, `/benchmarks`, `/benchmarks/dtap-mas`, `/leaderboard`, `/leaderboard/dtap-mas`
   and the MAS visualization assets and task JSON. Stop the candidate after verification.
5. Save the previous service working directory, current symlink target and existing `10-release.conf`
   (or its absence) under the new release's `deployment-backup/`. Preserve file permissions when backing up.
   Sync the source checkout to the same pushed commit by fast-forward or tracking branch checkout.
6. Atomically replace `current` using a temporary symlink and `mv -T`. Install the drop-in:

   ```ini
   [Service]
   WorkingDirectory=/home/zhaorun/decodingtrust-frontend-releases/current/frontend
   Environment=DT_DATA_ROOT=/home/zhaorun/decodingtrust-agent.github.io/backend/data
   ```

   Run `systemctl daemon-reload` and `systemctl restart decodingtrust-frontend` as root.
7. Verify the public pages, disabled benchmark menus, task tabs and leaderboard tables in a browser.
   Confirm the source checkout, `.release-commit` and GitHub branch point to the same SHA.
   Confirm the trajectory API PID and data file metadata are unchanged.

The existing `redeploy.sh` builds in the source checkout and also manages the trajectory API.
Use the release workflow for frontend-only updates to this layout. No automatic deployment hook is installed.

## Rollback

Restore the previous `current` target and backed-up `10-release.conf`; if the drop-in was originally absent,
remove the new drop-in so the base unit's original working directory takes effect. Run
`systemctl daemon-reload` and restart only `decodingtrust-frontend`, then verify public pages.
The original checkout's `.next` and earlier release directories are retained. Keep the GitHub feature branch
and PR available for inspection; a runtime rollback does not require rewriting Git history.

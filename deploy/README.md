# Self-hosted deployment

We're moving the site off GitHub Pages and hosting both the Next.js frontend
and the trajectory data on this VM (public IP `35.193.39.86`). The dt-auth
backend continues to listen on `:12000` and is reverse-proxied at `/auth-api/`.

```
                              ┌─────────────────────────────────┐
                              │ this server (35.193.39.86)      │
   client ──HTTPS──▶  nginx ──┼─▶ next start (loopback :3000)   │
                              │ ├─▶ /data/  → public/data/      │
                              │ │   (trajectory JSON, served    │
                              │ │   directly by nginx)          │
                              │ └─▶ /auth-api/ → :12000 dt-auth │
                              └─────────────────────────────────┘
```

The repo is laid out so that everything in `deploy/` is _files we copy onto
the host_ (nginx site, systemd unit, env example, helper scripts).

## Files in this folder

| File | Where it ends up |
|---|---|
| `nginx-staging.conf` | `/etc/nginx/sites-available/decodingtrust-agent-staging.conf` (temporary `:8088` for IP-based smoke tests, leaves the existing `agentsuite-red.virtueai.cc` config untouched) |
| `nginx-prod.conf` | `/etc/nginx/sites-available/decodingtrust-agent.conf` (final domain config) |
| `decodingtrust-frontend.service` | `/etc/systemd/system/decodingtrust-frontend.service` |
| `decodingtrust-frontend.env.example` | template for `/etc/decodingtrust-frontend.env` (chmod 600, root) |
| `redeploy.sh` | run on the host whenever code changes (`git pull` → `npm install` → `next build` → `systemctl restart`) |

## Phase 1 — local smoke test (no DNS change required)

This brings the new stack up on `http://35.193.39.86:8088/` while the old
GitHub Pages site at `decodingtrust-agent.com` keeps serving traffic.

```bash
# 1. Build once.
cd ~/decodingtrust-agent.github.io/frontend
rm -rf .next
npm run build      # ~2 min, prerenders 6.7k pages

# 2. Install systemd unit.
sudo cp ../deploy/decodingtrust-frontend.service /etc/systemd/system/
sudo cp ../deploy/decodingtrust-frontend.env.example /etc/decodingtrust-frontend.env
sudo chmod 600 /etc/decodingtrust-frontend.env
sudo $EDITOR /etc/decodingtrust-frontend.env   # plug in real Supabase keys
sudo systemctl daemon-reload
sudo systemctl enable --now decodingtrust-frontend.service
journalctl -u decodingtrust-frontend.service -f   # watch boot

# 3. Install staging nginx site.
sudo cp ../deploy/nginx-staging.conf \
   /etc/nginx/sites-available/decodingtrust-agent-staging.conf
sudo ln -sf /etc/nginx/sites-available/decodingtrust-agent-staging.conf \
   /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx

# 4. (GCE / cloud firewall) open port 8088 to the public Internet.
#    On bare metal: sudo ufw allow 8088/tcp

# 5. Smoke test:
curl -sI http://35.193.39.86:8088/ | head -3
curl -sI http://35.193.39.86:8088/registry/customer-service-malicious-indirect-financial_fraud-001 | head -3
curl -sI http://35.193.39.86:8088/data/trajectory-manifest.json | head -3
```

If everything responds `HTTP/1.1 200`, open
`http://35.193.39.86:8088/registry/customer-service-malicious-indirect-financial_fraud-001`
in a browser and verify the Trajectory tab loads runs.

## Phase 2 — DNS cutover

When you're ready to flip the domain:

1. **DNS records** at the registrar (Namecheap, Cloudflare, …):
   - `decodingtrust-agent.com` → A `35.193.39.86`
   - `www.decodingtrust-agent.com` → CNAME `decodingtrust-agent.com`
   - Lower the TTL beforehand (300s) so rollback is fast.

2. **Disable GitHub Pages**: GitHub repo → Settings → Pages → Source = None.
   Delete the root `CNAME` file (and `frontend/CNAME` if present).

3. **Install the prod nginx site**:
   ```bash
   sudo cp deploy/nginx-prod.conf /etc/nginx/sites-available/decodingtrust-agent.conf
   sudo ln -sf /etc/nginx/sites-available/decodingtrust-agent.conf /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/decodingtrust-agent-staging.conf  # optional
   sudo nginx -t && sudo systemctl reload nginx
   ```

4. **HTTPS** — pick one path:

   - **Cloudflare proxy (easiest)**: add the domain to Cloudflare, enable the
     orange-cloud proxy. Cloudflare terminates TLS at the edge and talks
     plain HTTP to nginx. After both ends speak HTTPS, set SSL/TLS mode to
     `Full`.
   - **Let's Encrypt direct**:
     ```bash
     sudo apt install -y certbot python3-certbot-nginx
     sudo certbot --nginx \
        -d decodingtrust-agent.com -d www.decodingtrust-agent.com
     ```
     This rewrites `nginx-prod.conf` in place to add the `:443` block + http→https redirect.

5. **Open ports** at the firewall: 80 + 443 inbound.

## Phase 3 — ongoing operation

```bash
# Rebuild and restart after a `git pull`:
bash ~/decodingtrust-agent.github.io/deploy/redeploy.sh

# Logs
journalctl -u decodingtrust-frontend.service -f
sudo tail -f /var/log/nginx/decodingtrust-agent.access.log

# Trajectory data refresh (after dropping new zips into ~/decodingtrust-agent.github.io/trajectory):
cd ~/decodingtrust-agent.github.io/frontend
npm run trajectories:unpack   # unzip + rebuild manifest

# Status
systemctl status decodingtrust-frontend.service
systemctl status nginx
```

## Trajectories — why nginx serves them directly

`public/data/trajectories/` is 3.2 GB / 127k files. Going through Next.js
adds latency for every request and burns memory. The nginx `location /data/`
block in both staging and prod configs is an `alias` to that directory so:

- `sendfile` + `tcp_nopush` push files to the kernel.
- gzip cuts ~20 MB JSONs to a few MB on the wire.
- Cached for a day; manifest URLs embed timestamps so they're effectively
  immutable.

The frontend (`components/registry/trajectory-tab.tsx`) fetches absolute
paths like `/data/trajectory-manifest.json` and
`/data/trajectories/.../judge_result.json` — those get matched by the nginx
`location /data/` block and never hit Next.js.

## What the user has to do (DNS + GitHub side)

1. Send the registrar's A-record/admin URL once you're ready.
2. Disable GitHub Pages on the `decodingtrust-agent.github.io` repo.
3. Either give me the Cloudflare account token or run `certbot` yourself.

# VPS Migration Plan: Railway + GitHub Pages → one Docker host

Status: **proposal** (2026-10-21). Nothing in this document is deployed yet.

The backend has been offline since the Railway trial ended. This plan moves
the whole product (site, API, database, TLS, backups) onto one small VPS
running Docker Compose and serves everything from one origin:
`https://study.faustze.tech`.

---

## 1. Target architecture

```
Internet ──► :80 / :443 ──► proxy   Caddy 2.11, Let's Encrypt certificates
                              ├─ /api/*, /health ──► api   FastAPI, uvicorn, 1 worker
                              │                       └──► db   Postgres 16, volume pgdata
                              └─ everything else ──► web   Caddy serving the `nuxt generate` output

networks:  edge = proxy, web, api       db = api, db (internal: no internet, no published ports)
published: 80/tcp, 443/tcp, 443/udp only
```

| Container | Image | Notes |
| --- | --- | --- |
| proxy | `caddy:2.11-alpine` | TLS, HTTP→HTTPS, security headers, routing |
| web | `ghcr.io/faustzer/frontend-study-lab-web:<sha>` | Static SPA; unknown paths fall back to `200.html` |
| api | `ghcr.io/faustzer/frontend-study-lab-api:<sha>` | `backend/Dockerfile`; runs `alembic upgrade head` on start |
| db | `postgres:16-alpine` | Same major as local dev and the tests |

**Why one origin:**
- No CORS. The client already falls back to `/api` (`frontend/api/client.ts`),
  so the per-environment `VITE_API_URL` goes away, and the same web image
  works on any host.
- The OAuth redirect URI and `FRONTEND_URL` use the same host.
- It makes the httpOnly-cookie auth from Known issues possible later.

**Trade-off:** the site now depends on the VPS being up; Pages was a free
CDN. That is acceptable for this project. Pages stays available as a
fallback until the cleanup phase (see Rollback).

**Images are built in GitHub Actions and pulled by the VPS** instead of
being built on the box. That keeps pnpm install and the Vite build off a
1 GB machine, and every deploy is a fixed image tag that can be rolled
back. The repository is public, so the GHCR packages can be public and the
VPS pulls them without credentials. There is no token to expire, unlike
`BOT_PAT`.

---

## 2. What was verified locally (2026-10-20)

The configs in the Appendix (A–F) were run as a stack on Docker 29 /
Compose 5.6, with Caddy's internal CA on `localhost:8443`:

- `/`, deep links (`/js-core/debounce`, `/auth/callback`) and unknown paths
  return the SPA. In Chromium the app renders with no console errors.
- `/health` → 200, `/api/auth/me` → 401, `POST /api/auth/dev-login` → 404
  (disabled).
- `/api/auth/google` → 302 to Google with
  `redirect_uri=https://…/api/auth/google/callback`. With `FORWARDED_ALLOW_IPS`
  left at uvicorn's default the URI becomes `http://…`, which Google would
  reject. So the proxy trust is required, and scoping it to the edge network
  replaces today's `--forwarded-allow-ips='*'`.
- An authenticated progress flow (dev-login enabled for that one test)
  works through the proxy, and client-sent XP is still ignored.
- Postgres cannot be reached from the edge network.
- A `pg_dump -Fc` restored into a fresh Postgres 16 has schema
  `b3c1d2e4f5a6` and the data.
- Responses carry HSTS, `nosniff` and Referrer-Policy; `/_nuxt/*` is
  served `immutable` and gzip-encoded.
- Idle memory: api 68 MiB, db 64 MiB, proxy 17 MiB, web 13 MiB (about
  160 MiB in total). Images: web 68 MB, api 233 MB.

**Not run yet:** `deploy.sh`, `backup.sh` and the release workflow
(Appendix G–I). They have only been checked statically:
- shellcheck and actionlint are clean;
- `deploy.sh` accepts a 40-character hex SHA and rejects short or
  non-hex input, including `abc;rm -rf /`.

---

## 3. Server requirements

- **VPS:** 1 vCPU, 1 GB RAM (2 GB is more comfortable), 20 GB SSD, public
  IPv4 (IPv6 optional). Ubuntu 24.04 LTS or Debian 12/13.
- **KVM virtualization.** OpenVZ/LXC plans often cannot run Docker.
- **Outbound reachability:** before committing to a long plan, check from the
  box that it can:
  - `docker pull` from Docker Hub and `ghcr.io`;
  - reach `accounts.google.com` and `oauth2.googleapis.com` (the OAuth
    token exchange runs server-side).

  If Docker Hub is blocked, configure a `registry-mirrors` entry.
- **DNS:** `faustze.tech` is hosted at SpaceWeb (`spaceweb.ru` name servers).
  Today `study` is a CNAME to `faustze.github.io`.

---

## 4. Data

Assume the Railway database is gone with the trial. If a dump turns up,
restore it in Phase 3 before opening the site.

Starting with an empty database means:
- **Accounts:** users sign in again and get new accounts. Tokens from the
  Railway era expired long ago (7-day JWTs).
- **Local progress:** the browser's progress is never lost.
  `mergeRemoteProgress` takes the union of completed items and only adopts
  the server's level/XP when they are ahead.
- **Pending completions:** the queue in localStorage is flushed to the new
  backend on the first sync after login.
- **What is lost:** server copies of completions that were already synced
  before Railway died. They are no longer queued, so they stay local to
  that browser, and syncing to a second device will not include them.

---

## 5. Phases

### Phase 0: preparation (owner)

- [ ] Restore the Pages custom domain (see the journal) so guests have a
      working site while the migration happens.
- [ ] Pick the VPS provider and plan (section 3).
- [ ] A day before the cutover, lower the TTL of the `study` DNS record to
      300 s.

### Phase 1: repository changes (one PR)

1. Add `deploy/`:
   - `compose.yaml`, `Caddyfile`, `web.Dockerfile` (with
     `web.Dockerfile.dockerignore`), `web.Caddyfile`, `.env.example`;
   - `deploy.sh` and `backup.sh` (executable).
2. `backend/Dockerfile`:
   - drop `--forwarded-allow-ips='*'` (uvicorn then reads
     `FORWARDED_ALLOW_IPS`, default `127.0.0.1`);
   - add a `HEALTHCHECK`;
   - remove the Railway wording.
3. Add `backend/.dockerignore` (whitelist) so `.venv`, caches, tests and any
   `.env` stay out of the build context.
4. Add `.github/workflows/release.yml` (Appendix I):
   - steps: CI and Backend CI → build and push both images tagged with the
     commit SHA → deploy over SSH;
   - `ci.yml` and `backend-ci.yml` gain `workflow_call` and lose their own
     `push: main` trigger. PR checks do not change.
   - This also fixes a gap: today a backend-only merge never deploys,
     because `deploy.yml` follows the path-filtered CI workflow.
5. Keep `deploy.yml`, `CNAME` and `backend/railway.toml` until Phase 5.

### Phase 2: server setup (one-time)

1. **Base system:**
   - a non-root sudo user, SSH keys only (`PasswordAuthentication no`,
     `PermitRootLogin no`);
   - `unattended-upgrades`;
   - a 1 GB swap file on a 1 GB box.
2. **Firewall:** allow 22/tcp, 80/tcp, 443/tcp and 443/udp. Note that ports
   published by Docker bypass ufw, so the real guard is that compose
   publishes only the proxy. Never add `ports:` to `api` or `db`.
3. **Docker:** install Docker Engine and the compose plugin from Docker's apt
   repository. Log rotation is already set per service in `compose.yaml`.
4. **`deploy` user** in the `docker` group. The docker group is
   root-equivalent, which is why CI's key for this user is limited to a
   forced command (step 7).
5. **Sparse clone** of the `deploy/` directory only, owned by `deploy`:
   ```bash
   git clone --filter=blob:none --sparse \
     https://github.com/Faustzer/frontend-study-lab.git /opt/studylab
   git -C /opt/studylab sparse-checkout set deploy
   ```
6. **Secrets file:** create `deploy/.env` from `deploy/.env.example` and
   `chmod 600` it.
   - `JWT_SECRET`: `openssl rand -hex 32`.
   - `POSTGRES_PASSWORD`: `openssl rand -hex 24`. Hex keeps the database
     URL valid without escaping.
   - Google credentials: from Google Cloud Console.
7. **CI deploy key:**
   - Generate it: `ssh-keygen -t ed25519 -f studylab-ci -N ''`.
   - In `~deploy/.ssh/authorized_keys`, add:
     ```
     command="/opt/studylab/deploy/deploy.sh",restrict ssh-ed25519 AAAA… studylab-ci
     ```
   - In GitHub, create the environment `production` and add:
     - secret `VPS_SSH_KEY`: the private key;
     - secret `VPS_KNOWN_HOSTS`: the output of
       `ssh-keyscan -t ed25519 <host>`;
     - variable `VPS_HOST`.
8. **Backups:**
   - Cron runs `deploy/backup.sh` nightly. It keeps 14 days of `pg_dump -Fc`
     files in `/opt/studylab/backups`:
     ```
     # /etc/cron.d/studylab-backup
     15 3 * * * deploy /opt/studylab/deploy/backup.sh 2>&1 | logger -t studylab-backup
     ```
   - Add an offsite copy with rclone or restic to object storage or another
     machine. A dump that exists only on the VPS dies with the VPS.
9. **Monitoring:** an external uptime check on
   `https://study.faustze.tech/health` (the UptimeRobot or Healthchecks.io
   free tier). Optionally, `backup.sh` pings Healthchecks.io on success, so
   a silent backup failure raises an alert.

### Phase 3: first deploy on a staging hostname

1. **DNS:** add an A record `new.faustze.tech` → the VPS IP. Put
   `DOMAIN=new.faustze.tech` in `deploy/.env`.
2. **Google Cloud Console** → Credentials → OAuth client:
   - add the authorized redirect URIs
     `https://new.faustze.tech/api/auth/google/callback` and
     `https://study.faustze.tech/api/auth/google/callback`;
   - remove the Railway URI.
3. **GHCR packages:** run the release workflow manually once. Then set both
   packages to Public (Package settings → Change visibility).
4. **Checks on the staging host:**
   - the home page and a deep link load;
   - `/health` → 200, `/api/auth/me` → 401;
   - Google login works end to end;
   - complete a module and reload: the progress stays;
   - log in from a second browser: the progress has synced;
   - `curl -I` shows the security headers;
   - `docker stats` shows memory well under the limits.
5. **Backups:** run `backup.sh` once and do a restore drill (Appendix H).

### Phase 4: cutover

1. **DNS:** replace the `study` CNAME (`faustze.github.io`) with an A record
   (and AAAA if the VPS has IPv6) → the VPS IP. Wait until
   `dig +short study.faustze.tech` returns the new IP.
2. **Switch the domain:** set `DOMAIN=study.faustze.tech` in `deploy/.env`,
   then run `docker compose up -d`. Caddy obtains the certificate once DNS
   points at the box.
3. **Pages:** in Settings → Pages, remove the custom domain.
4. **Verify:** repeat the Phase 3 checks on the real domain.

### Phase 5: cleanup (after a week without problems)

- Delete `deploy.yml`, `CNAME` and `backend/railway.toml`, and turn off
  Pages.
- Delete the `VITE_API_URL` repo variable; nothing reads it any more.
- Remove the `new` hostname from DNS and from the Google OAuth client.
- Raise HSTS `max-age` from 1 day to 1 year (Appendix B).
- Update the documentation:
  - README (stack, deploy);
  - `docs/AGENTS.md` "Production Deployment";
  - the redirect URIs in `docs/plan-backend.md`;
  - `docs/MIGRATION.md`;
  - the journal.

---

## 6. Rollback

- **Before Phase 4:** there is nothing to roll back; Pages keeps serving.
- **After the cutover:** point DNS back to the CNAME `faustze.github.io` and
  re-add the custom domain in Pages (`deploy.yml` still exists until
  Phase 5). Guests get the site back, but login does not work.
  - GitHub needs some time to issue the certificate again.
  - That delay is why HSTS starts at 1 day: a long HSTS would lock browsers
    out until then.
- **Bad release:** redeploy the previous commit with
  `/opt/studylab/deploy/deploy.sh <old-sha>`, or re-run the release workflow
  for an older commit.
- **Bad migration:** migrations are forward-only in practice. Restore the
  last dump (Appendix H).

---

## 7. Security notes

- **Secrets:** they live only in `/opt/studylab/deploy/.env` (mode 600). The
  GitHub `production` environment holds only the SSH key. Images contain no
  secrets:
  - the backend build context is whitelisted;
  - the web image only bakes in `VITE_API_URL=/api`.
- **Network:** only 80/443 are published, and Postgres sits on an internal
  network without internet access.
- **Proxy trust:** `FORWARDED_ALLOW_IPS` is scoped to the edge subnet
  instead of `*`.
- **CI key:** the forced command means the key can only deploy a 40-character
  commit SHA. It cannot open a shell, forward ports or run arbitrary
  commands.
- **Dev login:** `DEV_LOGIN_ENABLED` stays unset. The config logs a warning
  if it is on for a non-local deployment.
- **Follow-ups that need backend changes (not part of this migration):**
  - `https_only=True` on `SessionMiddleware`;
  - a separate session secret;
  - httpOnly-cookie auth instead of `localStorage`.

---

## Appendix: config drafts

A–F ran in the local test (section 2), with three small differences:
- the test passed `deploy/` as a named build context;
- the proxy was pinned to `caddy:2-alpine`, which was 2.11.7 at the time;
- the proxy also waited for the api to be healthy.

G–I are untested drafts.

### A. `deploy/compose.yaml`

```yaml
# Production stack for one small VPS. Secrets come from deploy/.env
# (server only, never committed; see .env.example).
name: studylab

x-defaults: &defaults
  restart: unless-stopped
  logging:
    driver: json-file
    options: { max-size: "10m", max-file: "3" }

services:
  proxy:
    <<: *defaults
    image: caddy:2.11-alpine
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"
    environment:
      SITE_ADDRESS: ${DOMAIN:?set DOMAIN in .env}
      ACME_EMAIL: ${ACME_EMAIL:?set ACME_EMAIL in .env}
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    networks: [edge]
    # Only the static site is a hard dependency: if the API is down, the
    # site still serves and /api answers 502
    depends_on: [web]
    deploy: { resources: { limits: { memory: 128m } } }

  web:
    <<: *defaults
    image: ghcr.io/faustzer/frontend-study-lab-web:${IMAGE_TAG:?set IMAGE_TAG in .env}
    networks: [edge]
    deploy: { resources: { limits: { memory: 64m } } }

  api:
    <<: *defaults
    image: ghcr.io/faustzer/frontend-study-lab-api:${IMAGE_TAG}
    environment:
      DATABASE_URL: postgresql+asyncpg://studylab:${POSTGRES_PASSWORD:?}@db:5432/studylab
      JWT_SECRET: ${JWT_SECRET:?}
      FRONTEND_URL: https://${DOMAIN}
      ALLOWED_ORIGINS: https://${DOMAIN}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:-}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET:-}
      TWITCH_CLIENT_ID: ${TWITCH_CLIENT_ID:-}
      TWITCH_CLIENT_SECRET: ${TWITCH_CLIENT_SECRET:-}
      DISCORD_CLIENT_ID: ${DISCORD_CLIENT_ID:-}
      DISCORD_CLIENT_SECRET: ${DISCORD_CLIENT_SECRET:-}
      # Only the edge proxy may set X-Forwarded-*; the https OAuth
      # redirect_uri is built from them
      FORWARDED_ALLOW_IPS: 172.30.0.0/24
    networks: [edge, db]
    depends_on:
      db: { condition: service_healthy }
    deploy: { resources: { limits: { memory: 256m } } }

  db:
    <<: *defaults
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: studylab
      POSTGRES_USER: studylab
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?}
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks: [db]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U studylab -d studylab"]
      interval: 5s
      timeout: 3s
      retries: 10
    deploy: { resources: { limits: { memory: 384m } } }

networks:
  edge:
    ipam: { config: [{ subnet: 172.30.0.0/24 }] }
  # No internet access and no published ports: only the API reaches Postgres
  db:
    internal: true

volumes:
  caddy_data:
  caddy_config:
  pgdata:
```

### B. `deploy/Caddyfile` (edge proxy)

```caddyfile
{
	email {$ACME_EMAIL}
}

{$SITE_ADDRESS} {
	encode zstd gzip

	@api path /api/* /health
	handle @api {
		reverse_proxy api:8000
	}

	handle {
		reverse_proxy web:80
	}

	header {
		# 1 day while Pages is still the rollback path; raise to 31536000
		# in Phase 5
		Strict-Transport-Security "max-age=86400"
		X-Content-Type-Options "nosniff"
		Referrer-Policy "strict-origin-when-cross-origin"
		-Server
	}
}
```

Caddy's `reverse_proxy` passes `Host` through and sets `X-Forwarded-For`
and `X-Forwarded-Proto`, which the API needs for the OAuth redirect URI.

### C. `deploy/web.Dockerfile` (build context: repository root)

```dockerfile
# Static frontend: `nuxt generate` output served by Caddy over plain HTTP;
# the edge proxy terminates TLS. Build: docker build -f deploy/web.Dockerfile .
FROM node:22-alpine AS build
WORKDIR /app
# husky's prepare hook needs .git, which is not in the build context
ENV HUSKY=0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nuxt.config.ts tsconfig.json ./
RUN npm install -g "$(node -p "require('./package.json').packageManager")"
# postinstall (nuxt prepare) warns that the SCSS entry is missing: frontend/
# is copied after install to keep this layer cached. generate is unaffected.
RUN pnpm install --frozen-lockfile
COPY frontend ./frontend
# Same-origin API behind the edge proxy
ARG VITE_API_URL=/api
RUN VITE_API_URL="$VITE_API_URL" pnpm run generate

FROM caddy:2.11-alpine
COPY deploy/web.Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/.output/public /srv
```

`deploy/web.Dockerfile.dockerignore` (BuildKit picks it up for this
Dockerfile only):

```
**
!package.json
!pnpm-lock.yaml
!pnpm-workspace.yaml
!nuxt.config.ts
!tsconfig.json
!frontend/
!deploy/web.Caddyfile
frontend/e2e/
frontend/**/__tests__/
frontend/tests/
**/.env
**/.env.*
```

### D. `deploy/web.Caddyfile`

```caddyfile
{
	admin off
	auto_https off
}

:80 {
	root * /srv
	encode zstd gzip
	# Nuxt build assets have content hashes in their names
	header /_nuxt/* Cache-Control "public, max-age=31536000, immutable"
	# SPA: unknown paths get the app shell, the client router takes over
	try_files {path} {path}/index.html /200.html
	file_server
}
```

Unknown paths answer 200 with the app shell, and the app shows its own 404
page. On Pages they answered 404. This only matters for SEO, and it goes
away with SSG (Nuxt migration Phase 4).

### E. `backend/Dockerfile` and `backend/.dockerignore`

```dockerfile
# Slim image sized for a ~1 GB VPS
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY alembic.ini .
COPY alembic ./alembic
COPY app ./app

# Drop root: the app only needs to read its own code
RUN useradd --system --no-create-home --uid 10001 app
USER app

EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=3 \
  CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2)"]

# Run migrations (retrying until Postgres accepts connections), then serve
# with a single worker. --proxy-headers trusts X-Forwarded-* only from
# $FORWARDED_ALLOW_IPS (compose sets the edge subnet; the default is
# 127.0.0.1).
CMD ["sh", "-c", "until alembic upgrade head; do echo 'migration failed, retrying in 3s...'; sleep 3; done && exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --proxy-headers"]
```

```
**
!requirements.txt
!alembic.ini
!alembic/
!app/
**/__pycache__
```

### F. `deploy/.env.example`

```bash
# Copy to deploy/.env on the server and chmod 600. Never commit the real file.

# Public hostname; Caddy gets a Let's Encrypt certificate for it
DOMAIN=study.faustze.tech
# Let's Encrypt account email (expiry and problem notices)
ACME_EMAIL=you@example.com
# Commit SHA of the images to run; deploy.sh updates it
IMAGE_TAG=replace-with-a-commit-sha

# Generate with: openssl rand -hex 24 (hex keeps the database URL valid)
POSTGRES_PASSWORD=generate-a-random-password
# Generate with: openssl rand -hex 32
JWT_SECRET=generate-a-random-secret

# Google OAuth: https://console.cloud.google.com → APIs & Services → Credentials
# Redirect URI: https://<DOMAIN>/api/auth/google/callback
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Optional; leave empty to keep these providers off
TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
```

### G. `deploy/deploy.sh` (untested)

```sh
#!/bin/sh
# Deploys one commit: the forced command for CI's SSH key, also usable by
# hand as `deploy.sh <sha>`. Anything other than a full SHA is rejected.
set -eu

tag="${SSH_ORIGINAL_COMMAND:-${1:-}}"
case "$tag" in
  ""|*[!0-9a-f]*) echo "usage: deploy.sh <40-char commit sha>" >&2; exit 2 ;;
esac
[ "${#tag}" -eq 40 ] || { echo "usage: deploy.sh <40-char commit sha>" >&2; exit 2; }

cd /opt/studylab
# Compose files come from the same commit as the images
git fetch --quiet --depth 1 origin "$tag"
git checkout --quiet --force --detach FETCH_HEAD

cd deploy
sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=$tag/" .env
docker compose pull --quiet
docker compose up -d --wait --remove-orphans
docker image prune -f >/dev/null
echo "deployed $tag"
```

### H. `deploy/backup.sh` and restore (untested as scripts)

The `pg_dump`/`pg_restore` commands themselves were tested (section 2).

```sh
#!/bin/sh
# Nightly Postgres dump, run by cron as the deploy user; keeps 14 days
set -eu
cd /opt/studylab/deploy
mkdir -p ../backups
out="../backups/studylab-$(date -u +%Y%m%dT%H%MZ).dump"
docker compose exec -T db pg_dump -U studylab -d studylab -Fc > "$out.tmp"
mv "$out.tmp" "$out"
find ../backups -name 'studylab-*.dump' -mtime +14 -delete
# Offsite copy goes here (rclone / restic)
```

Restore, in place:

```bash
cd /opt/studylab/deploy
docker compose stop api
docker compose exec -T db dropdb -U studylab --force studylab
docker compose exec -T db createdb -U studylab studylab
docker compose exec -T db pg_restore -U studylab -d studylab --no-owner < ../backups/<file>.dump
docker compose start api
```

For a drill without touching production, restore into a throwaway
`postgres:16-alpine` container and check `alembic_version` and the row
counts.

### I. `.github/workflows/release.yml` (sketch, untested)

The action SHAs are the latest releases as of 2026-10-20.

```yaml
name: Release

on:
  push:
    branches: [main]
    paths-ignore: ["docs/**", "**/*.md"]
  workflow_dispatch:

concurrency:
  group: release
  cancel-in-progress: false

permissions:
  contents: read

jobs:
  ci:
    uses: ./.github/workflows/ci.yml
  backend:
    uses: ./.github/workflows/backend-ci.yml

  images:
    needs: [ci, backend]
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    strategy:
      matrix:
        include:
          - { name: api, context: backend, file: backend/Dockerfile }
          - { name: web, context: ., file: deploy/web.Dockerfile }
    steps:
      - uses: actions/checkout@v7
      - uses: docker/login-action@dbcb813823bdd20940b903addbd779551569679f # v4.6.0
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/setup-buildx-action@f87e5991a6d7451dcb8d9637bfbc97413f497069 # v4.4.1
      - uses: docker/build-push-action@c3c9e263c25d99ce0380d002d59b67737d91b0dc # v7.4.0
        with:
          context: ${{ matrix.context }}
          file: ${{ matrix.file }}
          push: true
          tags: ghcr.io/faustzer/frontend-study-lab-${{ matrix.name }}:${{ github.sha }}
          # Links the package to this repository on GHCR
          labels: org.opencontainers.image.source=https://github.com/${{ github.repository }}
          cache-from: type=gha,scope=${{ matrix.name }}
          cache-to: type=gha,mode=max,scope=${{ matrix.name }}

  deploy:
    needs: images
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://study.faustze.tech
    steps:
      - name: Deploy over SSH
        env:
          SSH_KEY: ${{ secrets.VPS_SSH_KEY }}
          KNOWN_HOSTS: ${{ secrets.VPS_KNOWN_HOSTS }}
          HOST: ${{ vars.VPS_HOST }}
        run: |
          install -m 700 -d ~/.ssh
          printf '%s\n' "$SSH_KEY" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          printf '%s\n' "$KNOWN_HOSTS" > ~/.ssh/known_hosts
          # The server's forced command takes only the SHA; expanding it
          # on this side is intended
          # shellcheck disable=SC2029
          ssh "deploy@$HOST" "$GITHUB_SHA"

      - name: Smoke check
        run: curl -fsS --retry 5 --retry-delay 5 https://study.faustze.tech/health
```

`ci.yml` and `backend-ci.yml` need `workflow_call:` added to `on:`, and the
`push: branches: [main]` trigger removed so main is not checked twice.

Their change-detection steps also need one fix:
- **The problem:** they diff against `github.event.before`. That is fine for
  a push, but empty for `workflow_dispatch`, and all zeros for a branch's
  first push.
- **What happens:** `git diff ""` fails, and under the default
  `bash -eo pipefail` the `if` silently evaluates to `run=false`. The checks
  would be skipped and an untested image deployed.
- **The fix:** set `run=true` whenever the event is not `pull_request` and
  `before` is empty or all zeros.

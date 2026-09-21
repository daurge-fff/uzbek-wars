# Uzbek Wars — Deployment Guide

Target setup (primary scenario):

- Ubuntu server, everything runs in Docker containers started with Docker Compose from the repo root.
- Domain `uzbekwars.top` is served through Panel terminates TLS and reverse-proxies
  `https://uzbekwars.top` → `http://127.0.0.1:3060`.
- The same deployment serves two front doors: the normal website and the Telegram Mini App opened
  from the bot.

Every command below is copy-pasteable. Run them from the repo root unless a step says otherwise.

---

## 0. Architecture and endpoints

```
Browser / Telegram Mini App
        │  https://uzbekwars.top (443, TLS)
        ▼
   Panel (nginx)  ──reverse proxy──▶  127.0.0.1:3060
                                            │
                                    proxy container (nginx :80)
                                     ├─ /api/  ─▶ backend:3000  (Express)
                                     └─ /      ─▶ frontend:8080 (nginx serving the built PWA)
                                            │
                                        MongoDB (MONGODB_URI / DB_NAME)
```

| Compose service | What it runs | Container port | Published on the host |
|---|---|---|---|
| `backend` | Express API (`node dist/index.js`) | 3000 | not published |
| `frontend` | nginx serving the built React PWA | 8080 | not published |
| `proxy` | nginx reverse proxy | 80 | `3060:80` — this is the port Panel proxies to |

Health endpoints (do not mix them up):

| Endpoint | Served by | Meaning |
|---|---|---|
| `GET :80/healthz` (host: `http://127.0.0.1:3060/healthz`) | `proxy` | plain-text infrastructure probe → `200 healthy` |
| `GET :8080/healthz` | `frontend` container | same plain-text probe (Compose healthcheck) |
| `GET :3000/health` | `backend` container | JSON `{"status":"ok"}` — internal healthcheck only, **not** routed by the proxy |
| `GET /api/health` | backend via proxy | public JSON health payload used by the status page |
| `GET /health` | SPA via proxy | public human-readable status page (status lamps, real latencies) |

---

## 1. Requirements

- Ubuntu 22.04 or 24.04, root or `sudo`.
- Docker Engine + Compose plugin:
  ```bash
  docker --version && docker compose version
  ```
- Domain `uzbekwars.top` with DNS `A` records for `uzbekwars.top` (and `www`) pointing at the server IP.
- Ports: only **3060** is needed locally (bound by the `proxy` container, loopback-only traffic from
  Panel). **80/443 are owned by Panel** — the containers must not bind them.
- MongoDB reachable from the server (Atlas or self-hosted) → `MONGODB_URI` + `DB_NAME`.
- Google OAuth client (id + secret) for website login.
- Telegram bot token from @BotFather.
- Panel installed and reachable.

Firewall: allow 22/80/443. Do not expose 3060 to the internet (see §11).

---

## 2. Get the code and configure `.env`

1. Clone (or update) the repository:

   ```bash
   sudo mkdir -p /opt && cd /opt
   git clone https://github.com/daurge-fff/uzbek-wars.git
   cd uzbek-wars
   # existing checkout instead: git pull
   ```

2. Create `.env` and generate a secret:

   ```bash
   cp .env.example .env
   openssl rand -base64 32     # paste the output into JWT_SECRET
   nano .env
   ```

3. Required values — the backend refuses to start without these five
   (`Missing required environment variables: ...` in the logs):

   | Variable | Value for this deployment |
   |---|---|
   | `MONGODB_URI` | e.g. `mongodb+srv://user:pass@cluster.mongodb.net/` |
   | `DB_NAME` | `uzbek_wars` |
   | `JWT_SECRET` | output of `openssl rand -base64 32` |
   | `GOOGLE_CLIENT_ID` | Google OAuth client id for `uzbekwars.top` |
   | `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

4. Recommended values:

   ```dotenv
   PORT=3000
   NODE_ENV=production
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=https://uzbekwars.top          # single CORS origin + default web_app URL
   TELEGRAM_BOT_TOKEN=123456:ABC...            # from @BotFather
   TELEGRAM_WEBAPP_URL=https://uzbekwars.top   # optional; falls back to FRONTEND_URL
   ```

5. Notes on the shipped `.env.example`:

   - It also contains `PAYMENT_API_KEY`, `PAYMENT_WEBHOOK_SECRET`, `DEV_USERNAME`, `DEV_PASSWORD`,
     `ADMIN_TELEGRAM_ID`, `DOCKER_PROXY_PORT`. The dev login works only with
     `NODE_ENV=development`; `DOCKER_PROXY_PORT` is **not** read by `docker-compose.yml` (the port
     is hardcoded there, see §9).
   - `TELEGRAM_WEBAPP_URL` is optional in code: when it is empty the app uses `FRONTEND_URL`
     (`backend/src/bot/telegramBot.ts`), i.e. `https://uzbekwars.top`.
   - `docker-compose.yml` passes `.env` to the `backend` service via `env_file:` and also sets
     `NODE_ENV=production` and `PORT=3000` in `environment:` — values in `environment:` win over
     `env_file:`, so changing `PORT` in `.env` does not change the container port.
   - `.env` is listed in both `.gitignore` and `.dockerignore`: never commit it, and it is not
     copied into the image.

---

## 3. Build and start

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f --tail=100     # Ctrl-C stops following, containers keep running
```

Expected result: `uzbek-wars-backend`, `uzbek-wars-frontend`, `uzbek-wars-proxy` all `Up`.
The frontend starts only after the backend reports healthy (`depends_on: service_healthy`), so the
first build takes a few minutes.

### 3.1 How the images are built (npm workspaces)

This repository is an npm **workspaces** monorepo: the only lockfile is the root
`package-lock.json`, there is none inside `backend/` or `frontend/`. Both Dockerfiles therefore
install from the repo root and build the corresponding workspace:

- `Dockerfile.backend` — `builder` stage installs **all** deps (needed for `tsc`), compiles the
  backend and then a `prod-deps` stage installs production dependencies only for the runtime image.
  The `builder` stage is also reused by `docker compose --profile tools` (seeds, bot setup), because
  those scripts need `tsx` from devDependencies.
- `Dockerfile.frontend` — installs from the root lockfile, runs `npm run build --workspace=frontend`
  (Vite + `tsc`), and copies `frontend/dist` into the nginx image.

Verify the images before touching the server (the compose plugin is not required):

```bash
docker build -f Dockerfile.backend  -t uw-backend:test  .
docker build -f Dockerfile.frontend -t uw-frontend:test .
```

Both must finish with `naming to ...` / `exporting layers` and exit code 0. If a build fails at
`npm ci`, check that `package-lock.json` is present in the repo root (it is committed) — do not run
`npm ci` inside `backend/` or `frontend/`, those directories have no lockfile by design.

---

## 4. Seed the database (once, on a fresh database)

### Option A — inside Docker (recommended on the server)

The `tools` profile runs the seed scripts inside a container built from the `builder` stage, so
`tsx` and the sources are available and no Node.js installation is needed on the host. Variables
come from `.env` through `env_file`, so no `--env-file` flag is involved:

```bash
docker compose --profile tools run --rm seeder         # cities, characters, cosmetics, daily tasks
ocker compose --profile tools run --rm quest-seeder   # global quests (upserts by id, idempotent)
docker compose --profile tools run --rm bot-setup      # Telegram menu button + command list
```

The `tools` profile is never started by `docker compose up`, so these one-off containers do not run
with the game itself.

### Option B — from the host (Node 20+) 

```bash
npm install                                  # once: installs both workspaces, provides tsx
npm run seed --workspace=backend             # cities, characters, cosmetics, quests, daily tasks
npm run seed:quests --workspace=backend      # global quests only (upserts by id, idempotent)
```

Both options require `MONGODB_URI` and `DB_NAME` and must point at the intended database — the main
seed is meant for a fresh database.

---

## 5. Telegram bot setup

1. In Telegram, open **@BotFather** → `/newbot` → bot name → bot username. Copy the token into
   `TELEGRAM_BOT_TOKEN` in `.env`.
2. Optional bot profile: `/setname`, `/setdescription`, `/setuserpic`.
3. Set the Mini App URL to `https://uzbekwars.top`:
   - BotFather → your bot → **Bot Settings → Menu Button → Configure menu button**, or `/newapp`
     (name + the HTTPS URL).
   - The URL **must be HTTPS** — Telegram rejects plain `http://` web_app URLs.
   - If you also use a WebApp login button (`/setdomain`), set the same domain.
4. Apply the menu button and command list from the repo:

   ```bash
   npm run setup:bot --workspace=backend
   ```

   This reads `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBAPP_URL` (or `FRONTEND_URL`) and calls
   `setChatMenuButton` (button text `Играть`, `web_app.url` = your HTTPS URL, trailing slashes
   stripped) plus `setMyCommands` for `/play`, `/start`, `/help`, `/stats`.
5. The backend also starts the bot in-process (`initBot()` on startup) and answers `/start` and
   `/play` with a WebApp button. Run the standalone entrypoint only as an alternative, never at the
   same time:

   ```bash
   npm run bot --workspace=backend     # standalone bot process — do NOT run while the backend runs
   ```

6. Open the bot chat in Telegram and confirm the menu button opens the game.

---

## 6. Panel: site, TLS, reverse proxy

1. **Add site:** Panel → Website → Add site.
   - Domain: `uzbekwars.top` (add `www.uzbekwars.top` too if you want it to work).
   - No PHP, no database, any document root — the content is served by the containers, the docroot
     is unused. Do not enable "static site" behaviour for this site.
2. **TLS:** Website → SSL → Let's Encrypt → apply. Requirements: DNS already points at the server
   and port 80/443 are open. Enable **Force HTTPS**.
3. **Reverse proxy:** Website → Reverse Proxy → Add reverse proxy.
   - Proxy name: `uzbek-wars`
   - Target URL: `http://127.0.0.1:3060`
   - Cache: off. Keep the original `Host` header (Panel's "send domain" option: `$host`).
   - Panel writes this to `/www/server/panel/vhost/nginx/proxy/uzbekwars.top/uzbek-wars.conf`.
4. The resulting proxy snippet should look exactly like this:

   ```nginx
   # /www/server/panel/vhost/nginx/proxy/uzbekwars.top/uzbek-wars.conf
   location / {
       proxy_pass http://127.0.0.1:3060;
       proxy_http_version 1.1;

       # Заголовки исходного клиента
       proxy_set_header Host              $host;
       proxy_set_header X-Real-IP         $remote_addr;
       proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;   # https: TLS terminates here

       # WebSocket / upgrade support (needed for keep-alive upgrades)
       proxy_set_header Upgrade    $http_upgrade;
       proxy_set_header Connection "upgrade";

       proxy_read_timeout    300s;
       proxy_send_timeout    300s;
       client_max_body_size  10M;                    # mirrors the container proxy limit
   }
   ```

   Why the headers matter:
   - `Host` — the app builds absolute URLs and CORS checks from the public origin.
   - `X-Forwarded-Proto $scheme` — Panel terminates TLS, so this is `https` for real users.
     Telegram only accepts HTTPS web app URLs, and this header is what keeps HTTPS visible to the
     app and to the logs. (The current backend does not branch on it — there is no `trust proxy`
     and no `req.secure` usage — but keep it correct so HTTPS stays reportable.)
   - `Upgrade`/`Connection` — the inner proxy already forwards upgrades; the same at the Panel
     layer keeps that path intact.
   - `client_max_body_size 10M` — same limit as `proxy-nginx.conf`. Note the API's JSON body limit
     is 10 kb, enforced by the backend itself (`express.json({ limit: '10kb' })`).
5. Save; Panel reloads nginx automatically.
6. Check that the site's own `server` block has no conflicting `location /` of its own (static
   content, rewrites, or another proxy for the same path) — the last matching `location /` wins and
   a stale one causes 404s or a blank page.

---

## 7. Verify the deployment end to end

Run these in order; each one must pass before the next.

1. Infrastructure probe through the published port:

   ```bash
   curl -I http://127.0.0.1:3060/healthz     # HTTP/1.1 200, Content-Type: text/plain
   curl -s  http://127.0.0.1:3060/healthz    # healthy
   ```

2. Containers healthy:

   ```bash
   docker compose ps
   docker compose exec backend node -e "require('http').get('http://localhost:3000/health',r=>{console.log('backend',r.statusCode);process.exit(0)})"
   ```

3. Status page in a browser: `https://uzbekwars.top/health` → the SPA status page with status lamps
   and measured latencies (`/api/health`). A raw JSON blob here means you reached the backend's
   internal `/health` instead of the SPA route.

   ```bash
   curl -sI https://uzbekwars.top/healthz    # 200 text/plain, proves the probe is not shadowed
   curl -sI https://uzbekwars.top/           # 200 text/html (SPA fallback)
   ```

4. Website login: open `https://uzbekwars.top`, sign in with Google. The Google client must list
   `https://uzbekwars.top` as an authorised origin/redirect, and `FRONTEND_URL` must equal that
   origin (it is the single allowed CORS origin).

5. Mini app: open the bot in Telegram → menu button (`Играть`) → the mini app opens, signs in
   automatically and lands on the game. The client posts the signed `initData` to
   `POST /api/auth/telegram-webapp` with `{ initData, deviceInfo }` and receives
   `{ token, user, player, isNewUser }`.

6. Database check — the Telegram profile must be stored on the user document:

   ```bash
   mongosh "$MONGODB_URI" --eval 'db.getSiblingDB("uzbek_wars").users.findOne(
     { telegramId: { $exists: true } },
     { telegramId: 1, telegramUsername: 1, firstName: 1, lastName: 1, photoUrl: 1, languageCode: 1, telegramLastLoginAt: 1 })'
   ```

   Expected fields: `telegramId`, `telegramUsername`, `firstName`, `photoUrl`, `languageCode`
   (collection `users` — Mongoose's pluralised form of the `User` model).

7. Negative check on the auth wiring (a bogus signature must be rejected):

   ```bash
   curl -s -o /dev/null -w '%{http_code}\n' -X POST https://uzbekwars.top/api/auth/telegram-webapp \
     -H 'Content-Type: application/json' -d '{"initData":"auth_date=1&hash=deadbeef"}'
   ```

   `401` = the endpoint is wired and rejects forgeries. `503` = `TELEGRAM_BOT_TOKEN` is missing
   (`TELEGRAM_NOT_CONFIGURED`).

---

## 8. Updating the app, viewing logs

```bash
cd /opt/uzbek-wars
git pull
docker compose up -d --build
docker compose ps
```

```bash
docker compose logs -f backend              # follow backend logs
docker compose logs --tail=200 frontend
docker compose logs backend | grep -i mongo
docker compose exec proxy tail -f /var/log/nginx/access.log
docker compose restart backend              # restart one service
docker compose down                         # stop everything (MongoDB data is external and kept)
```

Container logs use the `json-file` driver with `10m` × 3 rotation. After editing `.env`, recreate
the affected containers — `env_file:` values are read when a container is created:

```bash
docker compose up -d --force-recreate backend
```

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Blank / white page at `https://uzbekwars.top` | Panel site serving its own empty docroot, a stale `location /`, or the proxy pointing at the wrong port | Confirm `curl -sI http://127.0.0.1:3060/` returns `200 text/html`; then read the site's proxy conf (§6) — only one `location /` must proxy to `127.0.0.1:3060`. SPA fallback lives in `nginx.conf` (`try_files $uri $uri/ /index.html`). |
| Build fails at `npm ci` (lockfile error) | `package-lock.json` missing from the repo root, or `npm ci` was run inside `backend/`/`frontend/` (no lockfiles there by design) | Build from the repo root (`docker build -f Dockerfile.backend .`) so the workspace lockfile is in the context. |
| `docker compose exec backend npm run seed` fails with `tsx: not found` | The runtime image ships production dependencies only | Use the `tools` profile instead: `docker compose --profile tools run --rm seeder` (§4). |
| Mini app login fails, response `code: INVALID_HASH` | `TELEGRAM_BOT_TOKEN` does not match the bot that opened the app (wrong bot, or the token was rotated) | Put the current token in `.env`, `docker compose up -d --force-recreate backend`, reopen the mini app. |
| Mini app login fails, `code: EXPIRED` | `initData` older than 24 h (freshness window is 24 h) | Reopen the mini app from the bot (payloads are re-signed on every open). |
| Mini app login fails, `MISSING_HASH` / `MISSING_AUTH_DATE` / `MISSING_USER` | The payload did not come from Telegram (hand-made request) | Not a server bug — test through the bot. |
| Mini app does not open at all / button does nothing | `web_app` URL is not HTTPS, or the menu button points elsewhere | Set `TELEGRAM_WEBAPP_URL=https://uzbekwars.top`, run `npm run setup:bot --workspace=backend`, and set the same URL in BotFather (§5). |
| `503` with `code: TELEGRAM_NOT_CONFIGURED` on `POST /api/auth/telegram-webapp` | `TELEGRAM_BOT_TOKEN` empty in `.env` | Add it, recreate the backend container. |
| API calls from the website/mini app return `403`/CORS error | `FRONTEND_URL` ≠ the public origin | Set `FRONTEND_URL=https://uzbekwars.top` (single allowed CORS origin) and recreate the backend. |
| Health page shows the database lamp red, logs show Mongo errors | Wrong `MONGODB_URI`/`DB_NAME`, Atlas IP allowlist missing the server IP, or the cluster is paused | Fix the URI/allowlist; `docker compose logs backend \| grep -i mongo`. |
| Backend container restarts in a loop | Missing required env var (`Missing required environment variables: ...`) | Fill the five required variables in `.env`, then `docker compose up -d`. |
| Need a different public port | The port is hardcoded in `docker-compose.yml` (`"3060:80"`); `DOCKER_PROXY_PORT` in `.env` is unused | Edit the `ports:` line (e.g. `"127.0.0.1:8080:80"`), `docker compose up -d`, update the Panel reverse proxy target. |
| `3060` already in use | Another service or an old container holds the port | `docker compose down`; `ss -ltnp \| grep 3060` (or `sudo lsof -i :3060`). |
| Bot answers `/start` but has no menu button | `setup:bot` was never run, or it failed | `npm run setup:bot --workspace=backend` (needs the HTTPS URL already reachable). |
| Bot stops responding after 409 errors in logs | Two pollers on the same token | Do not run `npm run bot --workspace=backend` while the backend container is running. |

If MongoDB runs on the same server without Docker, treat it as external: the backend connects only
through `MONGODB_URI`, no compose volume is used for data.

---

## 10. Running without Docker

For development or a quick test (Node 20+, npm 10+):

```bash
npm install
npm run dev          # repo root: backend (`tsx watch`, :3000) + frontend (vite, :5173)
```

Or run the two workspaces separately:

```bash
npm run dev --workspace=backend
npm run dev --workspace=frontend
```

- The frontend dev server proxies `/api` to `http://localhost:3000` (`frontend/vite.config.ts`),
  so no `VITE_API_URL` is needed. Set it only when the API lives on another origin.
- Backend dev reads the **root** `.env` (`backend/src/loadEnv.ts`), so configure `.env` first.
- `DEV_USERNAME` / `DEV_PASSWORD` login works only with `NODE_ENV=development`.

Production-like run without containers:

```bash
npm run build --workspace=backend && npm run start --workspace=backend    # Express on :3000
npm run build --workspace=frontend                                       # static bundle in frontend/dist
```

Serve `frontend/dist` with any static server/nginx that falls back to `index.html`, and point
`/api/` at `http://127.0.0.1:3000` — i.e. reproduce what the `proxy` container does.

### Why one build serves both front doors

`VITE_API_URL` is optional: when it is unset the app calls its own origin (`/api/...`), which is
exactly what makes the same bundle work as the website and as the Telegram Mini App. `VITE_*`
values are baked in at build time, and the Compose build passes no build args, so nothing
origin-specific is compiled in. `VITE_TELEGRAM_BOT_USERNAME` only customises the "open in Telegram"
link on the website (`frontend/src/utils/telegram.ts`, default `uzbekwars_bot`).

---

## 11. Security

- **Never commit `.env`.** It is gitignored and dockerignored. Keep secrets on the server only
  (`chmod 600 .env`).
- **Rotate on leak:** `JWT_SECRET` (regenerate with `openssl rand -base64 32` — all issued tokens
  become invalid, users sign in again) and `TELEGRAM_BOT_TOKEN` (BotFather `/revoke`). Recreate the
  containers after changing either.
- **MongoDB Atlas:** keep the IP allowlist limited to the server IP; never `0.0.0.0/0`. Use a
  least-privilege database user.
- **Do not expose 3060** to the internet. Publish it on loopback only
  (`"127.0.0.1:3060:80"` in `docker-compose.yml`) or firewall it; Panel owns 80/443.
- **Telegram auth is server-side.** `initDataUnsafe` values on the client are display-only; the
  backend recomputes the HMAC-SHA256 signature with `TELEGRAM_BOT_TOKEN` (`secret_key =
  HMAC_SHA256("WebAppData", bot_token)`) and rejects payloads whose `auth_date` is older than 24 h.
  A forged `initData` cannot create a session.
- Containers run as non-root users (`nodejs` in the backend image, `nginx` in the frontend image) —
  keep that, and keep images updated (`docker compose build --pull`).

---

## 12. Command reference

```bash
# Build / run
docker compose up -d --build
docker compose ps
docker compose logs -f --tail=100 backend
docker compose down

# One-off tasks (host, repo root)
npm install
npm run seed --workspace=backend
npm run seed:quests --workspace=backend
npm run setup:bot --workspace=backend

# Smoke checks
curl -I http://127.0.0.1:3060/healthz
curl -sI https://uzbekwars.top/
curl -sI https://uzbekwars.top/healthz
```

# Australian Finance Dashboard

A live financial dashboard tracking ASX-listed stocks, AUD foreign exchange rates, and
cryptocurrency prices — built as a full-stack, production-style portfolio project.

> **Status:** All 6 phases complete (backend, scheduler, frontend, search/watchlist/charts,
> testing/Docker/CI, Supabase Auth + admin dashboard), plus a post-launch design pass
> (light/dark mode, Stack Overflow-inspired UI, demo accounts). See [Build Phases](#build-phases)
> below, and [Known Issues](#known-issues) for one open auth compatibility gap.

## Features

- **Live market data** — ASX stocks (yfinance), cryptocurrency (CoinGecko), and AUD FX rates
  (Open Exchange Rates), refreshed every 60s on the dashboard and every 15 minutes into
  PostgreSQL by a background scheduler.
- **Search & watchlist** — autocomplete search across all three asset types; add any result to
  a personal watchlist (currently `localStorage`-backed, see [Future Improvements](#future-improvements)).
- **Historical charts** — every asset has a 1D/1W/1M/3M price chart with a hover tooltip/crosshair.
- **Market summary banner** — strongest/weakest ASX performer (linked to that stock), crypto
  market direction, and AUD strength, computed server-side from live + stored data.
- **Light/dark mode** — a manual toggle (not just OS preference), persisted per-browser, with a
  no-flash blocking script so the correct theme applies before first paint.
- **Auth + admin dashboard** — Supabase email/password auth; admins can manage which assets are
  tracked, manage user roles, and view/trigger the snapshot scheduler, all from `/admin`.
- **Demo accounts** — a guest and an admin demo login on the sign-in page so reviewers can see
  the full app, including `/admin`, without creating an account.

## Architecture

```
                     ┌──────────────────┐
                     │   Next.js (UI)    │  Phase 3
                     └────────┬─────────┘
                              │ REST (Axios / React Query)
                     ┌────────▼─────────┐
                     │   FastAPI (API)   │  Phase 1 ✅
                     │  routers → services│
                     └───┬────────┬─────┘
              ┌──────────┘        └───────────┐
     ┌────────▼────────┐          ┌───────────▼──────────┐
     │  Yahoo Finance   │          │  APScheduler (15m)    │  Phase 2
     │  CoinGecko       │          │  → snapshot pipeline  │
     │  Open Exch. Rates│          └───────────┬──────────┘
     └──────────────────┘                      │
                                     ┌──────────▼──────────┐
                                     │ PostgreSQL (Supabase)│
                                     └──────────────────────┘
```

## Tech Stack

| Layer      | Technology                                             |
|------------|---------------------------------------------------------|
| Frontend   | Next.js (App Router), TypeScript, Tailwind CSS, Recharts, React Query |
| Backend    | FastAPI, SQLAlchemy, APScheduler, Pydantic              |
| Database   | PostgreSQL (Supabase)                                    |
| Data       | yfinance (ASX stocks), CoinGecko (crypto), Open Exchange Rates (FX) |
| Deployment | Docker + Railway (API), Vercel (frontend), GitHub Actions (CI/CD) |

## Project Structure

```
finance-dashboard/
  backend/
    app/
      api/          REST route handlers (stocks, crypto, fx, prices, summary, search, admin, health)
      api/deps.py    Supabase JWT verification + require_admin dependency
      services/      Upstream API integrations (yahoo, coingecko, forex, search, summary, tracked_assets)
      models/         SQLAlchemy ORM models (incl. UserProfile, SchedulerRun)
      database/       Engine/session setup + seed script
      scheduler/      APScheduler job definitions, logs every run to scheduler_runs
      schemas/        Pydantic request/response models
      utils/          Cache, logging
      config.py        Environment-driven settings
      main.py           FastAPI app entry point
    tests/               pytest suite (services, API endpoints, scheduler pipeline, auth/admin)
    Dockerfile
    requirements.txt
  frontend/
    app/                 Routes, layout, providers, global styles (Next.js App Router)
    app/login/            Sign in / sign up page, with demo-account buttons
    app/admin/             Admin dashboard (assets, users, scheduler jobs) — admin-gated layout
    app/icon.svg            Favicon (Next.js auto-serves this)
    components/          MarketCard, SparklineChart, Header, Sidebar, AuthNav, Footer,
                          ThemeToggle, GlobalLoadingBar, section components
    context/              AuthContext (Supabase session), ThemeContext (light/dark mode)
    hooks/               React Query hooks (useStocks, useCrypto, useFx, useSummary, useAdmin)
    services/            Axios API client (attaches Supabase bearer token) + per-resource functions
    types/                TypeScript types mirroring the backend Pydantic schemas
    utils/                Formatting helpers (currency, percent, dates)
    __tests__/            Jest + React Testing Library suite
  docker/                docker-compose.yml (backend + Postgres, local dev)
  docs/
  .github/workflows/     ci.yml (lint, test, build, docker image)
```

## API Endpoints

| Method | Path                       | Description                                   |
|--------|-----------------------------|------------------------------------------------|
| GET    | `/health`                   | Liveness check                                 |
| GET    | `/stocks`                   | Live quotes for the default ASX watchlist      |
| GET    | `/stocks/{ticker}`          | Live quote for a single ticker                 |
| GET    | `/stocks/{ticker}/history`  | Historical close prices (`1D/1W/1M/3M`)        |
| GET    | `/crypto`                   | Live quotes for the default crypto watchlist   |
| GET    | `/crypto/{coin_id}`         | Live quote for a single coin                   |
| GET    | `/crypto/{coin_id}/history` | Historical AUD price series                    |
| GET    | `/fx`                       | Live AUD-based rates for the default FX pairs  |
| GET    | `/fx/{currency}`            | Live AUD-based rate for a single currency      |
| GET    | `/fx/{currency}/history`    | Historical AUD-based rate series               |
| GET    | `/prices/{ticker}`          | Stored historical snapshots from PostgreSQL    |
| GET    | `/summary`                  | Market summary banner data                     |
| GET    | `/search?q=`                 | Autocomplete search across stocks/crypto/FX    |
| GET    | `/admin/me`                  | Current authenticated user's profile (auth required) |
| GET/POST/DELETE | `/admin/assets/*`   | Manage tracked stocks/crypto/FX (admin only)   |
| GET    | `/admin/users`               | List users (admin only)                        |
| POST   | `/admin/users/{id}/promote`  | Grant admin (admin only)                       |
| POST   | `/admin/users/{id}/demote`   | Revoke admin (admin only)                      |
| GET    | `/admin/jobs`                 | Scheduler run history (admin only)             |
| POST   | `/admin/jobs/run-now`         | Manually trigger a snapshot run (admin only)   |

Interactive OpenAPI docs are served at `/docs` when the API is running.

## Environment Variables

See [.env.example](.env.example). Key variables:

| Variable                  | Description                                          |
|----------------------------|-------------------------------------------------------|
| `DATABASE_URL`              | Postgres connection string (Supabase). Defaults to a local SQLite file if unset. |
| `SUPABASE_URL` / `SUPABASE_KEY` | Supabase project credentials                     |
| `SUPABASE_JWT_SECRET`        | Supabase dashboard → Settings → API → JWT Settings. Backend verifies auth tokens with this. |
| `ADMIN_EMAILS`               | Comma-separated emails auto-promoted to admin on first sign-in |
| `OPEN_EXCHANGE_API_KEY`     | Free-tier app ID from [openexchangerates.org](https://openexchangerates.org) |
| `SCHEDULER_ENABLED`         | Toggle the background snapshot scheduler             |
| `CORS_ORIGINS`              | Comma-separated list of allowed frontend origins      |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend Supabase client credentials (public/anon-safe) |

## Local Setup (Backend)

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate   # Windows Git Bash; use .venv/bin/activate on macOS/Linux
pip install -r requirements-dev.txt

cp ../.env.example .env
# Edit .env: set OPEN_EXCHANGE_API_KEY, and DATABASE_URL if using Supabase
# (omit DATABASE_URL to fall back to local SQLite for development)

uvicorn app.main:app --reload --port 8000
```

Then visit `http://localhost:8000/docs` for interactive API docs.

### Seeding reference data

Once `DATABASE_URL` points at a real Postgres instance, seed the `stocks`, `crypto`,
and `fx_rates` reference tables (used by the scheduler pipeline in Phase 2):

```bash
python -m app.database.seed
```

## Local Setup (Frontend)

```bash
cd frontend
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

npm run dev
```

Then visit `http://localhost:3000`.

> **Note:** Browse via `http://localhost:3000`, not `http://127.0.0.1:3000` — the backend's
> default `CORS_ORIGINS` only allowlists `http://localhost:3000`, so requests from the
> `127.0.0.1` origin will be silently blocked by the browser. Update `CORS_ORIGINS` in the
> backend `.env` if you need a different frontend origin.

## Authentication & Admin Dashboard

Auth is optional for local dev — the public dashboard works with no Supabase project
configured at all. To enable sign-in and the admin dashboard:

1. Create a free [Supabase](https://supabase.com) project (email/password auth is on by default).
2. Copy **Project URL** and **anon public key** (Settings → API) into the frontend's
   `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Get the **JWT secret** the backend needs to verify tokens — **read
   [Known Issues](#known-issues) first**, since which value to use depends on whether your
   Supabase project uses legacy HS256 signing or the newer asymmetric (ECC/ES256) keys.
4. Set `ADMIN_EMAILS` in the backend `.env` to your email — the first time you sign in
   with that email, your account is auto-promoted to admin.
5. Sign up at `/login`, then visit `/admin`.

Without `NEXT_PUBLIC_SUPABASE_URL` configured, the frontend falls back to a syntactically
valid placeholder URL so the app still builds and the public dashboard still works — sign-in
attempts just fail with a normal network error until you configure a real project (this was
a real bug caught while verifying: `createClient()` throws at *module load time*, not just
when called, so a missing URL crashed the entire production build, not only the login page).

Without `SUPABASE_JWT_SECRET` configured, the backend's `/admin/*` routes return `503`
instead of crashing.

### Demo accounts

`/login` has "Guest demo" and "Admin demo" buttons for reviewers who don't want to sign up.
They sign in with hardcoded credentials (`frontend/app/login/page.tsx`, `DEMO_ACCOUNTS`):

| Role  | Email                | Password        |
|-------|-----------------------|------------------|
| Guest | `demo@findash.app`    | `DemoUser123!`   |
| Admin | `admin@findash.app`   | `DemoAdmin123!`  |

These are **not created automatically** — the buttons only work once you create both users
in Supabase (Authentication → Users → Add user, with "Auto Confirm User" checked) and add
the admin one to `ADMIN_EMAILS`. Change the hardcoded values in `DEMO_ACCOUNTS` if you'd
rather use different credentials.

## Known Issues

### Backend only verifies legacy HS256 Supabase tokens (open)

`app/api/deps.py` verifies Supabase session tokens using a single shared secret
(`SUPABASE_JWT_SECRET`) with the HS256 algorithm. Supabase projects created more recently
default to **asymmetric signing keys** (ECC/P-256, algorithm ES256) instead — check
Supabase dashboard → Settings → API → **JWT Signing Keys**. If the "Current key" there shows
an algorithm other than HS256, every real login will fail `/admin/*` routes with a `401`
even though `SUPABASE_JWT_SECRET` is set correctly, because the backend is verifying an
ES256-signed token as if it were HS256.

**Workaround (no code change):** in that same Supabase page, if a **Legacy HS256 (Shared
Secret)** key is listed, switch it to be the "current"/active signing key. Copy *that* key's
actual secret value (not its Key ID) into `SUPABASE_JWT_SECRET`. New tokens will then be
signed HS256 and verify correctly against the existing backend code.

**Proper fix (not yet implemented):** verify tokens against Supabase's public JWKS endpoint
(`<SUPABASE_URL>/auth/v1/.well-known/jwks.json`) instead of a shared secret — works
regardless of which signing method the project uses, and follows Supabase's current
recommended approach. Would need `PyJWT`'s `PyJWKClient` (requires the `cryptography`
package) in `app/api/deps.py::_decode_token`.

**How to tell which case you're in**, without guessing: mint a token with your
`SUPABASE_JWT_SECRET` and hit your deployed backend directly —

```bash
python -c "
import jwt, time
print(jwt.encode(
    {'sub': 'diag', 'email': 'you@example.com', 'aud': 'authenticated', 'exp': int(time.time())+3600},
    '<SUPABASE_JWT_SECRET>', algorithm='HS256',
))"
curl -H "Authorization: Bearer <token from above>" https://<your-backend>/admin/me
```

If that returns `200`, the shared secret is correct and any remaining `401` on *real* logins
confirms the project is using asymmetric keys (apply the workaround or proper fix above). If
it returns `401`, the secret itself is wrong/mistyped in `SUPABASE_JWT_SECRET`.

### Other deployment pitfalls hit while building this

- **`NEXT_PUBLIC_API_BASE_URL` needs the full scheme.** Setting it to a bare hostname
  (`your-app.up.railway.app` instead of `https://your-app.up.railway.app`) makes the browser
  treat API calls as relative paths on the frontend's own domain instead of the backend —
  every request 404s against the frontend itself, not the API.
- **`CORS_ORIGINS` must exactly match the frontend's deployed origin**, including scheme
  (`https://your-app.vercel.app`, not `your-app.vercel.app`). A mismatch fails silently in
  the UI as a generic network error; check the browser console for an explicit CORS message.
- **Supabase's direct Postgres connection (port 5432) is IPv6-only on newer projects.**
  Environments without IPv6 egress (this project's sandbox, and some PaaS networks) get
  `could not translate host name` or `Network is unreachable`. Use the **connection
  pooler** string instead (port 6543, `...pooler.supabase.com`), which resolves to IPv4.
- **`createClient()` from `@supabase/supabase-js` throws at module-load time**, not just when
  called, if given an empty/invalid URL — and since `AuthContext` is imported from the root
  layout, a missing `NEXT_PUBLIC_SUPABASE_URL` crashes the *entire* `next build`, not just
  auth pages. Fixed here with a syntactically-valid placeholder fallback (`services/supabaseClient.ts`).

## Testing

**Backend** (pytest, with all upstream APIs mocked — no network calls, no API keys needed):

```bash
cd backend
pytest -v
```

Covers service-layer logic (Yahoo/CoinGecko/FX parsing and error handling, the AUD
cross-rate math, search filtering, deriving FX day-change/sparkline from stored snapshots),
API endpoints (success/404/502 paths via `TestClient`), the scheduler's snapshot pipeline
(asserts rows are actually persisted to a real SQLite DB, and that one asset class failing
doesn't block the others), and Supabase JWT auth/admin-access enforcement (45 tests total —
real HS256 JWTs are minted in tests with a fake signing secret, no real Supabase project
needed to run the suite; see [Known Issues](#known-issues) for the HS256-vs-asymmetric-keys
gap this doesn't cover).

**Frontend** (Jest + React Testing Library):

```bash
cd frontend
npm test
```

Covers formatting utilities (including a regression test for a real `Intl.NumberFormat`
crash bug found while verifying Phase 4 in a browser), the `localStorage` watchlist store,
the `useWatchlist` hook, and `MarketCard` rendering/interaction.

## Docker

The backend is fully dockerized. From the `docker/` directory:

```bash
cd docker
cp ../.env.example .env   # set OPEN_EXCHANGE_API_KEY at minimum
docker compose up --build
```

This starts a local Postgres instance and the FastAPI backend (with the scheduler enabled)
on `http://localhost:8000`. The frontend still runs separately via `npm run dev` (Vercel is
the target for the deployed frontend, not Docker).

> **Note:** Docker was not available in the sandbox this project was built in, so the
> `Dockerfile`/`docker-compose.yml` are written to standard, well-tested patterns (multi-stage
> Python build, non-root runtime user, healthcheck hitting `/health`) but have not been
> verified end-to-end with an actual `docker build`. Verify locally before relying on them
> for a real deployment.

## CI/CD

`.github/workflows/ci.yml` runs on every push/PR to `main`:

- **backend** — `ruff check` + `pytest`
- **frontend** — `eslint` + `tsc --noEmit` + `jest` + `next build`
- **docker** — builds the backend image to catch Dockerfile regressions (depends on `backend` passing)

## Deployment Guide

**Backend → Railway:**
1. Create a new Railway project from this repo, root directory `backend/`.
2. Railway auto-detects the `Dockerfile`. Set environment variables from `.env.example`
   (`DATABASE_URL` pointed at your Supabase Postgres connection string, `OPEN_EXCHANGE_API_KEY`,
   `CORS_ORIGINS` set to your deployed frontend's origin, plus `SUPABASE_JWT_SECRET` and
   `ADMIN_EMAILS` if using auth — see [Authentication & Admin Dashboard](#authentication--admin-dashboard)).
3. Deploy. Railway assigns a public URL — note it for the frontend's `NEXT_PUBLIC_API_BASE_URL`.

**Database → Supabase:**
1. Create a Supabase project; copy its Postgres connection string into `DATABASE_URL`.
   Use the **connection pooler** string (port 6543), not the direct connection (port
   5432) — see [Known Issues](#known-issues) for why.
2. On first boot, the FastAPI app creates all tables (`Base.metadata.create_all`) and the
   scheduler seeds the `stocks`/`crypto`/`fx_rates` reference tables automatically — no manual
   migration step needed for a fresh database.

**Frontend → Vercel:**
1. Import this repo into Vercel, root directory `frontend/`.
2. Set `NEXT_PUBLIC_API_BASE_URL` to the **full** Railway backend URL from above (including
   `https://`), plus `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` if using auth.
3. Deploy. Vercel builds with `next build` automatically.

**GitHub Actions:** no additional setup — the workflow only builds/tests/lints and doesn't
deploy anything, so it works out of the box on any fork once pushed.

## Screenshots

_Add screenshots of the running dashboard here — e.g. `docs/screenshot-dashboard.png`,
`docs/screenshot-detail.png` — once deployed or run locally._

## Build Phases

- [x] **Phase 1** — Backend foundations: FastAPI app, SQLAlchemy models, Pydantic schemas,
      Yahoo Finance / CoinGecko / Open Exchange Rates integrations, REST endpoints, in-process caching.
- [x] **Phase 2** — APScheduler-driven snapshot pipeline persisting historical data to PostgreSQL
      (`app/scheduler/jobs.py`), seeding reference tables on startup, isolated per-asset-class error handling.
- [x] **Phase 3** — Next.js (App Router, TypeScript, Tailwind) dashboard with React Query data
      fetching, Axios services, and reusable components (`MarketCard`, `SparklineChart`, `Header`,
      `Sidebar`, skeleton/error states) rendering live ASX stock, crypto, and FX sections.
- [x] **Phase 4** — Unified `/search` across stocks/crypto/FX (`SearchBar`), a `localStorage`
      watchlist behind a swappable `WatchlistStore` interface, historical `PriceChart` with
      1D/1W/1M/3M range switching and tooltip/crosshair on every asset detail page
      (`/stocks/[ticker]`, `/crypto/[id]`, `/fx/[currency]`), and the `SummaryBanner` wired to `/summary`.
- [x] **Phase 5** — 28 backend pytest tests + 20 frontend Jest/RTL tests (all upstream calls
      mocked, no network/API keys required to run), dockerized backend (`backend/Dockerfile`,
      `docker/docker-compose.yml`), GitHub Actions CI (`backend`/`frontend`/`docker` jobs), and a
      deployment guide (Railway + Supabase + Vercel).
- [x] **Phase 6** — Supabase Auth (email/password) verified via HS256 JWT on the backend
      (`app/api/deps.py`), a DB-backed `UserProfile`/admin flag with auto-promotion via
      `ADMIN_EMAILS`, tracked stocks/crypto/FX switched from static env config to DB-driven
      (so admin edits take effect immediately across `/stocks`, `/crypto`, `/fx`, `/summary`,
      and the scheduler), and an admin dashboard (`/admin/assets`, `/admin/users`, `/admin/jobs`)
      to manage them, manage user roles, and view/trigger scheduler runs.
- [x] **Phase 7 — Post-launch polish** — light/dark mode with a manual toggle and no-flash
      script (`context/ThemeContext.tsx`), a Stack Overflow-inspired visual redesign (dark nav,
      sharper cards/buttons/badges, hover/press micro-interactions), a favicon and footer, demo
      login accounts, a global loading bar (`GlobalLoadingBar`), FX cards fixed to actually show
      day-change/sparkline data (derived from stored snapshots instead of never being populated),
      clickable summary banner tiles, a more discoverable admin dashboard entry point, and a fix
      for admin permission checks leaking across accounts in the same browser tab (query cache
      wasn't scoped per signed-in user).

## Future Improvements

- **Verify Supabase auth tokens via JWKS instead of a shared HS256 secret** — see
  [Known Issues](#known-issues) for why this is currently required for projects using
  Supabase's newer asymmetric signing keys.
- Redis-backed cache for multi-instance deployments (currently in-process TTL cache).
- Migrate the `localStorage` watchlist to a backend-persisted, per-user watchlist now that
  auth exists — `WatchlistStore` (`frontend/types/watchlist.ts`) is already an interface
  specifically so this is a drop-in swap.
- WebSocket/streaming price updates instead of polling.
- Alembic migrations instead of `Base.metadata.create_all` for schema changes post-launch.

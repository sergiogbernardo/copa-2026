# Copa 2026 — Live Tracker

A simple app to follow the 2026 World Cup in (near) real time: upcoming fixtures
(who plays whom, where and when), live scores, group standings, the knockout
bracket and insights (top scorers and recent form).

- **Web** (`apps/web`) — React + Vite + TypeScript + Tailwind. Deployed to GitHub
  Pages at `https://sergiogbernardo.github.io/copa-2026/`.
- **Worker** (`apps/worker`) — Cloudflare Worker that proxies the
  [football-data.org](https://www.football-data.org/) v4 API. It keeps the API
  token secret and caches responses to protect the free-tier quota.

```
Browser ──► GitHub Pages (web) ──► Cloudflare Worker (proxy) ──► football-data.org
```

## Requirements

- Node.js 22+
- A football-data.org API token (free tier at <https://www.football-data.org/client/register>)
- A Cloudflare account (free) for the Worker

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL (defaults to the local worker)
```

## Local development

Run the Worker and the web app in two terminals:

```bash
# terminal 1 — proxy on http://localhost:8787
npm run dev:worker

# terminal 2 — web on http://localhost:5173
npm run dev
```

For local Worker dev, put your token in `apps/worker/.dev.vars`:

```
FOOTBALL_DATA_TOKEN=your_token_here
```

## API (Worker)

| Endpoint                | Description                                          |
| ----------------------- | ---------------------------------------------------- |
| `GET /matches`          | Recent results + upcoming fixtures                   |
| `GET /matches?live=true`| Only in-play matches                                 |
| `GET /standings`        | Group-stage tables                                   |
| `GET /bracket`          | Knockout matches grouped by round                    |
| `GET /scorers`          | Top scorers of the tournament                        |

All endpoints accept `?season=2026` (also `2022`/`2024` for covered editions).

## Quality

```bash
npm run lint      # ESLint
npm run format    # Prettier (write)
npm test          # Vitest across workspaces
```

## Deploy

**Worker (Cloudflare):**

```bash
cd apps/worker
npx wrangler secret put FOOTBALL_DATA_TOKEN   # paste your token
npm run deploy
```

**Web (GitHub Pages):** push to `main`. The workflow in
`.github/workflows/deploy.yml` builds `apps/web` and publishes it. Set the repo
variable `VITE_API_BASE_URL` (Settings → Secrets and variables → Actions →
Variables) to the deployed Worker URL, and enable Pages with "GitHub Actions"
as the source.

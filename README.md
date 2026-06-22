# Copa 2026 — Live Tracker

A simple app to follow the 2026 World Cup in (near) real time: upcoming fixtures
(who plays whom, where and when), live scores, group standings, the knockout
bracket and insights (top scorers and recent form).

- **Web** (`apps/web`) — React + Vite + TypeScript + Tailwind. Deployed to GitHub
  Pages at `https://sergiogbernardo.github.io/copa-2026/`.
- **Worker** (`apps/worker`) — Cloudflare Worker that proxies the
  [football-data.org](https://www.football-data.org/) v4 API. It keeps the API
  token secret and uses Edge Cache plus a persistent KV snapshot to protect the
  free-tier quota.

```
Browser ──► GitHub Pages (web) ──► Cloudflare Worker (proxy) ──► football-data.org
                                      │
                                      └──► Workers KV (shared snapshot)
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

# once after the Worker starts — populate the local KV snapshot
curl http://localhost:8787/__scheduled

# terminal 2 — web on http://localhost:5173
npm run dev
```

For local Worker dev, put your token in `apps/worker/.dev.vars`:

```
FOOTBALL_DATA_TOKEN=your_token_here
```

## API (Worker)

| Endpoint                 | Description                             |
| ------------------------ | --------------------------------------- |
| `GET /matches`           | Recent results + upcoming fixtures      |
| `GET /matches?live=true` | Only in-play matches                    |
| `GET /standings`         | Group-stage tables                      |
| `GET /bracket`           | Knockout matches grouped by round       |
| `GET /scorers`           | Top scorers of the tournament           |
| `GET /teams`             | Teams, coaches and available squad data |

All endpoints accept `?season=2026`.

The Worker refreshes the 2026 snapshot every minute through a Cron Trigger.
Matches, standings and the bracket are derived from one upstream response;
scorers refresh every 10 minutes and squads every hour. KV keeps the last good
snapshot available when the upstream API is unavailable, while the Edge Cache
absorbs repeated requests within each Cloudflare location.

Public requests never call football-data.org directly. Immediately after the
first deployment, endpoints may return `503` for up to one minute while the
Cron Trigger creates the initial snapshot. This deliberately prevents a cold
cache stampede from exhausting the upstream rate limit.

Group tables are calculated from group-stage results using the tie-breakers
available in the feed: points, goal difference and goals scored. Later FIFA
tie-breakers such as fair play are not available from the free data source.

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

The production KV namespace and one-minute Cron Trigger are declared in
`apps/worker/wrangler.toml`. Local `wrangler dev` uses a local KV simulation.

**Web (GitHub Pages):** push to `main`. The workflow in
`.github/workflows/deploy.yml` builds `apps/web` and publishes it. Set the repo
variable `VITE_API_BASE_URL` (Settings → Secrets and variables → Actions →
Variables) to the deployed Worker URL, and enable Pages with "GitHub Actions"
as the source.

## PWA

The web app includes a manifest, install icon and service worker. Production
builds can be installed from supporting browsers. The application shell is
available offline; live tournament data still requires connectivity.

## Data limitations

The free football-data.org plan may delay scores and does not guarantee cards,
per-match line-ups or goal-event details. The UI does not fabricate those data.

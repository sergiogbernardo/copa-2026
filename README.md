# Copa 2026 — Live Tracker

A simple app to follow the 2026 World Cup in (near) real time: upcoming fixtures
(who plays whom, where and when), live scores, group standings and insights.

- **Web** (`apps/web`) — React + Vite + TypeScript + Tailwind. Deployed to GitHub
  Pages at `https://sergiogbernardo.github.io/copa-2026/`.
- **Worker** (`apps/worker`) — Cloudflare Worker that proxies the
  [API-Football](https://www.api-football.com/) endpoints. It keeps the API key
  secret and caches responses to protect the free-tier quota.

```
Browser ──► GitHub Pages (web) ──► Cloudflare Worker (proxy) ──► API-Football
```

## Requirements

- Node.js 22+
- An API-Football key (free tier at <https://www.api-sports.io/>)
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

For local Worker dev, put your key in `apps/worker/.dev.vars`:

```
FOOTBALL_API_KEY=your_key_here
```

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
npx wrangler secret put FOOTBALL_API_KEY   # paste your key
npm run deploy
```

**Web (GitHub Pages):** push to `main`. The workflow in
`.github/workflows/deploy.yml` builds `apps/web` and publishes it. Set the repo
variable `VITE_API_BASE_URL` (Settings → Secrets and variables → Actions →
Variables) to the deployed Worker URL, and enable Pages with "GitHub Actions"
as the source.

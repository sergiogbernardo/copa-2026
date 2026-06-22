import { getSnapshot, refreshSnapshot, type CacheEnv } from './cache';
import { DEFAULT_SEASON, selectMappedMatches } from './footballApi';

export interface Env extends CacheEnv {
  ALLOWED_ORIGIN: string;
}

const SUPPORTED_SEASONS = new Set(['2026']);
const API_PATHS = new Set(['/matches', '/standings', '/bracket', '/scorers', '/teams']);

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(
  data: unknown,
  origin: string,
  options: {
    status?: number;
    cacheStatus?: string;
    browserTtl?: number;
    edgeTtl?: number;
  } = {},
): Response {
  const { status = 200, cacheStatus, browserTtl = 0, edgeTtl = 0 } = options;
  const cacheControl =
    status === 200 && edgeTtl > 0
      ? `public, max-age=${browserTtl}, s-maxage=${edgeTtl}`
      : 'no-store';

  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': cacheControl,
      ...(cacheStatus ? { 'X-Cache': cacheStatus } : {}),
      ...corsHeaders(origin),
    },
  });
}

function cacheKey(request: Request): Request {
  return new Request(request.url, { method: 'GET' });
}

async function readEdgeCache(request: Request): Promise<Response | undefined> {
  if (typeof caches === 'undefined') return undefined;
  const cached = await caches.default.match(cacheKey(request));
  if (!cached) return undefined;
  const response = new Response(cached.body, cached);
  response.headers.set('X-Cache', 'EDGE');
  return response;
}

function writeEdgeCache(request: Request, response: Response, ctx: ExecutionContext): void {
  if (typeof caches === 'undefined' || !response.ok) return;
  ctx.waitUntil(caches.default.put(cacheKey(request), response.clone()));
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const origin = env.ALLOWED_ORIGIN || '*';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== 'GET') {
      return json({ error: 'Method not allowed' }, origin, { status: 405 });
    }

    const edgeHit = await readEdgeCache(request);
    if (edgeHit) return edgeHit;

    const url = new URL(request.url);
    if (!API_PATHS.has(url.pathname)) {
      return json({ error: 'Not found' }, origin, { status: 404 });
    }
    const season = url.searchParams.get('season') ?? DEFAULT_SEASON;
    if (!SUPPORTED_SEASONS.has(season)) {
      return json({ error: 'Unsupported season' }, origin, { status: 400 });
    }

    try {
      const cached = await getSnapshot(env, season);
      if (!cached) {
        const warming = json({ error: 'Cache is warming up' }, origin, { status: 503 });
        warming.headers.set('Retry-After', '30');
        return warming;
      }
      const { snapshot, cacheStatus } = cached;
      let response: Response;

      if (url.pathname === '/matches') {
        const matches = selectMappedMatches(snapshot.matches, {
          live: url.searchParams.get('live') === 'true',
          all: url.searchParams.get('all') === 'true',
        });
        response = json(matches, origin, {
          cacheStatus,
          browserTtl: 15,
          edgeTtl: 60,
        });
      } else if (url.pathname === '/standings') {
        response = json(snapshot.standings, origin, {
          cacheStatus,
          browserTtl: 60,
          edgeTtl: 300,
        });
      } else if (url.pathname === '/bracket') {
        response = json(snapshot.bracket, origin, {
          cacheStatus,
          browserTtl: 60,
          edgeTtl: 300,
        });
      } else if (url.pathname === '/scorers') {
        response = json(snapshot.scorers, origin, {
          cacheStatus,
          browserTtl: 300,
          edgeTtl: 600,
        });
      } else {
        response = json(snapshot.teams, origin, {
          cacheStatus,
          browserTtl: 3600,
          edgeTtl: 3600,
        });
      }

      writeEdgeCache(request, response, ctx);
      return response;
    } catch (error) {
      console.error(error);
      return json({ error: 'Upstream request failed' }, origin, { status: 502 });
    }
  },

  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(refreshSnapshot(env, DEFAULT_SEASON, controller.scheduledTime));
  },
};

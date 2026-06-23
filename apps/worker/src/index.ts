import { getSnapshot, refreshSnapshot, type CacheEnv } from './cache';
import { DEFAULT_SEASON, selectMappedMatches } from './footballApi';

export interface Env extends CacheEnv {
  ALLOWED_ORIGIN: string;
  API_RATE_LIMITER: RateLimit;
}

const SUPPORTED_SEASONS = new Set(['2026']);
const API_PATHS = new Set(['/matches', '/standings', '/bracket', '/scorers', '/teams']);
const HEALTH_PATH = '/health';
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
} as const;

function corsHeaders(origin?: string): Record<string, string> {
  if (!origin) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(
  data: unknown,
  origin?: string,
  options: {
    status?: number;
    cacheStatus?: string;
    browserTtl?: number;
    edgeTtl?: number;
    headers?: HeadersInit;
  } = {},
): Response {
  const { status = 200, cacheStatus, browserTtl = 0, edgeTtl = 0, headers } = options;
  const cacheControl =
    status === 200 && edgeTtl > 0
      ? `public, max-age=${browserTtl}, s-maxage=${edgeTtl}`
      : 'no-store';

  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl,
      ...SECURITY_HEADERS,
      ...(cacheStatus ? { 'X-Cache': cacheStatus } : {}),
      ...corsHeaders(origin),
      ...(headers ?? {}),
    },
  });
}

function cacheKey(url: URL, season: string): Request {
  const key = new URL(url.origin);
  key.pathname = url.pathname;

  if (url.pathname === '/matches') {
    key.searchParams.set('season', season);
    if (url.searchParams.get('all') === 'true') key.searchParams.set('all', 'true');
    if (url.searchParams.get('live') === 'true') key.searchParams.set('live', 'true');
  } else {
    key.searchParams.set('season', season);
  }

  return new Request(key.toString(), { method: 'GET' });
}

async function readEdgeCache(url: URL, season: string): Promise<Response | undefined> {
  if (typeof caches === 'undefined') return undefined;
  const cached = await caches.default.match(cacheKey(url, season));
  if (!cached) return undefined;
  const response = new Response(cached.body, cached);
  response.headers.set('X-Cache', 'EDGE');
  return response;
}

function writeEdgeCache(url: URL, season: string, response: Response, ctx: ExecutionContext): void {
  if (typeof caches === 'undefined' || !response.ok) return;
  ctx.waitUntil(caches.default.put(cacheKey(url, season), response.clone()));
}

function buildHealthPayload(snapshot: { season: string; updatedAt: number }, now = Date.now()) {
  const ageSeconds = Math.max(0, Math.floor((now - snapshot.updatedAt) / 1000));
  return {
    ok: true,
    ready: true,
    season: snapshot.season,
    updatedAt: snapshot.updatedAt,
    ageSeconds,
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const origin = env.ALLOWED_ORIGIN;

    if (!origin) {
      console.error('ALLOWED_ORIGIN is not configured');
      return json({ error: 'Server misconfigured' }, undefined, { status: 500 });
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== 'GET') {
      return json({ error: 'Method not allowed' }, origin, { status: 405 });
    }

    const url = new URL(request.url);
    if (!API_PATHS.has(url.pathname)) {
      if (url.pathname === HEALTH_PATH) {
        const snapshot = await getSnapshot(env, DEFAULT_SEASON);
        if (!snapshot) {
          return json(
            {
              ok: false,
              ready: false,
              season: DEFAULT_SEASON,
              updatedAt: null,
              ageSeconds: null,
            },
            origin,
            { status: 503 },
          );
        }

        return json(buildHealthPayload(snapshot.snapshot), origin, {
          headers: {
            'Cache-Control': 'no-store',
          },
        });
      }

      return json({ error: 'Not found' }, origin, { status: 404 });
    }
    const season = url.searchParams.get('season') ?? DEFAULT_SEASON;
    if (!SUPPORTED_SEASONS.has(season)) {
      return json({ error: 'Unsupported season' }, origin, { status: 400 });
    }

    const clientAddress = request.headers.get('CF-Connecting-IP') ?? 'local';
    try {
      const { success } = await env.API_RATE_LIMITER.limit({
        key: `${clientAddress}:${url.pathname}`,
      });
      if (!success) {
        return json({ error: 'Too many requests' }, origin, {
          status: 429,
          headers: { 'Retry-After': '60' },
        });
      }
    } catch (error) {
      console.error(
        JSON.stringify({
          message: 'rate limiter unavailable',
          error: error instanceof Error ? error.message : String(error),
        }),
      );
      return json({ error: 'Service temporarily unavailable' }, origin, {
        status: 503,
        headers: { 'Retry-After': '30' },
      });
    }

    const edgeHit = await readEdgeCache(url, season);
    if (edgeHit) return edgeHit;

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

      writeEdgeCache(url, season, response, ctx);
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

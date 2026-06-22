import { DEFAULT_SEASON, fetchMatches } from './footballApi';

export interface Env {
  FOOTBALL_DATA_TOKEN: string;
  ALLOWED_ORIGIN: string;
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data: unknown, origin: string, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      // Short edge cache to protect the upstream free-tier quota.
      'Cache-Control': 'public, max-age=15',
      ...corsHeaders(origin),
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = env.ALLOWED_ORIGIN || '*';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === '/matches') {
        const live = url.searchParams.get('live') === 'true';
        // Focus on 2026, but allow ?season=2022/2024 for the covered editions.
        const season = url.searchParams.get('season') ?? DEFAULT_SEASON;
        const matches = await fetchMatches(env.FOOTBALL_DATA_TOKEN, { live, season });
        return json(matches, origin);
      }

      // /standings is stubbed until the basic flow is validated.
      if (url.pathname === '/standings') {
        return json([], origin);
      }

      return json({ error: 'Not found' }, origin, 404);
    } catch (error) {
      console.error(error);
      return json({ error: 'Upstream request failed' }, origin, 502);
    }
  },
};

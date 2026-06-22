import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearMemoryCacheForTests, type TournamentSnapshot } from '../cache';
import worker, { type Env } from '../index';

const snapshot: TournamentSnapshot = {
  version: 1,
  season: '2026',
  updatedAt: Date.UTC(2026, 5, 22),
  matches: [
    {
      id: 1,
      status: 'NS',
      kickoff: '2026-06-23T19:00:00Z',
      venue: 'Fase de Grupos · Grupo A',
      city: null,
      home: { name: 'Brazil', logo: 'bra.svg', goals: null },
      away: { name: 'Japan', logo: 'jpn.svg', goals: null },
    },
  ],
  standings: [],
  bracket: [],
  scorers: [],
  teams: [],
};

function setup() {
  const get = vi.fn(async () => snapshot);
  const env = {
    FOOTBALL_DATA_TOKEN: 'test-token',
    ALLOWED_ORIGIN: 'https://example.com',
    CACHE: { get, put: vi.fn() } as unknown as KVNamespace,
  } satisfies Env;
  const waitUntil = vi.fn();
  const ctx = { waitUntil } as unknown as ExecutionContext;
  return { env, ctx, get, waitUntil };
}

afterEach(() => {
  vi.unstubAllGlobals();
  clearMemoryCacheForTests();
});

describe('Worker routes', () => {
  it('serves API data from the shared KV snapshot', async () => {
    const { env, ctx, get } = setup();
    const response = await worker.fetch(
      new Request('https://worker.example/matches?all=true'),
      env,
      ctx,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Cache')).toBe('KV');
    expect(await response.json()).toEqual(snapshot.matches);
    expect(get).toHaveBeenCalledOnce();
  });

  it('normalizes edge cache keys and ignores unrelated query params', async () => {
    const { env, ctx, get } = setup();
    const match = vi.fn(async (request: Request) => {
      expect(request.url).toBe('https://worker.example/matches?season=2026&all=true');
      return Response.json(snapshot.matches);
    });
    const put = vi.fn();
    vi.stubGlobal('caches', {
      default: {
        match,
        put,
      },
    });

    const response = await worker.fetch(
      new Request('https://worker.example/matches?all=true&foo=bar'),
      env,
      ctx,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Cache')).toBe('EDGE');
    expect(await response.json()).toEqual(snapshot.matches);
    expect(get).not.toHaveBeenCalled();
    expect(match).toHaveBeenCalledOnce();
    expect(put).not.toHaveBeenCalled();
  });

  it('rejects unsupported seasons before reading KV', async () => {
    const { env, ctx, get } = setup();
    const response = await worker.fetch(
      new Request('https://worker.example/matches?season=2024'),
      env,
      ctx,
    );

    expect(response.status).toBe(400);
    expect(get).not.toHaveBeenCalled();
  });

  it('rejects unsupported methods', async () => {
    const { env, ctx } = setup();
    const response = await worker.fetch(
      new Request('https://worker.example/matches', { method: 'POST' }),
      env,
      ctx,
    );
    expect(response.status).toBe(405);
  });

  it('fails closed when the allowed origin is not configured', async () => {
    const { env, ctx } = setup();
    env.ALLOWED_ORIGIN = '' as unknown as string;

    const response = await worker.fetch(new Request('https://worker.example/matches'), env, ctx);

    expect(response.status).toBe(500);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(await response.json()).toEqual({ error: 'Server misconfigured' });
  });

  it('returns 503 instead of hitting upstream while the first snapshot warms', async () => {
    const { env, ctx } = setup();
    env.CACHE = { get: vi.fn(async () => null), put: vi.fn() } as unknown as KVNamespace;
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(new Request('https://worker.example/matches'), env, ctx);

    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('exposes a health endpoint with snapshot age when ready', async () => {
    const { env, ctx } = setup();
    const response = await worker.fetch(new Request('https://worker.example/health'), env, ctx);

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toMatchObject({
      ok: true,
      ready: true,
      season: '2026',
      updatedAt: snapshot.updatedAt,
      ageSeconds: expect.any(Number),
    });
  });
});

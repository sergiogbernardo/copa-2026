import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearMemoryCacheForTests, readSnapshot, refreshSnapshot } from '../cache';
import type { RawMatch } from '../footballApi';

const rawMatch: RawMatch = {
  id: 1,
  utcDate: '2026-06-22T19:00:00Z',
  status: 'FINISHED',
  stage: 'GROUP_STAGE',
  group: 'GROUP_A',
  homeTeam: { name: 'Brazil', crest: 'bra.svg' },
  awayTeam: { name: 'Japan', crest: 'jpn.svg' },
  score: { fullTime: { home: 2, away: 1 } },
};

afterEach(() => {
  vi.unstubAllGlobals();
  clearMemoryCacheForTests();
});

describe('refreshSnapshot', () => {
  it('shares the matches payload and avoids KV writes when data did not change', async () => {
    const values = new Map<string, string>();
    const put = vi.fn(async (key: string, value: string) => {
      values.set(key, value);
    });
    const kv = {
      get: vi.fn(async (key: string) => {
        const value = values.get(key);
        return value ? JSON.parse(value) : null;
      }),
      put,
    } as unknown as KVNamespace;
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes('/matches')) return Response.json({ matches: [rawMatch] });
      if (url.includes('/scorers')) return Response.json({ scorers: [] });
      if (url.includes('/teams')) return Response.json({ teams: [] });
      return new Response(null, { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const env = { FOOTBALL_DATA_TOKEN: 'test-token', CACHE: kv };
    const firstRun = Date.UTC(2026, 5, 22, 12, 1);
    const snapshot = await refreshSnapshot(env, '2026', firstRun, true);
    const unchanged = await refreshSnapshot(env, '2026', firstRun + 60_000);

    expect(snapshot.matches).toHaveLength(1);
    expect(snapshot.standings.map((row) => row.team)).toEqual(['Brazil', 'Japan']);
    expect(unchanged).toEqual(snapshot);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(put).toHaveBeenCalledTimes(1);
  });
});

describe('readSnapshot', () => {
  it('re-reads KV once the in-memory copy expires so stale scores cannot persist', async () => {
    const fresh = { version: 1 as const, season: '2026', matches: [], standings: [], bracket: [], scorers: [], teams: [], updatedAt: 2 }; // prettier-ignore
    const stale = { ...fresh, updatedAt: 1 };
    let storedValue = stale;
    const get = vi.fn(async () => storedValue);
    const env = { FOOTBALL_DATA_TOKEN: 'test-token', CACHE: { get } as unknown as KVNamespace };

    const start = Date.UTC(2026, 5, 22, 12, 0);
    // First read populates the memory cache from KV.
    expect((await readSnapshot(env, '2026', start))?.updatedAt).toBe(1);

    // KV now holds a newer snapshot. Within the TTL we still serve the cached copy.
    storedValue = fresh;
    expect((await readSnapshot(env, '2026', start + 29_000))?.updatedAt).toBe(1);
    expect(get).toHaveBeenCalledTimes(1);

    // Past the TTL we go back to KV and pick up the newer snapshot.
    expect((await readSnapshot(env, '2026', start + 31_000))?.updatedAt).toBe(2);
    expect(get).toHaveBeenCalledTimes(2);
  });
});

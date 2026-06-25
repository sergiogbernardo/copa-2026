import {
  buildBracket,
  buildGroupStandings,
  fetchRawMatches,
  fetchScorers,
  fetchTeams,
  selectMatches,
  type BracketRound,
  type Match,
  type Scorer,
  type StandingRow,
  type TeamInfo,
} from './footballApi';

export interface CacheEnv {
  FOOTBALL_DATA_TOKEN: string;
  CACHE: KVNamespace;
}

export interface TournamentSnapshot {
  version: 1;
  season: string;
  matches: Match[];
  standings: StandingRow[];
  bracket: BracketRound[];
  scorers: Scorer[];
  teams: TeamInfo[];
  /** Time when the stored data last changed, not merely when it was checked. */
  updatedAt: number;
}

/**
 * How long a snapshot may be served from the in-isolate memory cache before we
 * re-read the KV store. Traffic-serving isolates never refresh the snapshot
 * themselves (only the cron does), so without an expiry they would freeze on the
 * first value they ever read and keep serving it — which makes scores appear to
 * "go back in time" as requests bounce between isolates frozen at different
 * moments. Aligning the expiry with the KV `cacheTtl` keeps reads consistent.
 */
const MEMORY_TTL_MS = 30_000;

interface MemoryEntry {
  snapshot: TournamentSnapshot;
  storedAt: number;
}

const memoryCache = new Map<string, MemoryEntry>();
const refreshes = new Map<string, Promise<TournamentSnapshot>>();

function snapshotKey(season: string): string {
  return `tournament:v1:${season}`;
}

function snapshotData(snapshot: TournamentSnapshot): Omit<TournamentSnapshot, 'updatedAt'> {
  return {
    version: snapshot.version,
    season: snapshot.season,
    matches: snapshot.matches,
    standings: snapshot.standings,
    bracket: snapshot.bracket,
    scorers: snapshot.scorers,
    teams: snapshot.teams,
  };
}

export function snapshotsHaveSameData(
  current: TournamentSnapshot,
  next: Omit<TournamentSnapshot, 'updatedAt'>,
): boolean {
  return JSON.stringify(snapshotData(current)) === JSON.stringify(next);
}

export async function readSnapshot(
  env: CacheEnv,
  season: string,
  now = Date.now(),
): Promise<TournamentSnapshot | null> {
  const key = snapshotKey(season);
  const inMemory = memoryCache.get(key);
  if (inMemory && now - inMemory.storedAt < MEMORY_TTL_MS) return inMemory.snapshot;

  const stored = await env.CACHE.get<TournamentSnapshot>(key, {
    type: 'json',
    cacheTtl: 30,
  });
  if (stored) memoryCache.set(key, { snapshot: stored, storedAt: now });
  return stored;
}

async function writeSnapshot(
  env: CacheEnv,
  snapshot: TournamentSnapshot,
  now = Date.now(),
): Promise<TournamentSnapshot> {
  await env.CACHE.put(snapshotKey(snapshot.season), JSON.stringify(snapshot));
  memoryCache.set(snapshotKey(snapshot.season), { snapshot, storedAt: now });
  return snapshot;
}

async function optionalRefresh<T>(
  label: string,
  fetcher: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fetcher();
  } catch (error) {
    console.error(`Failed to refresh ${label}`, error);
    return fallback;
  }
}

/**
 * Refresh one season using a single matches request. Group tables and the
 * bracket are derived from that same payload to preserve the upstream quota.
 */
export async function refreshSnapshot(
  env: CacheEnv,
  season: string,
  now = Date.now(),
  forceAll = false,
): Promise<TournamentSnapshot> {
  const key = snapshotKey(season);
  const running = refreshes.get(key);
  if (running) return running;

  const refresh = (async () => {
    const current = await readSnapshot(env, season, now);
    const minute = new Date(now).getUTCMinutes();
    const rawMatches = await fetchRawMatches(env.FOOTBALL_DATA_TOKEN, season);

    const refreshScorers = forceAll || !current || minute % 10 === 0;
    const refreshTeams = forceAll || !current || minute === 0;
    const [scorers, teams] = await Promise.all([
      refreshScorers
        ? optionalRefresh(
            'scorers',
            () => fetchScorers(env.FOOTBALL_DATA_TOKEN, season),
            current?.scorers ?? [],
          )
        : Promise.resolve(current.scorers),
      refreshTeams
        ? optionalRefresh(
            'teams',
            () => fetchTeams(env.FOOTBALL_DATA_TOKEN, season),
            current?.teams ?? [],
          )
        : Promise.resolve(current.teams),
    ]);

    const next: Omit<TournamentSnapshot, 'updatedAt'> = {
      version: 1,
      season,
      matches: selectMatches(rawMatches, { live: false, all: true }),
      standings: buildGroupStandings(rawMatches),
      bracket: buildBracket(rawMatches),
      scorers,
      teams,
    };

    if (current && snapshotsHaveSameData(current, next)) return current;
    return writeSnapshot(env, { ...next, updatedAt: now }, now);
  })().finally(() => refreshes.delete(key));

  refreshes.set(key, refresh);
  return refresh;
}

/** Serve the persistent snapshot without allowing public traffic to hit upstream. */
export async function getSnapshot(
  env: CacheEnv,
  season: string,
): Promise<{ snapshot: TournamentSnapshot; cacheStatus: 'KV' } | null> {
  const cached = await readSnapshot(env, season);
  if (cached) return { snapshot: cached, cacheStatus: 'KV' };
  return null;
}

export function clearMemoryCacheForTests(): void {
  memoryCache.clear();
  refreshes.clear();
}

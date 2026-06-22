/** Thin client + mappers for the API-Football v3 endpoints we use. */

const API_BASE = 'https://v3.football.api-sports.io';

// API-Football identifiers for the FIFA World Cup.
export const WORLD_CUP_LEAGUE_ID = 1;
export const WORLD_CUP_SEASON = 2026;

export interface Match {
  id: number;
  status: string;
  kickoff: string;
  venue: string | null;
  city: string | null;
  home: TeamSide;
  away: TeamSide;
}

export interface TeamSide {
  name: string;
  logo: string;
  goals: number | null;
}

export interface StandingRow {
  rank: number;
  team: string;
  logo: string;
  points: number;
  played: number;
  goalsDiff: number;
  group: string;
}

/** Shape of the fixture objects returned by API-Football (only fields we read). */
export interface RawFixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string };
    venue: { name: string | null; city: string | null };
  };
  teams: {
    home: { name: string; logo: string };
    away: { name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
}

export function mapFixtureToMatch(raw: RawFixture): Match {
  return {
    id: raw.fixture.id,
    status: raw.fixture.status.short,
    kickoff: raw.fixture.date,
    venue: raw.fixture.venue.name,
    city: raw.fixture.venue.city,
    home: { name: raw.teams.home.name, logo: raw.teams.home.logo, goals: raw.goals.home },
    away: { name: raw.teams.away.name, logo: raw.teams.away.logo, goals: raw.goals.away },
  };
}

async function apiGet(path: string, params: Record<string, string>, apiKey: string): Promise<{
  response: unknown[];
}> {
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const res = await fetch(url, { headers: { 'x-apisports-key': apiKey } });
  if (!res.ok) {
    throw new Error(`API-Football error: ${res.status}`);
  }
  return (await res.json()) as { response: unknown[] };
}

export async function fetchMatches(apiKey: string, live: boolean): Promise<Match[]> {
  const params = live
    ? { live: 'all' }
    : {
        league: String(WORLD_CUP_LEAGUE_ID),
        season: String(WORLD_CUP_SEASON),
        next: '20',
      };
  const data = await apiGet('/fixtures', params, apiKey);
  return (data.response as RawFixture[]).map(mapFixtureToMatch);
}

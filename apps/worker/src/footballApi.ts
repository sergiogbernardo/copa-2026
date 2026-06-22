/** Client + mappers for the football-data.org v4 API (FIFA World Cup). */

const API_BASE = 'https://api.football-data.org/v4';
const WORLD_CUP_CODE = 'WC';
export const DEFAULT_SEASON = '2026';

// How many recent results + upcoming fixtures the default view returns.
const RECENT_RESULTS = 5;
const UPCOMING = 15;

export interface TeamSide {
  name: string;
  logo: string;
  goals: number | null;
}

export interface Match {
  id: number;
  /** Front-facing short status: 'LIVE' | 'HT' | 'FT' | 'NS'. */
  status: string;
  /** ISO 8601 kickoff timestamp. */
  kickoff: string;
  /** We surface stage/group here (free tier has no stadium data). */
  venue: string | null;
  city: string | null;
  home: TeamSide;
  away: TeamSide;
}

/** Shape of the match objects returned by football-data.org (fields we read). */
export interface RawMatch {
  id: number;
  utcDate: string;
  status: string;
  stage?: string;
  group?: string | null;
  homeTeam: { name: string | null; crest: string | null };
  awayTeam: { name: string | null; crest: string | null };
  score: { fullTime: { home: number | null; away: number | null } };
}

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: 'Fase de Grupos',
  LAST_16: 'Oitavas de final',
  ROUND_OF_16: 'Oitavas de final',
  QUARTER_FINALS: 'Quartas de final',
  SEMI_FINALS: 'Semifinal',
  THIRD_PLACE: 'Disputa de 3º lugar',
  FINAL: 'Final',
};

/** Map football-data status to the short codes the front-end understands. */
function mapStatus(status: string): string {
  switch (status) {
    case 'IN_PLAY':
      return 'LIVE';
    case 'PAUSED':
      return 'HT';
    case 'FINISHED':
      return 'FT';
    default:
      return 'NS';
  }
}

function stageLabel(stage?: string, group?: string | null): string | null {
  const base = stage ? (STAGE_LABELS[stage] ?? null) : null;
  if (base && group) {
    // "GROUP_A" -> "Grupo A"
    const pretty = group.replace(/^GROUP_/, 'Grupo ').replace(/_/g, ' ');
    return `${base} · ${pretty}`;
  }
  return base;
}

export function mapMatch(raw: RawMatch): Match {
  return {
    id: raw.id,
    status: mapStatus(raw.status),
    kickoff: raw.utcDate,
    venue: stageLabel(raw.stage, raw.group),
    city: null,
    home: {
      name: raw.homeTeam.name ?? 'A definir',
      logo: raw.homeTeam.crest ?? '',
      goals: raw.score.fullTime.home,
    },
    away: {
      name: raw.awayTeam.name ?? 'A definir',
      logo: raw.awayTeam.crest ?? '',
      goals: raw.score.fullTime.away,
    },
  };
}

interface FetchOptions {
  live: boolean;
  season: string;
}

export async function fetchMatches(token: string, { live, season }: FetchOptions): Promise<Match[]> {
  const url = `${API_BASE}/competitions/${WORLD_CUP_CODE}/matches?season=${season}`;
  const res = await fetch(url, { headers: { 'X-Auth-Token': token } });
  if (!res.ok) {
    throw new Error(`football-data.org error: ${res.status}`);
  }

  const body = (await res.json()) as { matches?: RawMatch[] };
  const all = (body.matches ?? [])
    .map(mapMatch)
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff));

  if (live) {
    return all.filter((m) => m.status === 'LIVE' || m.status === 'HT');
  }

  // Default view: a few recent results + the upcoming fixtures.
  const firstPending = all.findIndex((m) => m.status !== 'FT');
  if (firstPending === -1) {
    return all.slice(-(RECENT_RESULTS + UPCOMING)); // tournament finished
  }
  const start = Math.max(0, firstPending - RECENT_RESULTS);
  return all.slice(start, firstPending + UPCOMING);
}

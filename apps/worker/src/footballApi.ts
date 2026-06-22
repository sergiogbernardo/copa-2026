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

// Knockout stages in bracket order. LAST_16/ROUND_OF_16 are aliases used by the
// API across editions, so we map both to the same round.
const KNOCKOUT_ORDER = [
  'LAST_16',
  'ROUND_OF_16',
  'QUARTER_FINALS',
  'SEMI_FINALS',
  'THIRD_PLACE',
  'FINAL',
] as const;

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

// --- Standings ---------------------------------------------------------------

export interface StandingRow {
  rank: number;
  team: string;
  logo: string;
  points: number;
  played: number;
  goalsDiff: number;
  /** Display group, e.g. "Grupo A". */
  group: string;
}

interface RawStandingEntry {
  position: number;
  team: { name: string | null; crest: string | null };
  playedGames: number;
  points: number;
  goalDifference: number;
}

interface RawStanding {
  type: string;
  group?: string | null;
  table: RawStandingEntry[];
}

/** "GROUP_A" -> "Grupo A"; falls back to the raw value when not a group code. */
function groupLabel(group?: string | null): string {
  if (!group) return 'Grupo';
  return group.replace(/^GROUP_/, 'Grupo ').replace(/_/g, ' ');
}

export function mapStandingEntry(entry: RawStandingEntry, group?: string | null): StandingRow {
  return {
    rank: entry.position,
    team: entry.team.name ?? 'A definir',
    logo: entry.team.crest ?? '',
    points: entry.points,
    played: entry.playedGames,
    goalsDiff: entry.goalDifference,
    group: groupLabel(group),
  };
}

export async function fetchStandings(token: string, season: string): Promise<StandingRow[]> {
  const url = `${API_BASE}/competitions/${WORLD_CUP_CODE}/standings?season=${season}`;
  const res = await fetch(url, { headers: { 'X-Auth-Token': token } });
  if (!res.ok) {
    throw new Error(`football-data.org error: ${res.status}`);
  }

  const body = (await res.json()) as { standings?: RawStanding[] };
  // Keep only the overall (TOTAL) group tables, skipping HOME/AWAY breakdowns.
  return (body.standings ?? [])
    .filter((s) => s.type === 'TOTAL' && Array.isArray(s.table))
    .flatMap((s) => s.table.map((entry) => mapStandingEntry(entry, s.group)));
}

// --- Knockout bracket --------------------------------------------------------

export interface BracketRound {
  /** Raw stage code, e.g. "QUARTER_FINALS". */
  stage: string;
  /** Display label, e.g. "Quartas de final". */
  label: string;
  matches: Match[];
}

/** Group the knockout matches into ordered rounds for the bracket view. */
export function buildBracket(matches: RawMatch[]): BracketRound[] {
  const rounds: BracketRound[] = [];

  for (const stage of KNOCKOUT_ORDER) {
    const inStage = matches
      .filter((m) => m.stage === stage)
      .map(mapMatch)
      .sort((a, b) => a.kickoff.localeCompare(b.kickoff));
    if (inStage.length === 0) continue;

    // ROUND_OF_16 is an alias of LAST_16; merge into a single round if both exist.
    const label = STAGE_LABELS[stage] ?? stage;
    const existing = rounds.find((r) => r.label === label);
    if (existing) {
      existing.matches.push(...inStage);
    } else {
      rounds.push({ stage, label, matches: inStage });
    }
  }

  return rounds;
}

export async function fetchBracket(token: string, season: string): Promise<BracketRound[]> {
  const url = `${API_BASE}/competitions/${WORLD_CUP_CODE}/matches?season=${season}`;
  const res = await fetch(url, { headers: { 'X-Auth-Token': token } });
  if (!res.ok) {
    throw new Error(`football-data.org error: ${res.status}`);
  }

  const body = (await res.json()) as { matches?: RawMatch[] };
  return buildBracket(body.matches ?? []);
}

// --- Top scorers -------------------------------------------------------------

export interface Scorer {
  player: string;
  team: string;
  logo: string;
  goals: number;
  assists: number | null;
}

interface RawScorer {
  player: { name: string | null };
  team: { name: string | null; crest: string | null };
  goals: number | null;
  assists: number | null;
}

export function mapScorer(raw: RawScorer): Scorer {
  return {
    player: raw.player.name ?? 'A definir',
    team: raw.team.name ?? '—',
    logo: raw.team.crest ?? '',
    goals: raw.goals ?? 0,
    assists: raw.assists,
  };
}

export async function fetchScorers(token: string, season: string): Promise<Scorer[]> {
  const url = `${API_BASE}/competitions/${WORLD_CUP_CODE}/scorers?season=${season}&limit=10`;
  const res = await fetch(url, { headers: { 'X-Auth-Token': token } });
  if (!res.ok) {
    throw new Error(`football-data.org error: ${res.status}`);
  }

  const body = (await res.json()) as { scorers?: RawScorer[] };
  return (body.scorers ?? []).map(mapScorer);
}

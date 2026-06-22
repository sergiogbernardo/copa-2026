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

/** Fetch the competition matches once so multiple views can share one upstream call. */
export async function fetchRawMatches(token: string, season: string): Promise<RawMatch[]> {
  const url = `${API_BASE}/competitions/${WORLD_CUP_CODE}/matches?season=${season}`;
  const res = await fetch(url, { headers: { 'X-Auth-Token': token } });
  if (!res.ok) {
    throw new Error(`football-data.org error: ${res.status}`);
  }

  const body = (await res.json()) as { matches?: RawMatch[] };
  return body.matches ?? [];
}

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: 'Fase de Grupos',
  LAST_32: 'Rodada de 32',
  ROUND_OF_32: 'Rodada de 32',
  LAST_16: 'Oitavas de final',
  ROUND_OF_16: 'Oitavas de final',
  QUARTER_FINALS: 'Quartas de final',
  SEMI_FINALS: 'Semifinal',
  THIRD_PLACE: 'Disputa de 3º lugar',
  FINAL: 'Final',
};

// Knockout stages in bracket order. The 48-team 2026 format opens with a Round
// of 32 (LAST_32). LAST_*/ROUND_OF_* are aliases used by the API across
// editions, so we map each pair to the same round.
const KNOCKOUT_ORDER = [
  'LAST_32',
  'ROUND_OF_32',
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
  /** When true, return every match (the web app groups/filters client-side). */
  all?: boolean;
}

export async function fetchMatches(
  token: string,
  { live, season, all: returnAll = false }: FetchOptions,
): Promise<Match[]> {
  const matches = await fetchRawMatches(token, season);
  return selectMatches(matches, { live, all: returnAll });
}

/** Map and select raw matches without making another upstream request. */
export function selectMatches(
  matches: RawMatch[],
  { live, all: returnAll = false }: Pick<FetchOptions, 'live' | 'all'>,
): Match[] {
  const all = matches.map(mapMatch).sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  return selectMappedMatches(all, { live, all: returnAll });
}

/** Select a view from an already mapped, oldest-first match list. */
export function selectMappedMatches(
  all: Match[],
  { live, all: returnAll = false }: Pick<FetchOptions, 'live' | 'all'>,
): Match[] {
  if (live) {
    return all.filter((m) => m.status === 'LIVE' || m.status === 'HT');
  }

  if (returnAll) {
    return all;
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

interface ComputedStanding extends StandingRow {
  goalsFor: number;
}

interface RawStandingEntry {
  position: number;
  team: { name: string | null; crest: string | null };
  playedGames: number;
  points: number;
  goalDifference: number;
}

/**
 * Display label for a standings block. football-data splits group competitions
 * into per-group blocks ("GROUP_A"/"Group A"), but for the 2026 World Cup the
 * free tier returns a single overall table with no group, so we label that case
 * "Classificação geral".
 */
function groupLabel(group?: string | null): string {
  if (!group) return 'Classificação geral';
  return group.replace(/^GROUP[_ ]?/i, 'Grupo ').replace(/_/g, ' ');
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

/**
 * Build real group tables from group-stage results. Available data covers the
 * first tie-breakers (points, goal difference and goals scored); FIFA's later
 * head-to-head/fair-play tie-breakers are intentionally not guessed.
 */
export function buildGroupStandings(matches: RawMatch[]): StandingRow[] {
  const groups = new Map<string, Map<string, ComputedStanding>>();

  const ensureTeam = (
    group: string,
    team: { name: string | null; crest: string | null },
  ): ComputedStanding | null => {
    if (!team.name) return null;
    const table = groups.get(group) ?? new Map<string, ComputedStanding>();
    groups.set(group, table);
    const existing = table.get(team.name);
    if (existing) return existing;
    const row: ComputedStanding = {
      rank: 0,
      team: team.name,
      logo: team.crest ?? '',
      points: 0,
      played: 0,
      goalsDiff: 0,
      goalsFor: 0,
      group: groupLabel(group),
    };
    table.set(team.name, row);
    return row;
  };

  for (const match of matches) {
    if (match.stage !== 'GROUP_STAGE' || !match.group) continue;
    const home = ensureTeam(match.group, match.homeTeam);
    const away = ensureTeam(match.group, match.awayTeam);
    if (!home || !away || match.status !== 'FINISHED') continue;

    const homeGoals = match.score.fullTime.home;
    const awayGoals = match.score.fullTime.away;
    if (homeGoals === null || awayGoals === null) continue;

    home.played += 1;
    away.played += 1;
    home.goalsFor += homeGoals;
    away.goalsFor += awayGoals;
    home.goalsDiff += homeGoals - awayGoals;
    away.goalsDiff += awayGoals - homeGoals;

    if (homeGoals > awayGoals) home.points += 3;
    else if (awayGoals > homeGoals) away.points += 3;
    else {
      home.points += 1;
      away.points += 1;
    }
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([, table]) =>
      [...table.values()]
        .sort(
          (a, b) =>
            b.points - a.points ||
            b.goalsDiff - a.goalsDiff ||
            b.goalsFor - a.goalsFor ||
            a.team.localeCompare(b.team),
        )
        .map((row, index) => ({
          rank: index + 1,
          team: row.team,
          logo: row.logo,
          points: row.points,
          played: row.played,
          goalsDiff: row.goalsDiff,
          group: row.group,
        })),
    );
}

export async function fetchStandings(token: string, season: string): Promise<StandingRow[]> {
  return buildGroupStandings(await fetchRawMatches(token, season));
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
  return buildBracket(await fetchRawMatches(token, season));
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

// --- Teams & squads ----------------------------------------------------------

export interface Player {
  id: number;
  name: string;
  position: string | null;
  nationality: string | null;
  dateOfBirth: string | null;
}

export interface TeamInfo {
  id: number;
  name: string;
  /** Three-letter code, e.g. "BRA". */
  tla: string;
  crest: string;
  coach: string | null;
  /** Home stadium (may be null on the free tier). */
  venue: string | null;
  clubColors: string | null;
  squad: Player[];
}

interface RawPlayer {
  id: number;
  name: string | null;
  position?: string | null;
  nationality?: string | null;
  dateOfBirth?: string | null;
}

interface RawTeam {
  id: number;
  name: string | null;
  tla?: string | null;
  crest?: string | null;
  clubColors?: string | null;
  venue?: string | null;
  coach?: { name?: string | null } | null;
  squad?: RawPlayer[];
}

export function mapPlayer(raw: RawPlayer): Player {
  return {
    id: raw.id,
    name: raw.name ?? '—',
    position: raw.position ?? null,
    nationality: raw.nationality ?? null,
    dateOfBirth: raw.dateOfBirth ?? null,
  };
}

export function mapTeam(raw: RawTeam): TeamInfo {
  return {
    id: raw.id,
    name: raw.name ?? '—',
    tla: raw.tla ?? '',
    crest: raw.crest ?? '',
    coach: raw.coach?.name ?? null,
    venue: raw.venue ?? null,
    clubColors: raw.clubColors ?? null,
    squad: (raw.squad ?? []).map(mapPlayer),
  };
}

export async function fetchTeams(token: string, season: string): Promise<TeamInfo[]> {
  const url = `${API_BASE}/competitions/${WORLD_CUP_CODE}/teams?season=${season}`;
  const res = await fetch(url, { headers: { 'X-Auth-Token': token } });
  if (!res.ok) {
    throw new Error(`football-data.org error: ${res.status}`);
  }

  const body = (await res.json()) as { teams?: RawTeam[] };
  return (body.teams ?? []).map(mapTeam).sort((a, b) => a.name.localeCompare(b.name));
}

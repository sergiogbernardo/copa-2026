import type { BracketRound, Match, Scorer, StandingRow } from '../types';

// Falls back to the deployed Worker URL (public, not a secret) when the build
// variable is not set, so the production site works without extra config.
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://copa-2026-api.sergiogbernardo.workers.dev';

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

/** Upcoming fixtures, or live matches when `live` is true. */
export function getMatches(live = false): Promise<Match[]> {
  return getJson<Match[]>(`/matches${live ? '?live=true' : ''}`);
}

export function getStandings(): Promise<StandingRow[]> {
  return getJson<StandingRow[]>('/standings');
}

export function getBracket(): Promise<BracketRound[]> {
  return getJson<BracketRound[]>('/bracket');
}

export function getScorers(): Promise<Scorer[]> {
  return getJson<Scorer[]>('/scorers');
}

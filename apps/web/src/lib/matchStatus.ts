import type { Match } from '../types';

/** Upstream codes that mean a match is in play. */
const LIVE_STATUSES = new Set(['1H', '2H', 'HT', 'ET', 'P', 'LIVE']);

/**
 * Upper bound for how long a match can legitimately stay "live": 90 minutes,
 * plus stoppage, extra time and penalties, with margin. The free football-data
 * tier sometimes leaves a finished match stuck on IN_PLAY, so we treat a status
 * that lingers past this window as stale and stop surfacing it as live.
 */
const MAX_LIVE_DURATION_MS = 3.5 * 60 * 60 * 1000;

/**
 * Whether a match should be shown as live right now. Requires a live status and
 * a kickoff that already happened but is still within the plausible match
 * window — this guards against stale upstream statuses.
 */
export function isLiveMatch(
  match: Pick<Match, 'status' | 'kickoff'>,
  now: number = Date.now(),
): boolean {
  if (!LIVE_STATUSES.has(match.status)) return false;
  const kickoff = new Date(match.kickoff).getTime();
  if (Number.isNaN(kickoff)) return false;
  return kickoff <= now && now - kickoff <= MAX_LIVE_DURATION_MS;
}

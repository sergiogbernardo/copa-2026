import type { Match } from '../types';

/**
 * Upper bound for how long a match can legitimately stay "live": 90 minutes,
 * plus stoppage, extra time and penalties, with margin. The free football-data
 * tier is unreliable around live windows — it both leaves finished matches stuck
 * on IN_PLAY and leaves in-progress matches stuck on NS well past kickoff. So we
 * infer the live state from the clock instead of trusting the status code, and
 * treat anything past this window as stale.
 */
const MAX_LIVE_DURATION_MS = 3.5 * 60 * 60 * 1000;

/** Whether the upstream feed considers the match over. */
export function isFinishedMatch(match: Pick<Match, 'status'>): boolean {
  return match.status === 'FT';
}

/**
 * Whether a match should be shown as live right now. A match is in play when it
 * has not finished and its kickoff already happened but is still within the
 * plausible match window. We rely on the clock rather than the status code
 * because the free tier often leaves a started match stuck on "NS".
 */
export function isLiveMatch(
  match: Pick<Match, 'status' | 'kickoff'>,
  now: number = Date.now(),
): boolean {
  if (isFinishedMatch(match)) return false;
  const kickoff = new Date(match.kickoff).getTime();
  if (Number.isNaN(kickoff)) return false;
  return kickoff <= now && now - kickoff <= MAX_LIVE_DURATION_MS;
}

/**
 * Whether a match has not kicked off yet. Excludes finished and in-play matches
 * so the "upcoming" view never overlaps with "live".
 */
export function isUpcomingMatch(
  match: Pick<Match, 'status' | 'kickoff'>,
  now: number = Date.now(),
): boolean {
  if (isFinishedMatch(match) || isLiveMatch(match, now)) return false;
  const kickoff = new Date(match.kickoff).getTime();
  if (Number.isNaN(kickoff)) return match.status === 'NS';
  return kickoff > now;
}

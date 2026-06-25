import { describe, expect, it } from 'vitest';
import { pickFeaturedMatch, pickLiveMatches } from '../features/matches/FeaturedMatch';
import type { Match } from '../types';

const match = (id: number, status: string, kickoff: string): Match => ({
  id,
  status,
  kickoff,
  venue: null,
  city: null,
  home: { name: 'Brazil', logo: '', goals: null },
  away: { name: 'Japan', logo: '', goals: null },
});

describe('pickFeaturedMatch', () => {
  it('prefers a live game over the next scheduled game', () => {
    const next = match(1, 'NS', '2026-06-23T18:00:00Z');
    const live = match(2, 'LIVE', '2026-06-22T18:00:00Z');
    expect(pickFeaturedMatch([next, live], Date.parse('2026-06-22T18:30:00Z'))).toBe(live);
  });

  it('returns the next future game when none is live', () => {
    const past = match(1, 'NS', '2026-06-21T18:00:00Z');
    const next = match(2, 'NS', '2026-06-23T18:00:00Z');
    expect(pickFeaturedMatch([past, next], Date.parse('2026-06-22T18:00:00Z'))).toBe(next);
  });

  it('skips a stale live status and falls back to the next game', () => {
    // Upstream still reports LIVE hours after kickoff; do not feature it.
    const stale = match(1, 'LIVE', '2026-06-22T17:00:00Z');
    const next = match(2, 'NS', '2026-06-23T18:00:00Z');
    expect(pickFeaturedMatch([stale, next], Date.parse('2026-06-22T21:40:00Z'))).toBe(next);
  });
});

describe('pickLiveMatches', () => {
  it('returns every match in play so parallel games are all featured', () => {
    const liveA = match(1, 'LIVE', '2026-06-22T17:00:00Z');
    const liveB = match(2, 'NS', '2026-06-22T17:00:00Z'); // started but feed stuck on NS
    const upcoming = match(3, 'NS', '2026-06-23T18:00:00Z');
    const now = Date.parse('2026-06-22T17:30:00Z');
    expect(pickLiveMatches([liveA, liveB, upcoming], now)).toEqual([liveA, liveB]);
  });

  it('returns an empty list when nothing is in play', () => {
    const upcoming = match(1, 'NS', '2026-06-23T18:00:00Z');
    expect(pickLiveMatches([upcoming], Date.parse('2026-06-22T18:00:00Z'))).toEqual([]);
  });
});

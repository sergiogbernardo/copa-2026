import { describe, expect, it } from 'vitest';
import { isLiveMatch, isUpcomingMatch } from '../lib/matchStatus';

const KICKOFF = '2026-06-22T17:00:00Z';

describe('isLiveMatch', () => {
  it('is live when the status is in play and the kickoff is recent', () => {
    const now = Date.parse('2026-06-22T18:00:00Z');
    expect(isLiveMatch({ status: 'LIVE', kickoff: KICKOFF }, now)).toBe(true);
    expect(isLiveMatch({ status: 'HT', kickoff: KICKOFF }, now)).toBe(true);
  });

  it('infers live from the clock when the feed is still stuck on NS', () => {
    // The free tier often leaves a started match on NS; if kickoff has passed
    // and we are within the match window, treat it as in play.
    const now = Date.parse('2026-06-22T18:00:00Z');
    expect(isLiveMatch({ status: 'NS', kickoff: KICKOFF }, now)).toBe(true);
  });

  it('is not live once the match has finished', () => {
    const now = Date.parse('2026-06-22T18:00:00Z');
    expect(isLiveMatch({ status: 'FT', kickoff: KICKOFF }, now)).toBe(false);
  });

  it('treats a status stuck on live past the match window as stale', () => {
    // Upstream left the match on LIVE more than 4 hours after kickoff.
    const now = Date.parse('2026-06-22T21:40:00Z');
    expect(isLiveMatch({ status: 'LIVE', kickoff: KICKOFF }, now)).toBe(false);
  });

  it('is not live before the kickoff happens', () => {
    const now = Date.parse('2026-06-22T16:30:00Z');
    expect(isLiveMatch({ status: 'LIVE', kickoff: KICKOFF }, now)).toBe(false);
  });
});

describe('isUpcomingMatch', () => {
  it('is upcoming before kickoff', () => {
    const now = Date.parse('2026-06-22T16:30:00Z');
    expect(isUpcomingMatch({ status: 'NS', kickoff: KICKOFF }, now)).toBe(true);
  });

  it('is not upcoming once it is live', () => {
    const now = Date.parse('2026-06-22T18:00:00Z');
    expect(isUpcomingMatch({ status: 'NS', kickoff: KICKOFF }, now)).toBe(false);
  });

  it('is not upcoming once it has finished', () => {
    const now = Date.parse('2026-06-22T16:30:00Z');
    expect(isUpcomingMatch({ status: 'FT', kickoff: KICKOFF }, now)).toBe(false);
  });
});

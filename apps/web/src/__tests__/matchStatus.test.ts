import { describe, expect, it } from 'vitest';
import { isLiveMatch } from '../lib/matchStatus';

const KICKOFF = '2026-06-22T17:00:00Z';

describe('isLiveMatch', () => {
  it('is live when the status is in play and the kickoff is recent', () => {
    const now = Date.parse('2026-06-22T18:00:00Z');
    expect(isLiveMatch({ status: 'LIVE', kickoff: KICKOFF }, now)).toBe(true);
    expect(isLiveMatch({ status: 'HT', kickoff: KICKOFF }, now)).toBe(true);
  });

  it('is not live for non in-play statuses', () => {
    const now = Date.parse('2026-06-22T18:00:00Z');
    expect(isLiveMatch({ status: 'FT', kickoff: KICKOFF }, now)).toBe(false);
    expect(isLiveMatch({ status: 'NS', kickoff: KICKOFF }, now)).toBe(false);
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

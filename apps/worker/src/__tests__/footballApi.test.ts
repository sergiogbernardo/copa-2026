import { describe, expect, it } from 'vitest';
import { mapFixtureToMatch, type RawFixture } from '../footballApi';

const sample: RawFixture = {
  fixture: {
    id: 12345,
    date: '2026-06-22T19:00:00+00:00',
    status: { short: '1H' },
    venue: { name: 'MetLife Stadium', city: 'East Rutherford' },
  },
  teams: {
    home: { name: 'Brazil', logo: 'https://logos/br.png' },
    away: { name: 'Argentina', logo: 'https://logos/ar.png' },
  },
  goals: { home: 1, away: 0 },
};

describe('mapFixtureToMatch', () => {
  it('maps a raw API-Football fixture into the domain Match shape', () => {
    const match = mapFixtureToMatch(sample);

    expect(match).toEqual({
      id: 12345,
      status: '1H',
      kickoff: '2026-06-22T19:00:00+00:00',
      venue: 'MetLife Stadium',
      city: 'East Rutherford',
      home: { name: 'Brazil', logo: 'https://logos/br.png', goals: 1 },
      away: { name: 'Argentina', logo: 'https://logos/ar.png', goals: 0 },
    });
  });
});

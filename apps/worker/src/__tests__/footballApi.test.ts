import { describe, expect, it } from 'vitest';
import { mapMatch, type RawMatch } from '../footballApi';

const sample: RawMatch = {
  id: 537327,
  utcDate: '2026-06-11T19:00:00Z',
  status: 'IN_PLAY',
  stage: 'GROUP_STAGE',
  group: 'GROUP_A',
  homeTeam: { name: 'Mexico', crest: 'https://crests/mex.svg' },
  awayTeam: { name: 'South Africa', crest: 'https://crests/rsa.svg' },
  score: { fullTime: { home: 2, away: 0 } },
};

describe('mapMatch', () => {
  it('maps a football-data.org match into the domain Match shape', () => {
    const match = mapMatch(sample);

    expect(match).toEqual({
      id: 537327,
      status: 'LIVE', // IN_PLAY -> LIVE
      kickoff: '2026-06-11T19:00:00Z',
      venue: 'Fase de Grupos · Grupo A',
      city: null,
      home: { name: 'Mexico', logo: 'https://crests/mex.svg', goals: 2 },
      away: { name: 'South Africa', logo: 'https://crests/rsa.svg', goals: 0 },
    });
  });

  it('falls back to "A definir" for undetermined knockout teams', () => {
    const tbd = mapMatch({
      ...sample,
      status: 'TIMED',
      stage: 'QUARTER_FINALS',
      group: null,
      homeTeam: { name: null, crest: null },
      awayTeam: { name: null, crest: null },
      score: { fullTime: { home: null, away: null } },
    });

    expect(tbd.status).toBe('NS');
    expect(tbd.venue).toBe('Quartas de final');
    expect(tbd.home).toEqual({ name: 'A definir', logo: '', goals: null });
  });
});

import { describe, expect, it } from 'vitest';
import { buildBracket, mapMatch, mapScorer, mapStandingEntry, type RawMatch } from '../footballApi';

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

describe('mapStandingEntry', () => {
  it('maps a standings table entry and prettifies the group code', () => {
    const row = mapStandingEntry(
      {
        position: 1,
        team: { name: 'Brazil', crest: 'https://crests/bra.svg' },
        playedGames: 3,
        points: 9,
        goalDifference: 6,
      },
      'GROUP_C',
    );

    expect(row).toEqual({
      rank: 1,
      team: 'Brazil',
      logo: 'https://crests/bra.svg',
      points: 9,
      played: 3,
      goalsDiff: 6,
      group: 'Grupo C',
    });
  });
});

describe('buildBracket', () => {
  const knockout = (id: number, stage: string, utcDate: string): RawMatch => ({
    ...sample,
    id,
    stage,
    group: null,
    utcDate,
    status: 'FINISHED',
  });

  it('groups knockout matches into ordered rounds, skipping the group stage', () => {
    const rounds = buildBracket([
      sample, // GROUP_STAGE, must be ignored
      knockout(1, 'FINAL', '2026-07-19T19:00:00Z'),
      knockout(2, 'QUARTER_FINALS', '2026-07-10T19:00:00Z'),
      knockout(3, 'QUARTER_FINALS', '2026-07-11T19:00:00Z'),
    ]);

    expect(rounds.map((r) => r.label)).toEqual(['Quartas de final', 'Final']);
    expect(rounds[0].matches).toHaveLength(2);
    // Sorted by kickoff within the round.
    expect(rounds[0].matches[0].id).toBe(2);
  });

  it('merges ROUND_OF_16 and LAST_16 aliases into a single round', () => {
    const rounds = buildBracket([
      knockout(1, 'LAST_16', '2026-07-01T19:00:00Z'),
      knockout(2, 'ROUND_OF_16', '2026-07-02T19:00:00Z'),
    ]);

    expect(rounds).toHaveLength(1);
    expect(rounds[0].label).toBe('Oitavas de final');
    expect(rounds[0].matches).toHaveLength(2);
  });
});

describe('mapScorer', () => {
  it('maps a scorer, defaulting missing goals to 0', () => {
    expect(
      mapScorer({
        player: { name: 'Vinícius Jr.' },
        team: { name: 'Brazil', crest: 'https://crests/bra.svg' },
        goals: 4,
        assists: 2,
      }),
    ).toEqual({
      player: 'Vinícius Jr.',
      team: 'Brazil',
      logo: 'https://crests/bra.svg',
      goals: 4,
      assists: 2,
    });
  });
});

/** Domain types shared across the web app. They mirror what the Worker returns. */

export interface TeamSide {
  name: string;
  logo: string;
  goals: number | null;
}

export interface Match {
  id: number;
  /** Front-facing short status: "LIVE" | "HT" | "FT" | "NS". */
  status: string;
  /** ISO 8601 kickoff timestamp. */
  kickoff: string;
  venue: string | null;
  city: string | null;
  home: TeamSide;
  away: TeamSide;
}

export interface StandingRow {
  rank: number;
  team: string;
  logo: string;
  points: number;
  played: number;
  goalsDiff: number;
  group: string;
}

export interface BracketRound {
  /** Raw stage code, e.g. "QUARTER_FINALS". */
  stage: string;
  /** Display label, e.g. "Quartas de final". */
  label: string;
  matches: Match[];
}

export interface Scorer {
  player: string;
  team: string;
  logo: string;
  goals: number;
  assists: number | null;
}

/** Domain types shared across the web app. They mirror what the Worker returns. */

export interface TeamSide {
  name: string;
  logo: string;
  goals: number | null;
}

export interface Match {
  id: number;
  /** API-Football short status, e.g. "NS" (not started), "1H", "HT", "FT". */
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

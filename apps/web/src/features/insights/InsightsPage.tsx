/**
 * Insights derived from live data: the tournament top scorers (from the Worker's
 * /scorers endpoint) and a simple recent-form view computed from finished matches.
 */
import { useMatches, useScorers } from '../../lib/hooks';
import { includesQuery, useSearchQuery } from '../../lib/search';
import { teamMatchesQuery, teamName, useI18n, type Lang } from '../../lib/i18n';
import { TeamCrest } from '../../components/TeamCrest';
import { TableSkeleton } from '../../components/Skeletons';
import type { Match } from '../../types';

type Result = 'W' | 'D' | 'L';

interface TeamForm {
  team: string;
  logo: string;
  results: Result[];
}

/** Build per-team recent form (most recent first) from finished matches. */
function computeForm(matches: Match[]): TeamForm[] {
  const byTeam = new Map<string, TeamForm>();

  const record = (name: string, logo: string, result: Result) => {
    const entry = byTeam.get(name) ?? { team: name, logo, results: [] };
    entry.results.push(result);
    byTeam.set(name, entry);
  };

  // Matches arrive sorted oldest-first; iterate in order and reverse at the end.
  for (const match of matches) {
    if (match.status !== 'FT') continue;
    const { home, away } = match;
    if (home.goals === null || away.goals === null) continue;

    const homeResult: Result = home.goals > away.goals ? 'W' : home.goals < away.goals ? 'L' : 'D';
    const awayResult: Result = homeResult === 'W' ? 'L' : homeResult === 'L' ? 'W' : 'D';
    record(home.name, home.logo, homeResult);
    record(away.name, away.logo, awayResult);
  }

  return [...byTeam.values()]
    .map((entry) => ({ ...entry, results: entry.results.slice(-5).reverse() }))
    .sort((a, b) => a.team.localeCompare(b.team));
}

const RESULT_STYLES: Record<Result, string> = {
  W: 'bg-emerald-500',
  D: 'bg-slate-400',
  L: 'bg-red-500',
};
// Single letter shown inside each dot, by language (PT: V/E/D, EN: W/D/L).
const RESULT_LETTER: Record<Lang, Record<Result, string>> = {
  pt: { W: 'V', D: 'E', L: 'D' },
  en: { W: 'W', D: 'D', L: 'L' },
};
const RESULT_TITLE_KEY: Record<Result, string> = {
  W: 'result.win',
  D: 'result.draw',
  L: 'result.loss',
};

function FormDots({ results }: { results: Result[] }) {
  const { t, lang } = useI18n();
  return (
    <span className="flex gap-1">
      {results.map((result, i) => (
        <span
          key={i}
          title={t(RESULT_TITLE_KEY[result])}
          className={`inline-block h-4 w-4 rounded-full text-center text-[10px] font-bold leading-4 text-white ${RESULT_STYLES[result]}`}
        >
          {RESULT_LETTER[lang][result]}
        </span>
      ))}
    </span>
  );
}

export default function InsightsPage() {
  const { data: scorers, isLoading: scorersLoading, isError: scorersError } = useScorers();
  const { data: matches, isLoading: matchesLoading } = useMatches();
  const q = useSearchQuery();
  const { t, lang } = useI18n();

  const filteredScorers = (scorers ?? [])
    .map((s, i) => ({ ...s, rank: i + 1 }))
    .filter((s) => includesQuery(s.player, q) || teamMatchesQuery(s.team, q, lang));
  const form = matches ? computeForm(matches).filter((f) => teamMatchesQuery(f.team, q, lang)) : [];

  return (
    <div className="mx-auto grid w-full max-w-6xl items-start gap-8 lg:grid-cols-2">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('insights.scorers')}</h2>
        {scorersLoading && <TableSkeleton count={5} />}
        {scorersError && <p className="text-red-600">{t('insights.scorersError')}</p>}
        {scorers && filteredScorers.length === 0 && (
          <p className="text-slate-500">{q ? t('insights.noScorers') : t('insights.noGoals')}</p>
        )}
        {filteredScorers.length > 0 && (
          <ol className="space-y-2">
            {filteredScorers.map((scorer, i) => (
              <li
                key={`${scorer.player}-${i}`}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm"
              >
                <span className="w-5 text-slate-400">{scorer.rank}</span>
                <TeamCrest name={scorer.team} crest={scorer.logo} className="h-5 w-5" />
                <span className="font-medium">{scorer.player}</span>
                <span className="text-slate-400">{teamName(scorer.team, lang)}</span>
                <span className="ml-auto font-bold tabular-nums">{scorer.goals}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t('insights.form')}</h2>
        <p className="text-xs text-slate-400">
          {t('insights.formIntro')}{' '}
          <span className="font-semibold text-emerald-600">{RESULT_LETTER[lang].W}</span>{' '}
          {t('result.win').toLowerCase()},{' '}
          <span className="font-semibold text-slate-500">{RESULT_LETTER[lang].D}</span>{' '}
          {t('result.draw').toLowerCase()},{' '}
          <span className="font-semibold text-red-500">{RESULT_LETTER[lang].L}</span>{' '}
          {t('result.loss').toLowerCase()}.
        </p>
        {matchesLoading && <TableSkeleton count={5} />}
        {!matchesLoading && form.length === 0 && (
          <p className="text-slate-500">{q ? t('insights.noTeams') : t('insights.noFinished')}</p>
        )}
        {form.length > 0 && (
          <ul className="space-y-2">
            {form.map((entry) => (
              <li
                key={entry.team}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm"
              >
                <TeamCrest name={entry.team} crest={entry.logo} className="h-5 w-5" />
                <span className="font-medium">{teamName(entry.team, lang)}</span>
                <span className="ml-auto">
                  <FormDots results={entry.results} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/**
 * Insights derived from live data: the tournament top scorers (from the Worker's
 * /scorers endpoint) and a simple recent-form view computed from finished matches.
 */
import { useMatches, useScorers } from '../../lib/hooks';
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

// Display in the Brazilian convention: Vitória / Empate / Derrota.
const RESULT_STYLES: Record<Result, string> = {
  W: 'bg-emerald-500',
  D: 'bg-slate-400',
  L: 'bg-red-500',
};
const RESULT_LABEL: Record<Result, string> = { W: 'V', D: 'E', L: 'D' };
const RESULT_TITLE: Record<Result, string> = {
  W: 'Vitória',
  D: 'Empate',
  L: 'Derrota',
};

function FormDots({ results }: { results: Result[] }) {
  return (
    <span className="flex gap-1">
      {results.map((result, i) => (
        <span
          key={i}
          title={RESULT_TITLE[result]}
          className={`inline-block h-4 w-4 rounded-full text-center text-[10px] font-bold leading-4 text-white ${RESULT_STYLES[result]}`}
        >
          {RESULT_LABEL[result]}
        </span>
      ))}
    </span>
  );
}

export default function InsightsPage() {
  const { data: scorers, isLoading: scorersLoading, isError: scorersError } = useScorers();
  const { data: matches, isLoading: matchesLoading } = useMatches();

  const form = matches ? computeForm(matches) : [];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Artilheiros</h2>
        {scorersLoading && <p className="text-slate-500">Carregando artilheiros…</p>}
        {scorersError && <p className="text-red-600">Não foi possível carregar os artilheiros.</p>}
        {scorers && scorers.length === 0 && (
          <p className="text-slate-500">Sem gols registrados ainda.</p>
        )}
        {scorers && scorers.length > 0 && (
          <ol className="space-y-2">
            {scorers.map((scorer, i) => (
              <li
                key={`${scorer.player}-${i}`}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm"
              >
                <span className="w-5 text-slate-400">{i + 1}</span>
                {scorer.logo && (
                  <img src={scorer.logo} alt="" className="h-5 w-5" loading="lazy" />
                )}
                <span className="font-medium">{scorer.player}</span>
                <span className="text-slate-400">{scorer.team}</span>
                <span className="ml-auto font-bold tabular-nums">{scorer.goals}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Forma recente</h2>
        <p className="text-xs text-slate-400">
          Últimos resultados, mais recente à esquerda —{' '}
          <span className="font-semibold text-emerald-600">V</span> vitória,{' '}
          <span className="font-semibold text-slate-500">E</span> empate,{' '}
          <span className="font-semibold text-red-500">D</span> derrota.
        </p>
        {matchesLoading && <p className="text-slate-500">Carregando resultados…</p>}
        {!matchesLoading && form.length === 0 && (
          <p className="text-slate-500">Sem jogos encerrados ainda.</p>
        )}
        {form.length > 0 && (
          <ul className="space-y-2">
            {form.map((entry) => (
              <li
                key={entry.team}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm"
              >
                {entry.logo && <img src={entry.logo} alt="" className="h-5 w-5" loading="lazy" />}
                <span className="font-medium">{entry.team}</span>
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

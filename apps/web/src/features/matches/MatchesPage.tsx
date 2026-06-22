import { useState } from 'react';
import { useMatches } from '../../lib/hooks';
import { includesQuery, useSearchQuery } from '../../lib/search';
import type { Match } from '../../types';
import MatchCard from './MatchCard';

type Filter = 'all' | 'live' | 'today' | 'upcoming' | 'finished';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'live', label: 'Ao vivo' },
  { key: 'today', label: 'Hoje' },
  { key: 'upcoming', label: 'Próximos' },
  { key: 'finished', label: 'Encerrados' },
];

/** A fixture with neither team decided yet (e.g. an empty knockout slot). */
const bothUndecided = (m: Match) =>
  m.home.name === 'A definir' && m.away.name === 'A definir';

const isLive = (m: Match) => m.status === 'LIVE' || m.status === 'HT';
const isToday = (m: Match) => {
  const now = new Date();
  const d = new Date(m.kickoff);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

function matchesFilter(match: Match, filter: Filter): boolean {
  switch (filter) {
    case 'live':
      return isLive(match);
    case 'today':
      return isToday(match);
    case 'upcoming':
      return match.status === 'NS';
    case 'finished':
      return match.status === 'FT';
    default:
      return true;
  }
}

interface DayGroup {
  key: string;
  label: string;
  matches: Match[];
}

/** Group matches by local calendar day, preserving the kickoff order. */
function groupByDay(matches: Match[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();

  for (const match of matches) {
    const date = new Date(match.kickoff);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const label = date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    });
    const group = groups.get(key) ?? { key, label, matches: [] };
    group.matches.push(match);
    groups.set(key, group);
  }

  return [...groups.values()];
}

export default function MatchesPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const { data: matches, isLoading, isError } = useMatches();
  const q = useSearchQuery();

  const filtered = (matches ?? [])
    // Hide fixtures whose teams aren't defined yet; they appear once a team is set.
    .filter((m) => !bothUndecided(m))
    .filter((m) => matchesFilter(m, filter))
    .filter((m) => includesQuery(m.home.name, q) || includesQuery(m.away.name, q));
  // "Todos" and "Encerrados" read better most-recent-first; "Próximos"/"Hoje"/
  // "Ao vivo" stay chronological (nearest kickoff first).
  const newestFirst = filter === 'all' || filter === 'finished';
  const ordered = newestFirst ? [...filtered].reverse() : filtered;
  const days = groupByDay(ordered);

  return (
    <section className="mx-auto w-full max-w-6xl space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              filter === key ? 'bg-pitch text-white' : 'bg-slate-200 hover:bg-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-slate-500">Carregando jogos…</p>}
      {isError && <p className="text-red-600">Não foi possível carregar os jogos.</p>}
      {matches && filtered.length === 0 && (
        <p className="text-slate-500">Nenhum jogo nesta seleção.</p>
      )}

      <div className="space-y-6">
        {days.map((day) => (
          <div key={day.key}>
            <h2 className="mb-2 text-sm font-semibold capitalize text-slate-500">{day.label}</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {day.matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

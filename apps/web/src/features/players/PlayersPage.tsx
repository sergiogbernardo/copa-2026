import { useState } from 'react';
import { useTeams } from '../../lib/hooks';
import { includesQuery, useSearchQuery } from '../../lib/search';
import { positionGroup } from '../../lib/positions';
import { TeamCrest } from '../../components/TeamCrest';
import { CardGridSkeleton } from '../../components/Skeletons';

interface FlatPlayer {
  id: number;
  name: string;
  position: string | null;
  team: string;
  crest: string;
}

export default function PlayersPage() {
  const { data: teams, isLoading, isError } = useTeams();
  const q = useSearchQuery();
  const [teamFilter, setTeamFilter] = useState('');

  if (isLoading) return <CardGridSkeleton count={9} />;
  if (isError) return <p className="text-red-600">Não foi possível carregar os jogadores.</p>;
  if (!teams || teams.length === 0)
    return <p className="text-slate-500">Jogadores indisponíveis.</p>;

  const players: FlatPlayer[] = teams.flatMap((t) =>
    t.squad.map((p) => ({
      id: p.id,
      name: p.name,
      position: p.position,
      team: t.name,
      crest: t.crest,
    })),
  );

  const filtered = players
    .filter((p) => (teamFilter ? p.team === teamFilter : true))
    .filter((p) => includesQuery(p.name, q) || includesQuery(p.team, q));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          aria-label="Filtrar por seleção"
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
        >
          <option value="">Todas as seleções ({teams.length})</option>
          {teams.map((t) => (
            <option key={t.id} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
        <span className="text-sm text-slate-400">{filtered.length} jogadores</span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-slate-500">Nenhum jogador encontrado.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
            >
              <TeamCrest name={p.team} crest={p.crest} className="h-6 w-6" />
              <div className="min-w-0">
                <p className="truncate font-medium">{p.name}</p>
                <p className="truncate text-xs text-slate-400">
                  {positionGroup(p.position)} · {p.team}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

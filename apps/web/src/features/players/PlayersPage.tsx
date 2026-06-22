import { useState } from 'react';
import { useTeams } from '../../lib/hooks';
import { includesQuery, useSearchQuery } from '../../lib/search';
import { positionGroup, positionGroupLabel } from '../../lib/positions';
import { teamMatchesQuery, teamName, useI18n } from '../../lib/i18n';
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
  const { t, lang } = useI18n();
  const [teamFilter, setTeamFilter] = useState('');

  if (isLoading) return <CardGridSkeleton count={9} />;
  if (isError) return <p className="text-red-600">{t('players.error')}</p>;
  if (!teams || teams.length === 0)
    return <p className="text-slate-500">{t('players.unavailable')}</p>;

  const players: FlatPlayer[] = teams.flatMap((team) =>
    team.squad.map((p) => ({
      id: p.id,
      name: p.name,
      position: p.position,
      team: team.name,
      crest: team.crest,
    })),
  );

  const filtered = players
    .filter((p) => (teamFilter ? p.team === teamFilter : true))
    .filter((p) => includesQuery(p.name, q) || teamMatchesQuery(p.team, q, lang));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          aria-label={t('players.filterAria')}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
        >
          <option value="">{t('players.allTeams', { count: teams.length })}</option>
          {teams.map((team) => (
            <option key={team.id} value={team.name}>
              {teamName(team.name, lang)}
            </option>
          ))}
        </select>
        <span className="text-sm text-slate-400">
          {t('players.count', { count: filtered.length })}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-slate-500">{t('players.empty')}</p>
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
                  {positionGroupLabel(positionGroup(p.position), lang)} · {teamName(p.team, lang)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

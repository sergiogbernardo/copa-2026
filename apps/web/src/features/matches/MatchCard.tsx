import type { Match } from '../../types';
import StatusBadge from '../../components/StatusBadge';

function Side({ name, logo, goals }: Match['home']) {
  return (
    <div className="flex items-center gap-2">
      {logo && <img src={logo} alt="" className="h-6 w-6" loading="lazy" />}
      <span className="font-medium">{name}</span>
      {goals !== null && <span className="ml-auto text-lg font-bold tabular-nums">{goals}</span>}
    </div>
  );
}

export default function MatchCard({ match }: { match: Match }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <StatusBadge status={match.status} kickoff={match.kickoff} />
        {match.venue && (
          <span className="truncate text-xs text-slate-400">
            {match.venue}
            {match.city ? ` · ${match.city}` : ''}
          </span>
        )}
      </div>
      <div className="space-y-2">
        <Side {...match.home} />
        <Side {...match.away} />
      </div>
    </article>
  );
}

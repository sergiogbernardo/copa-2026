import type { Match } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import { TeamCrest } from '../../components/TeamCrest';
import { StarIcon } from '../../components/icons';
import { teamName, translateVenue, useI18n } from '../../lib/i18n';

function Side({ name, logo, goals }: Match['home']) {
  const { lang } = useI18n();
  return (
    <div className="flex items-center gap-2">
      <TeamCrest name={name} crest={logo} className="h-6 w-6" />
      <span className="font-medium">{teamName(name, lang)}</span>
      {goals !== null && <span className="ml-auto text-lg font-bold tabular-nums">{goals}</span>}
    </div>
  );
}

export default function MatchCard({
  match,
  favorite = false,
}: {
  match: Match;
  favorite?: boolean;
}) {
  const { lang } = useI18n();
  const venue = translateVenue(match.venue, lang);
  return (
    <article
      className={`rounded-lg border bg-white p-4 shadow-sm ${
        favorite ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusBadge status={match.status} kickoff={match.kickoff} />
          {favorite && <StarIcon filled className="h-4 w-4 text-amber-400" />}
        </div>
        {venue && (
          <span className="truncate text-xs text-slate-400">
            {venue}
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

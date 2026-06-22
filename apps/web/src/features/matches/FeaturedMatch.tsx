import { useEffect, useState } from 'react';
import { TeamCrest } from '../../components/TeamCrest';
import { isLiveMatch } from '../../lib/matchStatus';
import { teamName, useI18n } from '../../lib/i18n';
import type { Match } from '../../types';

function countdown(kickoff: string, now: number): string {
  const remaining = Math.max(0, new Date(kickoff).getTime() - now);
  const totalMinutes = Math.floor(remaining / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

export function pickFeaturedMatch(matches: Match[], now = Date.now()): Match | null {
  const live = matches.find((match) => isLiveMatch(match, now));
  if (live) return live;
  return (
    matches.find((match) => match.status === 'NS' && new Date(match.kickoff).getTime() >= now) ??
    null
  );
}

export default function FeaturedMatch({ matches }: { matches: Match[] }) {
  const [now, setNow] = useState(Date.now());
  const { t, lang } = useI18n();
  const match = pickFeaturedMatch(matches, now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  if (!match) return null;
  const live = isLiveMatch(match, now);

  return (
    <section className="overflow-hidden rounded-xl bg-gradient-to-r from-pitch to-emerald-700 p-4 text-white shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-white/80">
          {live ? t('featured.live') : t('featured.next')}
        </span>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
          {live ? t('live.upper') : t('featured.startsIn', { time: countdown(match.kickoff, now) })}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
        <div className="flex min-w-0 flex-col items-center gap-2">
          <TeamCrest name={match.home.name} crest={match.home.logo} className="h-10 w-10" />
          <span className="truncate font-semibold">{teamName(match.home.name, lang)}</span>
        </div>
        <div className="text-xl font-bold tabular-nums">
          {match.home.goals !== null && match.away.goals !== null
            ? `${match.home.goals} × ${match.away.goals}`
            : '×'}
        </div>
        <div className="flex min-w-0 flex-col items-center gap-2">
          <TeamCrest name={match.away.name} crest={match.away.logo} className="h-10 w-10" />
          <span className="truncate font-semibold">{teamName(match.away.name, lang)}</span>
        </div>
      </div>
    </section>
  );
}

import { useMatches } from '../lib/hooks';
import { isLiveMatch } from '../lib/matchStatus';
import { useI18n } from '../lib/i18n';

/** Topbar indicator: shows a pulsing badge with the count of in-play matches. */
export function LiveBadge() {
  const { data: matches } = useMatches();
  const { t } = useI18n();
  const liveCount = matches?.filter((m) => isLiveMatch(m)).length ?? 0;

  if (liveCount === 0) return null;

  return (
    <span className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
      </span>
      {t('live.upper')} · {liveCount}
    </span>
  );
}

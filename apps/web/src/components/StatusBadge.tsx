import { isLiveMatch } from '../lib/matchStatus';
import { useI18n } from '../lib/i18n';

interface Props {
  status: string;
  kickoff: string;
}

/** Small badge: shows the live label for in-play matches, otherwise the kickoff time. */
export default function StatusBadge({ status, kickoff }: Props) {
  const { t, locale } = useI18n();
  if (isLiveMatch({ status, kickoff })) {
    return (
      <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
        {t('live.upper')}
      </span>
    );
  }
  if (status === 'FT') {
    return <span className="text-xs font-medium text-slate-500">{t('status.finished')}</span>;
  }
  const time = new Date(kickoff).toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  return <span className="text-xs font-medium text-slate-500">{time}</span>;
}

const LIVE_STATUSES = new Set(['1H', '2H', 'HT', 'ET', 'P', 'LIVE']);

interface Props {
  status: string;
  kickoff: string;
}

/** Small badge: shows "AO VIVO" for in-play matches, otherwise the kickoff time. */
export default function StatusBadge({ status, kickoff }: Props) {
  if (LIVE_STATUSES.has(status)) {
    return (
      <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
        AO VIVO
      </span>
    );
  }
  if (status === 'FT') {
    return <span className="text-xs font-medium text-slate-500">Encerrado</span>;
  }
  const time = new Date(kickoff).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  return <span className="text-xs font-medium text-slate-500">{time}</span>;
}

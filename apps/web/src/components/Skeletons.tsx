import { useI18n } from '../lib/i18n';

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  const { t } = useI18n();
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label={t('a11y.loadingContent')}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <Pulse className="h-4 w-24" />
          <div className="space-y-3">
            <Pulse className="h-6 w-full" />
            <Pulse className="h-6 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ count = 8 }: { count?: number }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto w-full max-w-5xl space-y-3" aria-label={t('a11y.loadingTable')}>
      <Pulse className="h-5 w-32" />
      {Array.from({ length: count }, (_, index) => (
        <Pulse key={index} className="h-8 w-full" />
      ))}
    </div>
  );
}

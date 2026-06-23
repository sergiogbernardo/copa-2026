import { useTeamModal } from './TeamModal';
import { TBD_NAME, teamName, useI18n } from '../lib/i18n';

interface Props {
  name: string;
  crest: string;
  /** Size classes for the crest image, e.g. "h-6 w-6". */
  className?: string;
}

/** A team flag that opens the team overview modal when clicked. */
export function TeamCrest({ name, crest, className = 'h-6 w-6' }: Props) {
  const { openTeam } = useTeamModal();
  const { t, lang } = useI18n();
  const tbd = !name || name === TBD_NAME;

  if (tbd) {
    return <span className={`${className} shrink-0 rounded-full bg-slate-100`} />;
  }

  return (
    <button
      type="button"
      onClick={() => openTeam(name)}
      title={t('crest.view', { name: teamName(name, lang) })}
      className="shrink-0 rounded transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-slate-900/40"
    >
      {crest ? (
        <img src={crest} alt={teamName(name, lang)} className={className} loading="lazy" />
      ) : (
        <span className={`${className} block rounded-full bg-slate-200`} />
      )}
    </button>
  );
}

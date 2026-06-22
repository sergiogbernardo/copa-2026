import { useTeamModal } from './TeamModal';

interface Props {
  name: string;
  crest: string;
  /** Size classes for the crest image, e.g. "h-6 w-6". */
  className?: string;
}

/** A team flag that opens the team overview modal when clicked. */
export function TeamCrest({ name, crest, className = 'h-6 w-6' }: Props) {
  const { openTeam } = useTeamModal();
  const tbd = !name || name === 'A definir';

  if (tbd) {
    return <span className={`${className} shrink-0 rounded-full bg-slate-100`} />;
  }

  return (
    <button
      type="button"
      onClick={() => openTeam(name)}
      title={`Ver ${name}`}
      className="shrink-0 rounded transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-pitch/50"
    >
      {crest ? (
        <img src={crest} alt={name} className={className} loading="lazy" />
      ) : (
        <span className={`${className} block rounded-full bg-slate-200`} />
      )}
    </button>
  );
}

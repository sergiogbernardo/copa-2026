import { useBracket } from '../../lib/hooks';
import type { BracketRound, Match } from '../../types';
import { TrophyIcon } from '../../components/icons';
import { TeamCrest } from '../../components/TeamCrest';

const LINE = 'pointer-events-none absolute bg-slate-300';

/** Compact tile for a single knockout fixture. */
function MatchTile({ match, className = 'w-40' }: { match: Match; className?: string }) {
  const decided = match.home.goals !== null && match.away.goals !== null;
  const homeWins = decided && match.home.goals! > match.away.goals!;
  const awayWins = decided && match.away.goals! > match.home.goals!;

  return (
    <div
      className={`${className} rounded-md border border-slate-200 bg-white p-2 text-xs shadow-sm`}
    >
      <TeamRow {...match.home} winner={homeWins} />
      <div className="my-1 border-t border-slate-100" />
      <TeamRow {...match.away} winner={awayWins} />
    </div>
  );
}

function TeamRow({ name, logo, goals, winner }: Match['home'] & { winner: boolean }) {
  const tbd = name === 'A definir';
  return (
    <div className={`flex items-center gap-1.5 ${winner ? 'font-semibold' : ''}`}>
      <TeamCrest name={name} crest={logo} className="h-4 w-4" />
      <span className={`truncate ${tbd ? 'italic text-slate-400' : ''}`}>{name}</span>
      <span className="ml-auto tabular-nums text-slate-500">{goals ?? '–'}</span>
    </div>
  );
}

interface ColumnProps {
  round: BracketRound;
  side: 'left' | 'right';
  /** Outermost round of its side (no incoming connectors). */
  outermost: boolean;
}

/**
 * One round of one half of the bracket. Matches fill equal-height slots so the
 * connector lines (drawn with absolutely-positioned spans) line up: each pair's
 * vertical line spans exactly from one slot's centre to the next slot's centre.
 */
function Column({ round, side, outermost }: ColumnProps) {
  const isLeft = side === 'left';
  const toCenter = isLeft ? 'right-0 translate-x-full' : 'left-0 -translate-x-full';
  const toOuter = isLeft ? 'left-0 -translate-x-full' : 'right-0 translate-x-full';
  const hasPairs = round.matches.length > 1;

  return (
    <div className="flex flex-col">
      <div className="mb-2 whitespace-nowrap text-center text-[11px] font-semibold text-slate-500">
        {round.label}
      </div>
      <div className="flex flex-1 flex-col justify-around">
        {round.matches.map((match, i) => (
          <div key={match.id} className="relative flex flex-1 items-center">
            <MatchTile match={match} />
            {/* advance line toward the centre */}
            <span className={`${LINE} top-1/2 h-px w-4 ${toCenter}`} />
            {/* vertical line joining the pair, on the centre side */}
            {hasPairs && i % 2 === 0 && (
              <span className={`${LINE} top-1/2 h-full w-px ${toCenter}`} />
            )}
            {/* incoming line from the previous (outer) round */}
            {!outermost && <span className={`${LINE} top-1/2 h-px w-4 ${toOuter}`} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function FinalColumn({ final, third }: { final: Match; third?: Match }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 px-2">
      <TrophyIcon className="h-12 w-12 text-amber-400" />
      <div className="relative flex items-center">
        {/* incoming lines from both semifinals */}
        <span className={`${LINE} top-1/2 h-px w-4 left-0 -translate-x-full`} />
        <span className={`${LINE} top-1/2 h-px w-4 right-0 translate-x-full`} />
        <MatchTile match={final} />
      </div>
      {third && (
        <div className="text-center">
          <div className="mb-1 text-[11px] font-semibold text-slate-400">Disputa de 3º lugar</div>
          <MatchTile match={third} />
        </div>
      )}
    </div>
  );
}

export default function BracketPage() {
  const { data: rounds, isLoading, isError } = useBracket();

  if (isLoading) return <p className="text-slate-500">Carregando chaveamento…</p>;
  if (isError) return <p className="text-red-600">Não foi possível carregar o chaveamento.</p>;
  if (!rounds || rounds.length === 0)
    return <p className="text-slate-500">Mata-mata ainda não definido.</p>;

  const final = rounds.find((r) => r.stage === 'FINAL');
  const third = rounds.find((r) => r.stage === 'THIRD_PLACE');
  const main = rounds.filter((r) => r.stage !== 'FINAL' && r.stage !== 'THIRD_PLACE');

  // Split each round into the two halves of the bracket.
  const half = (r: BracketRound, part: 'left' | 'right'): BracketRound => {
    const mid = Math.ceil(r.matches.length / 2);
    const matches = part === 'left' ? r.matches.slice(0, mid) : r.matches.slice(mid).reverse();
    return { ...r, matches };
  };

  const leftRounds = main.map((r) => half(r, 'left'));
  // Centre-outwards order on the right: Semis nearest the final, Round of 32 last.
  const rightRounds = [...main].reverse().map((r) => half(r, 'right'));

  return (
    <>
      {/* Mobile/tablet: a simple vertical list of rounds (the symmetric bracket
          is too wide for small screens). */}
      <div className="space-y-6 lg:hidden">
        {rounds.map((round) => (
          <section key={`m-${round.stage}`}>
            <h2 className="mb-2 text-sm font-semibold text-slate-500">{round.label}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {round.matches.map((m) => (
                <MatchTile key={m.id} match={m} className="w-full" />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Desktop: the symmetric FIFA-style bracket. */}
      <div className="hidden overflow-x-auto pb-4 lg:block">
        <div className="flex min-w-max items-stretch justify-center gap-8">
          {leftRounds.map((r, i) => (
            <Column key={`l-${r.stage}`} round={r} side="left" outermost={i === 0} />
          ))}
          {final && <FinalColumn final={final.matches[0]} third={third?.matches[0]} />}
          {rightRounds.map((r, i) => (
            <Column
              key={`r-${r.stage}`}
              round={r}
              side="right"
              outermost={i === rightRounds.length - 1}
            />
          ))}
        </div>
      </div>
    </>
  );
}

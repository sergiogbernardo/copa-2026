import { useBracket } from '../../lib/hooks';
import type { Match } from '../../types';

/** Compact two-row tile for a single knockout fixture. */
function BracketMatch({ match }: { match: Match }) {
  const decided = match.home.goals !== null && match.away.goals !== null;
  const homeWins = decided && match.home.goals! > match.away.goals!;
  const awayWins = decided && match.away.goals! > match.home.goals!;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm">
      <TeamRow {...match.home} winner={homeWins} />
      <div className="my-1 border-t border-slate-100" />
      <TeamRow {...match.away} winner={awayWins} />
    </article>
  );
}

function TeamRow({ name, logo, goals, winner }: Match['home'] & { winner: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${winner ? 'font-semibold' : ''}`}>
      {logo && <img src={logo} alt="" className="h-5 w-5" loading="lazy" />}
      <span className="truncate">{name}</span>
      <span className="ml-auto tabular-nums">{goals ?? '–'}</span>
    </div>
  );
}

export default function BracketPage() {
  const { data: rounds, isLoading, isError } = useBracket();

  if (isLoading) return <p className="text-slate-500">Carregando chaveamento…</p>;
  if (isError) return <p className="text-red-600">Não foi possível carregar o chaveamento.</p>;
  if (!rounds || rounds.length === 0)
    return <p className="text-slate-500">Mata-mata ainda não definido.</p>;

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-4">
        {rounds.map((round) => (
          <section key={round.label} className="w-56 shrink-0 space-y-3">
            <h2 className="text-sm font-semibold text-slate-500">{round.label}</h2>
            {round.matches.map((match) => (
              <BracketMatch key={match.id} match={match} />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

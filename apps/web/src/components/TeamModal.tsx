import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useMatches, useScorers, useTeams } from '../lib/hooks';
import { POSITION_ORDER, positionGroup, positionLabel } from '../lib/positions';
import type { Match } from '../types';
import { useFavoriteTeam } from './FavoriteTeam';
import { CloseIcon, StarIcon } from './icons';

interface TeamModalValue {
  openTeam: (name: string) => void;
}

const TeamModalContext = createContext<TeamModalValue>({ openTeam: () => {} });

export function useTeamModal(): TeamModalValue {
  return useContext(TeamModalContext);
}

export function TeamModalProvider({ children }: { children: ReactNode }) {
  const [team, setTeam] = useState<string | null>(null);

  return (
    <TeamModalContext.Provider value={{ openTeam: setTeam }}>
      {children}
      {team && <TeamOverview teamName={team} onClose={() => setTeam(null)} />}
    </TeamModalContext.Provider>
  );
}

function scoreLabel(match: Match): string {
  if (match.home.goals === null || match.away.goals === null) return 'vs';
  return `${match.home.goals} × ${match.away.goals}`;
}

function MatchRow({ match }: { match: Match }) {
  const date = new Date(match.kickoff).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
  return (
    <li className="flex items-center gap-2 border-t border-slate-100 py-1.5 text-sm">
      <span className="w-12 shrink-0 text-xs text-slate-400">{date}</span>
      <span className="flex-1 truncate text-right">{match.home.name}</span>
      <span className="shrink-0 font-semibold tabular-nums">{scoreLabel(match)}</span>
      <span className="flex-1 truncate">{match.away.name}</span>
    </li>
  );
}

function TeamOverview({ teamName, onClose }: { teamName: string; onClose: () => void }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { data: teams } = useTeams();
  const { data: matches } = useMatches();
  const { data: scorers } = useScorers();
  const { favoriteTeam, setFavoriteTeam } = useFavoriteTeam();

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const lower = teamName.toLowerCase();
  const team = teams?.find((t) => t.name.toLowerCase() === lower);
  const teamMatches = (matches ?? []).filter(
    (m) => m.home.name === teamName || m.away.name === teamName,
  );
  const teamScorers = (scorers ?? []).filter((s) => s.team === teamName);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-overview-title"
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center gap-3 bg-pitch px-4 py-3 text-white">
          {team?.crest && <img src={team.crest} alt="" className="h-8 w-8" />}
          <div>
            <h2 id="team-overview-title" className="text-lg font-bold leading-tight">
              {team?.name ?? teamName}
            </h2>
            {team?.coach && <p className="text-xs text-white/80">Técnico: {team.coach}</p>}
          </div>
          <button
            type="button"
            aria-label={favoriteTeam === teamName ? 'Remover dos favoritos' : 'Favoritar seleção'}
            aria-pressed={favoriteTeam === teamName}
            onClick={() => setFavoriteTeam(favoriteTeam === teamName ? '' : teamName)}
            className="ml-auto rounded p-1 hover:bg-white/10"
          >
            <StarIcon filled={favoriteTeam === teamName} className="h-5 w-5" />
          </button>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="rounded p-1 hover:bg-white/10"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-6 overflow-y-auto p-4">
          {team?.clubColors && (
            <p className="text-xs text-slate-500">
              Cores: <span className="font-medium text-slate-700">{team.clubColors}</span>
            </p>
          )}

          <section>
            <h3 className="mb-1 text-sm font-semibold text-slate-500">Jogos</h3>
            {teamMatches.length === 0 ? (
              <p className="text-sm text-slate-400">Sem jogos.</p>
            ) : (
              <ul>
                {teamMatches.map((m) => (
                  <MatchRow key={m.id} match={m} />
                ))}
              </ul>
            )}
          </section>

          {teamScorers.length > 0 && (
            <section>
              <h3 className="mb-1 text-sm font-semibold text-slate-500">Artilheiros</h3>
              <ul className="text-sm">
                {teamScorers.map((s, i) => (
                  <li key={`${s.player}-${i}`} className="flex justify-between py-0.5">
                    <span>{s.player}</span>
                    <span className="font-semibold tabular-nums">{s.goals}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h3 className="mb-2 text-sm font-semibold text-slate-500">
              Elenco {team?.squad.length ? `(${team.squad.length})` : ''}
            </h3>
            {!team || team.squad.length === 0 ? (
              <p className="text-sm text-slate-400">Elenco indisponível.</p>
            ) : (
              <div className="space-y-3">
                {POSITION_ORDER.map((group) => {
                  const players = team.squad.filter((p) => positionGroup(p.position) === group);
                  if (players.length === 0) return null;
                  return (
                    <div key={group}>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {group}
                      </h4>
                      <ul className="text-sm">
                        {players.map((p) => (
                          <li key={p.id} className="flex justify-between py-0.5">
                            <span>{p.name}</span>
                            <span className="text-xs text-slate-400">
                              {positionLabel(p.position)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

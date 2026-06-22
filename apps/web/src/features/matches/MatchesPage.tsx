import { useState } from 'react';
import { useMatches } from '../../lib/hooks';
import MatchCard from './MatchCard';

export default function MatchesPage() {
  const [live, setLive] = useState(false);
  const { data: matches, isLoading, isError } = useMatches(live);

  return (
    <section>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setLive(false)}
          className={`rounded px-3 py-1 text-sm ${!live ? 'bg-pitch text-white' : 'bg-slate-200'}`}
        >
          Próximos
        </button>
        <button
          onClick={() => setLive(true)}
          className={`rounded px-3 py-1 text-sm ${live ? 'bg-pitch text-white' : 'bg-slate-200'}`}
        >
          Ao vivo
        </button>
      </div>

      {isLoading && <p className="text-slate-500">Carregando jogos…</p>}
      {isError && <p className="text-red-600">Não foi possível carregar os jogos.</p>}
      {matches && matches.length === 0 && (
        <p className="text-slate-500">Nenhum jogo {live ? 'ao vivo agora' : 'agendado'}.</p>
      )}

      <div className="grid gap-3">
        {matches?.map((match) => <MatchCard key={match.id} match={match} />)}
      </div>
    </section>
  );
}

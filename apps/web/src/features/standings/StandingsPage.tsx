import { useStandings } from '../../lib/hooks';
import { includesQuery, useSearchQuery } from '../../lib/search';
import { TeamCrest } from '../../components/TeamCrest';
import type { StandingRow } from '../../types';

function StandingsTable({ rows }: { rows: StandingRow[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-slate-400">
        <tr>
          <th className="py-1">#</th>
          <th>Seleção</th>
          <th className="text-center">J</th>
          <th className="text-center">SG</th>
          <th className="text-center">Pts</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.team} className="border-t border-slate-100">
            <td className="py-1 text-slate-400">{row.rank}</td>
            <td className="flex items-center gap-2 py-1">
              <TeamCrest name={row.team} crest={row.logo} className="h-5 w-5" />
              {row.team}
            </td>
            <td className="text-center">{row.played}</td>
            <td className="text-center">{row.goalsDiff}</td>
            <td className="text-center font-semibold">{row.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function StandingsPage() {
  const { data, isLoading, isError } = useStandings();
  const q = useSearchQuery();

  if (isLoading) return <p className="text-slate-500">Carregando tabela…</p>;
  if (isError) return <p className="text-red-600">Não foi possível carregar a tabela.</p>;
  if (!data || data.length === 0) return <p className="text-slate-500">Tabela indisponível.</p>;

  const rows = data.filter((row) => includesQuery(row.team, q));
  if (rows.length === 0)
    return <p className="text-slate-500">Nenhuma seleção encontrada para “{q}”.</p>;

  const groups = [...new Set(rows.map((row) => row.group))];

  // Single overall table (World Cup free tier): split it into two columns when
  // there are enough rows (a narrow search result stays as one table).
  if (groups.length === 1 && rows.length > 12) {
    const mid = Math.ceil(rows.length / 2);
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <h2 className="font-semibold">{groups[0]}</h2>
        <div className="grid gap-x-12 gap-y-6 lg:grid-cols-2">
          <StandingsTable rows={rows.slice(0, mid)} />
          <StandingsTable rows={rows.slice(mid)} />
        </div>
      </div>
    );
  }

  // Real group tables: lay them out side by side.
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-x-12 gap-y-8 lg:grid-cols-2">
      {groups.map((group) => (
        <section key={group}>
          <h2 className="mb-2 font-semibold">{group}</h2>
          <StandingsTable rows={rows.filter((row) => row.group === group)} />
        </section>
      ))}
    </div>
  );
}

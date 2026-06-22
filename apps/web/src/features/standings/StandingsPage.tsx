import { useStandings } from '../../lib/hooks';

export default function StandingsPage() {
  const { data: rows, isLoading, isError } = useStandings();

  if (isLoading) return <p className="text-slate-500">Carregando tabela…</p>;
  if (isError) return <p className="text-red-600">Não foi possível carregar a tabela.</p>;
  if (!rows || rows.length === 0) return <p className="text-slate-500">Tabela indisponível.</p>;

  const groups = [...new Set(rows.map((row) => row.group))];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {groups.map((group) => (
        <section key={group}>
          <h2 className="mb-2 font-semibold">{group}</h2>
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
              {rows
                .filter((row) => row.group === group)
                .map((row) => (
                  <tr key={row.team} className="border-t border-slate-100">
                    <td className="py-1">{row.rank}</td>
                    <td className="flex items-center gap-2 py-1">
                      {row.logo && <img src={row.logo} alt="" className="h-5 w-5" loading="lazy" />}
                      {row.team}
                    </td>
                    <td className="text-center">{row.played}</td>
                    <td className="text-center">{row.goalsDiff}</td>
                    <td className="text-center font-semibold">{row.points}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}

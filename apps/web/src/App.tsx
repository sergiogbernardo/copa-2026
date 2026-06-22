import { NavLink, Route, Routes } from 'react-router-dom';
import MatchesPage from './features/matches/MatchesPage';
import StandingsPage from './features/standings/StandingsPage';
import InsightsPage from './features/insights/InsightsPage';

const navItems = [
  { to: '/', label: 'Jogos', end: true },
  { to: '/grupos', label: 'Grupos' },
  { to: '/insights', label: 'Insights' },
];

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-pitch text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-bold">Copa 2026 · Ao vivo</h1>
          <nav className="flex gap-4 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive ? 'font-semibold underline' : 'opacity-80 hover:opacity-100'
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <Routes>
          <Route path="/" element={<MatchesPage />} />
          <Route path="/grupos" element={<StandingsPage />} />
          <Route path="/insights" element={<InsightsPage />} />
        </Routes>
      </main>
    </div>
  );
}

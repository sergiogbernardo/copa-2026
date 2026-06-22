import { NavLink, Route, Routes } from 'react-router-dom';
import MatchesPage from './features/matches/MatchesPage';
import StandingsPage from './features/standings/StandingsPage';
import BracketPage from './features/bracket/BracketPage';
import InsightsPage from './features/insights/InsightsPage';

const navItems = [
  { to: '/', label: 'Jogos', end: true },
  { to: '/grupos', label: 'Grupos' },
  { to: '/chaveamento', label: 'Chaveamento' },
  { to: '/insights', label: 'Insights' },
];

function Sidebar() {
  return (
    <aside className="bg-pitch text-white md:min-h-screen md:w-56">
      <div className="px-4 py-4 md:py-6">
        <h1 className="text-lg font-bold">Copa 2026 · Ao vivo</h1>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-3 text-sm md:flex-col md:gap-0 md:px-3 md:pb-6">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `whitespace-nowrap rounded px-3 py-2 transition-colors ${
                isActive ? 'bg-white/15 font-semibold' : 'opacity-80 hover:bg-white/10 hover:opacity-100'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <Sidebar />
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <Routes>
          <Route path="/" element={<MatchesPage />} />
          <Route path="/grupos" element={<StandingsPage />} />
          <Route path="/chaveamento" element={<BracketPage />} />
          <Route path="/insights" element={<InsightsPage />} />
        </Routes>
      </main>
    </div>
  );
}

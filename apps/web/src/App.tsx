import { useEffect, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import MatchesPage from './features/matches/MatchesPage';
import StandingsPage from './features/standings/StandingsPage';
import BracketPage from './features/bracket/BracketPage';
import InsightsPage from './features/insights/InsightsPage';
import { LiveBadge } from './components/LiveBadge';
import { BracketIcon, CalendarIcon, ChartIcon, MenuIcon, TableIcon } from './components/icons';

const navItems = [
  { to: '/', label: 'Jogos', end: true, Icon: CalendarIcon },
  { to: '/grupos', label: 'Grupos', Icon: TableIcon },
  { to: '/chaveamento', label: 'Chaveamento', Icon: BracketIcon },
  { to: '/insights', label: 'Insights', Icon: ChartIcon },
];

const COLLAPSE_KEY = 'copa2026:sidebar-collapsed';

function NavItems({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 p-2">
      {navItems.map(({ to, label, end, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          title={collapsed ? label : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors ${
              isActive
                ? 'bg-pitch/10 font-semibold text-pitch'
                : 'text-slate-600 hover:bg-slate-100'
            } ${collapsed ? 'justify-center' : ''}`
          }
        >
          <Icon className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="truncate">{label}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

export default function App() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === 'true',
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, String(collapsed));
  }, [collapsed]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-pitch px-4 py-3 text-white shadow">
        {/* Mobile: open drawer. Desktop: collapse/expand the sidebar. */}
        <button
          type="button"
          aria-label="Alternar menu"
          onClick={() => {
            setMobileOpen((v) => !v);
            setCollapsed((v) => !v);
          }}
          className="rounded p-1 hover:bg-white/10"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold">Copa 2026 · Ao vivo</h1>
        <div className="ml-auto">
          <LiveBadge />
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside
          className={`hidden shrink-0 border-r border-slate-200 bg-white md:block ${
            collapsed ? 'w-16' : 'w-56'
          }`}
        >
          <NavItems collapsed={collapsed} />
        </aside>

        {/* Mobile off-canvas drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 w-56 bg-white shadow-xl">
              <NavItems collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-6">
          {/* Each page sets its own max width; the bracket uses the full width. */}
          <Routes>
            <Route path="/" element={<MatchesPage />} />
            <Route path="/grupos" element={<StandingsPage />} />
            <Route path="/chaveamento" element={<BracketPage />} />
            <Route path="/insights" element={<InsightsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

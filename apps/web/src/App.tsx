import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import MatchesPage from './features/matches/MatchesPage';
import StandingsPage from './features/standings/StandingsPage';
import BracketPage from './features/bracket/BracketPage';
import InsightsPage from './features/insights/InsightsPage';
import PlayersPage from './features/players/PlayersPage';
import { LiveBadge } from './components/LiveBadge';
import { TeamModalProvider } from './components/TeamModal';
import { FavoriteTeamProvider } from './components/FavoriteTeam';
import {
  BracketIcon,
  CalendarIcon,
  ChartIcon,
  MenuIcon,
  SearchIcon,
  TableIcon,
  UsersIcon,
} from './components/icons';

const navItems = [
  { to: '/', label: 'Jogos', end: true, Icon: CalendarIcon },
  { to: '/grupos', label: 'Grupos', Icon: TableIcon },
  { to: '/chaveamento', label: 'Chaveamento', Icon: BracketIcon },
  { to: '/jogadores', label: 'Jogadores', Icon: UsersIcon },
  { to: '/insights', label: 'Insights', Icon: ChartIcon },
];

const COLLAPSE_KEY = 'copa2026:sidebar-collapsed';

function NavItems({
  collapsed,
  search,
  onNavigate,
}: {
  collapsed: boolean;
  search: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1 p-2">
      {navItems.map(({ to, label, end, Icon }) => (
        <NavLink
          key={to}
          // Keep the active search term when switching pages.
          to={{ pathname: to, search }}
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

function SearchBox() {
  const [params, setParams] = useSearchParams();
  const value = params.get('q') ?? '';

  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
      <input
        type="search"
        value={value}
        placeholder="Buscar seleção ou jogador…"
        aria-label="Buscar seleção ou jogador"
        onChange={(e) => {
          const next = new URLSearchParams(params);
          if (e.target.value) next.set('q', e.target.value);
          else next.delete('q');
          setParams(next, { replace: true });
        }}
        className="w-40 rounded-md bg-white/15 py-1.5 pl-8 pr-2 text-sm text-white placeholder:text-white/70 focus:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/40 sm:w-56 md:w-72"
      />
    </div>
  );
}

export default function App() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { search } = useLocation();

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, String(collapsed));
  }, [collapsed]);

  return (
    <FavoriteTeamProvider>
      <TeamModalProvider>
        <div className="flex h-screen flex-col bg-slate-50 text-slate-900">
          <header className="z-30 flex shrink-0 items-center gap-3 bg-pitch px-4 py-3 text-white shadow">
            {/* Mobile: open drawer. Desktop: collapse/expand the sidebar. */}
            <button
              type="button"
              aria-label="Alternar menu"
              onClick={() => {
                // Desktop collapses the sidebar; mobile opens the drawer.
                if (window.matchMedia('(min-width: 768px)').matches) {
                  setCollapsed((v) => !v);
                } else {
                  setMobileOpen((v) => !v);
                }
              }}
              className="rounded p-1 hover:bg-white/10"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            <h1 className="hidden text-lg font-bold sm:block">Copa 2026 · Ao vivo</h1>
            <div className="ml-auto flex items-center gap-3">
              <SearchBox />
              <LiveBadge />
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
            {/* Desktop sidebar */}
            <aside
              className={`hidden shrink-0 overflow-y-auto border-r border-slate-200 bg-white md:block ${
                collapsed ? 'w-16' : 'w-56'
              }`}
            >
              <NavItems collapsed={collapsed} search={search} />
            </aside>

            {/* Mobile off-canvas drawer */}
            {mobileOpen && (
              <div className="fixed inset-0 z-40 md:hidden">
                <div
                  className="absolute inset-0 bg-black/40"
                  onClick={() => setMobileOpen(false)}
                />
                <aside className="absolute inset-y-0 left-0 w-56 bg-white shadow-xl">
                  <NavItems
                    collapsed={false}
                    search={search}
                    onNavigate={() => setMobileOpen(false)}
                  />
                </aside>
              </div>
            )}

            <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6">
              {/* Each page sets its own max width; the bracket uses the full width. */}
              <Routes>
                <Route path="/" element={<MatchesPage />} />
                <Route path="/grupos" element={<StandingsPage />} />
                <Route path="/chaveamento" element={<BracketPage />} />
                <Route path="/jogadores" element={<PlayersPage />} />
                <Route path="/insights" element={<InsightsPage />} />
              </Routes>
            </main>
          </div>
        </div>
      </TeamModalProvider>
    </FavoriteTeamProvider>
  );
}

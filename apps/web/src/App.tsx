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
import { LanguageProvider, useI18n } from './lib/i18n';
import {
  BracketIcon,
  CalendarIcon,
  ChartIcon,
  GlobeIcon,
  MenuIcon,
  SearchIcon,
  TableIcon,
  UsersIcon,
} from './components/icons';

const navItems = [
  { to: '/', labelKey: 'nav.matches', end: true, Icon: CalendarIcon },
  { to: '/grupos', labelKey: 'nav.groups', Icon: TableIcon },
  { to: '/chaveamento', labelKey: 'nav.bracket', Icon: BracketIcon },
  { to: '/jogadores', labelKey: 'nav.players', Icon: UsersIcon },
  { to: '/insights', labelKey: 'nav.insights', Icon: ChartIcon },
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
  const { t } = useI18n();
  return (
    <nav className="flex flex-col gap-1 p-2">
      {navItems.map(({ to, labelKey, end, Icon }) => {
        const label = t(labelKey);
        return (
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
        );
      })}
    </nav>
  );
}

/** Header button that toggles the UI language between Portuguese and English. */
function LanguageToggle() {
  const { lang, toggle, t } = useI18n();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t('a11y.switchLang')}
      title={t('a11y.switchLang')}
      className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase hover:bg-white/25"
    >
      <GlobeIcon className="h-4 w-4" />
      {lang}
    </button>
  );
}

function SearchBox() {
  const [params, setParams] = useSearchParams();
  const { t } = useI18n();
  const value = params.get('q') ?? '';

  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
      <input
        type="search"
        value={value}
        placeholder={t('search.placeholder')}
        aria-label={t('search.placeholder')}
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

function AppShell() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { search } = useLocation();
  const { t } = useI18n();

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
              aria-label={t('a11y.toggleMenu')}
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
            <h1 className="hidden text-lg font-bold sm:block">{t('header.title')}</h1>
            <div className="ml-auto flex items-center gap-3">
              <SearchBox />
              <a
                href="https://sergiogbernardo.github.io/"
                aria-label="Hub de Projetos"
                title="Hub de Projetos"
                className="flex shrink-0 items-center rounded-full bg-white/15 p-1 transition hover:scale-105 hover:bg-white/25"
              >
                <img
                  src={`${import.meta.env.BASE_URL}hub-icon.png`}
                  alt="Hub de Projetos"
                  className="h-7 w-7"
                />
              </a>
              <LanguageToggle />
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
              <footer className="mx-auto mt-10 max-w-6xl border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
                © 2026 Sergio Bernardo · {t('footer.data')}:{' '}
                <a
                  href="https://www.football-data.org/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-slate-600"
                >
                  football-data.org
                </a>
              </footer>
            </main>
          </div>
        </div>
      </TeamModalProvider>
    </FavoriteTeamProvider>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppShell />
    </LanguageProvider>
  );
}

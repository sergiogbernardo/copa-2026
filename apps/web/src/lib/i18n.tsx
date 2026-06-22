/**
 * Lightweight i18n for the web app — no external dependency. A context holds the
 * active language (persisted in localStorage, defaulting to the browser locale)
 * and exposes `t()` for UI strings plus helpers that translate the few strings
 * the Worker bakes in Portuguese (stage labels, the "A definir" sentinel, the
 * standings group label).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type Lang = 'pt' | 'en';

const STORAGE_KEY = 'copa2026:lang';

/** BCP-47 locale used for Intl date/number formatting per language. */
export const LOCALES: Record<Lang, string> = { pt: 'pt-BR', en: 'en-US' };

/** Sentinel the Worker uses for an undecided team. */
export const TBD_NAME = 'A definir';

type Vars = Record<string, string | number>;
type Dict = Record<string, string>;

const messages: Record<Lang, Dict> = {
  pt: {
    'live.upper': 'AO VIVO',
    'common.close': 'Fechar',
    'header.title': 'Copa 2026 · Ao vivo',
    'nav.matches': 'Jogos',
    'nav.groups': 'Grupos',
    'nav.bracket': 'Chaveamento',
    'nav.players': 'Jogadores',
    'nav.insights': 'Insights',
    'a11y.toggleMenu': 'Alternar menu',
    'a11y.switchLang': 'Mudar idioma para English',
    'a11y.loadingContent': 'Carregando conteúdo',
    'a11y.loadingTable': 'Carregando tabela',
    'search.placeholder': 'Buscar seleção ou jogador…',
    'footer.data': 'Dados',
    'filter.all': 'Todos',
    'filter.live': 'Ao vivo',
    'filter.today': 'Hoje',
    'filter.upcoming': 'Próximos',
    'filter.finished': 'Encerrados',
    'favorite.srLabel': 'Seleção favorita',
    'favorite.choose': 'Escolher favorita',
    'favorite.only': 'Só {team}',
    'matches.error': 'Não foi possível carregar os jogos.',
    'matches.empty': 'Nenhum jogo nesta seleção.',
    'featured.live': 'Agora ao vivo',
    'featured.next': 'Próximo jogo',
    'featured.startsIn': 'Começa em {time}',
    'status.finished': 'Encerrado',
    'table.team': 'Seleção',
    'table.played': 'J',
    'table.gd': 'SG',
    'table.points': 'Pts',
    'standings.error': 'Não foi possível carregar a tabela.',
    'standings.unavailable': 'Tabela indisponível.',
    'standings.noResults': 'Nenhuma seleção encontrada para “{q}”.',
    'standings.overall': 'Classificação geral',
    'group.prefix': 'Grupo',
    'bracket.error': 'Não foi possível carregar o chaveamento.',
    'bracket.empty': 'Mata-mata ainda não definido.',
    'players.error': 'Não foi possível carregar os jogadores.',
    'players.unavailable': 'Jogadores indisponíveis.',
    'players.filterAria': 'Filtrar por seleção',
    'players.allTeams': 'Todas as seleções ({count})',
    'players.count': '{count} jogadores',
    'players.empty': 'Nenhum jogador encontrado.',
    'insights.scorers': 'Artilheiros',
    'insights.scorersError': 'Não foi possível carregar os artilheiros.',
    'insights.noScorers': 'Nenhum artilheiro encontrado.',
    'insights.noGoals': 'Sem gols registrados ainda.',
    'insights.form': 'Sequência',
    'insights.formIntro': 'Últimos resultados, mais recente à esquerda —',
    'insights.noTeams': 'Nenhuma seleção encontrada.',
    'insights.noFinished': 'Sem jogos encerrados ainda.',
    'result.win': 'Vitória',
    'result.draw': 'Empate',
    'result.loss': 'Derrota',
    'modal.coach': 'Técnico',
    'modal.favorite': 'Favoritar seleção',
    'modal.unfavorite': 'Remover dos favoritos',
    'modal.colors': 'Cores',
    'modal.matches': 'Jogos',
    'modal.noMatches': 'Sem jogos.',
    'modal.squad': 'Elenco',
    'modal.squadUnavailable': 'Elenco indisponível.',
    'crest.view': 'Ver {name}',
    'team.tbd': 'A definir',
  },
  en: {
    'live.upper': 'LIVE',
    'common.close': 'Close',
    'header.title': 'Copa 2026 · Live',
    'nav.matches': 'Matches',
    'nav.groups': 'Groups',
    'nav.bracket': 'Bracket',
    'nav.players': 'Players',
    'nav.insights': 'Insights',
    'a11y.toggleMenu': 'Toggle menu',
    'a11y.switchLang': 'Mudar idioma para Português',
    'a11y.loadingContent': 'Loading content',
    'a11y.loadingTable': 'Loading table',
    'search.placeholder': 'Search team or player…',
    'footer.data': 'Data',
    'filter.all': 'All',
    'filter.live': 'Live',
    'filter.today': 'Today',
    'filter.upcoming': 'Upcoming',
    'filter.finished': 'Finished',
    'favorite.srLabel': 'Favorite team',
    'favorite.choose': 'Choose favorite',
    'favorite.only': 'Only {team}',
    'matches.error': 'Could not load matches.',
    'matches.empty': 'No matches for this filter.',
    'featured.live': 'Live now',
    'featured.next': 'Next match',
    'featured.startsIn': 'Starts in {time}',
    'status.finished': 'Finished',
    'table.team': 'Team',
    'table.played': 'P',
    'table.gd': 'GD',
    'table.points': 'Pts',
    'standings.error': 'Could not load the table.',
    'standings.unavailable': 'Table unavailable.',
    'standings.noResults': 'No team found for “{q}”.',
    'standings.overall': 'Overall standings',
    'group.prefix': 'Group',
    'bracket.error': 'Could not load the bracket.',
    'bracket.empty': 'Knockout stage not set yet.',
    'players.error': 'Could not load players.',
    'players.unavailable': 'Players unavailable.',
    'players.filterAria': 'Filter by team',
    'players.allTeams': 'All teams ({count})',
    'players.count': '{count} players',
    'players.empty': 'No player found.',
    'insights.scorers': 'Top scorers',
    'insights.scorersError': 'Could not load top scorers.',
    'insights.noScorers': 'No scorer found.',
    'insights.noGoals': 'No goals recorded yet.',
    'insights.form': 'Form',
    'insights.formIntro': 'Recent results, most recent on the left —',
    'insights.noTeams': 'No team found.',
    'insights.noFinished': 'No finished matches yet.',
    'result.win': 'Win',
    'result.draw': 'Draw',
    'result.loss': 'Loss',
    'modal.coach': 'Coach',
    'modal.favorite': 'Add to favorites',
    'modal.unfavorite': 'Remove from favorites',
    'modal.colors': 'Colors',
    'modal.matches': 'Matches',
    'modal.noMatches': 'No matches.',
    'modal.squad': 'Squad',
    'modal.squadUnavailable': 'Squad unavailable.',
    'crest.view': 'View {name}',
    'team.tbd': 'TBD',
  },
};

/** Knockout/group stage labels keyed by the Worker's stage code. */
const STAGE_LABELS: Record<Lang, Dict> = {
  pt: {
    GROUP_STAGE: 'Fase de Grupos',
    LAST_32: 'Rodada de 32',
    ROUND_OF_32: 'Rodada de 32',
    LAST_16: 'Oitavas de final',
    ROUND_OF_16: 'Oitavas de final',
    QUARTER_FINALS: 'Quartas de final',
    SEMI_FINALS: 'Semifinal',
    THIRD_PLACE: 'Disputa de 3º lugar',
    FINAL: 'Final',
  },
  en: {
    GROUP_STAGE: 'Group Stage',
    LAST_32: 'Round of 32',
    ROUND_OF_32: 'Round of 32',
    LAST_16: 'Round of 16',
    ROUND_OF_16: 'Round of 16',
    QUARTER_FINALS: 'Quarter-finals',
    SEMI_FINALS: 'Semi-finals',
    THIRD_PLACE: 'Third-place play-off',
    FINAL: 'Final',
  },
};

/** Reverse lookup so a Worker-supplied Portuguese venue label can be translated. */
const PT_LABEL_TO_STAGE: Dict = Object.fromEntries(
  Object.entries(STAGE_LABELS.pt).map(([code, label]) => [label, code]),
);

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => (key in vars ? String(vars[key]) : `{${key}}`));
}

function detectLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'pt' || stored === 'en') return stored;
  return navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

interface I18nValue {
  lang: Lang;
  locale: string;
  setLang: (lang: Lang) => void;
  toggle: () => void;
  t: (key: string, vars?: Vars) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  }, [lang]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);
  const toggle = useCallback(() => setLangState((l) => (l === 'pt' ? 'en' : 'pt')), []);
  const t = useCallback(
    (key: string, vars?: Vars) => interpolate(messages[lang][key] ?? key, vars),
    [lang],
  );

  const value = useMemo<I18nValue>(
    () => ({ lang, locale: LOCALES[lang], setLang, toggle, t }),
    [lang, setLang, toggle, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within LanguageProvider');
  return context;
}

/** Translate a stage code (e.g. "QUARTER_FINALS") for the active language. */
export function stageLabel(stage: string, lang: Lang): string {
  return STAGE_LABELS[lang][stage] ?? stage;
}

/**
 * National team names in Portuguese, keyed by the English name football-data
 * returns. English reuses the source name as-is, so only Portuguese is mapped.
 */
const TEAM_NAMES_PT: Dict = {
  // South America
  Argentina: 'Argentina',
  Bolivia: 'Bolívia',
  Brazil: 'Brasil',
  Chile: 'Chile',
  Colombia: 'Colômbia',
  Ecuador: 'Equador',
  Paraguay: 'Paraguai',
  Peru: 'Peru',
  Uruguay: 'Uruguai',
  Venezuela: 'Venezuela',
  // North & Central America
  Canada: 'Canadá',
  'Costa Rica': 'Costa Rica',
  Curaçao: 'Curaçao',
  Haiti: 'Haiti',
  Honduras: 'Honduras',
  Jamaica: 'Jamaica',
  Mexico: 'México',
  Panama: 'Panamá',
  'United States': 'Estados Unidos',
  // Europe
  Albania: 'Albânia',
  Austria: 'Áustria',
  Belgium: 'Bélgica',
  'Bosnia-Herzegovina': 'Bósnia e Herzegovina',
  Croatia: 'Croácia',
  Czechia: 'Tchéquia',
  Denmark: 'Dinamarca',
  England: 'Inglaterra',
  France: 'França',
  Germany: 'Alemanha',
  Greece: 'Grécia',
  Hungary: 'Hungria',
  Italy: 'Itália',
  Netherlands: 'Países Baixos',
  Norway: 'Noruega',
  Poland: 'Polônia',
  Portugal: 'Portugal',
  'Republic of Ireland': 'Irlanda',
  Romania: 'Romênia',
  Russia: 'Rússia',
  Scotland: 'Escócia',
  Serbia: 'Sérvia',
  Slovakia: 'Eslováquia',
  Slovenia: 'Eslovênia',
  Spain: 'Espanha',
  Sweden: 'Suécia',
  Switzerland: 'Suíça',
  Turkey: 'Turquia',
  Türkiye: 'Turquia',
  Ukraine: 'Ucrânia',
  Wales: 'País de Gales',
  // Africa
  Algeria: 'Argélia',
  Angola: 'Angola',
  Cameroon: 'Camarões',
  'Cape Verde Islands': 'Cabo Verde',
  'DR Congo': 'RD Congo',
  'Congo DR': 'RD Congo',
  Egypt: 'Egito',
  Ghana: 'Gana',
  'Ivory Coast': 'Costa do Marfim',
  Mali: 'Mali',
  Morocco: 'Marrocos',
  Nigeria: 'Nigéria',
  Senegal: 'Senegal',
  'South Africa': 'África do Sul',
  Tunisia: 'Tunísia',
  // Asia
  Australia: 'Austrália',
  China: 'China',
  'China PR': 'China',
  Iran: 'Irã',
  Iraq: 'Iraque',
  Japan: 'Japão',
  Jordan: 'Jordânia',
  Qatar: 'Catar',
  'Saudi Arabia': 'Arábia Saudita',
  'South Korea': 'Coreia do Sul',
  'United Arab Emirates': 'Emirados Árabes Unidos',
  Uzbekistan: 'Uzbequistão',
  // Oceania
  'New Zealand': 'Nova Zelândia',
};

/**
 * Display name for a team, mapping the "A definir" sentinel and (in Portuguese)
 * the English source name to its localized form. Unknown names pass through.
 */
export function teamName(name: string, lang: Lang): string {
  if (name === TBD_NAME) return messages[lang]['team.tbd'];
  if (lang === 'pt') return TEAM_NAMES_PT[name] ?? name;
  return name;
}

/** True when the query matches the team's source name or its localized name. */
export function teamMatchesQuery(name: string, query: string, lang: Lang): boolean {
  if (query === '') return true;
  const localized = teamName(name, lang).toLowerCase();
  return name.toLowerCase().includes(query) || localized.includes(query);
}

/**
 * Translate a Worker-supplied venue label. The Worker emits Portuguese
 * ("Quartas de final · Grupo A"); for English we map each segment back through
 * the stage codes and translate the group prefix.
 */
export function translateVenue(venue: string | null, lang: Lang): string | null {
  if (!venue || lang === 'pt') return venue;
  return venue
    .split(' · ')
    .map((part) => {
      const code = PT_LABEL_TO_STAGE[part];
      if (code) return stageLabel(code, lang);
      return part.replace(/^Grupo\b/, messages[lang]['group.prefix']);
    })
    .join(' · ');
}

/** Translate a standings group label ("Classificação geral" / "Grupo A"). */
export function translateGroup(group: string, lang: Lang): string {
  if (lang === 'pt') return group;
  if (group === messages.pt['standings.overall']) return messages.en['standings.overall'];
  return group.replace(/^Grupo\b/, messages[lang]['group.prefix']);
}

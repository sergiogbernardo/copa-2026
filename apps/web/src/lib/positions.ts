import type { Lang } from './i18n';

/** Language-independent position group codes, in display order. */
export type PositionGroup = 'GK' | 'DEF' | 'MID' | 'FWD' | 'OTHER';

export const POSITION_ORDER: PositionGroup[] = ['GK', 'DEF', 'MID', 'FWD', 'OTHER'];

/** Bucket a football-data position string into a position group code. */
export function positionGroup(position: string | null): PositionGroup {
  const p = (position ?? '').toLowerCase();
  if (p.includes('keeper') || p.includes('goalkeeper')) return 'GK';
  if (p.includes('back') || p.includes('defen')) return 'DEF';
  if (p.includes('midfield')) return 'MID';
  if (
    p.includes('forward') ||
    p.includes('offen') ||
    p.includes('winger') ||
    p.includes('striker') ||
    p.includes('attack')
  )
    return 'FWD';
  return 'OTHER';
}

const GROUP_LABELS: Record<Lang, Record<PositionGroup, string>> = {
  pt: { GK: 'Goleiros', DEF: 'Defensores', MID: 'Meio-campo', FWD: 'Atacantes', OTHER: 'Outros' },
  en: { GK: 'Goalkeepers', DEF: 'Defenders', MID: 'Midfield', FWD: 'Forwards', OTHER: 'Others' },
};

/** Plural label for a position group, e.g. "Defensores" / "Defenders". */
export function positionGroupLabel(group: PositionGroup, lang: Lang): string {
  return GROUP_LABELS[lang][group];
}

// Specific football-data positions translated to Portuguese. The source
// positions are already English, so English reuses them as-is.
const POSITION_LABELS_PT: Record<string, string> = {
  Goalkeeper: 'Goleiro',
  'Centre-Back': 'Zagueiro',
  'Left-Back': 'Lateral-esquerdo',
  'Right-Back': 'Lateral-direito',
  Defence: 'Defensor',
  'Defensive Midfield': 'Volante',
  'Central Midfield': 'Meio-campista',
  'Attacking Midfield': 'Meia ofensivo',
  'Left Midfield': 'Meia-esquerda',
  'Right Midfield': 'Meia-direita',
  Midfield: 'Meio-campista',
  'Left Winger': 'Ponta-esquerda',
  'Right Winger': 'Ponta-direita',
  'Centre-Forward': 'Centroavante',
  Offence: 'Atacante',
};

const GROUP_SINGULAR: Record<Lang, Record<PositionGroup, string>> = {
  pt: { GK: 'Goleiro', DEF: 'Defensor', MID: 'Meio-campista', FWD: 'Atacante', OTHER: '—' },
  en: { GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', FWD: 'Forward', OTHER: '—' },
};

/** Translate a specific position for the active language, falling back to the group. */
export function positionLabel(position: string | null, lang: Lang): string {
  if (lang === 'pt') {
    if (position && POSITION_LABELS_PT[position]) return POSITION_LABELS_PT[position];
    return GROUP_SINGULAR.pt[positionGroup(position)];
  }
  return position ?? GROUP_SINGULAR.en[positionGroup(position)];
}

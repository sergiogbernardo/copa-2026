/** Bucket a football-data position string into a Portuguese group label. */
export function positionGroup(position: string | null): string {
  const p = (position ?? '').toLowerCase();
  if (p.includes('keeper') || p.includes('goalkeeper')) return 'Goleiros';
  if (p.includes('back') || p.includes('defen')) return 'Defensores';
  if (p.includes('midfield')) return 'Meio-campo';
  if (
    p.includes('forward') ||
    p.includes('offen') ||
    p.includes('winger') ||
    p.includes('striker') ||
    p.includes('attack')
  )
    return 'Atacantes';
  return 'Outros';
}

/** Display order for the position groups. */
export const POSITION_ORDER = ['Goleiros', 'Defensores', 'Meio-campo', 'Atacantes', 'Outros'];

// Specific football-data positions translated to Portuguese.
const POSITION_LABELS: Record<string, string> = {
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

const GROUP_SINGULAR: Record<string, string> = {
  Goleiros: 'Goleiro',
  Defensores: 'Defensor',
  'Meio-campo': 'Meio-campista',
  Atacantes: 'Atacante',
  Outros: '—',
};

/** Translate a specific position to Portuguese, falling back to the group. */
export function positionLabel(position: string | null): string {
  if (position && POSITION_LABELS[position]) return POSITION_LABELS[position];
  return GROUP_SINGULAR[positionGroup(position)];
}

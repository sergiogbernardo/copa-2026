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

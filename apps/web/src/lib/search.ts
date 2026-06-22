import { useSearchParams } from 'react-router-dom';

/** Current search term from the URL (?q=), normalized to lower case. */
export function useSearchQuery(): string {
  const [params] = useSearchParams();
  return (params.get('q') ?? '').trim().toLowerCase();
}

/** True when the term is empty or `text` contains it (case-insensitive). */
export function includesQuery(text: string, query: string): boolean {
  return query === '' || text.toLowerCase().includes(query);
}

import { useQuery } from '@tanstack/react-query';
import { getMatches, getStandings } from './apiClient';

/** Live matches refetch often; upcoming fixtures can be cached longer. */
export function useMatches(live = false) {
  return useQuery({
    queryKey: ['matches', { live }],
    queryFn: () => getMatches(live),
    refetchInterval: live ? 20_000 : 5 * 60_000,
  });
}

export function useStandings() {
  return useQuery({
    queryKey: ['standings'],
    queryFn: getStandings,
    refetchInterval: 5 * 60_000,
  });
}

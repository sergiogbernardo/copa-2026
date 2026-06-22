import { useQuery } from '@tanstack/react-query';
import { getBracket, getMatches, getScorers, getStandings } from './apiClient';

/** All matches; refetched often enough to keep live scores fresh. */
export function useMatches() {
  return useQuery({
    queryKey: ['matches'],
    queryFn: getMatches,
    refetchInterval: 30_000,
  });
}

export function useStandings() {
  return useQuery({
    queryKey: ['standings'],
    queryFn: getStandings,
    refetchInterval: 5 * 60_000,
  });
}

export function useBracket() {
  return useQuery({
    queryKey: ['bracket'],
    queryFn: getBracket,
    refetchInterval: 5 * 60_000,
  });
}

export function useScorers() {
  return useQuery({
    queryKey: ['scorers'],
    queryFn: getScorers,
    refetchInterval: 10 * 60_000,
  });
}

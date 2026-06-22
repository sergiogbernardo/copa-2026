import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const FAVORITE_KEY = 'copa2026:favorite-team';

interface FavoriteTeamValue {
  favoriteTeam: string;
  setFavoriteTeam: (team: string) => void;
}

const FavoriteTeamContext = createContext<FavoriteTeamValue | null>(null);

export function FavoriteTeamProvider({ children }: { children: ReactNode }) {
  const [favoriteTeam, setFavoriteTeamState] = useState(
    () => localStorage.getItem(FAVORITE_KEY) ?? '',
  );

  useEffect(() => {
    const syncFavorite = (event: StorageEvent) => {
      if (event.key === FAVORITE_KEY) setFavoriteTeamState(event.newValue ?? '');
    };
    window.addEventListener('storage', syncFavorite);
    return () => window.removeEventListener('storage', syncFavorite);
  }, []);

  const setFavoriteTeam = (team: string) => {
    setFavoriteTeamState(team);
    if (team) localStorage.setItem(FAVORITE_KEY, team);
    else localStorage.removeItem(FAVORITE_KEY);
  };

  return (
    <FavoriteTeamContext.Provider value={{ favoriteTeam, setFavoriteTeam }}>
      {children}
    </FavoriteTeamContext.Provider>
  );
}

export function useFavoriteTeam(): FavoriteTeamValue {
  const context = useContext(FavoriteTeamContext);
  if (!context) throw new Error('useFavoriteTeam must be used within FavoriteTeamProvider');
  return context;
}

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { STORAGE_KEYS } from '@/lib/constants/storage';
import { storage } from '@/lib/utils/storage';

interface FavoritesContextValue {
  favoriteIds: string[];
  isReady: boolean;
  isFavorite: (compoundId: string) => boolean;
  toggleFavorite: (compoundId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadFavorites() {
      try {
        const stored = await storage.getItem(STORAGE_KEYS.favoriteIds);
        if (stored) {
          setFavoriteIds(JSON.parse(stored) as string[]);
        }
      } finally {
        setIsReady(true);
      }
    }

    loadFavorites();
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    storage.setItem(STORAGE_KEYS.favoriteIds, JSON.stringify(favoriteIds));
  }, [favoriteIds, isReady]);

  const value: FavoritesContextValue = {
    favoriteIds,
    isReady,
    isFavorite: (compoundId) => favoriteIds.includes(compoundId),
    toggleFavorite: (compoundId) => {
      setFavoriteIds((current) =>
        current.includes(compoundId)
          ? current.filter((id) => id !== compoundId)
          : [...current, compoundId].sort((left, right) => left.localeCompare(right)),
      );
    },
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error('useFavorites must be used inside FavoritesProvider');
  }

  return context;
}

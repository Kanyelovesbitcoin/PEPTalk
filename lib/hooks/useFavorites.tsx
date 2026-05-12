import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { STORAGE_KEYS } from '@/lib/constants/storage';
import { storage } from '@/lib/utils/storage';
import { parseJsonArray, setJsonItem } from '@/lib/utils/storageJson';

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
        setFavoriteIds(parseJsonArray<string>(stored, STORAGE_KEYS.favoriteIds));
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

    setJsonItem(STORAGE_KEYS.favoriteIds, favoriteIds);
  }, [favoriteIds, isReady]);

  const isFavorite = useCallback(
    (compoundId: string) => favoriteIds.includes(compoundId),
    [favoriteIds],
  );

  const toggleFavorite = useCallback((compoundId: string) => {
    setFavoriteIds((current) =>
      current.includes(compoundId)
        ? current.filter((id) => id !== compoundId)
        : [...current, compoundId].sort((left, right) => left.localeCompare(right)),
    );
  }, []);

  const value: FavoritesContextValue = useMemo(() => ({
    favoriteIds,
    isReady,
    isFavorite,
    toggleFavorite,
  }), [favoriteIds, isFavorite, isReady, toggleFavorite]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error('useFavorites must be used inside FavoritesProvider');
  }

  return context;
}

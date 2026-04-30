import { useCallback, useEffect, useState } from 'react';

import { STORAGE_KEYS } from '@/lib/constants/storage';
import { storage } from '@/lib/utils/storage';

export function useAiPreview() {
  const [isReady, setIsReady] = useState(false);
  const [freeAiStackUsed, setFreeAiStackUsed] = useState(false);
  const [aiPrivacyAccepted, setAiPrivacyAccepted] = useState(false);

  const refresh = useCallback(async () => {
    const [used, accepted] = await Promise.all([
      storage.getItem(STORAGE_KEYS.freeAiStackUsed),
      storage.getItem(STORAGE_KEYS.aiPrivacyAccepted),
    ]);
    setFreeAiStackUsed(used === 'true');
    setAiPrivacyAccepted(accepted === 'true');
    setIsReady(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const acceptAiPrivacy = useCallback(async () => {
    await storage.setItem(STORAGE_KEYS.aiPrivacyAccepted, 'true');
    setAiPrivacyAccepted(true);
  }, []);

  const consumeFreeAiStack = useCallback(async () => {
    await storage.setItem(STORAGE_KEYS.freeAiStackUsed, 'true');
    setFreeAiStackUsed(true);
  }, []);

  return {
    acceptAiPrivacy,
    aiPrivacyAccepted,
    consumeFreeAiStack,
    freeAiStackUsed,
    isReady,
    refresh,
  };
}

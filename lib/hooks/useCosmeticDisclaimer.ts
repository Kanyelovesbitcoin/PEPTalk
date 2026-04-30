import { useEffect, useState } from 'react';

import { STORAGE_KEYS } from '@/lib/constants/storage';
import { storage } from '@/lib/utils/storage';

export function useCosmeticDisclaimer(): [boolean, (next: boolean) => void] {
  const [show, setShow] = useState(false);

  useEffect(() => {
    storage.getItem(STORAGE_KEYS.cosmeticDisclaimer).then((v) => {
      if (v === '1') setShow(true);
    });
  }, []);

  function update(next: boolean) {
    setShow(next);
    storage.setItem(STORAGE_KEYS.cosmeticDisclaimer, next ? '1' : '0');
  }

  return [show, update];
}
